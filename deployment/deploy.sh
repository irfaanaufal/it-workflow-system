#!/bin/bash
# ============================================================
# IT-SYSTEM DEPLOYMENT SCRIPT
# Jalankan di server sebagai root atau dengan sudo
# ============================================================

set -euo pipefail

# ---- KONFIGURASI ----
APP_DIR="/var/www/it-system"
DB_NAME="mainwalet"
DB_USER="root"
DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup_on_error() {
    echo ""
    echo "!!! DEPLOYMENT GAGAL — mencoba kembali ke mode online..."
    if [ -f "$APP_DIR/.env" ]; then
        (cd "$APP_DIR" && php artisan up) || true
    fi
}
trap cleanup_on_error ERR

echo "============================================"
echo "  IT-SYSTEM DEPLOYMENT"
echo "============================================"

# ---- STEP 1: CEK ENVIRONMENT ----
echo ""
echo "[1/8] Checking environment..."
php -v | head -1
node -v
composer -V | head -1

# ---- STEP 2: PASSWORD MYSQL ROOT ----
# (kosongkan jika root tanpa password / auth_socket)
echo ""
echo "[2/8] MySQL root password (untuk backup & SQL deployment)..."
read -r -s -p "Password root (Enter = kosong): " MYSQL_ROOT_PASSWORD
echo ""
export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"
# mysql/mysqldump membaca MYSQL_PWD — password tidak tampil di proses

# ---- STEP 3: BACKUP DATABASE ----
echo ""
echo "[3/8] Backing up database..."
BACKUP_FILE="backup_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
if ! mysqldump --single-transaction --routines --triggers -u "$DB_USER" "$DB_NAME" > "/root/$BACKUP_FILE"; then
    rm -f "/root/$BACKUP_FILE"
    echo "ERROR: backup gagal — deployment dihentikan (tidak ada perubahan sama sekali)."
    exit 1
fi
if [ ! -s "/root/$BACKUP_FILE" ]; then
    rm -f "/root/$BACKUP_FILE"
    echo "ERROR: file backup kosong — deployment dihentikan."
    exit 1
fi
echo "Backup saved to /root/$BACKUP_FILE"

# ---- STEP 4: COMPOSER (SEBELUM artisan apa pun) ----
echo ""
echo "[4/8] Installing PHP dependencies..."
cd "$APP_DIR"
composer install --no-dev --optimize-autoloader

# ---- STEP 5: SETUP .ENV (ATOMIC & TERVERIFIKASI) ----
echo ""
echo "[5/8] Setting up .env..."
if [ ! -f "$DEPLOY_DIR/.env.production" ]; then
    echo "ERROR: $DEPLOY_DIR/.env.production tidak ditemukan."
    exit 1
fi
if [ ! -f "$APP_DIR/.env" ]; then
    cp "$DEPLOY_DIR/.env.production" "$APP_DIR/.env"
    (cd "$APP_DIR" && php artisan key:generate)
    read -r -s -p "MySQL password untuk user 'sindangasih': " DB_PASSWORD
    echo ""
    if [ -z "$DB_PASSWORD" ]; then
        rm -f "$APP_DIR/.env"
        echo "ERROR: password tidak boleh kosong — .env dibuang, jalankan ulang deploy."
        exit 1
    fi
    ESCAPED_DB_PASSWORD="$(printf '%s' "$DB_PASSWORD" | sed 's/[&|\\]/\\&/g')"
    sed -i "s|<MySQL password>|$ESCAPED_DB_PASSWORD|" "$APP_DIR/.env"
    unset DB_PASSWORD ESCAPED_DB_PASSWORD
    if grep -q '<MySQL password>' "$APP_DIR/.env" || ! grep -q '^APP_KEY=base64:' "$APP_DIR/.env"; then
        rm -f "$APP_DIR/.env"
        echo "ERROR: .env gagal divalidasi (placeholder/APP_KEY) — .env dibuang, jalankan ulang deploy."
        exit 1
    fi
    chmod 600 "$APP_DIR/.env"
    echo ".env created with APP_KEY generated."
else
    # .env sudah ada: GAGALKAN jika rusak, jangan lanjut dengan konfigurasi setengah jadi
    if grep -q '<MySQL password>' "$APP_DIR/.env" || ! grep -q '^APP_KEY=base64:' "$APP_DIR/.env"; then
        echo "ERROR: .env lama masih berisi placeholder / APP_KEY kosong."
        echo "  Perbaiki manual (isi DB_PASSWORD, jalankan 'php artisan key:generate'), lalu deploy ulang."
        exit 1
    fi
    echo ".env already exists and valid, skipping."
fi

# ---- STEP 6: INSTALL DEPENDENCIES & BUILD ----
echo ""
echo "[6/8] Installing frontend dependencies & building..."
cd "$APP_DIR"
npm ci
npm run build

# ---- STEP 7: PERMISSIONS, SYMLINK & CACHES ----
echo ""
echo "[7/8] Setting permissions, symlink and caches..."
chown -R www-data:www-data "$APP_DIR/storage" "$APP_DIR/bootstrap/cache"
chmod -R 775 "$APP_DIR/storage" "$APP_DIR/bootstrap/cache"
cd "$APP_DIR"
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link
# nginx memakai root = public/, jadi URL /it-system/* butuh link public/it-system → public/
if [ -L "$APP_DIR/public/it-system" ]; then
    echo "symlink public/it-system sudah ada"
elif [ -e "$APP_DIR/public/it-system" ]; then
    echo "PERINGATAN: public/it-system ada tapi bukan symlink — dilewati, periksa manual."
else
    ln -s . "$APP_DIR/public/it-system"
    echo "symlink public/it-system dibuat"
fi

# ---- STEP 8: MAINTENANCE MODE, SQL, MIGRATE & RESTART ----
echo ""
echo "[8/8] Maintenance mode, SQL deployment & migrations..."
cd "$APP_DIR"
php artisan down
mysql -u "$DB_USER" "$DB_NAME" < "$DEPLOY_DIR/deploy.sql"
echo "SQL script executed successfully."
php artisan migrate --force
php artisan queue:restart
if command -v supervisorctl >/dev/null 2>&1; then
    supervisorctl restart 'it-system-worker:*' \
        || echo "PERINGATAN: restart worker gagal — cek supervisorctl status."
else
    echo "PERINGATAN: supervisorctl tidak ditemukan — queue worker tidak di-restart."
fi
php artisan up

# ---- SMOKE TEST ----
echo ""
echo "Smoke test:"
if command -v curl >/dev/null 2>&1; then
    HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 'https://sindangasih-makmur.com/it-system/up' || echo '000')"
    if [ "$HTTP_CODE" = "200" ]; then
        echo "  /it-system/up -> HTTP 200 OK"
    else
        echo "  PERINGATAN: /it-system/up -> HTTP $HTTP_CODE — cek nginx & laravel.log"
    fi
fi

echo ""
echo "============================================"
echo "  DEPLOYMENT SELESAI!"
echo "============================================"
echo ""
echo "Akses: https://sindangasih-makmur.com/it-system"
echo ""
echo "Verifikasi:"
echo "  supervisorctl status"
echo "  tail -f $APP_DIR/storage/logs/laravel.log"
echo "============================================"
