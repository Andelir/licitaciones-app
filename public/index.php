<?php

declare(strict_types=1);

// Front controller: carga autoload y enrutador
require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Router;
use Illuminate\Database\Capsule\Manager as Capsule;
use Dotenv\Dotenv;

// Mostrar errores en desarrollo (ajustar en producción)
ini_set('display_errors', '1');
error_reporting(E_ALL);

// ----------------------
// Cargar .env
// ----------------------
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// ----------------------
// Inicializar Eloquent ORM
// ----------------------
$capsule = new Capsule();

$capsule->addConnection([
    'driver'    => $_ENV['DB_CONNECTION'] ?? 'mysql',
    'host'      => $_ENV['DB_HOST'] ?? '127.0.0.1',
    'database'  => $_ENV['DB_DATABASE'] ?? 'licitaciones',
    'username'  => $_ENV['DB_USERNAME'] ?? 'root',
    'password'  => $_ENV['DB_PASSWORD'] ?? '',
    'charset'   => $_ENV['DB_CHARSET'] ?? 'utf8mb4',
    'collation' => $_ENV['DB_COLLATION'] ?? 'utf8mb4_unicode_ci',
    'prefix'    => $_ENV['DB_PREFIX'] ?? '',
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();

// ----------------------
// Router
// ----------------------
$router = new Router();

// Cargar rutas desde routes/web.php (si existe)
$routesFile = __DIR__ . '/../routes/web.php';
if (file_exists($routesFile)) {
    require $routesFile; // dentro de este fichero se espera que se use la variable $router
}
// Cargar rutas desde routes/api.php (si existe)
$apiRoutesFile = __DIR__ . '/../routes/api.php';
if (file_exists($apiRoutesFile)) {
    require $apiRoutesFile; // dentro de este fichero se espera que se use la variable $router
}

// Redirigir raíz al listado de licitaciones
$router->get('/', function () {
    header('Location: /licitaciones', true, 302);
    return '';
});

// Not found handler devuelve JSON
$router->setNotFound(fn() => ['error' => 'Ruta no encontrada']);

// Despachar la petición actual con manejo de excepciones global
try {
    $router->dispatch();
} catch (\Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Internal Server Error',
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
