#!/bin/bash
set -e

# Redirect all output to a log file for debugging
exec > /var/log/user-data.log 2>&1
echo "Starting user_data bootstrap at $(date)"

# Prevent apt-get from showing interactive prompts
export DEBIAN_FRONTEND=noninteractive

# Update and install dependencies
apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release git

# Add Docker's official GPG key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Docker Compose
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Ensure Docker starts on boot
systemctl enable docker
systemctl start docker

# Add the default ubuntu user to the docker group
usermod -aG docker ubuntu

# Setup deployment directory
mkdir -p /home/ubuntu/deployment
chown ubuntu:ubuntu /home/ubuntu/deployment

# The GitHub Action will SSH in as 'ubuntu', pull the docker-compose.yml,
# set up the .env file, and run `docker compose up -d`
