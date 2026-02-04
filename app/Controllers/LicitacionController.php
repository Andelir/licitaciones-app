<?php

namespace App\Controllers;

use App\Models\Licitacion;
use App\Services\Eloquent;
use App\Services\LicitacionService;

class LicitacionController
{
    private LicitacionService $licitacionService;
    public function __construct()
    {
        $this->licitacionService = new LicitacionService();
    }

    // API index
    public function index(): array
    {
        try {
            // Obtener parámetros de búsqueda
            $search = $_GET['search'] ?? '';
            $searchField = $_GET['field'] ?? 'todos';
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $perPage = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

            // Validar que page y perPage sean positivos
            if ($page < 1) $page = 1;
            if ($perPage < 1) $perPage = 10;
            if ($perPage > 100) $perPage = 100; // Limitar a máximo 100 registros por página

            // Obtener licitaciones filtradas y paginadas
            $result = $this->licitacionService->searchLicitaciones($search, $searchField, $page, $perPage);

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
                'message' => 'Error al obtener licitaciones: ' . $e->getMessage()
            ];
        }
    }

    // API show
    public function show(array $params): array
    {
        try {
            $id = (int)($params['id'] ?? 0);
            $item = $this->licitacionService->getLicitacionById($id);
            
            if (!$item) {
                http_response_code(404);
                return ['error' => 'No encontrado'];
            }

            return ['data' => $item->toArray()];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => 'Error al obtener la licitación'];
        }
    }

    // API store - Con validaciones completas del frontend
    public function store(): array
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            
            // Crear licitación usando el servicio (incluye validaciones)
            $licitacion = $this->licitacionService->createLicitacion($input);
            
            return [
                'statusCode' => 201,
                'data' => $licitacion
            ];
            
        } catch (\Exception $e) {
            // Intentar decodificar errores de validación
            $decoded = json_decode($e->getMessage(), true);
            
            if ($decoded && isset($decoded['errors'])) {
                // Son errores de validación estructurados
                http_response_code(422);
                return [
                    'error' => 'Errores de validación',
                    'errors' => $decoded['errors']
                ];
            }
            
            // Error genérico
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // API update - Con validaciones
    public function update(array $params): array
    {
        try {
            $id = (int)($params['id'] ?? 0);
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            
            $licitacion = $this->licitacionService->updateLicitacion($id, $input);
            
            return ['data' => $licitacion];
            
        } catch (\Exception $e) {
            $decoded = json_decode($e->getMessage(), true);
            
            if ($decoded && isset($decoded['errors'])) {
                http_response_code(422);
                return [
                    'error' => 'Errores de validación',
                    'errors' => $decoded['errors']
                ];
            }
            
            if (strpos($e->getMessage(), 'no encontrada') !== false) {
                http_response_code(404);
                return ['error' => $e->getMessage()];
            }
            
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // API upload documento
    public function uploadDocumento(array $params): array
    {
        try {
            $id = (int)($params['id'] ?? 0);
            $file = $_FILES['archivo'] ?? null;
            $data = [
                'titulo' => $_POST['titulo'] ?? '',
                'descripcion' => $_POST['descripcion'] ?? ''
            ];

            $documento = $this->licitacionService->uploadDocumento($id, $data, $file ?? []);

            return ['data' => $documento];
        } catch (\Exception $e) {
            $decoded = json_decode($e->getMessage(), true);
            if ($decoded && isset($decoded['errors'])) {
                http_response_code(422);
                return [
                    'error' => 'Errores de validación',
                    'errors' => $decoded['errors']
                ];
            }
            if (strpos($e->getMessage(), 'no encontrada') !== false) {
                http_response_code(404);
                return ['error' => $e->getMessage()];
            }
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // API delete documento
    public function deleteDocumento(array $params): array
    {
        try {
            $id = (int)($params['id'] ?? 0);
            $documentoId = (int)($params['documentoId'] ?? 0);

            $this->licitacionService->deleteDocumento($id, $documentoId);

            return ['deleted' => true];
        } catch (\Exception $e) {
            if (strpos($e->getMessage(), 'no encontrado') !== false) {
                http_response_code(404);
                return ['error' => $e->getMessage()];
            }
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // API download documento
    public function downloadDocumento(array $params): void
    {
        try {
            $id = (int)($params['id'] ?? 0);
            $documentoId = (int)($params['documentoId'] ?? 0);

            $documento = \App\Models\DocumentoLicitacion::find($documentoId);
            if (!$documento || (int)$documento->licitacion_id !== $id) {
                http_response_code(404);
                echo 'Documento no encontrado';
                return;
            }

            $filePath = __DIR__ . '/../../' . ltrim($documento->archivo, '/');
            if (!is_file($filePath)) {
                http_response_code(404);
                echo 'Archivo no encontrado';
                return;
            }

            $fileName = basename($documento->archivo);
            $mime = mime_content_type($filePath) ?: 'application/octet-stream';

            header('Content-Type: ' . $mime);
            header('Content-Disposition: attachment; filename="' . $fileName . '"');
            header('Content-Length: ' . filesize($filePath));
            readfile($filePath);
        } catch (\Exception $e) {
            http_response_code(500);
            echo 'Error al descargar el archivo';
        }
    }

    // Web form: create
    public function createForm(): string
    {
        ob_start();
        $view = __DIR__ . '/../../resources/views/licitaciones/create.php';
        if (!file_exists($view)) {
            return '<h1>View not found: resources/views/licitaciones/create.php</h1>';
        }
        include $view;
        return ob_get_clean();
    }

    public function listLicitaciones(): string
    {
        ob_start();
        $view = __DIR__ . '/../../resources/views/licitaciones/index.php';
        if (!file_exists($view)) {
            return '<h1>View not found: resources/views/licitaciones/index.php</h1>';
        }
        include $view;
        return ob_get_clean();
    }

    // Web form: edit
    public function editForm(array $params): string
    {
        ob_start();
        $view =  __DIR__ . "/../../resources/views/licitaciones/edit.php";
        if (!file_exists($view)) {
            return '<h1>View not found: resources/views/licitaciones/edit.php</h1>';
        }
        include $view;
        return ob_get_clean();
    }

    // Web form: view
    public function viewForm(array $params): string
    {
        ob_start();
        $view = __DIR__ . '/../../resources/views/licitaciones/view.php';
        if (!file_exists($view)) {
            return '<h1>View not found: resources/views/licitaciones/view.php</h1>';
        }
        include $view;
        return ob_get_clean();
    }

    // API export - Exportar a Excel
    public function export(): void
    {
        try {
            // Obtener parámetros de filtro (sin paginación para el reporte)
            $search = $_GET['search'] ?? '';
            $searchField = $_GET['field'] ?? 'todos';

            $data = $this->licitacionService->getAllLicitacionesFiltered($search, $searchField);

            // Generar y descargar el Excel
            $this->licitacionService->exportToExcel($data);
        } catch (\Exception $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Error al exportar: ' . $e->getMessage()
            ]);
        }
    }
}
