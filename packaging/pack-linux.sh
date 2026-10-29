#!/usr/bin/env bash
# Construye el paquete de escritorio en release/anotaciones/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/release/anotaciones"

cd "${ROOT}"
npm run build

rm -rf "${OUT}"
mkdir -p "${OUT}/web"

cp -a "${ROOT}/dist/." "${OUT}/web/"
install -m755 "${ROOT}/packaging/anotaciones" "${OUT}/anotaciones"
install -m755 "${ROOT}/packaging/anotaciones-tray.py" "${OUT}/anotaciones-tray.py"
install -m644 "${ROOT}/packaging/anotaciones.desktop" "${OUT}/anotaciones.desktop"

if [[ -f "${ROOT}/public/logo.png" ]]; then
  install -m644 "${ROOT}/public/logo.png" "${OUT}/logo.png"
elif [[ -f "${ROOT}/dist/logo.png" ]]; then
  install -m644 "${ROOT}/dist/logo.png" "${OUT}/logo.png"
else
  echo "Aviso: no se encontró logo.png" >&2
fi

# Scripts de instalación junto al release (comodidad)
install -m755 "${ROOT}/packaging/install.sh" "${ROOT}/release/install.sh"
install -m755 "${ROOT}/packaging/uninstall.sh" "${ROOT}/release/uninstall.sh"
install -m755 "${ROOT}/packaging/build-deb.sh" "${ROOT}/release/build-deb.sh"

echo "Paquete listo en ${OUT}"
echo "  Instalar:  sudo ./packaging/install.sh"
echo "  O .deb:    ./packaging/build-deb.sh && sudo dpkg -i release/*.deb"
