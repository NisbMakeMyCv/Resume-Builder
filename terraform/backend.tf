terraform {
  backend "s3" {
    bucket = "makemycv-terraform-state-bucket"
    key    = "infrastructure/terraform.tfstate"
    # Note: If your AWS bucket is in a different region, update this value.
    # Otherwise Terraform will fail to initialize.
    region = "us-east-1"
  }
}
