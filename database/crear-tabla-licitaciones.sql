CREATE TABLE licitaciones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    consecutivo VARCHAR(255) NOT NULL UNIQUE,
    objeto VARCHAR(150) NOT NULL,
    descripcion VARCHAR(400),

    moneda VARCHAR(3) NOT NULL,
    presupuesto DECIMAL(15,2) NOT NULL,

    actividad_id INT UNSIGNED NOT NULL,

    fecha_inicio DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    fecha_cierre DATE NOT NULL,
    hora_cierre TIME NOT NULL,

    estado VARCHAR(20) NOT NULL,

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_licitaciones_actividad
        FOREIGN KEY (actividad_id)
        REFERENCES actividades(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;