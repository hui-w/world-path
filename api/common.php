<?php
function render_header() {
	echo '<!DOCTYPE html>'."\n";
	echo '<html>'."\n";
	echo '<head>'."\n";
	echo '    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />'."\n";
	echo '    <title>World-Path DB Admin</title>'."\n";
	echo '    <link rel="stylesheet" type="text/css" href="./admin.css" />'."\n";
	echo '</head>'."\n";
	echo '<body>'."\n";
	echo '<body>'."\n";
	echo '	<div class="page-wrapper">'."\n";
}

function render_toolbar() {
	echo '    <ul class="toolbar">'."\n";
	echo '        <li><a href="init_db.php">Init Database</a></li>'."\n";
	echo '    </ul>'."\n";
}

function render_footer() {
	echo '		<div class="footer">&copy; QLike.com</div>'."\n";
	echo '	</div>'."\n";
	echo '</body>'."\n";
	echo '</html>'."\n";
}
?>