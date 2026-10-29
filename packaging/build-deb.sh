#!/usr/bin/env bash
# Genera un .deb instalable (arquitectura all).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${ANOTACIONES_VERSION:-$(node -p "require('${ROOT}/package.json').version" 2>/dev/null || echo 0.5.0)}"
SRC="${ROOT}/release/anotaciones"
STAGE="${ROOT}/release/deb-root"
OUT_DIR="${ROOT}/release"
PKG_NAME="anotaciones"
DEB_NAME="${PKG_NAME}_${VERSION}_all.deb"

if [[ ! -d "${SRC}/web" || ! -f "${SRC}/anotaciones" ]]; then
  echo "No hay paquete en release/anotaciones. Ejecuta antes: npm run pack:linux" >&2
  exit 1
fi

if ! command -v dpkg-deb >/dev/null 2>&1; then
  echo "Se necesita dpkg-deb (paquete dpkg-dev en Ubuntu)." >&2
  exit 1
fi

rm -rf "${STAGE}"
mkdir -p "${STAGE}/DEBIAN"
mkdir -p "${STAGE}/opt/anotaciones"
mkdir -p "${STAGE}/usr/local/bin"
mkdir -p "${STAGE}/usr/share/applications"

cp -a "${SRC}/." "${STAGE}/opt/anotaciones/"
chmod 755 "${STAGE}/opt/anotaciones/anotaciones"
chmod 755 "${STAGE}/opt/anotaciones/anotaciones-tray.py"

# Enlace relativo vía wrapper en bin
cat > "${STAGE}/usr/local/bin/anotaciones" <<'EOF'
#!/usr/bin/env bash
exec /opt/anotaciones/anotaciones "$@"
EOF
chmod 755 "${STAGE}/usr/local/bin/anotaciones"

install -m644 "${STAGE}/opt/anotaciones/anotaciones.desktop" \
  "${STAGE}/usr/share/applications/anotaciones.desktop"

SIZE_KB="$(du -sk "${STAGE}/opt" | awk '{print $1}')"

cat > "${STAGE}/DEBIAN/control" <<EOF
Package: ${PKG_NAME}
Version: ${VERSION}
Section: office
Priority: optional
Architecture: all
Installed-Size: ${SIZE_KB}
Maintainer: ANOtaciones <local@localhost>
Depends: python3, python3-gi, gir1.2-gtk-3.0, gir1.2-ayatanaappindicator3-0.1 | gir1.2-appindicator3-0.1
Recommends: chromium | chromium-browser | google-chrome-stable | brave-browser
Description: Notas, tableros y bases de datos locales
 ANOtaciones es una SPA local (IndexedDB) empaquetada para Ubuntu
 con lanzador de escritorio, bandeja del sistema y servidor HTTP
 mínimo en localhost.
EOF

cat > "${STAGE}/DEBIAN/postinst" <<'EOF'
#!/bin/sh
set -e
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database /usr/share/applications >/dev/null 2>&1 || true
fi
exit 0
EOF
chmod 755 "${STAGE}/DEBIAN/postinst"

cat > "${STAGE}/DEBIAN/postrm" <<'EOF'
#!/bin/sh
set -e
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database /usr/share/applications >/dev/null 2>&1 || true
fi
exit 0
EOF
chmod 755 "${STAGE}/DEBIAN/postrm"

mkdir -p "${OUT_DIR}"
dpkg-deb --root-owner-group --build "${STAGE}" "${OUT_DIR}/${DEB_NAME}"
rm -rf "${STAGE}"

echo "Generado: ${OUT_DIR}/${DEB_NAME}"
echo "Instalar: sudo dpkg -i ${OUT_DIR}/${DEB_NAME}"
