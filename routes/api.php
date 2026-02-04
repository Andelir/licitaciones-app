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
$router->get('/api/actividades', 'ActividadController@index');

