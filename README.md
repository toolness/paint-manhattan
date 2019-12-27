A hacky prototype to help me learn the streets of Manhattan.

The streets are based on a map called [Plan of the City of New York][plan]
that was created sometime between 1790 and 1799. The map is old but the
streets haven't actually changed much over the past couple centuries.

## Editing the map

[Aseprite][] is required to edit the map at `manhattan.aseprite`. The metadata
for each street name is stored in a separate layer in the "Highlights" layer group.

Once you've edited the map, run `python3 export_spritesheet.py` to export it
as a spritesheet and associated JSON metadata (alternatively, you can use
Aseprite's "Export Sprite Sheet" command with the equivalent options).

[plan]: https://digitalcollections.nypl.org/items/5e66b3e8-e8ff-d471-e040-e00a180654d7
[Aseprite]: https://www.aseprite.org/
