terraform {
  backend "s3" {
    bucket = "makemycv-terraform-state-bucket"
    key    = "infrastructure/terraform.tfstate"
  }
}
