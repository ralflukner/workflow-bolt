# Module Variables

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (prod/staging/dev)"
  type        = string
}

variable "allowed_ips" {
  description = "List of allowed IP addresses for web access"
  type        = list(string)
  default     = []
} 