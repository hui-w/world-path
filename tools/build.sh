#!/bin/sh

YUI="./yuicompressor-2.4.8.jar"
FILE_NAME="world-path-0.1.0.min.js"
SRC_DIR="../src"
OUT_DIR="../release"

echo "Deleting old content of output..."
rm -rf $OUT_DIR
mkdir $OUT_DIR

echo "Combining JS files..."
cat \
$SRC_DIR/common.js \
$SRC_DIR/frame.js \
$SRC_DIR/map.js \
$SRC_DIR/toolbar.js \
$SRC_DIR/world-shape.js \
> $OUT_DIR/temp.combined.js

echo "Compressing JS files..."
java -jar "$YUI" \
--type js \
-o $OUT_DIR/temp.minified.js \
$OUT_DIR/temp.combined.js

echo "Adding the version header..."
cat \
./version.js \
$OUT_DIR/temp.minified.js \
> $OUT_DIR/$FILE_NAME

echo "Deleting temporary files..."
rm -f $OUT_DIR/temp.combined.js
rm -f $OUT_DIR/temp.minified.js

echo "Preparing static files..."
cp $SRC_DIR/index_release.html $OUT_DIR/index.html
cp $SRC_DIR/data-json.js $OUT_DIR/data.js

echo "Done!"