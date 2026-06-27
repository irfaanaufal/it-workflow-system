<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreTicketRequest extends FormRequest
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
            'attachment'       => ['nullable', 'image', 'mimes:png,jpg,jpeg', 'max:2048'],
        ];
    }

    /**
     * Additional validation after base rules pass.
     * Blocker is only allowed for 'fix bug' and 'maintenance'.
     */
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
        });
    }
}
