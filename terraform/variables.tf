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
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into the instance. Restrict to your IP, e.g. 1.2.3.4/32"
  type        = string
}
