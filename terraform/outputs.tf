output "instance_id" {
  description = "The ID of the EC2 instance"
  value       = aws_instance.app_server.id
}

output "instance_public_ip" {
  description = "The public IP address of the EC2 instance"
  value       = aws_instance.app_server.public_ip
}

output "instance_public_dns" {
  description = "The public DNS name of the EC2 instance"
  value       = aws_instance.app_server.public_dns
}

output "github_actions_iam_user" {
  description = "IAM user for GitHub Actions"
  value       = aws_iam_user.github_actions.name
}

output "github_actions_access_key_id" {
  description = "Store this in GitHub Secrets as AWS_ACCESS_KEY_ID"
  value       = aws_iam_access_key.github_actions_key.id
  sensitive   = false
}

output "github_actions_secret_access_key" {
  description = "Store this in GitHub Secrets as AWS_SECRET_ACCESS_KEY"
  value       = aws_iam_access_key.github_actions_key.secret
  sensitive   = true # View using `terraform output -raw github_actions_secret_access_key`
}
