-- ============================================================
-- IT-SYSTEM DEPLOYMENT SQL SCRIPT
-- Database: mainwalet
-- Tanggal: 2026-09-12 (revisi: production hardening)
-- Catatan: Script ini idempotent — aman diulang
--   - FASE 1: schema (DDL, auto-commit)
--   - FASE 2-5: data dalam SATU transaksi (START TRANSACTION s/d COMMIT)
--   - 2 migrasi TERSEDIA di repo tapi sengaja TIDAK dicatat di FASE 5
--     (2026_08_30_000001_create_karyawans_table, 2026_08_30_000002_add_missing_indexes)
--     karena guarded & dibiarkan dijalankan `php artisan migrate --force`
-- ============================================================

-- ============================================================
-- FASE 1: SCHEMA CHANGES (cek dulu, tambah jika missing)
-- ============================================================

-- 1a. roles: tambah kolom level
SET @has_level = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' AND COLUMN_NAME = 'level');
SET @sql = IF(@has_level = 0,
    'ALTER TABLE roles ADD COLUMN `level` INT NULL UNIQUE AFTER `name`',
    'SELECT "SKIP: roles.level sudah ada" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1b. users: tambah kolom deleted_at
SET @has_da = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'deleted_at');
SET @sql = IF(@has_da = 0,
    'ALTER TABLE users ADD COLUMN `deleted_at` TIMESTAMP NULL AFTER `updated_at`',
    'SELECT "SKIP: users.deleted_at sudah ada" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1c. tickets: tambah kolom deadline
SET @has_dl = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'deadline');
SET @sql = IF(@has_dl = 0,
    'ALTER TABLE tickets ADD COLUMN `deadline` DATE NULL AFTER `status`',
    'SELECT "SKIP: tickets.deadline sudah ada" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1d. tickets: tambah kolom link_sistem
SET @has_ls = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'link_sistem');
SET @sql = IF(@has_ls = 0,
    'ALTER TABLE tickets ADD COLUMN `link_sistem` VARCHAR(255) NULL AFTER `system_ptsam_id`',
    'SELECT "SKIP: tickets.link_sistem sudah ada" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1e. user_applications: tambah kolom permissions
SET @has_pm = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_applications' AND COLUMN_NAME = 'permissions');
SET @sql = IF(@has_pm = 0,
    'ALTER TABLE user_applications ADD COLUMN `permissions` JSON NULL AFTER `role_id`',
    'SELECT "SKIP: user_applications.permissions sudah ada" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1f. tickets: tambah index status (jika belum ada)
SET @has_idx = (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND INDEX_NAME = 'tickets_status_index');
SET @sql = IF(@has_idx = 0,
    'ALTER TABLE tickets ADD INDEX tickets_status_index (`status`)',
    'SELECT "SKIP: tickets.status index sudah ada" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1g. user_applications: tambah unique index (jika belum ada)
SET @has_uq = (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_applications'
    AND INDEX_NAME = 'user_applications_user_id_application_id_unique');
SET @sql = IF(@has_uq = 0,
    'ALTER TABLE user_applications ADD UNIQUE INDEX user_applications_user_id_application_id_unique (`user_id`, `application_id`)',
    'SELECT "SKIP: user_applications unique index sudah ada" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1h. tickets: ubah FK karyawan_id dari CASCADE ke SET NULL (idempotent)
SET @has_fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets'
    AND CONSTRAINT_NAME = 'tickets_karyawan_id_foreign'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sql = IF(@has_fk > 0,
    'ALTER TABLE tickets DROP FOREIGN KEY tickets_karyawan_id_foreign',
    'SELECT "SKIP: FK tidak ditemukan" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Re-add FK dengan SET NULL + buat karyawan_id nullable
SET @is_nullable = (SELECT IS_NULLABLE FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'karyawan_id');
SET @sql = IF(@is_nullable = 'NO',
    'ALTER TABLE tickets MODIFY COLUMN `karyawan_id` BIGINT UNSIGNED NULL',
    'SELECT "SKIP: karyawan_id sudah nullable" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tambah FK baru (hanya jika belum ada)
SET @has_fk2 = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets'
    AND CONSTRAINT_NAME = 'tickets_karyawan_id_foreign'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sql = IF(@has_fk2 = 0,
    'ALTER TABLE tickets ADD CONSTRAINT tickets_karyawan_id_foreign FOREIGN KEY (`karyawan_id`) REFERENCES `karyawans`(`id`) ON DELETE SET NULL',
    'SELECT "SKIP: FK sudah ada" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1i. users.role_id → FK ke roles (ON DELETE SET NULL, sesuai migrasi repo).
--     Prod sudah punya INDEX users_role_id_foreign tapi TANPA constraint (Laravel
--     menandai migrasi sebagai run) — buat constraint-nya (idempotent).
SET @has_fk3 = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
    AND CONSTRAINT_NAME = 'users_role_id_foreign'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sql = IF(@has_fk3 = 0,
    'ALTER TABLE users ADD CONSTRAINT users_role_id_foreign FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL',
    'SELECT "SKIP: FK users.role_id sudah ada" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1j. user_applications.role_id → FK ke roles (ON DELETE SET NULL, sesuai migrasi repo)
SET @has_fk4 = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_applications'
    AND CONSTRAINT_NAME = 'user_applications_role_id_foreign'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sql = IF(@has_fk4 = 0,
    'ALTER TABLE user_applications ADD CONSTRAINT user_applications_role_id_foreign FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL',
    'SELECT "SKIP: FK user_applications.role_id sudah ada" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- ============================================================
-- FASE 2: ROLE DATA MIGRATION (dalam transaksi)
-- CATATAN: TANPA `DELETE FROM roles` — cukup rename in-place agar
-- referensi FK users.role_id & user_applications.role_id tidak rusak.
-- Legacy prod: (1,superadmin) (2,admin) (3,user) (4,it)
-- Jebakan: unique key name case-insensitive → 'it' (id4) bentrok dengan
-- 'IT' (id1) — karena itu fase A rename dulu ke nama netral.
-- ============================================================

START TRANSACTION;

-- 2a. Fase A: rename role legacy (hanya baris lama yang belum punya level)
UPDATE roles SET name = CONCAT('_old_', id)
WHERE id <= 4 AND level IS NULL AND name <> CONCAT('_old_', id);

-- 2b. Fase B: upsert 9 role resmi (id = level). Idempoten & aman ulang.
INSERT INTO roles (id, name, level, created_at, updated_at) VALUES
(1, 'IT', 1, NOW(), NOW()),
(2, 'Direktur Utama', 2, NOW(), NOW()),
(3, 'Head Admin', 3, NOW(), NOW()),
(4, 'HRD', 4, NOW(), NOW()),
(5, 'Admin', 5, NOW(), NOW()),
(6, 'Teknisi', 6, NOW(), NOW()),
(7, 'QA', 7, NOW(), NOW()),
(8, 'QC', 8, NOW(), NOW()),
(9, 'Ekspedisi', 9, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    level = VALUES(level),
    updated_at = VALUES(updated_at);


-- ============================================================
-- FASE 3: USER ROLE MAPPING (sesuai mapping dari user)
-- ============================================================

-- Irfaanaufal (id=1): superadmin → IT (1)
UPDATE users SET role_id = 1 WHERE id = 1;

-- Hadi (id=9): superadmin → HRD (4)
UPDATE users SET role_id = 4 WHERE id = 9;

-- Hendi (id=10): superadmin → IT (1)
UPDATE users SET role_id = 1 WHERE id = 10;

-- Johan (id=20): superadmin → Direktur Utama (2)
UPDATE users SET role_id = 2 WHERE id = 20;

-- Wenny (id=21): superadmin → Head Admin (3)
UPDATE users SET role_id = 3 WHERE id = 21;

-- Walid (id=7): user → Ekspedisi (9)
UPDATE users SET role_id = 9 WHERE id = 7;

-- Noviyanti, Salsabila, Evita, Hida, YESHA, Novia → Admin (5)
UPDATE users SET role_id = 5 WHERE id IN (8, 11, 12, 13, 14, 15);

-- Lia → QA (7)
UPDATE users SET role_id = 7 WHERE id = 16;

-- Safana, Riskia, Malik, Desyifa, Annisa, Tedi → QC (8)
UPDATE users SET role_id = 8 WHERE id IN (17, 18, 19, 22, 23, 24);

-- Fadhil, Gani → Teknisi (6)
UPDATE users SET role_id = 6 WHERE id IN (25, 26);


-- ============================================================
-- FASE 4: SYNC user_applications (dalam transaksi)
-- ============================================================

-- 4a. Backfill akses aplikasi 1 (it-workflow) untuk user aktif yang belum
--     punya baris. Kenapa: di prod HANYA 9 dari 21 user punya baris app=1 —
--     12 user lain akan kena 403 karena TIDAK PUNYA BARIS sama sekali
--     (bukan baris inactive; migrasi backfill lama tidak menyentuh mereka
--     karena mereka sudah punya baris untuk aplikasi lain).
--     Semua baris app=1 yang sudah ada di prod juga is_active=1.
INSERT INTO user_applications (user_id, application_id, is_active, approved_by, approved_at, role_id, created_at, updated_at)
SELECT u.id, 1, 1, NULL, NULL, u.role_id, NOW(), NOW()
FROM users u
LEFT JOIN user_applications ua ON ua.user_id = u.id AND ua.application_id = 1
WHERE ua.id IS NULL
  AND u.deleted_at IS NULL
  AND u.role_id IS NOT NULL;

-- 4b. Sinkronkan role_id SEMUA baris mengikuti users.role_id
--     (semantik sama dengan migrasi 2026_08_29_backfill_user_applications
--     yang memang mengisi role_id = users.role_id untuk setiap aplikasi)
UPDATE user_applications ua
JOIN users u ON u.id = ua.user_id
SET ua.role_id = u.role_id
WHERE (ua.role_id <=> u.role_id) = 0;


-- ============================================================
-- FASE 5: INSERT MIGRATION RECORDS
-- (Agar `php artisan migrate` tidak coba run ulang)
-- CATATAN:
--   - Idempoten: DELETE hanya 34 nama di bawah dulu (jangan pernah
--     DELETE WHERE batch — tabel migrations dipakai bersama).
--   - 2026_08_30_000001_create_karyawans_table & 2026_08_30_000002_
--     add_missing_indexes SENGAJA TIDAK dicatat — keduanya guarded dan
--     dibiarkan dijalankan `php artisan migrate --force` di deploy.sh.
-- ============================================================

DELETE FROM migrations WHERE migration IN (
'0001_01_01_000000_create_users_table',
'0001_01_01_000001_create_cache_table',
'0001_01_01_000002_create_jobs_table',
'2026_06_24_000001_create_roles_table',
'2026_06_24_070137_clean_users_role_column',
'2026_06_24_070511_create_tickets_table',
'2026_06_24_070521_create_ticket_checklists_table',
'2026_06_24_070819_create_personal_access_tokens_table',
'2026_06_25_034538_add_uat_fields_to_tickets_table',
'2026_06_25_040628_add_avatar_to_users_table',
'2026_06_25_083000_add_soft_deletes_to_tickets_table',
'2026_06_26_000000_create_log_notifikasi_table',
'2026_06_26_010000_add_tracking_fields_to_log_notifikasi_table',
'2026_06_26_020000_add_visible_in_bell_to_log_notifikasi_table',
'2026_06_27_063828_create_system_ptsam_table',
'2026_06_27_063838_add_system_ptsam_id_to_tickets_table',
'2026_06_29_100357_create_applications_table',
'2026_06_29_100403_create_user_applications_table',
'2026_06_29_103000_drop_permissions_tables',
'2026_07_01_100000_add_username_fid_role_to_users_table',
'2026_07_03_000001_add_unique_to_user_applications',
'2026_07_03_000002_add_role_id_to_user_applications',
'2026_07_08_000000_add_reject_reason_to_tickets_table',
'2026_08_18_000000_add_level_to_roles_and_replace_roles',
'2026_08_18_000001_resequence_role_ids',
'2026_08_18_000001_add_deadline_to_tickets_table',
'2026_08_18_000002_add_link_sistem_to_tickets_table',
'2026_08_26_000001_migrate_role_to_per_app',
'2026_08_26_000002_add_head_admin_role',
'2026_08_26_000003_fix_karyawan_cascade_delete',
'2026_08_27_000001_add_role_fk_to_users_table',
'2026_08_27_000001_add_permissions_to_user_applications',
'2026_08_27_000002_add_performance_indexes',
'2026_08_29_000001_backfill_user_applications'
);

INSERT INTO migrations (migration, batch) VALUES
('0001_01_01_000000_create_users_table', 1),
('0001_01_01_000001_create_cache_table', 1),
('0001_01_01_000002_create_jobs_table', 1),
('2026_06_24_000001_create_roles_table', 1),
('2026_06_24_070137_clean_users_role_column', 1),
('2026_06_24_070511_create_tickets_table', 1),
('2026_06_24_070521_create_ticket_checklists_table', 1),
('2026_06_24_070819_create_personal_access_tokens_table', 1),
('2026_06_25_034538_add_uat_fields_to_tickets_table', 1),
('2026_06_25_040628_add_avatar_to_users_table', 1),
('2026_06_25_083000_add_soft_deletes_to_tickets_table', 1),
('2026_06_26_000000_create_log_notifikasi_table', 1),
('2026_06_26_010000_add_tracking_fields_to_log_notifikasi_table', 1),
('2026_06_26_020000_add_visible_in_bell_to_log_notifikasi_table', 1),
('2026_06_27_063828_create_system_ptsam_table', 1),
('2026_06_27_063838_add_system_ptsam_id_to_tickets_table', 1),
('2026_06_29_100357_create_applications_table', 1),
('2026_06_29_100403_create_user_applications_table', 1),
('2026_06_29_103000_drop_permissions_tables', 1),
('2026_07_01_100000_add_username_fid_role_to_users_table', 1),
('2026_07_03_000001_add_unique_to_user_applications', 1),
('2026_07_03_000002_add_role_id_to_user_applications', 1),
('2026_07_08_000000_add_reject_reason_to_tickets_table', 1),
('2026_08_18_000000_add_level_to_roles_and_replace_roles', 1),
('2026_08_18_000001_resequence_role_ids', 1),
('2026_08_18_000001_add_deadline_to_tickets_table', 1),
('2026_08_18_000002_add_link_sistem_to_tickets_table', 1),
('2026_08_26_000001_migrate_role_to_per_app', 1),
('2026_08_26_000002_add_head_admin_role', 1),
('2026_08_26_000003_fix_karyawan_cascade_delete', 1),
('2026_08_27_000001_add_role_fk_to_users_table', 1),
('2026_08_27_000001_add_permissions_to_user_applications', 1),
('2026_08_27_000002_add_performance_indexes', 1),
('2026_08_29_000001_backfill_user_applications', 1);

COMMIT;
-- Akhir FASE 2-5 (transaksi)
