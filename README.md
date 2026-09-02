# Michael Searle — portfolio site

Plain HTML, CSS and JavaScript. No build step, no dependencies to install.

```
index.html            everything you'll normally edit
assets/css/site.css   all styling
assets/js/site.js     hover previews, the player, scroll behaviour
assets/img/           bio photograph
```

## Preview it locally

```bash
python3 -m http.server 4321
```

Then open <http://localhost:4321>. Open it over a server rather than
double-clicking `index.html` — the YouTube previews need a real origin.

## Everyday edits

Everything below lives in `index.html` and is marked with a comment.

**Add or change a film.** Copy one `<article class="film">` block and change
four things: `data-video`, the `src` of the still, the client name and the
subtitle. The still comes straight from YouTube, so you never upload one —
`https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg`.

One card is commented out because no YouTube link has been supplied for it:
**Origina**. Paste the video ID into both `data-video` and the image `src`,
delete the `<!--` and `-->` around the block, and it appears — then check the
row spans below still add up.

**Fix a bad crop.** Frames are cropped to 2.35:1. A film finished at that ratio
lands perfectly, but one finished 16:9 loses a quarter of its height, which can
clip heads. Add `--focus` to that card — `0%` holds the top of the still, `100%`
the bottom, and leaving it off centres. Applied Materials is set to `15%`.

**Lay out the grid.** Each card carries `style="--span:7;--push:0"`.
`--span` is how many of the twelve columns it fills; `--push` nudges it down
the page in pixels, which is what gives the grid its hand-laid feel. Keep each
row's spans adding up to twelve or less, or the card wraps onto a new row.
Both are ignored below 1180px, where the grid becomes two columns and then one.

**Awards.** One `<li class="ledger__row">` per award: distinction, awarding
body, project, role. `ledger__metal--gold` is what makes a line read brighter
than the silvers.

**The `film__laurel` line** only appears on films that won something — that
asymmetry is deliberate, so don't add it to every card.

## Things worth knowing

- The page is monochrome on purpose. Every colour on it comes from the film
  frames and the bio photograph, and only once you look at them.
- On a mouse, a still is desaturated until you hover it, then it develops to
  colour straight away, and the film itself starts playing silently once you
  have held the cursor there for three seconds. That hold is `PREVIEW_DELAY` in
  `site.js`. The bio photograph does the same, minus the playback.
- On a phone there is no cursor, so position does the work instead: whatever is
  in the middle of the screen is in full colour, and each frame fades back to
  monochrome as it scrolls away from the centre. `site.js` writes a `--dev`
  value (0 to 1) onto each frame as you scroll and the filters in
  `@media (hover:none)` interpolate on it, so tune the feel there — `hot` and
  `cold` in `site.js` set how wide the colour band is.
- To change the bio photograph, drop a new file at `assets/img/bio.jpg`. It is
  cropped to 3:2, so give it a landscape frame.
- Frames are cropped to 2.35:1 because most of the films are finished at that
  ratio and YouTube's 16:9 stills arrive letterboxed. The crop removes the bars
  exactly. A film added later that is natively 16:9 gets cropped top and bottom
  to match the rest, so check its still still reads at that ratio.
- The contact email is sized to fill the page width. If you swap in a longer
  address, lower the divisor in `.contact__mail` until it fits on one line.
- Typefaces are Archivo (display and labels, using its variable width axis)
  and Newsreader (the italic subtitles and the About story), both from Google
  Fonts.

## Publishing

It is a static site, so anything will host it: Netlify, Vercel, GitHub Pages,
Cloudflare Pages. Drag the folder in.

Still placeholder, and worth fixing: the **Yinson subtitle**, the **NXzen
subtitle**, which currently repeats Adecco's, and the **hero line** under the
heading.
