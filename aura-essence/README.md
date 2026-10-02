# AURA ESSENCE: single-page website

Static HTML, CSS and JavaScript. No build step, no dependencies. Open `index.html` in a browser, or serve the folder with any static host.

## Structure

```text
index.html
css/style.css        all styles (design tokens at the top)
js/main.js           all behaviour (WhatsApp number at the top)
assets/images/       placeholder images, logo.svg, favicon.svg
assets/video/        placeholder film
```

## Replace before launch

| What | Where |
| --- | --- |
| WhatsApp number | `WHATSAPP_NUMBER` at the top of `js/main.js` (country code first, digits only) |
| Logo | `assets/images/logo.svg` (and `favicon.svg`) |
| Hero, about, product, story images | same filenames in `assets/images/` (hero 4:5, products 4:5, about 4:5, story wide) |
| Film and poster | `assets/video/aura-essence-film.mp4`, `assets/images/video-poster.jpg` |
| Social preview | `assets/images/og-image.jpg` (1200 x 630) |
| Domain | replace `https://www.example.com/` in the canonical, Open Graph, Twitter and JSON-LD tags in `index.html` |
| Footer contact details | `index.html`, footer (Instagram and email are text placeholders, not links) |
| Products and testimonials | `index.html`, collection and testimonial sections (all sample content) |

Every placeholder image has "PLACEHOLDER IMAGE" and its filename drawn on it, so nothing placeholder can be mistaken for final photography.

## Notes

- Until `WHATSAPP_NUMBER` is set, the form still validates but shows a friendly "not available yet" message and logs the generated message to the console for testing.
- The film uses `preload="none"`, so nothing downloads until the visitor presses play. Add a captions file with a `<track kind="captions">` element when the real film is ready.
- Fonts (Cormorant Garamond and Manrope) load from Google Fonts with a serif/sans fallback stack. Self-host them if you prefer no third-party requests.
- Colours, spacing and type are controlled by the custom properties at the top of `css/style.css`.
