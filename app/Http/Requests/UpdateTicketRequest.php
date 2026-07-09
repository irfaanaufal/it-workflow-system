<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'judul_laporan'    => ['required', 'string', 'max:255'],
            'kategori_laporan' => ['required', 'string', 'in:new system,add feature,maintenance,fix bug'],
            'urgensi_laporan'  => ['required', 'string', 'in:blocker,high,medium,low'],
            'kondisi_lapangan' => ['required', 'string'],
            'keinginan_sistem' => ['required', 'string'],
            'dampak_positif'   => ['required', 'string'],
            'system_ptsam_id'  => ['nullable', 'integer', 'exists:system_ptsam,id'],
            'attachment'       => ['nullable', 'file', 'max:10240', 'mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            $kategori = $this->input('kategori_laporan');
            $urgensi  = $this->input('urgensi_laporan');

            if ($urgensi === 'blocker' && !in_array($kategori, ['fix bug', 'maintenance'])) {
                $v->errors()->add(
                    'urgensi_laporan',
                    'Urgensi "Blocker" hanya dapat digunakan untuk kategori Fix Bug atau Maintenance.'
                );
            }

            if (in_array($kategori, ['add feature', 'maintenance', 'fix bug']) && !$this->input('system_ptsam_id')) {
                $v->errors()->add(
                    'system_ptsam_id',
                    'Sistem yang dilaporkan wajib dipilih untuk kategori Add Feature, Maintenance, atau Fix Bug.'
                );
            }
        });
    }
}
