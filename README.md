This is a simple game to help me learn the streets of Manhattan.

The streets are based on a map called [Plan of the City of New York][plan]
that was created sometime between 1790 and 1799. The map is old but the
streets haven't actually changed much over the past couple centuries.

In situations where the names of streets have changed, the old and new name
have been separated with a slash; for example, Fair Street was later
renamed to Fulton Street, so this is represented as "Fair/Fulton Street".
A number of the renamings were informally verified through internet
searches, though Forgotten New York's [Lower Manhattan Necrology][nec]
was particularly useful.

[nec]: https://forgotten-ny.com/1999/09/lower-manhattan-necrology/

## Quick start

```
yarn
yarn start
```

Then visit http://localhost:8000/.

## Editing the map

[Aseprite][] is required to edit the map at `manhattan.aseprite`. The metadata
for each street name is stored in a separate layer per street; they effectively
function as masks and the actual RGB color of the street isn't important, as long
as it's not completely transparent.

Once you've edited the map, run `python3 export_spritesheet.py` to export it
as a spritesheet and associated JSON metadata (alternatively, you can use
Aseprite's "Export Sprite Sheet" command with the equivalent options).

## About the font

The font is taken from [pman-sdl][], an ancient Pac-Man clone I wrote in 2003. I
am pretty sure I created it myself, but it was a long time ago.

[plan]: https://digitalcollections.nypl.org/items/5e66b3e8-e8ff-d471-e040-e00a180654d7
[Aseprite]: https://www.aseprite.org/
[pman-sdl]: https://github.com/toolness/pman-sdl/
