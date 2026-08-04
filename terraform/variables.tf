variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., prod, dev)"
  type        = string
  default     = "prod"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small" # t3.small is good for a simple web app. Update to t3.medium if running out of memory during builds.
}

variable "key_name" {
  description = "Name of the SSH key pair deployed in AWS"
  type        = string
  default     = "makemycv-deployer-key"
}

variable "ssh_public_key" {
  description = "Public SSH key for EC2 instance access"
  type        = string
  default     = ""
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into the instance"
  type        = string
  default     = "0.0.0.0/0"
}
