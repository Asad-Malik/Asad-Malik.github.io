# Asad W. Malik — Academic Website

Static personal website (plain HTML/CSS/JS, no build step) for GitHub Pages.

## Structure
```
index.html                  page content (bio, research, experience, education, contact)
assets/css/style.css        design (ivory / navy / gold, light + dark mode)
assets/js/main.js           animations, citation chart, publication search & filters
assets/cv/Asad_Malik_CV.pdf downloadable CV
data/publications.js        publication list + metrics (generated from Google Scholar)
scripts/update_publications.py  refreshes data/publications.js
photo.jpg                   (add this) profile photo; falls back to an "AWM" monogram
```

## Preview locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000

## Refresh publications from Google Scholar
```bash
python3 scripts/update_publications.py
```
If Google rate-limits the request, wait a while and retry.

## Deploy to GitHub Pages
1. Create a repo (for a root URL, name it `<username>.github.io`).
2. Push this folder:
   ```bash
   git init && git add . && git commit -m "Initial website"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```
3. On GitHub, open **Settings → Pages**, set **Source: Deploy from a branch**, **Branch: main / (root)**.
