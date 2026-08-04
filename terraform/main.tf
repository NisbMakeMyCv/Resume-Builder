terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # For production, we strongly recommend storing state in S3.
  # Remove this comment block and configure your backend when ready:
  # backend "s3" {
  #   bucket         = "makemycv-terraform-state-bucket"
  #   key            = "prod/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "makemycv-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "MakeMyCV"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
