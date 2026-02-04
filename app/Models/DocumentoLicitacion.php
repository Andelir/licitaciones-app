<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model as EloquentModel;

class DocumentoLicitacion extends EloquentModel
{
    protected $table = 'documentos_licitacion';

    protected $fillable = [
        'licitacion_id',
        'titulo',
        'descripcion',
        'archivo',
    ];

    public $timestamps = true;
    const CREATED_AT = 'creado_en';
    const UPDATED_AT = null;
}
