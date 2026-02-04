<?php
namespace App\Services;

use App\Models\Licitacion;
use App\Models\DocumentoLicitacion;
use Exception;

class LicitacionService
{
    /**
     * Obtener todas las licitaciones
     */
    public function getAllLicitaciones(): array
    {
        try {
            return Licitacion::orderBy('id', 'desc')->get()->toArray();
        } catch (Exception $e) {
            throw new Exception('Error al obtener licitaciones: ' . $e->getMessage());
        }
    }

    /**
     * Obtener todas las licitaciones filtradas (sin paginación)
     * 
     * @param string $search Término de búsqueda
     * @param string $searchField Campo donde buscar (todos, consecutivo, objeto, descripcion)
     * @return array Array de licitaciones
     */
    public function getAllLicitacionesFiltered(string $search = '', string $searchField = 'todos'): array
    {
        try {
            $query = Licitacion::query();

            // Aplicar filtros de búsqueda
            if (!empty(trim($search))) {
                $searchTerm = '%' . trim($search) . '%';
                
                if ($searchField === 'todos') {
                    $query->where(function ($q) use ($searchTerm) {
                        $q->where('consecutivo', 'LIKE', $searchTerm)
                          ->orWhere('objeto', 'LIKE', $searchTerm)
                          ->orWhere('descripcion', 'LIKE', $searchTerm);
                    });
                } elseif ($searchField === 'consecutivo') {
                    $query->where('consecutivo', 'LIKE', $searchTerm);
                } elseif ($searchField === 'objeto') {
                    $query->where('objeto', 'LIKE', $searchTerm);
                } elseif ($searchField === 'descripcion') {
                    $query->where('descripcion', 'LIKE', $searchTerm);
                }
            }

            // Obtener todos los registros ordenados
            return $query->orderBy('id', 'desc')->get()->toArray();
            
        } catch (Exception $e) {
            throw new Exception('Error al obtener licitaciones filtradas: ' . $e->getMessage());
        }
    }

    /**
     * Buscar licitaciones con filtros y paginación
     * 
     * @param string $search Término de búsqueda
     * @param string $searchField Campo donde buscar (todos, consecutivo, objeto, descripcion)
     * @param int $page Página actual
     * @param int $perPage Registros por página
     * @return array Array con 'data', 'total', 'page', 'per_page', 'last_page'
     */
    public function searchLicitaciones(string $search = '', string $searchField = 'todos', int $page = 1, int $perPage = 10): array
    {
        try {
            $query = Licitacion::query();

            // Aplicar filtros de búsqueda
            if (!empty(trim($search))) {
                $searchTerm = '%' . trim($search) . '%';
                
                if ($searchField === 'todos') {
                    $query->where(function ($q) use ($searchTerm) {
                        $q->where('consecutivo', 'LIKE', $searchTerm)
                          ->orWhere('objeto', 'LIKE', $searchTerm)
                          ->orWhere('descripcion', 'LIKE', $searchTerm);
                    });
                } elseif ($searchField === 'consecutivo') {
                    $query->where('consecutivo', 'LIKE', $searchTerm);
                } elseif ($searchField === 'objeto') {
                    $query->where('objeto', 'LIKE', $searchTerm);
                } elseif ($searchField === 'descripcion') {
                    $query->where('descripcion', 'LIKE', $searchTerm);
                }
            }

            // Obtener total de registros antes de paginar
            $total = $query->count();

            // Calcular última página
            $lastPage = (int)ceil($total / $perPage);

            // Asegurar que la página esté dentro del rango válido
            if ($page < 1) {
                $page = 1;
            } elseif ($page > $lastPage && $lastPage > 0) {
                $page = $lastPage;
            }

            // Obtener datos paginados
            $offset = ($page - 1) * $perPage;
            $data = $query->orderBy('id', 'desc')
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
            throw new Exception('Error al buscar licitaciones: ' . $e->getMessage());
        }
    }

    /**
     * Obtener una licitación por ID
     */
    public function getLicitacionById(int $id): ?Licitacion
    {
        try {
            return Licitacion::with('documentos')->find($id);
        } catch (Exception $e) {
            throw new Exception('Error al buscar licitación: ' . $e->getMessage());
        }
    }

    /**
     * Crear una nueva licitación con validaciones completas
     * 
     * @param array $data Datos de entrada
     * @return Licitacion
     * @throws Exception Si hay errores de validación o al guardar
     */
    public function createLicitacion(array $data): Licitacion
    {
        // Validar todos los campos
        $errors = $this->validateLicitacionData($data);
        
        if (!empty($errors)) {
            throw new Exception(json_encode(['errors' => $errors]));
        }

        try {
            // Generar consecutivo automático
            $consecutivo = $this->generateConsecutivo();
            
            // Preparar datos limpios para inserción
            $cleanData = [
                'consecutivo' => $consecutivo,
                'objeto' => trim($data['objeto']),
                'descripcion' => trim($data['descripcion']),
                'presupuesto' => $this->formatPresupuesto($data['presupuesto']),
                'moneda' => trim($data['moneda']),
                'actividad_id' => !empty($data['actividad_id']) ? (int)$data['actividad_id'] : null,
                'fecha_inicio' => $data['fecha_inicio'],
                'hora_inicio' => $data['hora_inicio'],
                'fecha_cierre' => $data['fecha_cierre'],
                'hora_cierre' => $data['hora_cierre'],
                'estado' => 'ACTIVO'
            ];

            return Licitacion::create($cleanData);
        } catch (Exception $e) {
            throw new Exception('Error al crear la licitación: ' . $e->getMessage());
        }
    }

    /**
     * Actualizar una licitación existente
     */
    public function updateLicitacion(int $id, array $data): Licitacion
    {
        $licitacion = $this->getLicitacionById($id);
        
        if (!$licitacion) {
            throw new Exception('Licitación no encontrada');
        }

        // Validar datos si se proporcionan
        $errors = $this->validateLicitacionData($data, true);
        
        if (!empty($errors)) {
            throw new Exception(json_encode(['errors' => $errors]));
        }

        try {
            // Actualizar solo los campos proporcionados
            foreach ($data as $key => $value) {
                if (in_array($key, ['objeto', 'descripcion', 'presupuesto', 'moneda', 'actividad_id', 
                                     'fecha_inicio', 'hora_inicio', 'fecha_cierre', 'hora_cierre'])) {
                    if ($key === 'presupuesto' && !empty($value)) {
                        $licitacion->$key = $this->formatPresupuesto($value);
                    } else {
                        $licitacion->$key = $value;
                    }
                }
            }
            
            $licitacion->save();
            return $licitacion;
        } catch (Exception $e) {
            throw new Exception('Error al actualizar la licitación: ' . $e->getMessage());
        }
    }

    /**
     * Eliminar una licitación
     */
    public function deleteLicitacion(int $id): bool
    {
        $licitacion = $this->getLicitacionById($id);
        
        if (!$licitacion) {
            throw new Exception('Licitación no encontrada');
        }

        try {
            return $licitacion->delete();
        } catch (Exception $e) {
            throw new Exception('Error al eliminar la licitación: ' . $e->getMessage());
        }
    }

    /**
     * Cargar documento asociado a una licitación
     */
    public function uploadDocumento(int $licitacionId, array $data, array $file): DocumentoLicitacion
    {
        $licitacion = $this->getLicitacionById($licitacionId);
        if (!$licitacion) {
            throw new Exception('Licitación no encontrada');
        }

        $titulo = trim((string)($data['titulo'] ?? ''));
        $descripcion = trim((string)($data['descripcion'] ?? ''));

        $errors = [];
        if ($titulo === '') {
            $errors['titulo'] = 'El título es obligatorio.';
        }
        if ($descripcion === '') {
            $errors['descripcion'] = 'La descripción es obligatoria.';
        }
        if (empty($file) || !isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) {
            $errors['file'] = 'El archivo es obligatorio.';
        }

        if (!empty($errors)) {
            throw new Exception(json_encode(['errors' => $errors]));
        }

        $allowedMime = ['application/pdf', 'application/zip', 'application/x-zip-compressed'];
        $originalName = (string)($file['name'] ?? '');
        $lowerName = strtolower($originalName);
        $ext = pathinfo($lowerName, PATHINFO_EXTENSION);
        $mime = (string)($file['type'] ?? '');

        if (!in_array($mime, $allowedMime, true) && !in_array($ext, ['pdf', 'zip'], true)) {
            throw new Exception(json_encode(['errors' => ['file' => 'Solo se permiten archivos PDF o ZIP.']]));
        }

        $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);
        $fileName = time() . '_' . $safeName;

        $baseDir = __DIR__ . '/../../storage/documentos_licitacion/' . $licitacionId;
        if (!is_dir($baseDir)) {
            mkdir($baseDir, 0775, true);
        }

        $filePath = $baseDir . '/' . $fileName;
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            throw new Exception('No se pudo guardar el archivo');
        }

        try {
            return DocumentoLicitacion::create([
            'licitacion_id' => $licitacionId,
            'titulo' => $titulo,
            'descripcion' => $descripcion,
            'archivo' => 'storage/documentos_licitacion/' . $licitacionId . '/' . $fileName,
        ]);
        } catch (Exception $e) {
            throw new Exception('Error al guardar el documento: ' . $e->getMessage());
        }
    }

    /**
     * Eliminar documento asociado a una licitación
     */
    public function deleteDocumento(int $licitacionId, int $documentoId): bool
    {
        $documento = DocumentoLicitacion::find($documentoId);
        if (!$documento || (int)$documento->licitacion_id !== $licitacionId) {
            throw new Exception('Documento no encontrado');
        }

        $fullPath = __DIR__ . '/../../' . ltrim($documento->archivo, '/');
        if (is_file($fullPath)) {
            @unlink($fullPath);
        }

        return (bool)$documento->delete();
    }

    /**
     * Validar datos de licitación según reglas del frontend
     * 
     * @param array $data Datos a validar
     * @param bool $isUpdate Si es actualización (validaciones opcionales)
     * @return array Array de errores (vacío si no hay errores)
     */
    private function validateLicitacionData(array $data, bool $isUpdate = false): array
    {
        $errors = [];

        // Validación: objeto (obligatorio, max 150, no solo espacios)
        $objeto = $data['objeto'] ?? '';
        if (!$isUpdate || isset($data['objeto'])) {
            if (empty(trim($objeto))) {
                $errors['objeto'] = 'El objeto es obligatorio.';
            } elseif (strlen($objeto) > 150) {
                $errors['objeto'] = 'El objeto no puede exceder 150 caracteres.';
            } elseif (trim($objeto) === '') {
                $errors['objeto'] = 'El objeto no puede contener solo espacios.';
            }
        }

        // Validación: descripcion (obligatorio, max 400, no solo espacios)
        $descripcion = $data['descripcion'] ?? '';
        if (!$isUpdate || isset($data['descripcion'])) {
            if (empty(trim($descripcion))) {
                $errors['descripcion'] = 'La descripción es obligatoria.';
            } elseif (strlen($descripcion) > 400) {
                $errors['descripcion'] = 'La descripción no puede exceder 400 caracteres.';
            } elseif (trim($descripcion) === '') {
                $errors['descripcion'] = 'La descripción no puede contener solo espacios.';
            }
        }

        // Validación: presupuesto (obligatorio, numérico > 0, max 2 decimales)
        $presupuesto = $data['presupuesto'] ?? '';
        if (!$isUpdate || isset($data['presupuesto'])) {
            $presupuestoStr = str_replace(',', '.', trim((string)$presupuesto));
            
            if (empty($presupuestoStr)) {
                $errors['presupuesto'] = 'El presupuesto es obligatorio.';
            } elseif (!preg_match('/^[0-9]+(\.[0-9]{1,2})?$/', $presupuestoStr)) {
                $errors['presupuesto'] = 'El presupuesto debe ser un número con hasta 2 decimales.';
            } else {
                $presupuestoVal = (float)$presupuestoStr;
                if ($presupuestoVal <= 0) {
                    $errors['presupuesto'] = 'El presupuesto debe ser mayor que 0.';
                }
            }
        }

        // Validación: moneda (obligatorio)
        $moneda = $data['moneda'] ?? '';
        if (!$isUpdate || isset($data['moneda'])) {
            if (empty(trim($moneda))) {
                $errors['moneda'] = 'La moneda es obligatoria.';
            }
        }

        // Validación: fecha_inicio (obligatorio, formato válido)
        $fechaInicio = $data['fecha_inicio'] ?? '';
        if (!$isUpdate || isset($data['fecha_inicio'])) {
            if (empty($fechaInicio)) {
                $errors['fecha_inicio'] = 'La fecha de inicio es obligatoria.';
            } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaInicio)) {
                $errors['fecha_inicio'] = 'Formato de fecha inválido (YYYY-MM-DD).';
            } elseif (!$this->isValidDate($fechaInicio)) {
                $errors['fecha_inicio'] = 'La fecha de inicio no es válida.';
            }
        }

        // Validación: hora_inicio (obligatorio, formato HH:mm)
        $horaInicio = $data['hora_inicio'] ?? '';
        if (!$isUpdate || isset($data['hora_inicio'])) {
            if (empty($horaInicio)) {
                $errors['hora_inicio'] = 'La hora de inicio es obligatoria.';
            } elseif (!preg_match('/^([01]\d|2[0-3]):([0-5]\d)$/', $horaInicio)) {
                $errors['hora_inicio'] = 'Formato de hora inválido (HH:mm 24h).';
            }
        }

        // Validación: fecha_cierre (obligatorio, >= fecha_inicio)
        $fechaCierre = $data['fecha_cierre'] ?? '';
        if (!$isUpdate || isset($data['fecha_cierre'])) {
            if (empty($fechaCierre)) {
                $errors['fecha_cierre'] = 'La fecha de cierre es obligatoria.';
            } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaCierre)) {
                $errors['fecha_cierre'] = 'Formato de fecha inválido (YYYY-MM-DD).';
            } elseif (!$this->isValidDate($fechaCierre)) {
                $errors['fecha_cierre'] = 'La fecha de cierre no es válida.';
            } elseif (!empty($fechaInicio) && $fechaCierre < $fechaInicio) {
                $errors['fecha_cierre'] = 'La fecha de cierre no puede ser menor a la fecha de inicio.';
            }
        }

        // Validación: hora_cierre (obligatorio, validación cruzada)
        $horaCierre = $data['hora_cierre'] ?? '';
        if (!$isUpdate || isset($data['hora_cierre'])) {
            if (empty($horaCierre)) {
                $errors['hora_cierre'] = 'La hora de cierre es obligatoria.';
            } elseif (!preg_match('/^([01]\d|2[0-3]):([0-5]\d)$/', $horaCierre)) {
                $errors['hora_cierre'] = 'Formato de hora inválido (HH:mm 24h).';
            } elseif (!empty($fechaInicio) && !empty($fechaCierre) && 
                      $fechaInicio === $fechaCierre && 
                      !empty($horaInicio) && $horaCierre <= $horaInicio) {
                $errors['hora_cierre'] = 'La hora de cierre debe ser mayor a la hora de inicio cuando las fechas son iguales.';
            }
        }

        return $errors;
    }

    /**
     * Formatear presupuesto a 2 decimales
     */
    private function formatPresupuesto($presupuesto): string
    {
        $value = str_replace(',', '.', trim((string)$presupuesto));
        return number_format((float)$value, 2, '.', '');
    }

    /**
     * Validar que una fecha sea válida
     */
    private function isValidDate(string $date): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }

    /**
     * Generar consecutivo automático con formato: PO-{4 dígitos}-{año 2 dígitos}
     * Ejemplo: PO-0001-25
     * 
     * @return string Consecutivo generado
     */
    private function generateConsecutivo(): string
    {
        try {
            // Obtener el año actual en 2 dígitos
            $yearSuffix = substr(date('Y'), -2);
            
            // Obtener el consecutivo más alto de este año
            $currentYear = date('Y');
            $maxRecord = Licitacion::whereRaw("YEAR(creado_en) = ?", [$currentYear])
                ->orderBy('consecutivo', 'desc')
                ->first();
            
            // Si no hay registros este año, empezar en 1
            $nextNumber = 1;
            
            if ($maxRecord && $maxRecord->consecutivo) {
                // Extraer el número del consecutivo anterior (PO-0001-25 -> 0001)
                if (preg_match('/PO-(\d+)-\d{2}/', $maxRecord->consecutivo, $matches)) {
                    $lastNumber = (int)$matches[1];
                    $nextNumber = $lastNumber + 1;
                }
            }
            
            // Formatear con 4 dígitos y crear el consecutivo final
            $formattedNumber = str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
            return "PO-{$formattedNumber}-{$yearSuffix}";
            
        } catch (Exception $e) {
            throw new Exception('Error al generar consecutivo: ' . $e->getMessage());
        }
    }

    /**
     * Exportar licitaciones a Excel usando PhpSpreadsheet
     * 
     * @param array $licitaciones Array de licitaciones a exportar
     * @throws Exception
     */
    public function exportToExcel(array $licitaciones): void
    {
        try {
            // Crear nuevo libro de Excel
            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Licitaciones');
            
            // Estilo para el encabezado
            $headerStyle = [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                    'size' => 12
                ],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4472C4']
                ],
                'alignment' => [
                    'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                    'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER
                ]
            ];
            
            // Headers
            $headers = ['Consecutivo', 'Objeto', 'Descripción', 'Presupuesto', 'Moneda', 'Fecha Inicio', 'Hora Inicio', 'Fecha Cierre', 'Hora Cierre', 'Estado', 'Creado'];
            $column = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($column . '1', $header);
                $sheet->getStyle($column . '1')->applyFromArray($headerStyle);
                $sheet->getColumnDimension($column)->setAutoSize(true);
                $column++;
            }
            
            // Datos
            $row = 2;
            foreach ($licitaciones as $lic) {
                $sheet->setCellValue('A' . $row, $lic['consecutivo'] ?? '');
                $sheet->setCellValue('B' . $row, $lic['objeto'] ?? '');
                $sheet->setCellValue('C' . $row, $lic['descripcion'] ?? '');
                $sheet->setCellValue('D' . $row, $lic['presupuesto'] ?? '');
                $sheet->setCellValue('E' . $row, $lic['moneda'] ?? '');
                $sheet->setCellValue('F' . $row, $lic['fecha_inicio'] ?? '');
                $sheet->setCellValue('G' . $row, $lic['hora_inicio'] ?? '');
                $sheet->setCellValue('H' . $row, $lic['fecha_cierre'] ?? '');
                $sheet->setCellValue('I' . $row, $lic['hora_cierre'] ?? '');
                $sheet->setCellValue('J' . $row, $lic['estado'] ?? 'ACTIVO');
                $sheet->setCellValue('K' . $row, $lic['creado_en'] ?? '');
                $row++;
            }
            
            // Aplicar bordes a toda la tabla
            $lastRow = $row - 1;
            $sheet->getStyle('A1:K' . $lastRow)->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                        'color' => ['rgb' => '000000']
                    ]
                ]
            ]);
            
            // Generar el archivo
            $fileName = 'licitaciones-' . date('Y-m-d-His') . '.xlsx';
            
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment; filename="' . $fileName . '"');
            header('Cache-Control: max-age=0');
            
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $writer->save('php://output');
            
            // Liberar memoria
            $spreadsheet->disconnectWorksheets();
            unset($spreadsheet);
            
            exit;
            
        } catch (Exception $e) {
            throw new Exception('Error al exportar a Excel: ' . $e->getMessage());
        }
    }
}