#!/usr/bin/env python3
"""Indicador de bandeja del sistema para ANOtaciones (Ubuntu)."""
from __future__ import annotations

import os
import signal
import subprocess
import sys
import time
from pathlib import Path

PORT = int(os.environ.get("ANOTACIONES_PORT", "8765"))
URL = f"http://127.0.0.1:{PORT}"
APP_DIR = Path(os.environ.get("ANOTACIONES_APP_DIR", Path(__file__).resolve().parent))
ICON_PATH = APP_DIR / "logo.png"
SERVER_PID = os.environ.get("ANOTACIONES_SERVER_PID", "").strip()
WM_CLASS = "anotaciones"
APP_PATTERN = f"--app={URL}"
PROFILE_PATTERN = "anotaciones-browser"
# Preferir binarios .deb/.rpm frente a snap (snap no puede escribir user-data-dir fuera de ~/snap).
BROWSERS_PREFERRED = (
    "google-chrome-stable",
    "google-chrome",
    "brave-browser",
    "chromium-browser",
    "chromium",
)


def which(cmd: str) -> str | None:
    from shutil import which as _which

    return _which(cmd)


def is_snap_path(path: str) -> bool:
    return "/snap/" in path or path.startswith("/snap/")


def user_data_dir(browser: str | None = None) -> Path:
    """Perfil propio; bajo ~/snap/... si el navegador es snap (permisos)."""
    if browser and is_snap_path(browser):
        snap_name = "chromium"
        if "brave" in browser:
            snap_name = "brave"
        path = Path.home() / "snap" / snap_name / "common" / "anotaciones-browser"
    else:
        xdg = os.environ.get("XDG_CONFIG_HOME", "").strip()
        base = Path(xdg) if xdg else Path.home() / ".config"
        path = base / "anotaciones-browser"
    path.mkdir(parents=True, exist_ok=True)
    return path


def find_browser() -> str | None:
    """Devuelve ruta absoluta; prioriza no-snap."""
    candidates: list[str] = []
    for name in BROWSERS_PREFERRED:
        path = which(name)
        if path:
            candidates.append(path)
    non_snap = [p for p in candidates if not is_snap_path(p)]
    if non_snap:
        return non_snap[0]
    return candidates[0] if candidates else None


def pgrep_app() -> list[int]:
    """PIDs del navegador de ANOtaciones (perfil dedicado; más fiable que solo --app=)."""
    pgrep = which("pgrep")
    if not pgrep:
        return []
    pids: set[int] = set()
    for pattern in (PROFILE_PATTERN, APP_PATTERN):
        r = subprocess.run(
            [pgrep, "-f", pattern],
            check=False,
            capture_output=True,
            text=True,
        )
        if r.returncode not in (0, 1):
            continue
        for line in r.stdout.splitlines():
            line = line.strip()
            if line.isdigit():
                pids.add(int(line))
    me = os.getpid()
    return [p for p in sorted(pids) if p != me]


def app_running() -> bool:
    return bool(pgrep_app())


def focus_window() -> bool:
    """Intenta enfocar la ventana existente. True si parece haberlo logrado."""
    wmctrl = which("wmctrl")
    if wmctrl:
        r = subprocess.run(
            [wmctrl, "-xa", WM_CLASS],
            check=False,
            capture_output=True,
            text=True,
        )
        if r.returncode == 0:
            return True
        listed = subprocess.run(
            [wmctrl, "-lx"],
            check=False,
            capture_output=True,
            text=True,
        )
        if listed.returncode == 0:
            for line in listed.stdout.splitlines():
                if WM_CLASS.lower() in line.lower() or URL in line:
                    wid = line.split(None, 1)[0]
                    subprocess.run([wmctrl, "-ia", wid], check=False)
                    return True

    xdotool = which("xdotool")
    if xdotool:
        for key in ("--class", "--name"):
            r = subprocess.run(
                [xdotool, "search", key, WM_CLASS],
                check=False,
                capture_output=True,
                text=True,
            )
            if r.returncode == 0 and r.stdout.strip():
                wid = r.stdout.strip().splitlines()[0]
                subprocess.run(
                    [xdotool, "windowactivate", "--sync", wid],
                    check=False,
                )
                return True
    return False


def launch_browser() -> bool:
    browser = find_browser()
    if browser:
        data_dir = str(user_data_dir(browser))
        cmd = [
            browser,
            f"--user-data-dir={data_dir}",
            f"--app={URL}",
            f"--class={WM_CLASS}",
            f"--name={WM_CLASS}",
            "--no-first-run",
            "--no-default-browser-check",
        ]
        try:
            # DEVNULL: Chrome se bloquea si stderr=PIPE y nadie lee.
            subprocess.Popen(
                cmd,
                start_new_session=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except OSError as exc:
            print(f"ANOtaciones: no se pudo abrir el navegador ({exc})", file=sys.stderr)
            return False
        for _ in range(80):
            if app_running() or focus_window():
                break
            time.sleep(0.05)
        return True
    xdg = which("xdg-open")
    if xdg:
        subprocess.Popen([xdg, URL], start_new_session=True)
        return True
    print(f"ANOtaciones: abre manualmente {URL}", file=sys.stderr)
    return False


def open_app(_widget=None) -> None:
    if focus_window():
        return
    if app_running():
        if not focus_window():
            print(
                "ANOtaciones: la app ya está en ejecución "
                "(instala wmctrl o xdotool para enfocar la ventana).",
                file=sys.stderr,
            )
        return
    launch_browser()


def kill_browser() -> None:
    pids = pgrep_app()
    for pid in pids:
        try:
            os.kill(pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        except OSError as exc:
            print(f"ANOtaciones: no se pudo cerrar PID {pid} ({exc})", file=sys.stderr)

    deadline = time.time() + 3
    while time.time() < deadline and pgrep_app():
        time.sleep(0.1)

    for pid in pgrep_app():
        try:
            os.kill(pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        except OSError:
            pass

    pkill = which("pkill")
    if pkill:
        for pattern in (PROFILE_PATTERN, APP_PATTERN):
            subprocess.run([pkill, "-f", pattern], check=False)
        time.sleep(0.15)
        for pattern in (PROFILE_PATTERN, APP_PATTERN):
            subprocess.run([pkill, "-9", "-f", pattern], check=False)

    wmctrl = which("wmctrl")
    if wmctrl:
        listed = subprocess.run(
            [wmctrl, "-lx"],
            check=False,
            capture_output=True,
            text=True,
        )
        if listed.returncode == 0:
            for line in listed.stdout.splitlines():
                if WM_CLASS.lower() in line.lower():
                    wid = line.split(None, 1)[0]
                    subprocess.run([wmctrl, "-ic", wid], check=False)


def kill_server() -> None:
    if not SERVER_PID:
        return
    try:
        pid = int(SERVER_PID)
    except ValueError:
        return
    try:
        os.kill(pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    except OSError as exc:
        print(f"ANOtaciones: no se pudo detener el servidor ({exc})", file=sys.stderr)
    time.sleep(0.15)
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return
    except OSError:
        return
    try:
        os.kill(pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    except OSError:
        pass


def quit_app(_widget=None) -> None:
    kill_browser()
    kill_server()
    try:
        from gi.repository import Gtk  # type: ignore

        Gtk.main_quit()
    except Exception:
        sys.exit(0)


def load_indicator():
    import gi

    gi.require_version("Gtk", "3.0")
    try:
        gi.require_version("AyatanaAppIndicator3", "0.1")
        from gi.repository import AyatanaAppIndicator3 as AppIndicator3  # type: ignore
    except (ValueError, ImportError):
        gi.require_version("AppIndicator3", "0.1")
        from gi.repository import AppIndicator3  # type: ignore

    from gi.repository import Gtk  # type: ignore

    return AppIndicator3, Gtk


def main() -> int:
    try:
        AppIndicator3, Gtk = load_indicator()
    except Exception as exc:
        print(
            f"ANOtaciones: bandeja no disponible ({exc}). "
            "Instala python3-gi y gir1.2-ayatanaappindicator3-0.1",
            file=sys.stderr,
        )
        return 2

    icon = str(ICON_PATH) if ICON_PATH.is_file() else "applications-office"
    indicator = AppIndicator3.Indicator.new(
        "anotaciones",
        icon,
        AppIndicator3.IndicatorCategory.APPLICATION_STATUS,
    )
    indicator.set_status(AppIndicator3.IndicatorStatus.ACTIVE)
    indicator.set_title("ANOtaciones")
    if ICON_PATH.is_file():
        indicator.set_icon_full(str(ICON_PATH), "ANOtaciones")

    menu = Gtk.Menu()

    item_open = Gtk.MenuItem(label="Abrir ANOtaciones")
    item_open.connect("activate", open_app)
    menu.append(item_open)

    menu.append(Gtk.SeparatorMenuItem())

    item_quit = Gtk.MenuItem(label="Salir")
    item_quit.connect("activate", quit_app)
    menu.append(item_quit)

    menu.show_all()
    indicator.set_menu(menu)

    def on_signal(_signum, _frame):
        quit_app()

    signal.signal(signal.SIGTERM, on_signal)
    signal.signal(signal.SIGINT, on_signal)

    open_app()
    Gtk.main()
    kill_browser()
    kill_server()
    return 0


if __name__ == "__main__":
    sys.exit(main())
