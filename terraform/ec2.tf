# Find the latest Ubuntu 22.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

resource "aws_instance" "app_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = length(aws_key_pair.deployer) > 0 ? aws_key_pair.deployer[0].key_name : var.key_name

  vpc_security_group_ids = [aws_security_group.app_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  # Provisioning script
  user_data = file("${path.module}/scripts/user_data.sh")

  root_block_device {
    volume_size = 30 # 30GB is sufficient for OS, Docker, and DB data
    volume_type = "gp3"
  }

  # The Name and Role tags are CRITICAL as GitHub Actions uses them to discover the IP address
  tags = {
    Name = "MakeMyCV-AppServer"
    Role = "AppServer"
  }

  # IMPORTANT: Prevents Terraform from destroying/recreating the instance
  # every time user_data changes or a new AMI is released. 
  # Deployments happen via GitHub Actions, not Terraform.
  lifecycle {
    ignore_changes = [user_data, ami]
  }
}
