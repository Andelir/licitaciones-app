<?php
$title = 'Licitaciones - Suplos';
ob_start();
?>
<div id="licitaciones-list" class="container mt-3">
    <!-- Vue mount point -->
</div>

<?php
$content = ob_get_clean();
include __DIR__ . '/../layouts/app.php';

