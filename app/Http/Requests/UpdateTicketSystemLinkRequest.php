<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTicketSystemLinkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isIT('it-workflow') === true;
    }

    public function rules(): array
    {
        return [
            'link_sistem' => ['nullable', 'url', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'link_sistem.url' => 'Format link sistem tidak valid. Pastikan diawali http:// atau https://.',
            'link_sistem.max' => 'Link sistem terlalu panjang (maksimal 1000 karakter).',
        ];
    }
}