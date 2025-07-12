# Redis Logger Infrastructure - Persistent Storage for Redis Streams
# This module creates a secure logging system that persists Redis data to Cloud SQL

# Cloud SQL Instance for Redis Logging
resource "google_sql_database_instance" "redis_logger_db" {
  name             = "redis-logger-db-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region
  project          = var.project_id

  settings {
    tier = "db-custom-2-8192"  # 2 vCPUs, 8GB RAM for logging workload
    
    ip_configuration {
      ipv4_enabled    = false  # No public IP
      private_network = google_compute_network.secure_vpc.id
      require_ssl     = true
    }

    # High-performance settings for logging
    database_flags {
      name  = "max_connections"
      value = "200"
    }

    database_flags {
      name  = "shared_buffers"
      value = "131072"
    }

    database_flags {
      name  = "work_mem"
      value = "16384"
    }

    database_flags {
      name  = "maintenance_work_mem"
      value = "1024"
    }

    database_flags {
      name  = "autovacuum"
      value = "on"
    }

    database_flags {
      name  = "log_statement"
      value = "all"
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 2048
      record_application_tags = true
      record_client_address   = true
    }
  }

  deletion_protection = true
}

# Create databases
resource "google_sql_database" "redis_logs" {
  name     = "redis_logs"
  instance = google_sql_database_instance.redis_logger_db.name
  project  = var.project_id
}

resource "google_sql_database" "dashboard_persistence" {
  name     = "dashboard_persistence"
  instance = google_sql_database_instance.redis_logger_db.name
  project  = var.project_id
}

# Create users
resource "google_sql_user" "redis_logger_user" {
  name     = "redis_logger"
  instance = google_sql_database_instance.redis_logger_db.name
  password = random_password.redis_logger_db_password.result
  project  = var.project_id
}

resource "google_sql_user" "dashboard_user" {
  name     = "dashboard_user"
  instance = google_sql_database_instance.redis_logger_db.name
  password = random_password.dashboard_db_password.result
  project  = var.project_id
}

resource "random_password" "redis_logger_db_password" {
  length  = 32
  special = true
}

resource "random_password" "dashboard_db_password" {
  length  = 32
  special = true
}

# Store passwords in Secret Manager
resource "google_secret_manager_secret" "redis_logger_db_password" {
  secret_id = "redis-logger-db-password-${var.environment}"
  project   = var.project_id

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "redis_logger_db_password" {
  secret      = google_secret_manager_secret.redis_logger_db_password.id
  secret_data = random_password.redis_logger_db_password.result
}

resource "google_secret_manager_secret" "dashboard_db_password" {
  secret_id = "dashboard-db-password-${var.environment}"
  project   = var.project_id

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "dashboard_db_password" {
  secret      = google_secret_manager_secret.dashboard_db_password.id
  secret_data = random_password.dashboard_db_password.result
}

# Service Account for Redis Logger
resource "google_service_account" "redis_logger_sa" {
  account_id   = "redis-logger-${var.environment}"
  display_name = "Redis Logger Service Account"
  project      = var.project_id
}

# Grant permissions
resource "google_project_iam_member" "logger_redis_viewer" {
  project = var.project_id
  role    = "roles/redis.viewer"
  member  = "serviceAccount:${google_service_account.redis_logger_sa.email}"
}

resource "google_project_iam_member" "logger_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.redis_logger_sa.email}"
}

resource "google_project_iam_member" "logger_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.redis_logger_sa.email}"
}

# Cloud Storage bucket for backup and archival
resource "google_storage_bucket" "redis_archive" {
  name          = "${var.project_id}-redis-archive-${var.environment}"
  location      = var.region
  project       = var.project_id
  force_destroy = false

  # Enable versioning for data protection
  versioning {
    enabled = true
  }

  # Lifecycle rules for cost optimization
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type          = "SetStorageClass"
      storage_class = "ARCHIVE"
    }
  }

  # Security settings
  uniform_bucket_level_access = true
  
  encryption {
    default_kms_key_name = google_kms_crypto_key.redis_logger_key.id
  }

  labels = {
    environment = var.environment
    service     = "redis-logger"
    compliance  = "hipaa"
  }
}

# KMS for encryption
resource "google_kms_key_ring" "redis_logger_keyring" {
  name     = "redis-logger-keyring-${var.environment}"
  location = var.region
  project  = var.project_id
}

resource "google_kms_crypto_key" "redis_logger_key" {
  name            = "redis-logger-key-${var.environment}"
  key_ring        = google_kms_key_ring.redis_logger_keyring.id
  rotation_period = "7776000s" # 90 days

  version_template {
    algorithm = "GOOGLE_SYMMETRIC_ENCRYPTION"
  }
}

# Get project number for service account
data "google_project" "current" {
  project_id = var.project_id
}

# Grant KMS key access to the default compute service account for storage bucket encryption
resource "google_kms_crypto_key_iam_member" "compute_kms_binding" {
  crypto_key_id = google_kms_crypto_key.redis_logger_key.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:${data.google_project.current.number}-compute@developer.gserviceaccount.com"
}

# Grant KMS key access to the Cloud Storage service account for bucket encryption
resource "google_kms_crypto_key_iam_member" "storage_kms_binding" {
  crypto_key_id = google_kms_crypto_key.redis_logger_key.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:service-${data.google_project.current.number}@gs-project-accounts.iam.gserviceaccount.com"
}

# Cloud Function for Dashboard Persistence API
resource "google_storage_bucket" "dashboard_api_source" {
  name     = "${var.project_id}-dashboard-api-source-${var.environment}"
  location = var.region
  project  = var.project_id
}

resource "google_storage_bucket_object" "dashboard_api_zip" {
  name   = "dashboard-api-${data.archive_file.dashboard_api.output_md5}.zip"
  bucket = google_storage_bucket.dashboard_api_source.name
  source = data.archive_file.dashboard_api.output_path
}

data "archive_file" "dashboard_api" {
  type        = "zip"
  output_path = "/tmp/dashboard-api.zip"
  
  source {
    content  = file("${path.module}/dashboard-api/index.js")
    filename = "index.js"
  }
  
  source {
    content  = file("${path.module}/dashboard-api/package.json")
    filename = "package.json"
  }
}

resource "google_cloudfunctions2_function" "dashboard_persistence_api" {
  name     = "dashboard-persistence-api-${var.environment}"
  location = var.region
  project  = var.project_id

  build_config {
    runtime     = "nodejs20"
    entry_point = "handleRequest"
    source {
      storage_source {
        bucket = google_storage_bucket.dashboard_api_source.name
        object = google_storage_bucket_object.dashboard_api_zip.name
      }
    }
  }

  service_config {
    max_instance_count    = 10
    min_instance_count    = 1
    available_memory      = "512M"
    timeout_seconds       = 60
    service_account_email = google_service_account.dashboard_api_sa.email
    
    environment_variables = {
      DB_HOST        = google_sql_database_instance.redis_logger_db.private_ip_address
      DB_NAME        = google_sql_database.dashboard_persistence.name
      DB_USER        = google_sql_user.dashboard_user.name
      PROJECT_ID     = var.project_id
      ENVIRONMENT    = var.environment
    }

    secret_environment_variables {
      key        = "DB_PASSWORD"
      project_id = var.project_id
      secret     = google_secret_manager_secret.dashboard_db_password.secret_id
      version    = "latest"
    }

    vpc_connector                 = google_vpc_access_connector.serverless_connector.id
    vpc_connector_egress_settings = "PRIVATE_RANGES_ONLY"
  }
}

# Use the existing serverless connector instead of creating a duplicate

# Service Account for Dashboard API
resource "google_service_account" "dashboard_api_sa" {
  account_id   = "dashboard-api-${var.environment}"
  display_name = "Dashboard Persistence API Service Account"
  project      = var.project_id
}

# Grant permissions to Dashboard API
resource "google_project_iam_member" "dashboard_api_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.dashboard_api_sa.email}"
}

resource "google_project_iam_member" "dashboard_api_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.dashboard_api_sa.email}"
}

# Outputs are defined in outputs.tf 