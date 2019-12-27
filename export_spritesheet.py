import os
import sys
import subprocess
from pathlib import Path


ASE_FILENAME = "manhattan.aseprite"

JSON_FILENAME = "manhattan.json"

PNG_FILENAME = "manhattan.png"

ASEPRITE_PATH = os.environ.get('ASEPRITE_PATH')

# https://www.aseprite.org/docs/cli/
ASEPRITE_ARGS = [
    "-b",
    "--data", JSON_FILENAME,
    "--sheet", PNG_FILENAME,
    "--split-layers",
    "--filename-format", r"{layer}",
    ASE_FILENAME,
]

ASEPRITE_PATHS_TO_TRY = [
    Path("C:\\") / "Program Files" / "Aseprite" / "Aseprite.exe", 
]


def find_aseprite() -> Path:
    if ASEPRITE_PATH:
        return Path(ASEPRITE_PATH)
    for path in ASEPRITE_PATHS_TO_TRY:
        if path.exists():
            return path
    raise Exception(f'Aseprite not found, please define ASEPRITE_PATH in your environment!')


def main():
    print(f"Exporting {ASE_FILENAME} to {JSON_FILENAME} and {PNG_FILENAME}...")
    if subprocess.call([find_aseprite(), *ASEPRITE_ARGS]):
        sys.exit(1)
    print("Done.")


if __name__ == "__main__":
    main()
