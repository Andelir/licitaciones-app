<?php

/**
 * Archivo de rutas (simple): define rutas usando la instancia $router
 * Ejemplo: $router->get('/app', function() { ... });
 */

/** @var \App\Core\Router $router */

$router->get('/licitaciones', 'LicitacionController@listLicitaciones');
$router->get('/licitaciones/create', 'LicitacionController@createForm');
$router->get('/licitaciones/{id:\d+}', 'LicitacionController@viewForm');
$router->get('/licitaciones/{id:\d+}/edit', 'LicitacionController@editForm');

