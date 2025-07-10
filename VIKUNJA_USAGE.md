## How to Use Vikunja for AI Developers

### 1. **What is Vikunja?**

Vikunja is an open-source project management tool, similar to Trello or Asana, but self-hosted and script-friendly. In this project, it’s used to track tasks, bugs, features, and project management items for AI development.

---

### 2. **Accessing Vikunja Tasks**

#### **Via the CLI**

You can manage tasks directly from your terminal using the provided scripts:

- **List all open tasks:**
  ```sh
  ./scripts/manage-tasks.cjs list
  ```

- **Add a new task:**
  ```sh
  ./scripts/manage-tasks.cjs add "Your task title here"
  ```
  You’ll be prompted for a description and priority.

- **Mark a task as done:**
  ```sh
  ./scripts/manage-tasks.cjs done <task_id>
  ```

- **Organize and categorize tasks:**
  ```sh
  ./scripts/organize-tasks.cjs categorize
  ```

- **Show a summary of tasks:**
  ```sh
  ./scripts/organize-tasks.cjs summary
  ```

- **Aggressively clean up junk/old TODOs:**
  ```sh
  ./scripts/aggressive-cleanup.cjs clean
  ```

---

### 3. **Best Practices for AI Developers**

- **Create tasks for:**
  - New features, experiments, or research spikes
  - Bugs, test failures, or technical debt
  - Infrastructure changes (e.g., NATS migration, CI/CD)
  - Documentation and compliance work

- **Use clear, actionable titles** (e.g., “Refactor secureStorage for testability”).
- **Add context in the description** (e.g., file names, error messages, links to logs).
- **Set the right priority:**
  - 4: Blocker/Critical
  - 3: High/Urgent
  - 2: Normal
  - 1: Low/Backlog

- **Mark tasks as done** as soon as they’re completed.
- **Regularly review and organize tasks** using the provided scripts.

---

### 4. **Syncing and Automation**

- **Syncing TODOs from code:**  
  This is currently disabled due to noise. Only add tasks manually or via meaningful automation.
- **Automated cleanup:**  
  Use the aggressive cleanup script to remove junk tasks if needed.

---

### 5. **Collaboration Tips**

- **Assign tasks to yourself or others** (if multi-user is enabled).
- **Use labels/categories** for filtering (e.g., `[CRITICAL_BUGS]`, `[INFRA]`, `[DOCS]`).
- **Link tasks to code commits or PRs** in your commit messages or task descriptions.

---

### 6. **Troubleshooting**

- If you see vendor or junk tasks, run:
  ```sh
  ./scripts/aggressive-cleanup.cjs clean
  ```
- If you need to reset all TODOs:
  ```sh
  ./scripts/remove-all-todos.cjs
  ```

---

### 7. **Where to Find More Info**

- See `scripts/` for all available CLI tools.
- Project documentation: `docs/` directory.
- For help, contact the project maintainer or check the README.

---
