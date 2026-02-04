<?php

namespace App\Controllers;

use App\Services\ActividadService;

class ActividadController
{
    private ActividadService $actividadService;

    public function __construct()
    {
        $this->actividadService = new ActividadService();
    }

    public function index(): array
    {
        try {
            $search = $_GET['search'] ?? '';
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $perPage = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

            if ($page < 1) $page = 1;
            if ($perPage < 1) $perPage = 10;
            if ($perPage > 100) $perPage = 100;

            $result = $this->actividadService->searchActividades($search, $page, $perPage);

            return [
                'success' => true,
                'data' => $result['data'],
                'pagination' => [
                    'total' => $result['total'],
                    'page' => $result['page'],
                    'per_page' => $result['per_page'],
                    'last_page' => $result['last_page']
                ]
            ];
        } catch (\Exception $e) {
            http_response_code(500);
            return [
                'success' => false,
                'message' => 'Error al obtener actividades: ' . $e->getMessage()
            ];
        }
    }
}
