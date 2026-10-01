#!/bin/bash
# ============================================================
# IT-SYSTEM DEPLOYMENT SCRIPT
# Jalankan di server sebagai root atau dengan sudo
# ============================================================

set -e

# ---- KONFIGURASI ----
APP_DIR="/var/www/it-system"
DB_NAME="mainwalet"
DB_USER="root"
DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo "  IT-SYSTEM DEPLOYMENT"
echo "============================================"

# ---- STEP 1: CEK ENVIRONMENT ----
echo ""
echo "[1/7] Checking environment..."
php -v | head -1
node -v
composer -V | head -1

# ---- STEP 2: BACKUP DATABASE ----
echo ""
echo "[2/7] Backing up database..."
BACKUP_FILE="backup_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -u "$DB_USER" "$DB_NAME" > "/root/$BACKUP_FILE"
echo "Backup saved to /root/$BACKUP_FILE"

# ---- STEP 3: JALANKAN SQL DEPLOYMENT SCRIPT ----
echo ""
echo "[3/7] Running SQL deployment script..."
mysql -u "$DB_USER" "$DB_NAME" < "$DEPLOY_DIR/deploy.sql"
echo "SQL script executed successfully."

# ---- STEP 4: SETUP .ENV ----
echo ""
echo "[4/7] Setting up .env..."
if [ ! -f "$APP_DIR/.env" ]; then
    cp "$DEPLOY_DIR/.env.production" "$APP_DIR/.env"
    cd "$APP_DIR"
    php artisan key:generate
    read -p "MySQL password untuk user 'sindangasih': " -s DB_PASSWORD
    echo ""
    sed -i "s/<MySQL password>/$DB_PASSWORD/" "$APP_DIR/.env"
    echo ".env created with APP_KEY generated."
else
    echo ".env already exists, skipping."
fi

# ---- STEP 5: INSTALL DEPENDENCIES & BUILD ----
echo ""
echo "[5/7] Installing dependencies..."
cd "$APP_DIR"
composer install --no-dev --optimize-autoloader
npm ci
npm run build

# ---- STEP 6: PERMISSIONS & CACHES ----
echo ""
echo "[6/7] Setting permissions and caching..."
chown -R www-data:www-data "$APP_DIR/storage" "$APP_DIR/bootstrap/cache"
chmod -R 775 "$APP_DIR/storage" "$APP_DIR/bootstrap/cache"
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link

# ---- STEP 7: MIGRATE ----
echo ""
echo "[7/7] Running migrations..."
php artisan migrate --force

echo ""
echo "============================================"
echo "  DEPLOYMENT SELESAI!"
echo "============================================"
echo ""
echo "Akses: https://sindangasih-makmur.com/it-system"
echo ""
echo "Login pertama kali:"
echo "  Username: irfaanaufal"
echo "  Password: (password yang dulu)"
echo ""
echo "Verifikasi:"
echo "  supervisorctl status"
echo "  tail -f $APP_DIR/storage/logs/laravel.log"
echo "============================================"
