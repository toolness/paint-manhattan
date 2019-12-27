A hacky prototype to help me learn the streets of Manhattan.

The streets are based on a map called [Plan of the City of New York][plan]
that was created sometime between 1790 and 1799. The map is old but the
streets haven't actually changed much over the past couple centuries.

## Quick start

```
yarn
yarn watch
```

In another terminal, start a web server with `python3 -m http.server`.

Then visit http://localhost:8000/.

## Editing the map

[Aseprite][] is required to edit the map at `manhattan.aseprite`. The metadata
for each street name is stored in a separate layer in the "Highlights" layer group.

Once you've edited the map, run `python3 export_spritesheet.py` to export it
as a spritesheet and associated JSON metadata (alternatively, you can use
Aseprite's "Export Sprite Sheet" command with the equivalent options).

## About the font

The font is taken from [pman-sdl][], an ancient Pac-Man clone I wrote in 2003. I
am pretty sure I created it myself, but it was a long time ago.

[plan]: https://digitalcollections.nypl.org/items/5e66b3e8-e8ff-d471-e040-e00a180654d7
[Aseprite]: https://www.aseprite.org/
[pman-sdl]: https://github.com/toolness/pman-sdl/
