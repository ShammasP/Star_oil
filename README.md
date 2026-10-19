# Star Pure Coconut Oil website

Static site (HTML + CSS + JS, no build step).

| Page | What it is |
|---|---|
| `index.html` | Loader, then a full-screen 3D carousel of the packs over flowing golden oil |
| `product.html?p=<id>` | One page per pack, each in its own colour (opened by clicking a pack) |
| `story.html` | Our story, the scroll-filled bottle, the process and stats |
| `contact.html` | Address, plus a form that sends a WhatsApp message |

## View it
```
python -m http.server 8765
```
then open http://127.0.0.1:8765

## Edit content
Everything about the products (names, text, colours, photos) **and** the phone/WhatsApp number lives in **`js/data.js`**.

## Add your logo and product photos
| What | File |
|---|---|
| Logo | `assets/images/logo.svg` (to use a PNG, change `logo.svg` in `js/common.js`) |
| 5 L can | `assets/images/products/5l-can.png` |
| 2 L bottle | `assets/images/products/2l-bottle.png` |
| 1 L bottle | `assets/images/products/1l-bottle.png` |
| 1 L pouch | `assets/images/products/1l-pouch.png` |
| 500 ml pouch | `assets/images/products/500ml-pouch.png` |

Use PNGs with a **transparent background**, upright, about 1000 px tall. Until a photo exists, the drawn illustration is shown.

## Publish on GitHub Pages
1. Create a new repository on GitHub and push this folder to it.
2. In the repo, open **Settings → Pages**. Set **Source** to "Deploy from a branch", choose the `main` branch and the `/ (root)` folder, then save.
3. After a minute the site is live at `https://<username>.github.io/<repo>/`.

All links are relative, so the site works both at that address and on its own domain.

### Custom domain
1. In **Settings → Pages → Custom domain**, enter your domain (e.g. `starcoconutoil.in`). GitHub adds a `CNAME` file for you.
2. At your domain provider, add DNS records:
   - for `www`: a `CNAME` record pointing to `<username>.github.io`
   - for the bare domain: `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
3. Tick **Enforce HTTPS** once the certificate is ready.

## Project layout
```
index.html  product.html  story.html  contact.html  404.html
css/      base.css (shared), home.css, product.css, pages.css
js/       data.js (content), common.js (shared), oil.js (oil shader), home.js, product.js, pages.js
assets/   images/logo.svg, images/lineup.webp, images/products/*.png
```
