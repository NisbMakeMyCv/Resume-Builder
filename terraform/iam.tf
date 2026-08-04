# IAM Role for the EC2 Instance (if it needs to interact with AWS services, e.g., CloudWatch, S3)
resource "aws_iam_role" "ec2_role" {
  name = "makemycv-ec2-role-v2"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# Attach basic SSM managed instance core for potential Session Manager access
resource "aws_iam_role_policy_attachment" "ssm_policy" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "makemycv-ec2-profile-v2"
  role = aws_iam_role.ec2_role.name
}

# IAM Policy for GitHub Actions
# Grants least-privilege access needed to describe instances (for dynamic IP discovery)
resource "aws_iam_policy" "github_actions_policy" {
  name        = "makemycv-github-actions-policy"
  description = "Allows GitHub Actions to query EC2 instances for deployment"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeTags"
        ]
        Resource = "*" # Describe operations do not support resource-level permissions
      }
    ]
  })
}

# We create an IAM user for GitHub Actions.
# In a true enterprise environment, OpenID Connect (OIDC) is preferred over static IAM users.
# For this setup, assuming standard AWS Access Keys are used in GitHub Secrets.
resource "aws_iam_user" "github_actions" {
  name = "makemycv-github-deployer-v2"
}

resource "aws_iam_user_policy_attachment" "github_actions_attach" {
  user       = aws_iam_user.github_actions.name
  policy_arn = aws_iam_policy.github_actions_policy.arn
}

# Generate Access Keys for the IAM user
resource "aws_iam_access_key" "github_actions_key" {
  user = aws_iam_user.github_actions.name
}
