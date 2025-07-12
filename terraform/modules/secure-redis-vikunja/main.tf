# Secure Redis and Vikunja Infrastructure for GCP
# HIPAA-compliant setup with maximum security

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Variables are defined in variables.tf

# VPC Network - Isolated network for our services
resource "google_compute_network" "secure_vpc" {
  name                    = "secure-redis-vikunja-vpc-${var.environment}"
  auto_create_subnetworks = false
  project                 = var.project_id
}

# Private Service Connection for Cloud SQL
resource "google_compute_global_address" "private_ip_address" {
  name          = "private-ip-address-${var.environment}"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.secure_vpc.id
  project       = var.project_id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.secure_vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

# Private Subnet for Redis and Worker Services
resource "google_compute_subnetwork" "private_subnet" {
  name          = "private-subnet-${var.environment}"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.secure_vpc.id
  project       = var.project_id

  # Enable Private Google Access
  private_ip_google_access = true

  # Enable flow logs for security monitoring
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 1.0
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# VPC Connector for serverless services (Cloud Functions, Cloud Run)
resource "google_vpc_access_connector" "serverless_connector" {
  name          = "serverless-connector-${var.environment}"
  project       = var.project_id
  region        = var.region
  network       = google_compute_network.secure_vpc.id
  ip_cidr_range = "10.0.2.0/28"
  
  # Machine type for the connector
  machine_type = "e2-micro"
  
  # Min and max instances
  min_instances = 2
  max_instances = 10
  
  # Throughput settings
  min_throughput = 200
  max_throughput = 1000
}

# Secondary ranges for GKE pods and services
resource "google_compute_subnetwork" "gke_subnet" {
  name          = "gke-subnet-${var.environment}"
  ip_cidr_range = "10.0.3.0/24"
  region        = var.region
  network       = google_compute_network.secure_vpc.id
  project       = var.project_id

  # Enable Private Google Access
  private_ip_google_access = true

  # Secondary ranges for pods and services
  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.1.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.2.0.0/16"
  }
}

# Cloud NAT for outbound internet access (for package updates, etc.)
resource "google_compute_router" "nat_router" {
  name    = "nat-router-${var.environment}"
  region  = var.region
  network = google_compute_network.secure_vpc.id
  project = var.project_id
}

resource "google_compute_router_nat" "nat_gateway" {
  name                               = "nat-gateway-${var.environment}"
  router                             = google_compute_router.nat_router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
  project                            = var.project_id

  log_config {
    enable = true
    filter = "ALL"
  }
}

# Firewall Rules - Deny all by default, allow only what's needed
resource "google_compute_firewall" "deny_all_ingress" {
  name     = "deny-all-ingress-${var.environment}"
  network  = google_compute_network.secure_vpc.name
  project  = var.project_id
  priority = 1000

  deny {
    protocol = "all"
  }

  source_ranges = ["0.0.0.0/0"]
}

# Allow internal communication within VPC
resource "google_compute_firewall" "allow_internal" {
  name     = "allow-internal-${var.environment}"
  network  = google_compute_network.secure_vpc.name
  project  = var.project_id
  priority = 900

  allow {
    protocol = "tcp"
    ports    = ["6379", "3456", "8080", "3001"] # Redis, Vikunja, Worker, SSE
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.0.1.0/24"]
}

# Allow SSH from Cloud IAP (secure bastion)
resource "google_compute_firewall" "allow_iap_ssh" {
  name     = "allow-iap-ssh-${var.environment}"
  network  = google_compute_network.secure_vpc.name
  project  = var.project_id
  priority = 800

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  # Cloud IAP IP range
  source_ranges = ["35.235.240.0/20"]
  target_tags   = ["allow-iap-ssh"]
}

# Redis Instance - Using Memorystore for managed Redis
resource "google_redis_instance" "secure_redis" {
  name               = "secure-redis-${var.environment}"
  tier               = "STANDARD_HA"  # High availability
  memory_size_gb     = 5
  region             = var.region
  project            = var.project_id
  
  # Version 6.x for latest security features
  redis_version      = "REDIS_6_X"
  
  # Network configuration
  authorized_network = google_compute_network.secure_vpc.id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"
  
  # Security settings
  auth_enabled       = true
  transit_encryption_mode = "SERVER_AUTHENTICATION"
  
  # Maintenance window
  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours   = 3
        minutes = 0
      }
    }
  }

  labels = {
    environment = var.environment
    service     = "redis"
    compliance  = "hipaa"
  }
}

# Service Account for Worker Service
resource "google_service_account" "worker_sa" {
  account_id   = "tebra-worker-${var.environment}"
  display_name = "Tebra Redis Worker Service Account"
  project      = var.project_id
}

# Worker service needs to access Redis and Cloud Run
resource "google_project_iam_member" "worker_redis_access" {
  project = var.project_id
  role    = "roles/redis.editor"
  member  = "serviceAccount:${google_service_account.worker_sa.email}"
}

resource "google_project_iam_member" "worker_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.worker_sa.email}"
}

# Service Account for Vikunja
resource "google_service_account" "vikunja_sa" {
  account_id   = "vikunja-${var.environment}"
  display_name = "Vikunja Service Account"
  project      = var.project_id
}

# Vikunja Database - Cloud SQL PostgreSQL
resource "google_sql_database_instance" "vikunja_db" {
  name             = "vikunja-db-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region
  project          = var.project_id

  settings {
    tier = "db-g1-small"
    
    ip_configuration {
      ipv4_enabled    = false  # No public IP
      private_network = google_compute_network.secure_vpc.id
      require_ssl     = true
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }

    database_flags {
      name  = "log_connections"
      value = "on"
    }

    database_flags {
      name  = "log_disconnections"
      value = "on"
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }
  }

  deletion_protection = true
  
  depends_on = [google_service_networking_connection.private_vpc_connection]
}

resource "google_sql_database" "vikunja" {
  name     = "vikunja"
  instance = google_sql_database_instance.vikunja_db.name
  project  = var.project_id
}

resource "google_sql_user" "vikunja_user" {
  name     = "vikunja"
  instance = google_sql_database_instance.vikunja_db.name
  password = random_password.vikunja_db_password.result
  project  = var.project_id
}

resource "random_password" "vikunja_db_password" {
  length  = 32
  special = true
}

# Store passwords in Secret Manager
resource "google_secret_manager_secret" "vikunja_db_password" {
  secret_id = "vikunja-db-password-${var.environment}"
  project   = var.project_id

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "vikunja_db_password" {
  secret      = google_secret_manager_secret.vikunja_db_password.id
  secret_data = random_password.vikunja_db_password.result
}

resource "google_secret_manager_secret" "redis_auth_string" {
  secret_id = "redis-auth-string-${var.environment}"
  project   = var.project_id

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "redis_auth_string" {
  secret      = google_secret_manager_secret.redis_auth_string.id
  secret_data = google_redis_instance.secure_redis.auth_string
}

# GKE Cluster for running Worker and Vikunja
resource "google_container_cluster" "secure_cluster" {
  name     = "secure-cluster-${var.environment}"
  location = var.region
  project  = var.project_id

  # Use release channel for automatic updates
  release_channel {
    channel = "REGULAR"
  }

  # Network configuration
  network    = google_compute_network.secure_vpc.name
  subnetwork = google_compute_subnetwork.gke_subnet.name

  # Security settings
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  # Workload Identity for secure pod authentication
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # IP allocation policy for pods and services
  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  # Security hardening
  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }

  # Binary Authorization
  binary_authorization {
    evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
  }

  # Network policy
  network_policy {
    enabled  = true
    provider = "CALICO"
  }

  # Shielded nodes
  enable_shielded_nodes = true

  # Node configuration
  node_config {
    preemptible  = false
    machine_type = "e2-standard-4"

    # Security settings
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    # Workload Identity
    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      environment = var.environment
      compliance  = "hipaa"
    }

    tags = ["allow-iap-ssh"]
  }

  initial_node_count = 3

  # Auto-scaling
  cluster_autoscaling {
    enabled = true
    resource_limits {
      resource_type = "cpu"
      minimum       = 3
      maximum       = 10
    }
    resource_limits {
      resource_type = "memory"
      minimum       = 12
      maximum       = 40
    }
  }

  # Maintenance window - GKE-compliant, 4 hours every Sunday
  maintenance_policy {
    recurring_window {
      start_time = "01:00Z"
      end_time   = "05:00Z"
      recurrence = "FREQ=WEEKLY;BYDAY=SU"
    }
  }
}

# Cloud Armor Security Policy
resource "google_compute_security_policy" "webapp_security" {
  name    = "webapp-security-${var.environment}"
  project = var.project_id

  # Default rule - deny all
  rule {
    action   = "deny(403)"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
  }

  # Allow from known good IPs only (skip if no IPs provided)
  dynamic "rule" {
    for_each = length(var.allowed_ips) > 0 ? [1] : []
    content {
      action   = "allow"
      priority = "1000"
      match {
        versioned_expr = "SRC_IPS_V1"
        config {
          src_ip_ranges = var.allowed_ips
        }
      }
    }
  }

  # Rate limiting
  rule {
    action   = "rate_based_ban"
    priority = "2000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
      ban_duration_sec = 600
    }
  }

  # OWASP rules
  rule {
    action   = "deny(403)"
    priority = "3000"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-stable')"
      }
    }
  }

  rule {
    action   = "deny(403)"
    priority = "3001"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-stable')"
      }
    }
  }
}

# Load Balancer for Vikunja
resource "google_compute_global_address" "vikunja_ip" {
  name    = "vikunja-ip-${var.environment}"
  project = var.project_id
}

# Outputs are defined in outputs.tf 