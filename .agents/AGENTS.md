# Project Rules & Feature Flows

## 1. Centralized Database Architecture
The database `main_db` is a shared/central database used across multiple applications in this ecosystem:
1. **IT Workflow** (this current codebase, slug: `it-workflow`)
2. **Reminder** (slug: `reminder`)
3. **Shortly App** (slug: `shortly`)
4. **Meeting Attendance** (slug: `meeting-attendance`)

> [!IMPORTANT]
> Any changes to the core schemas (`users`, `roles`, `permissions`, `role_has_permissions`, `applications`, and `user_applications`) must preserve backward compatibility as they are shared with the other applications in the portal.

---

## 2. Centralized Application Access Flow

Here is the detailed flow of how user registration, automatic access request, and approval operate within this system:

```mermaid
sequenceDiagram
    actor User
    actor SuperAdmin
    participant Register as Halaman Register
    participant Login as Halaman Login
    participant DB as Database (main_db)
    participant Manage as Kelola Permintaan (Admin)

    User->>Register: Input Nama, Email, Username, Password, FID
    Register->>DB: Simpan User Baru (Role: 'user')
    Register-->>User: Redirect ke /login (Pendaftaran Berhasil)

    User->>Login: Input Username & Password
    Login->>DB: Cek Autentikasi Kredensial
    alt Kredensial Valid, Tapi Belum Ada Akses 'it-workflow'
        Login->>DB: Buat Request Akses Otomatis (user_applications.is_active = 0)
        Login-->>User: Batalkan Sesi & Redirect dengan Pesan: "Permintaan akses diajukan secara otomatis..."
    else Akses Masih Ditangguhkan (Pending)
        Login-->>User: Batalkan Sesi & Redirect dengan Pesan: "Akses Anda masih ditangguhkan (Pending Approval)..."
    }
    
    Note over SuperAdmin, Manage: Super Admin menyetujui permintaan akses
    SuperAdmin->>Manage: Buka Kelola Permintaan / Hak Akses & Peran
    Manage->>DB: Set user_applications.is_active = 1 (approved_by & approved_at diisi)
    
    User->>Login: Input Username & Password kembali
    Login->>DB: Cek Autentikasi & Izin Akses (Aktif)
    Login-->>User: Berhasil Masuk ke Dashboard IT Workflow (Menu-menu sistem terbuka)
```

### Tahap 1: Registrasi Pengguna
* **File Terkait**: [RegisteredUserController.php](file:///g:/Vterr/SOURCE%20CODE/it-system/app/Http/Controllers/Auth/RegisteredUserController.php) & [Register.jsx](file:///g:/Vterr/SOURCE%20CODE/it-system/resources/js/Pages/Auth/Register.jsx)
* **Logika**:
  1. Pengguna memasukkan data registrasi (Nama, Username, Email, Password, dan FID opsional).
  2. Jika FID tidak diinput, sistem akan mencoba mencocokkan Nama dengan tabel `karyawans` secara otomatis untuk memetakan divisinya.
  3. Pengguna disimpan dengan peran default `'user'`.
  4. Akun diset langsung terverifikasi email (`email_verified_at = now()`).
  5. Pengguna dialihkan secara fisik ke **Halaman Login** tanpa sesi login aktif (`Auth::login` dilewati).

### Tahap 2: Login & Pembuatan Request Otomatis
* **File Terkait**: [AuthenticatedSessionController.php](file:///g:/Vterr/SOURCE%20CODE/it-system/app/Http/Controllers/Auth/AuthenticatedSessionController.php) & [CheckITWorkflowAccess.php](file:///g:/Vterr/SOURCE%20CODE/it-system/app/Http/Middleware/CheckITWorkflowAccess.php)
* **Logika**:
  1. Pengguna memasukkan kredensial di halaman login.
  2. Jika kredensial benar, sistem akan mengecek hak akses pengguna:
     * **Bypass Otoritas**: Jika pengguna memiliki permission `access-it-workflow` (seperti role `superadmin` atau `it`), mereka langsung lolos ke Dashboard.
     * **Auto-Request**: Jika pengguna reguler belum memiliki entri di tabel `user_applications` untuk aplikasi `it-workflow`, sistem akan **secara otomatis membuat entri baru** dengan `is_active = false`.
     * **Redireksi & Pesan Pending**: Sesi login user tersebut akan langsung dimusnahkan (`Auth::logout()`), lalu dialihkan kembali ke login dengan error di kolom email: *"Permintaan akses ke IT Workflow telah diajukan secara otomatis. Harap tunggu persetujuan Super Admin."*
     * **Pengecekan Berulang**: Jika entri sudah ada tetapi `is_active` masih `false`, login akan kembali ditolak dengan pesan: *"Akses Anda ke IT Workflow masih ditangguhkan (Pending Approval). Harap hubungi Super Admin."*

### Tahap 3: Persetujuan oleh Super Admin / IT Staff
* **File Terkait**: [ApplicationController.php](file:///g:/Vterr/SOURCE%20CODE/it-system/app/Http/Controllers/ApplicationController.php) & [Requests.jsx](file:///g:/Vterr/SOURCE%20CODE/it-system/resources/js/Pages/Applications/Requests.jsx)
* **Logika**:
  1. Super Admin atau Staff IT masuk ke portal sistem dan mengakses halaman **Akses Aplikasi -> Kelola Permintaan** (atau melalui route `/admin/applications/requests`).
  2. Mereka akan melihat tabel daftar pengajuan akses aplikasi dari seluruh pengguna.
  3. Ketika Super Admin mengklik tombol **Approve (Aktifkan Akses)**:
     * Sistem memicu method `toggleAccess` pada `ApplicationController`.
     * Field `is_active` pada tabel `user_applications` diubah menjadi `true`.
     * Kolom `approved_by` diisi dengan ID admin yang menyetujui, dan `approved_at` diisi dengan waktu saat itu.
  4. Setelah disetujui, pengguna bersangkutan dapat login kembali dengan sukses dan seluruh menu navigasi sistem (seperti Dashboard, My Requests, Global Monitor, dsb.) akan otomatis terbuka di sidebarnya.

---

## 3. Matriks Hak Akses & Peran (Role & Permission Matrix)

Berikut adalah daftar hak akses granular yang tersedia di dalam sistem beserta pemetaannya untuk masing-masing peran:

| Hak Akses (Permission) | Keterangan / Fungsi | superadmin | it | user |
| --- | --- | :---: | :---: | :---: |
| **`access-it-workflow`** | Akses masuk utama ke aplikasi IT Workflow | ✓ | ✓ | |
| **`manage-applications`** | CRUD Aplikasi (tambah/edit/hapus daftar sistem) | ✓ | | |
| **`approve-requests`** | Menyetujui/menolak pengajuan akses dari user lain | ✓ | ✓ | |
| **`create.laporan`** | Membuat laporan tiket permasalahan baru | ✓ | | ✓ |
| **`take.laporan`** | Mengambil alih tiket laporan untuk dikerjakan staf IT | ✓ | ✓ | |
| **`close.laporan`** | Menyelesaikan dan menutup tiket laporan | ✓ | ✓ | |
| **`edit.laporan`** | Mengubah rincian data tiket laporan | ✓ | ✓ | |
| **`delete.laporan`** | Menghapus tiket laporan dari sistem | ✓ | | |
| **`view.laporan.global`**| Memantau semua laporan secara global (Global Monitor) | ✓ | ✓ | |

> [!NOTE]
> Hak akses di atas dikelola secara dinamis melalui halaman **Hak Akses & Peran** (`/admin/roles-permissions`) oleh Super Admin.

