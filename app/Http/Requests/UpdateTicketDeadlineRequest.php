<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTicketDeadlineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'deadline' => ['nullable', 'date', 'date_format:Y-m-d', 'after_or_equal:today'],
        ];
    }

    public function messages(): array
    {
        return [
            'deadline.after_or_equal' => 'Target penyelesaian tidak boleh sebelum hari ini.',
        ];
    }
}