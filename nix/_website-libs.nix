{ pkgs }:
with pkgs;
[
  cairo
  fontconfig
  freetype
  giflib
  glib
  libjpeg
  libpng
  librsvg
  openssl
  pango
  pixman
  poppler-utils
  sqlite
  stdenv.cc.cc.lib
  zlib
]
