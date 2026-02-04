CREATE TABLE actividades (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    codigo_segmento INT NOT NULL,
    segmento VARCHAR(200) NOT NULL,

    codigo_familia INT NOT NULL,
    familia VARCHAR(200) NOT NULL,

    codigo_clase INT NOT NULL,
    clase VARCHAR(200) NOT NULL,

    codigo_producto INT NOT NULL,
    producto VARCHAR(200) NOT NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;