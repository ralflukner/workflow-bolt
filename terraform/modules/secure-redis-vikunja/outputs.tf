# Module Outputs

output "vpc_connector_name" {
  value       = google_vpc_access_connector.serverless_connector.name
  description = "VPC connector name for serverless services"
}

output "vpc_id" {
  value       = google_compute_network.secure_vpc.id
  description = "VPC network ID"
}

output "private_subnet_name" {
  value       = google_compute_subnetwork.private_subnet.name
  description = "Private subnet name"
}

output "redis_host" {
  value       = google_redis_instance.secure_redis.host
  description = "Redis instance host"
  sensitive   = true
}

output "redis_port" {
  value       = google_redis_instance.secure_redis.port
  description = "Redis instance port"
}

output "redis_auth_string" {
  value       = google_redis_instance.secure_redis.auth_string
  description = "Redis authentication string"
  sensitive   = true
}

output "vikunja_db_connection" {
  value       = google_sql_database_instance.vikunja_db.private_ip_address
  description = "Vikunja database private IP"
  sensitive   = true
}

output "cluster_endpoint" {
  value       = google_container_cluster.secure_cluster.endpoint
  description = "GKE cluster endpoint"
  sensitive   = true
}

output "cluster_name" {
  value       = google_container_cluster.secure_cluster.name
  description = "GKE cluster name"
}

output "vikunja_ip" {
  value       = google_compute_global_address.vikunja_ip.address
  description = "Vikunja external IP address"
}

output "redis_logger_db_host" {
  value       = google_sql_database_instance.redis_logger_db.private_ip_address
  description = "Redis Logger database private IP"
  sensitive   = true
}

output "dashboard_api_url" {
  value       = google_cloudfunctions2_function.dashboard_persistence_api.service_config[0].uri
  description = "Dashboard Persistence API URL"
}

output "redis_archive_bucket" {
  value       = google_storage_bucket.redis_archive.name
  description = "Redis archive bucket name"
}

output "worker_service_account" {
  value       = google_service_account.worker_sa.email
  description = "Worker service account email"
}

output "vikunja_service_account" {
  value       = google_service_account.vikunja_sa.email
  description = "Vikunja service account email"
} 