<?php
$title = 'Ver Licitación - Suplos';
ob_start();
?>
<div class="container mt-4">
  <div id="licitacion-view"></div>
</div>
<?php
$content = ob_get_clean();
include __DIR__ . '/../layouts/app.php';
