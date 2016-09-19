<?php
require_once("./common.php");
require_once('class_sqlite.php');
render_header();
render_toolbar();

$DB=new SQLite('world_path.db'); 
$DB->query("create table poi(id integer primary key,title varchar(50))"); 
$DB->query("insert into poi(title) values('上海')"); 
$DB->query("insert into poi(title) values('北京')"); 
$DB->query("insert into poi(title) values('广州')"); 
$DB->query("insert into poi(title) values('深圳')"); 
print_r($DB->getlist('select * from poi order by id desc')); 

render_footer();
?>