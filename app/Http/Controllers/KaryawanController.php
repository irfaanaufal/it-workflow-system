<?php

namespace App\Http\Controllers;

use App\Models\Karyawan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class KaryawanController extends Controller
{
    public function index()
    {
        $karyawans = Karyawan::orderBy('nama_karyawan', 'asc')->get();

        return Inertia::render('Admin/Karyawan', [
            'karyawans' => $karyawans,
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'fid' => 'required|string|max:50|unique:karyawans,fid',
            'nama_karyawan' => 'required|string|max:255',
            'divisi' => 'nullable|string|max:255',
            'jabatan' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:Active,Inactive',
        ], [
            'fid.required' => 'Fingerprint ID (FID) wajib diisi.',
            'fid.unique' => 'FID ini sudah terdaftar untuk karyawan lain.',
            'nama_karyawan.required' => 'Nama karyawan wajib diisi.',
        ]);

        if (!isset($validated['status'])) {
            $validated['status'] = 'Active';
        }

        Karyawan::create($validated);

        return back()->with('success', 'Karyawan baru berhasil ditambahkan!');
    }

    public function update(Request $request, $fid)
    {
        $karyawan = Karyawan::findOrFail($fid);

        $validated = $request->validate([
            'nama_karyawan' => 'required|string|max:255',
            'divisi' => 'nullable|string|max:255',
            'jabatan' => 'nullable|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'nama_karyawan.required' => 'Nama karyawan wajib diisi.',
            'status.required' => 'Status karyawan wajib diisi.',
        ]);

        $karyawan->update($validated);

        return back()->with('success', 'Data karyawan berhasil diperbarui!');
    }
}
