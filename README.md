This is a web-based game to help players learn the history of Manhattan,
as told by its streets.

The streets are based on a map called [Plan of the City of New York][plan]
that was created sometime between 1790 and 1799. The map is old but the
streets haven't actually changed much over the past couple centuries.

In situations where the names of streets have changed, the old and new name
have been separated with a slash; for example, Fair Street was later
renamed to Fulton Street, so this is represented as "Fair/Fulton Street".
A number of the renamings were informally verified through internet
searches, though Forgotten New York's [Lower Manhattan Necrology][nec]
was particularly useful.

Streets which no longer exist in present-day Manhattan, or whose
names were ambiguous, are not included in the game as streets for
the player to paint, though they are still visible on the screen.

The game also features stories about the streets. Most of these
were taken from Wikipedia, Dan Rogerson's
[Manhattan Street Names Past and Present][rogerson], 
and the walking tour "Slavery and Resistance in NYC" offered by
[Mariame Kaba][kaba].

For more information on the inspiration behind this game, see the blog post
[The Stories Streets Tell][blogpost].

[You can play the game here.][game]

[nec]: https://forgotten-ny.com/1999/09/lower-manhattan-necrology/
[rogerson]: https://www.amazon.com/dp/B00C0MTRUK
[kaba]: http://mariamekaba.com/
[blogpost]: https://www.toolness.com/wp/post/paint-manhattan-circa-1799/

## Quick start

If you want to run/develop the game locally, clone the repository,
install [NodeJS][] and [Yarn][] and run:

```
yarn
yarn start
```

Then visit http://localhost:8000/.

You can also visit http://localhost:8000/debug.html for some debugging options.

[game]: https://paint.toolness.org/
[NodeJS]: https://nodejs.org/
[Yarn]: https://yarnpkg.com/

## Running tests

The game has a browser-based test suite that you can run at
http://localhost:8000/test.html.

Note that adding any new test files involves adding new `<script>` tags to
`test.html`, as there is no "automatic discovery" of them.

## Editing the map

[Aseprite][] is required to edit the map at `graphics/manhattan.aseprite`. The
metadata for each street name is stored in a separate layer per street; they
effectively function as masks and the actual RGB color of the street isn't
important, as long as it's not completely transparent.

Once you've edited the map, run `python3 export_from_aseprite.py` to export it
as a spritesheet and associated JSON metadata (alternatively, you can use
Aseprite's "Export Sprite Sheet" command with the equivalent options).

## About the audio

Sound effects were created using increpare's [Bfxr][]. Original Bfxr files are
located in the `audio/` directory.

[Bfxr]: https://www.bfxr.net/

## About the graphics

The large font is taken from [pman-sdl][], an ancient Pac-Man clone I wrote in 2003. I
am pretty sure I created it myself, but it was a long time ago.

I created all the other graphics in December 2019.

## Deployment

To build the project, run:

```
yarn build
```

The entire project is now in the `public` folder and can be copied to any standard
static file host/server, such as Apache, Amazon S3, or Netlify.

[plan]: https://digitalcollections.nypl.org/items/5e66b3e8-e8ff-d471-e040-e00a180654d7
[Aseprite]: https://www.aseprite.org/
[pman-sdl]: https://github.com/toolness/pman-sdl/
