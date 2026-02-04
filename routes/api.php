<?php

/**
 * Archivo de rutas (simple): define rutas usando la instancia $router
 * Ejemplo: $router->get('/app', function() { ... });
 */

/** @var \App\Core\Router $router */

// API: licitaciones (mínimo REST para la prueba)
$router->get('/api/licitaciones', 'LicitacionController@index');
$router->get('/api/licitaciones/export', 'LicitacionController@export');
$router->post('/api/licitaciones', 'LicitacionController@store');
$router->get('/api/licitaciones/{id:\d+}', 'LicitacionController@show');
$router->put('/api/licitaciones/{id:\d+}', 'LicitacionController@update');
$router->post('/api/licitaciones/{id:\d+}/documentos', 'LicitacionController@uploadDocumento');
$router->delete('/api/licitaciones/{id:\d+}/documentos/{documentoId:\d+}', 'LicitacionController@deleteDocumento');
$router->get('/api/licitaciones/{id:\d+}/documentos/{documentoId:\d+}/download', 'LicitacionController@downloadDocumento');

// Endpoint de actividades (temporal / ejemplo) usado por el modal de búsqueda
$router->get('/api/actividades', function() {
    // Parámetro opcional ?search=xxx
    $q = trim((string)($_GET['search'] ?? ''));
    $samples = [
        ['id' => 1, 'nombre' => 'Construcción'],
        ['id' => 2, 'nombre' => 'Suministros'],
        ['id' => 3, 'nombre' => 'Servicios profesionales'],
        ['id' => 4, 'nombre' => 'Mantenimiento'],
        ['id' => 5, 'nombre' => 'Transporte']
    ];
    if ($q === '') {
        return ['data' => $samples];
    }
    $q = mb_strtolower($q);
    $filtered = array_values(array_filter($samples, function ($s) use ($q) {
        return mb_strpos(mb_strtolower($s['nombre']), $q) !== false;
    }));
    return ['data' => $filtered];
});

