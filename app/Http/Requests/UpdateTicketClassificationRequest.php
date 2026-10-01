<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTicketClassificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kategori_laporan' => ['required', 'string', 'in:new system,add feature,maintenance,fix bug'],
            'urgensi_laporan'  => ['required', 'string', 'in:blocker,high,medium,low'],
            'system_ptsam_id'  => ['nullable', 'integer', 'exists:system_ptsam,id'],
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