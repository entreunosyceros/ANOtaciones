#!/usr/bin/env bash
# Instala ANOtaciones en /opt/anotaciones y registra el lanzador de escritorio.
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Ejecuta con sudo: sudo ./packaging/install.sh" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${ROOT}/release/anotaciones"
PREFIX="/opt/anotaciones"

if [[ ! -d "${SRC}/web" || ! -f "${SRC}/anotaciones" ]]; then
  echo "No hay paquete en release/anotaciones. Ejecuta antes: npm run pack:linux" >&2
  exit 1
fi

echo "Instalando ANOtaciones en ${PREFIX}…"
rm -rf "${PREFIX}"
mkdir -p "${PREFIX}"
cp -a "${SRC}/." "${PREFIX}/"
chmod 755 "${PREFIX}/anotaciones"

ln -sf "${PREFIX}/anotaciones" /usr/local/bin/anotaciones

DESKTOP_SRC="${PREFIX}/anotaciones.desktop"
if [[ ! -f "${DESKTOP_SRC}" ]]; then
  DESKTOP_SRC="${ROOT}/packaging/anotaciones.desktop"
fi
install -Dm644 "${DESKTOP_SRC}" /usr/share/applications/anotaciones.desktop

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database /usr/share/applications >/dev/null 2>&1 || true
fi

echo "Listo. Busca «ANOtaciones» en el menú de aplicaciones o ejecuta: anotaciones"
