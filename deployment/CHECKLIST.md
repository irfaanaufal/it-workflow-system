# CHECKLIST DEPLOYMENT IT-SYSTEM (Production)

Checklist ini pelengkap `deploy.sh` — dijalankan berurutan di server.
Semua perintah diasumsikan sebagai **root** di server Linux.

---

## 0. SEKALI SAAT PERTAMA

- [ ] **Pastikan semua commit sudah di-push** — server tidak bisa `git pull`
      sebelum push dilakukan. Cek dari repo lokal: `git log origin/main..main`
      (harus kosong; bila ada, push dulu `git push origin main`).
- [ ] Prasyarat terpasang di server:
      `php8.3` + `php8.3-fpm`, `composer`, `node`+`npm`, `mysql-client`,
      `supervisor`, `nginx`.
- [ ] Tentukan cara code sampai ke server (git pull / rsync).
      **`public/build` TIDAK di-track git** → build dilakukan DI SERVER
      (otomatis oleh `deploy.sh` step 6; pastikan `npm ci` bisa jalan).

---

## 1. PRE-FLIGHT (sebelum menjalankan deploy.sh)

- [ ] Path aplikasi sesuai konfigurasi script:
      `grep '^APP_DIR=' deployment/deploy.sh` → `/var/www/it-system` ✔
- [ ] **INSPEKSI NGINX LIVE — jangan timpa buta.** Situs sudah live, jadi
      konfigurasi asli mungkin berbeda dari template:
      ```bash
      nginx -T 2>/dev/null | grep -nE "server_name|root |it-system|client_max_body"
      ls -la /etc/nginx/sites-enabled/
      ```
      - Pastikan hanya **satu** `server` block yang klaim
        `sindangasih-makmur.com` (dua block = block pertama menang, blok
        kedua diabaikan).
      - Jika `/it-system/` sudah berfungsi → **jangan ganti config**, cukup
        pastikan `client_max_body_size 12m` & redirect
        `location = /it-system { return 301 /it-system/; }` ditambahkan.
      - Jika belum ada / rusak → merge `deployment/nginx-it-system`
        ke config aktif, lalu **wajib**:
        ```bash
        nginx -t && systemctl reload nginx
        ```
- [ ] Jika `.env` SUDAH ADA di server, verifikasi (deploy.sh juga akan
      menolak jika rusak, tapi cek dulu supaya tak perlu deploy ulang):
      ```bash
      grep -E '^(APP_DEBUG|LOG_STACK|APP_KEY|DB_PASSWORD)' /var/www/it-system/.env
      ```
      Wajib: `APP_DEBUG=false`, `LOG_STACK=daily`, `APP_KEY=base64:…`
      terisi, `DB_PASSWORD` bukan `<MySQL password>`.
- [ ] Catat posisi sekarang untuk rollback:
      `cd /var/www/it-system && git log --oneline -1`

---

## 2. JALANKAN DEPLOY

```bash
cd /var/www/it-system
bash deployment/deploy.sh
```

- [ ] Password root MySQL (Enter = kosong bila auth_socket).
- [ ] Password user `sindangasih` (hanya bila `.env` belum ada).
- [ ] **Backup terbentuk & tidak kosong** — deploy berhenti otomatis jika
      gagal:
      `ls -la /root/backup_mainwalet_*.sql`
- [ ] Semua step `[1/8] … [8/8]` sukses, tidak ada `!!! DEPLOYMENT GAGAL`.
- [ ] Smoke test akhir: `/it-system/up -> HTTP 200 OK`.
- [ ] Jika gagal di tengah: script otomatis `php artisan up`. Bila perlu
      manual: `cd /var/www/it-system && php artisan up`.

---

## 3. VERIFIKASI DATABASE

```bash
cd /var/www/it-system && php artisan tinker
```
```php
Role::count();                                            // 10 (ada "Menunggu Persetujuan")
Role::where('name','Menunggu Persetujuan')->value('level'); // 10
User::whereNull('role_id')->count();                      // 0  (21 user semua ter-mapping)
DB::table('user_applications')->where('application_id',1)->count(); // = jumlah user aktif (21) — 12 user dulu LOCKOUT kini punya baris
DB::table('migrations')->count();                         // 37 (= jumlah file migrasi di repo)
```
- [ ] FK tercipta (audit: prod dulu hanya punya index tanpa constraint):
      `SHOW CREATE TABLE users\G` dan `user_applications\G`
      → ada `CONSTRAINT users_role_id_foreign` & `user_applications_role_id_foreign`.

---

## 4. VERIFIKASI APLIKASI (browser)

- [ ] Buka `https://sindangasih-makmur.com/it-system` → redirect 301 ke
      `/it-system/` → halaman login tampil **HTTPS** (lihat Source:
      URL aset `https://…/it-system/build/…` — bukan `http://`).
- [ ] Login (akun IT) → dashboard → buat tiket + lampiran **> 1 MB**
      (menguji `client_max_body_size 12m`).
- [ ] Avatar tampil di profil & header (URL kini
      `…/it-system/storage/profile-photos/…`).
- [ ] Buka detail + timeline tiket milik sendiri → 200.
      Buka tiket orang lain (akun lain) → **403** (uji IDOR: endpoint
      `/api/tickets/{id}` & `/api/tickets/{id}/timeline`).
- [ ] **Registrasi & login**: daftar akun baru (nama = nama karyawan yang cocok)
      → role `Menunggu Persetujuan` (bukan langsung IT/HRD) + **tepat 1 baris**
      `user_applications` (it-workflow, inactive) + notifikasi **"Permintaan
      akses baru"** ke lonceng level 1,2,3,4,7 — baris muncul di **Kelola
      Permintaan** saat itu juga (bukan setelah login, bukan 4) → klik Masuk →
      modal **"Akun belum diaktifkan. Hubungi tim IT"** (tanpa bypass — akun
      admin level 1 pun diblokir bila barisnya belum aktif) → approve →
      role otomatis sesuai divisi → Login kedua → dashboard.
- [ ] **Lupa password**: email tak dikenal & email valid → pesan yang
      **sama** (tidak ada error "user tidak ditemukan").
- [ ] `GET /it-system` tanpa slash → 301 → `/it-system/`.

---

## 5. VERIFIKASI KEAMANAN

- [ ] **HTTPS terdeteksi** (penting setelah `trustProxies` dibatasi):
      aset di page-source harus `https://`. Jika `http://` →
      server di belakang proxy, lakukan salah satu:
      - tambahkan IP proxy asli ke `trustProxies(at: […])` di
        `bootstrap/app.php`, **atau**
      - set `fastcgi_param HTTPS on;` di location index.php.
- [ ] **REMOTE_ADDR bukan IP proxy** (bila di belakang CDN/proxy, wajib
      sesuaikan `trustProxies` agar rate-limit tetap pakai IP asli).
- [ ] Throttle login: 6× POST `/login` gagal → respons **429**.
- [ ] Header `X-Forwarded-For` palsu tidak mengubah rate-limit / IP log.
- [ ] `APP_DEBUG=false` (akses `/it-system/nonexistent` → halaman error
      generik, **tanpa stack trace**).

---

## 6. OPERASIONAL

- [ ] `supervisorctl status` → `it-system-worker:*` **RUNNING**.
- [ ] Queue jalan: kirim notifikasi tiket → masuk `storage/logs/laravel-*.log`
      tanpa error, job `failed_jobs` kosong.
- [ ] Rotasi log: `LOG_STACK=daily` → file `laravel-2026-10-0*.log` muncul.
- [ ] Retensi backup manual di `/root/backup_*.sql` — hapus berkala
      (mis. `find /root -name 'backup_mainwalet_*.sql' -mtime +30 -delete`).
      **Dump repo** (`deployment/backup_*.sql`) sudah di-gitignore — jangan
      pernah commit.

---

## 7. ROLLBACK (jika bermasalah)

```bash
cd /var/www/it-system
php artisan down

# 1. Kembalikan database (HATI-HATI: menimpa perubahan sesudah backup)
mysql -u root mainwalet < /root/backup_mainwalet_<TANGGAL>.sql

# 2. Kembalikan kode ke commit sebelum deploy
git checkout <hash-sebelum-deploy>

# 3. Build ulang & normalisasi
composer install --no-dev --optimize-autoloader && npm ci && npm run build
php artisan config:cache && php artisan route:cache && php artisan view:cache

# 4. Nginx: kembalikan config backup, lalu
nginx -t && systemctl reload nginx

php artisan up
```
