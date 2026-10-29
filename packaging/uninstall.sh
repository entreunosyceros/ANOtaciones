#!/usr/bin/env bash
# Desinstala ANOtaciones del sistema.
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Ejecuta con sudo: sudo ./packaging/uninstall.sh" >&2
  exit 1
fi

echo "Desinstalando ANOtaciones…"
rm -rf /opt/anotaciones
rm -f /usr/local/bin/anotaciones
rm -f /usr/share/applications/anotaciones.desktop

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database /usr/share/applications >/dev/null 2>&1 || true
fi

echo "ANOtaciones desinstalado."
