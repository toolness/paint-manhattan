import os
import sys
from typing import List, Optional
import subprocess
from pathlib import Path


MY_DIR = Path(__file__).parent.resolve()

GRAPHICS_DIR = MY_DIR / "graphics"

ASEPRITE_PATH = os.environ.get('ASEPRITE_PATH')

ASEPRITE_PATHS_TO_TRY = [
    Path("C:\\") / "Program Files" / "Aseprite" / "Aseprite.exe", 
]


def export(aseprite_binary: Path, basename: str, extra_args: Optional[List[str]] = None):
    ase_filename = f"{basename}.aseprite"
    json_filename = f"{basename}.json"
    png_filename = f"{basename}.png"

    # https://www.aseprite.org/docs/cli/
    aseprite_args = [
        "-b",
        "--data", json_filename,
        "--sheet", png_filename,
        *(extra_args or []),
        ase_filename,
    ]

    print(f"Exporting {ase_filename} to {json_filename} and {png_filename}...")
    if subprocess.call([aseprite_binary, *aseprite_args], cwd=GRAPHICS_DIR):
        # On Windows at least, this won't happen even if Aseprite fails,
        # which is a bummer.
        sys.exit(1)


def find_aseprite() -> Path:
    if ASEPRITE_PATH:
        return Path(ASEPRITE_PATH)
    for path in ASEPRITE_PATHS_TO_TRY:
        if path.exists():
            return path
    raise Exception(f'Aseprite not found, please define ASEPRITE_PATH in your environment!')


def main():
    aseprite = find_aseprite()
    export(aseprite, 'manhattan', extra_args=[
        "--split-layers",
        "--filename-format", r"{layer}",
    ])
    export(aseprite, 'splash', extra_args=[
        "--ignore-layer", "Background"
    ])
    export(aseprite, 'pman_font01', extra_args=[
        "--ignore-layer", "Background"
    ])
    print("Done.")


if __name__ == "__main__":
    main()
