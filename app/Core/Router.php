<?php

declare(strict_types=1);

namespace App\Core;


/**
 * Router minimalista, moderno y tipado para PHP 8.3
 * - Soporta parámetros {id} y {name:\d+}
 * - Devuelve JSON para arrays/objetos
 * - Manejo 404 / 405 y excepciones
 */
final class Router
{
    /** @var Route[] */
    private array $routes = [];
    /** @var callable|null */
    private $notFoundHandler = null;
    private bool $sendHeaders = true;

    public function __construct(bool $sendHeaders = true)
    {
        $this->sendHeaders = $sendHeaders;
    }

    /**
     * Añade una ruta y devuelve el objeto Route (para uso fluido)
     */
    public function add(string $method, string $path, callable|string $handler): Route
    {
        $path = $this->normalizePath($path);
        $regex = $this->pathToRegex($path);
        $route = new Route(strtoupper($method), $path, $handler, $regex);
        $this->routes[] = $route;
        return $route;
    }

    public function get(string $path, callable|string $handler): Route
    {
        return $this->add('GET', $path, $handler);
    }

    public function post(string $path, callable|string $handler): Route
    {
        return $this->add('POST', $path, $handler);
    }

    public function put(string $path, callable|string $handler): Route
    {
        return $this->add('PUT', $path, $handler);
    }

    public function delete(string $path, callable|string $handler): Route
    {
        return $this->add('DELETE', $path, $handler);
    }

    public function setNotFound(callable $handler): void
    {
        $this->notFoundHandler = $handler;
    }

    public function dispatch(string $method = null, string $uri = null): void
    {
        $method = $method ?? ($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri = $uri ?? (parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
        $uri = $this->normalizePath($uri);

        $allowed = [];

        foreach ($this->routes as $route) {
            if (!preg_match($route->regex, $uri, $matches)) {
                continue;
            }

            if ($route->method !== strtoupper($method)) {
                $allowed[] = $route->method;
                continue;
            }

            $params = $this->extractParams($matches);

            try {
                $result = $this->invokeHandler($route->handler, $params);
                $this->sendResponse($result);
            } catch (\Throwable $e) {
                $this->handleThrowable($e);
            }

            return;
        }

        if (!empty($allowed)) {
            $this->sendStatus(405, ['Allow' => implode(', ', array_unique($allowed))]);
            echo '405 Method Not Allowed';
            return;
        }

        if ($this->notFoundHandler) {
            $result = call_user_func($this->notFoundHandler, []);
            $this->sendResponse($result);
            return;
        }

        $this->sendStatus(404);
        echo '404 Not Found';
    }

    /**
     * Invoca el handler (callable o Controller@method)
     */
    protected function invokeHandler(callable|string $handler, array $params): mixed
    {
        if (is_callable($handler)) {
            return $handler($params);
        }

        if (is_string($handler) && str_contains($handler, '@')) {
            [$controller, $method] = explode('@', $handler, 2);
            $class = "App\\Controllers\\{$controller}";
            if (!class_exists($class)) {
                throw new \RuntimeException("Controller {$class} not found");
            }
            $instance = new $class();
            if (!method_exists($instance, $method)) {
                throw new \RuntimeException("Method {$method} not found in controller {$class}");
            }
            return $instance->$method($params);
        }

        throw new \InvalidArgumentException('Invalid route handler');
    }

    protected function sendResponse(mixed $result): void
    {
        if (is_array($result) || is_object($result)) {
            $this->sendStatus($result['statusCode'] ?? 200);
            if ($this->sendHeaders) {
                header('Content-Type: application/json; charset=utf-8');
            }
            echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            return;
        }

        if (is_string($result) || is_numeric($result)) {
            echo $result;
            return;
        }

        // Si el handler ya gestionó la respuesta o devolvió null, no hacemos nada
    }

    protected function sendStatus(int $status, array $headers = []): void
    {
        if ($this->sendHeaders) {
            http_response_code($status);
            foreach ($headers as $k => $v) {
                header("{$k}: {$v}", true);
            }
        }
    }

    protected function handleThrowable(\Throwable $e): void
    {
        $this->sendStatus(500);
        if (ini_get('display_errors')) {
            echo 'Internal Server Error: ' . $e->getMessage();
        } else {
            echo 'Internal Server Error';
        }
    }

    protected function extractParams(array $matches): array
    {
        $params = [];
        foreach ($matches as $key => $value) {
            if (!is_int($key)) {
                $params[$key] = $value;
            }
        }
        return $params;
    }

    protected function pathToRegex(string $path): string
    {
        // Soporta {name} y {id:\d+}
        $regex = preg_replace_callback('#\{([^}]+)\}#', function ($m) {
            $parts = explode(':', $m[1], 2);
            $name = preg_quote($parts[0], '#');
            $pattern = $parts[1] ?? '[^/]+';
            return "(?P<{$name}>{$pattern})";
        }, $path);

        return '#^' . rtrim($regex, '/') . '/?$#u';
    }

    protected function normalizePath(string $path): string
    {
        if ($path === '') {
            return '/';
        }
        if ($path[0] !== '/') {
            $path = '/' . $path;
        }
        $path = parse_url($path, PHP_URL_PATH) ?: $path;
        $path = preg_replace('#/+#', '/', $path);
        if ($path !== '/' && str_ends_with($path, '/')) {
            $path = rtrim($path, '/');
        }
        return $path;
    }
}

/**
 * Representa una ruta
 *
 * Propiedades públicas con docblocks para compatibilidad con PHP <8.0/8.1
 */
final class Route
{
    /** @var string */
    public $method;

    /** @var string */
    public $path;

    /** @var callable|string */
    public $handler;

    /** @var string */
    public $regex;

    public function __construct(string $method, string $path, $handler, string $regex)
    {
        $this->method = $method;
        $this->path = $path;
        $this->handler = $handler;
        $this->regex = $regex;
    }
}
