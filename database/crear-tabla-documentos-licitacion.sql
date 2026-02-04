CREATE TABLE documentos_licitacion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    licitacion_id INT UNSIGNED NOT NULL,

    titulo VARCHAR(100) NOT NULL,
    descripcion VARCHAR(200),

    archivo VARCHAR(255) NOT NULL,

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_documentos_licitacion
        FOREIGN KEY (licitacion_id)
        REFERENCES licitaciones(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;