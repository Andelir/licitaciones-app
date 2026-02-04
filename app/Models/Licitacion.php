<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model as EloquentModel;
use App\Models\DocumentoLicitacion;
use App\Models\Actividad;

class Licitacion extends EloquentModel
{
    protected $table = 'licitaciones';
    protected $fillable = ['consecutivo', 'objeto', 'descripcion', 'presupuesto', 'moneda', 'actividad_id', 'fecha_inicio', 'hora_inicio', 'fecha_cierre', 'hora_cierre', 'estado'];
    
    // Usar nombres de columnas en español para timestamps
    public $timestamps = true;
    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    // Cast de fechas
    protected $dates = ['creado_en', 'actualizado_en'];

    public function documentos()
    {
        return $this->hasMany(DocumentoLicitacion::class, 'licitacion_id');
    }

    public function actividad()
    {
        return $this->belongsTo(Actividad::class, 'actividad_id');
    }
}
