# Dynamically create an AWS Key Pair from the provided SSH public key if provided
resource "aws_key_pair" "deployer" {
  count      = var.ssh_public_key != "" ? 1 : 0
  key_name   = var.key_name
  public_key = var.ssh_public_key
}
