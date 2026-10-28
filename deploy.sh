#!/bin/bash
# ==============================================================================
# Leaf Curt VPS Auto-Deploy Script
# Solves Git conflicts automatically, protects live orders, builds & restarts PM2
# ==============================================================================

set -e

# Always switch to the directory where this script is located
cd "$(dirname "$0")"

echo "📍 Working directory: $(pwd)"

echo "🚀 [1/6] Backing up live server orders and database..."
mkdir -p /tmp/leafcurt_backup
cp prisma/*.json /tmp/leafcurt_backup/ 2>/dev/null || true
cp prisma/*.db /tmp/leafcurt_backup/ 2>/dev/null || true

echo "🔄 [2/6] Cleaning working tree to avoid merge conflicts..."
git checkout -- prisma/settings.json 2>/dev/null || true
git stash --include-untracked 2>/dev/null || true

echo "📥 [3/6] Pulling latest updates from GitHub..."
git fetch origin master
git reset --hard origin/master

echo "🛡️ [4/6] Restoring live customer orders & SQLite database..."
if [ -s /tmp/leafcurt_backup/orders.json ]; then
  cp /tmp/leafcurt_backup/orders.json prisma/ 2>/dev/null || true
fi
if [ -s /tmp/leafcurt_backup/abandoned_carts.json ]; then
  cp /tmp/leafcurt_backup/abandoned_carts.json prisma/ 2>/dev/null || true
fi
if [ -s /tmp/leafcurt_backup/leafcurt.db ]; then
  cp /tmp/leafcurt_backup/leafcurt.db prisma/ 2>/dev/null || true
fi

# Ensure uploads folder exists with write permissions
mkdir -p public/uploads
chmod -R 755 public/uploads 2>/dev/null || true

# Check & ensure Nginx allows 100MB uploads (prevents HTTP 413)
if [ -f /etc/nginx/nginx.conf ] && ! grep -q "client_max_body_size" /etc/nginx/nginx.conf; then
  echo "🔧 Configuring Nginx upload limit to 100M..."
  sed -i '/http {/a \    client_max_body_size 100M;' /etc/nginx/nginx.conf 2>/dev/null || true
  nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || true
fi

echo "📦 [5/6] Updating dependencies & generating database schema..."
npm install
npx prisma generate

echo "⚡ [6/6] Building production bundle & restarting PM2..."
npm run build

# Restart the specific PM2 process if found, or all
if pm2 list | grep -q "leafcurt"; then
  pm2 restart leafcurt
else
  pm2 restart all
fi

echo "✅ =================================================================="
echo "✅ Leaf Curt updated and deployed successfully with zero conflicts!"
echo "✅ =================================================================="
