<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTicketReporterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isIT('it-workflow') === true;
    }

    public function rules(): array
    {
        return [
            'karyawan_id' => ['required', 'integer', 'exists:karyawans,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'karyawan_id.required' => 'Pelapor baru wajib dipilih.',
            'karyawan_id.exists' => 'Karyawan yang dipilih tidak ditemukan.',
        ];
    }
}