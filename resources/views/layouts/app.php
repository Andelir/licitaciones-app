<?php
if (!isset($title)) $title = 'Aplicación';
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></title>
    <link rel="stylesheet" href="/css/app.css">
    <?php if (!empty($head)) echo $head; ?>
</head>
<body>
    <?php include __DIR__ . '/../partials/header.php'; ?>

    <main role="main" class="py-4">
        <?= $content ?? '' ?>
    </main>

    <?php include __DIR__ . '/../partials/footer.php'; ?>

    <script src="/js/app.js" defer></script>
    <?php if (!empty($scripts)) echo $scripts; ?>
</body>
</html>
