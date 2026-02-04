# LicitacionesApp

Aplicación para gestionar licitaciones con backend en PHP 8.3, Eloquent ORM y frontend en Vue 3 + Bootstrap 5.

## Arquitectura

Estructura principal:

- app/Core: Router, Controller base y utilidades.
- app/Controllers: Controladores HTTP para API y vistas.
- app/Models: Modelos Eloquent (Licitacion, DocumentoLicitacion).
- app/Services: Lógica de negocio (validaciones, consecutivo, export, documentos).
- resources/js: Frontend Vue 3.
- resources/views: Vistas PHP que montan los componentes.
- routes: Rutas web y API.
- storage: Archivos locales.

Flujo típico:

Vista -> Componente Vue -> API -> Servicio -> Modelo (Eloquent) -> DB

## Requisitos

- PHP 8.3
- Composer
- Node 18
- MySQL

## Instalación

1) Dependencias PHP

composer install

2) Configuración .env

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=licitaciones
DB_USERNAME=root
DB_PASSWORD=

3) Migraciones

Ejecuta los SQL dentro de la carpeta database

4) Frontend

npm ci
npm run dev

5) Acceso

http://localhost/licitacionesapp/licitaciones

## VirtualHost (Apache)

Configura el DocumentRoot apuntando a la carpeta public para que las rutas funcionen correctamente:

<VirtualHost *:80>
	ServerName licitacionesapp.test
	DocumentRoot "C:/laragon/www/licitacionesapp/public"

	<Directory "C:/laragon/www/licitacionesapp/public">
		AllowOverride All
		Require all granted
	</Directory>

	ErrorLog "C:/laragon/www/licitacionesapp/storage/logs/error.log"
	CustomLog "C:/laragon/www/licitacionesapp/storage/logs/access.log" common
</VirtualHost>

Luego:

1) Agrega el dominio en el archivo hosts:

127.0.0.1 licitacionesapp.test

2) Reinicia Apache desde Laragon.

3) Accede a:

http://licitacionesapp.test/licitaciones

## Funcionalidades

- CRUD de licitaciones.
- Validación completa en frontend y backend.
- Paginación y búsqueda desde backend.
- Exportación a Excel.
- Carga de documentos PDF/ZIP asociados a licitaciones.

## Rutas principales

Web:

- /licitaciones
- /licitaciones/create
- /licitaciones/{id}
- /licitaciones/{id}/edit

API:

- GET /api/licitaciones
- POST /api/licitaciones
- GET /api/licitaciones/{id}
- PUT /api/licitaciones/{id}
- DELETE /api/licitaciones/{id}
- POST /api/licitaciones/{id}/documentos
- DELETE /api/licitaciones/{id}/documentos/{documentoId}
- GET /api/licitaciones/{id}/documentos/{documentoId}/download
- GET /api/licitaciones/export

## Notas

- Documentos se guardan en storage/documentos_licitacion/{licitacion_id}.
- La generación del consecutivo es automática con formato PO-0001-25.
- Para desarrollo local, el navegador puede marcar descargas como no seguras si no hay HTTPS.
