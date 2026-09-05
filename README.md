# Michael Searle — portfolio site

Plain HTML, CSS and JavaScript. No build step, no dependencies to install.

```
index.html            the film index, about, awards, team
contact.html          the enquiry form
assets/css/site.css   all styling, both pages
assets/js/site.js     hover previews, the player, scroll behaviour
assets/js/contact.js  the enquiry form: human check, honeypot, sending
assets/img/           bio photograph, team portraits, share card
```

## Preview it locally

```bash
python3 -m http.server 4321
```

Then open <http://localhost:4321>. Open it over a server rather than
double-clicking `index.html` — the YouTube previews need a real origin.

## The motion study

`motion.html` is a separate page, not linked from the site and marked
`noindex`. It is a working sketch of the interaction language of sites like
Resn's *Corn Revolutionized* — weighted scrolling, type that reacts to the
pointer, scenes that hold while you scroll through them — written in the same
plain HTML, CSS and JavaScript as the rest, with no libraries.

```
motion.html             the study
assets/css/motion.css   its styling, loaded after site.css
assets/js/motion.js     one animation loop driving everything
```

Open <http://localhost:4321/motion.html> alongside the local server above.

What it does, section by section:

1. **The cursor field.** Each headline is split into characters. Every frame,
   each character measures its distance to the pointer and answers on the
   variable axes of Archivo — `wght` and `wdth` — while leaning out of the way.
   Tune it per headline with `data-radius`, `data-push`, `data-wght`,
   `data-wdth`. The text stays real text: selectable, searchable, readable to a
   screen reader.
2. **Weighted scroll.** The page is a fixed sheet translated by hand each
   frame, chasing the browser's scroll position instead of matching it. The lag
   is the effect. An empty div behind it holds the real scroll height.
3. **Parallax and shear.** The scroll velocity from step 2 drives a slow pan on
   each still inside its frame, and a fraction of a degree of skew on the frame
   itself.
4. **Pinned scene.** A tall section whose inner panel is held in the viewport
   while you scroll past it, with progress writing a `--p` custom property that
   the copy and the progress rule both read.
5. **Magnetic targets and the drawn cursor.** `data-magnetic` pulls an element
   toward the pointer; the ring widens and picks up a label from `data-cue`.

Everything degrades on its own: a touch device gets native scrolling and the
system cursor, and `prefers-reduced-motion` turns off the sheet, the pinning
and the field, leaving a static page that says the same things.


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
  have held the cursor there for 2.2 seconds. That hold is `PREVIEW_DELAY` in
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

## The enquiry form

`contact.html` asks a client the things worth knowing before a first reply:
what the film is for, what they need from you, where and when it shoots, and
the budget range. Three things guard it, all in `contact.js`: a sum written in
words that has to be answered, a honeypot field only a bot can see, and a
three-second floor on how fast the form can be submitted.

**Where the answers go.** Out of the box the form opens the sender's mail app
with everything filled in and addressed to you, which needs no setup but relies
on them pressing send. For answers to land in your inbox on their own, get a
free endpoint from formspree.io or web3forms.com and paste it into `ENDPOINT`
at the top of `contact.js`. Nothing else changes.

## The share picture

`assets/img/share.jpg` is what appears when the link is pasted into WhatsApp,
Slack or a message. It is 1200x628 and referenced by absolute URL in the
`og:image` tags of both pages — a relative path will not work, those services
fetch the page from their own servers. Replace the file to change the preview,
keeping roughly the same proportions.

## Publishing

It is a static site, so anything will host it: Netlify, Vercel, GitHub Pages,
Cloudflare Pages. Drag the folder in.

Still placeholder, and worth fixing: the **Yinson subtitle**, the **NXzen
subtitle**, which currently repeats Adecco's, and the **hero line** under the
heading.
