# Self-documenting Makefile with collision-safe venv
SHELL := /bin/bash
.DEFAULT_GOAL := help

# === SMART FUNCTION DETECTION ===
_IN_FUNC_DIR := $(shell test -f main.py && echo "yes" || echo "no")
_CURRENT_FUNC := $(shell test -f main.py && grep -oE '^def [a-zA-Z0-9_]+\(request\):' main.py | head -1 | sed 's/def //;s/(request)://' || echo "")
_DIR_NAME := $(shell basename $(CURDIR))

ifeq ($(_IN_FUNC_DIR),yes)
  NAME ?= $(or $(_CURRENT_FUNC),$(_DIR_NAME))
endif

PROJECT_ID ?= $(shell gcloud config get-value project 2>/dev/null)
PROJECT_NUMBER = $(shell gcloud projects describe $(PROJECT_ID) --format='value(projectNumber)' 2>/dev/null)
REGION ?= us-central1
PYTHON_VERSION ?= python311

# === COLLISION-SAFE SHARED VENV ===
REPO_ROOT := $(shell git rev-parse --show-toplevel 2>/dev/null || pwd)
REPO_NAME := $(shell basename $(REPO_ROOT))
VENV_DIR := $(REPO_ROOT)/.venv-$(REPO_NAME)
VENV_BIN := $(VENV_DIR)/bin
PYTHON := $(VENV_BIN)/python
PIP := $(VENV_BIN)/pip

# === REUSABLE FLAGS ===
GCLOUD_BASE = gcloud functions deploy $(NAME) \
  --gen2 --runtime $(PYTHON_VERSION) --trigger-http \
  --region $(REGION) --quiet --project $(PROJECT_ID)

# === MAIN TARGETS ===
.PHONY: help new deploy test logs status rollback clean destroy

help: ## Show available commands
	@echo "Cloud Functions Playbook v5.2"
	@echo "============================"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Current directory: $(CURDIR)"
	@echo "Detected function: $(or $(NAME),<none - use NAME=function_name>)"
	@echo "Project: $(PROJECT_ID) ($(PROJECT_NUMBER))"
	@echo "Region: $(REGION)"

new: ## Create new function (NAME=my_function)
	@test -n "$(NAME)" || (echo "❌ Usage: make new NAME=my_function"; exit 1)
	@./scripts/create_function.sh $(NAME)
	@echo "✅ Created functions/$(NAME)"
	@echo "📝 Opening editor..."
	@$${EDITOR:-vi} functions/$(NAME)/main.py

deploy: _check-name test ## Test and deploy current function
	@REGION=$(REGION) ./scripts/deploy_with_retry.sh $(NAME) "$(GCLOUD_BASE)"

test: _check-name _ensure-venv ## Run tests (uses shared venv)
	@echo "🧪 Testing $(NAME)..."
	@cd functions/$(NAME) && \
	  $(PYTHON) -m py_compile main.py && \
	  PYTHONPATH=. $(PYTHON) -m pytest ../../tests/$(NAME)/ -v --tb=short

test-integration: _check-name _ensure-venv ## Run integration tests with local services
	@echo "🐳 Starting local services..."
	@REDIS_PORT=$$(./scripts/start_test_services.sh) && \
	  REDIS_HOST=localhost REDIS_PORT=$$REDIS_PORT make test && \
	  docker stop cf-test-redis-$$$$ >/dev/null 2>&1 || true

logs: _check-name ## Show structured logs with trace correlation
	@gcloud logging read "resource.labels.function_name=$(NAME)" \
	  --limit=50 --format=json --project=$(PROJECT_ID) | \
	  jq -r '.[] | select(.jsonPayload) | .jsonPayload | @json' | \
	  jq -s 'sort_by(.timestamp) | reverse | .[]' || \
	  echo "💡 No recent logs found for $(NAME)"

status: ## Show health status of all functions
	@./scripts/health_dashboard.sh $(REGION) $(PROJECT_ID)

rollback: _check-name ## Rollback to previous version
	@./scripts/safe_rollback.sh $(NAME) $(REGION) $(PROJECT_ID)

destroy: _check-name ## Delete function and all resources
	@echo "🗑️  Destroying $(NAME)..."
	@gcloud functions delete $(NAME) --region $(REGION) --quiet || true
	@echo "✅ Function $(NAME) destroyed"

clean: ## Remove build artifacts (preserves shared venv)
	@find . -type d -name "__pycache__" -o -name ".pytest_cache" | xargs rm -rf
	@find functions -type d -name ".venv" | xargs rm -rf
	@docker ps -q --filter "name=cf-test-redis" | xargs -r docker stop
	@echo "✅ Cleaned build artifacts"

clean-all: clean ## Remove all artifacts including shared venv
	@rm -rf $(VENV_DIR)
	@echo "✅ Cleaned all artifacts"

# === INTERNAL HELPERS ===
_check-name:
	@test -n "$(NAME)" || (echo "❌ No function specified. Use NAME=function_name or run from functions/NAME/"; exit 1)

_ensure-venv:
	@if [ ! -d $(VENV_DIR) ]; then \
	  echo "📦 Creating shared venv..."; \
	  python3 -m venv $(VENV_DIR); \
	  $(PIP) install -q -U pip wheel; \
	fi
	@test -f tests/requirements-dev.txt && $(PIP) install -q -r tests/requirements-dev.txt || true

# === CI/CD TARGETS ===
ci-lint: ## Run all linters (used by CI)
	@pre-commit run --all-files
	@terraform -chdir=terraform fmt -check -recursive
	@terraform -chdir=terraform validate
	@flake8 functions/ tests/ --max-line-length=120 --ignore=E203,W503
	@isort --check-only functions/ tests/

ci-deploy: _check-name ## Deploy with stricter checks (used by CI)
	@$(MAKE) test NAME=$(NAME)
	@$(MAKE) deploy NAME=$(NAME)