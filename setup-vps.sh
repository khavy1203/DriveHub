#!/bin/bash
# VPS Initial Setup Script for DriveHub
# Hỗ trợ Ubuntu 22.04 & 24.04 - Chạy với quyền sudo

set -e

echo "=== DriveHub VPS Setup ==="

# 1. Update system
echo "Updating system..."
sudo apt-get update -y && sudo apt-get upgrade -y

# 2. Install Docker
if ! command -v docker &>/dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo systemctl enable docker
  sudo systemctl start docker
fi

# 3. Thêm user hiện tại vào group docker để không cần gõ sudo khi dùng docker
if ! groups $USER | grep &>/dev/null "\bdocker\b"; then
  echo "Adding $USER to docker group..."
  sudo usermod -aG docker $USER
  echo "LƯU Ý: Bạn cần logout và login lại sau khi script này chạy xong để quyền Docker có hiệu lực."
fi

# 4. Install Docker Compose plugin (v2)
if ! docker compose version &>/dev/null; then
  echo "Installing Docker Compose plugin..."
  sudo apt-get install -y docker-compose-plugin
fi

# 5. Create app directory và cấp quyền cho user deploy
echo "Setting up directories..."
sudo mkdir -p /opt/drivehub
sudo chown -R $USER:$USER /opt/drivehub
cd /opt/drivehub

# 6. Open firewall ports
if command -v ufw &>/dev/null; then
  echo "Configuring UFW..."
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 8080/tcp
  sudo ufw --force enable
  echo "UFW rules applied."
fi

echo "=== Setup hoàn tất thành công! ==="