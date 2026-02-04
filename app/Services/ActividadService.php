<?php

namespace App\Services;

use App\Models\Actividad;
use Exception;

class ActividadService
{
    /**
     * Buscar actividades con filtros y paginación
     */
    public function searchActividades(string $search = '', int $page = 1, int $perPage = 10): array
    {
        try {
            $query = Actividad::query();
            $search = trim($search);

            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $like = '%' . $search . '%';
                    $q->where('segmento', 'LIKE', $like)
                      ->orWhere('familia', 'LIKE', $like)
                      ->orWhere('clase', 'LIKE', $like)
                      ->orWhere('producto', 'LIKE', $like);

                    if (is_numeric($search)) {
                        $q->orWhere('codigo_segmento', '=', (int)$search)
                          ->orWhere('codigo_familia', '=', (int)$search)
                          ->orWhere('codigo_clase', '=', (int)$search)
                          ->orWhere('codigo_producto', '=', (int)$search);
                    }
                });
            }

            $total = $query->count();
            $lastPage = (int)ceil($total / $perPage);

            if ($page < 1) {
                $page = 1;
            } elseif ($page > $lastPage && $lastPage > 0) {
                $page = $lastPage;
            }

            $offset = ($page - 1) * $perPage;
            $data = $query->orderBy('id', 'asc')
                ->offset($offset)
                ->limit($perPage)
                ->get()
                ->toArray();

            return [
                'data' => $data,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => $lastPage
            ];
        } catch (Exception $e) {
            throw new Exception('Error al buscar actividades: ' . $e->getMessage());
        }
    }
}
