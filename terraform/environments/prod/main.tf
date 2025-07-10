# Production Environment - Secure Redis and Vikunja Infrastructure

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  
  # Store state in GCS bucket for team collaboration
  backend "gcs" {
    bucket  = "luknerlumina-terraform-state"
    prefix  = "terraform/state/prod/redis-vikunja"
  }
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "luknerlumina-firebase"  # Update with your project ID
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "allowed_ips" {
  description = "List of allowed IP addresses for web access"
  type        = list(string)
  default     = []  # Add your office/home IPs here
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "redis.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudkms.googleapis.com",
    "cloudfunctions.googleapis.com",
    "cloudbuild.googleapis.com",
    "vpcaccess.googleapis.com",
    "servicenetworking.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
  ])
  
  project = var.project_id
  service = each.key
  
  disable_dependent_services = false
}

# Private Service Connection moved to module to avoid circular dependency

# Deploy the secure infrastructure module
module "secure_infrastructure" {
  source = "../../modules/secure-redis-vikunja"
  
  project_id   = var.project_id
  region       = var.region
  environment  = "prod"
  allowed_ips  = var.allowed_ips
  
  depends_on = [
    google_project_service.required_apis
  ]
}

# Outputs
output "redis_connection" {
  value = {
    host = module.secure_infrastructure.redis_host
    port = module.secure_infrastructure.redis_port
  }
  description = "Redis connection details"
  sensitive   = true
}

output "vikunja_database" {
  value       = module.secure_infrastructure.vikunja_db_connection
  description = "Vikunja database connection"
  sensitive   = true
}

output "cluster_info" {
  value       = module.secure_infrastructure.cluster_endpoint
  description = "GKE cluster endpoint"
  sensitive   = true
}

output "vikunja_url" {
  value       = "https://${module.secure_infrastructure.vikunja_ip}"
  description = "Vikunja external URL"
}

output "dashboard_api_url" {
  value       = module.secure_infrastructure.dashboard_api_url
  description = "Dashboard Persistence API URL"
}

output "next_steps" {
  value = <<-EOT
    Infrastructure deployed! Next steps:
    
    1. Configure kubectl:
       gcloud container clusters get-credentials secure-cluster-prod --region=${var.region} --project=${var.project_id}
    
    2. Get Redis connection string:
       terraform output -json redis_connection
    
    3. Deploy applications:
       - Deploy Vikunja to GKE
       - Deploy Tebra Worker to GKE
       - Deploy Redis Logger to GKE
       - Deploy SSE Proxy to GKE
    
    4. Update DNS:
       Point your domain to: ${module.secure_infrastructure.vikunja_ip}
    
    5. Configure Cloud Armor:
       Add your allowed IPs to the security policy
  EOT
  description = "Next steps after infrastructure deployment"
} 