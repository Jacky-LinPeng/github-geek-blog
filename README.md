# GitHub Geek Blog Homepage

A single-page, cyberpunk-style personal homepage for GitHub Pages.

## 1) Customize

Edit `script.js`:

- `username`: your GitHub id
- `displayName`: your display name
- `typedTexts`: rotating hero lines

Edit `index.html`:

- Blog cards under `#blog`
- Contact links under `#contact`

## 2) Local preview

```bash
cd github-geek-blog
python3 -m http.server 8080
```

Open: `http://localhost:8080`

## 3) Deploy to GitHub Pages (user site)

If your GitHub username is `alice`, create repo `alice.github.io` and push:

```bash
cd github-geek-blog
git init
git add .
git commit -m "init geek homepage"
git branch -M main
git remote add origin git@github.com:alice/alice.github.io.git
git push -u origin main
```

Then open:

`https://alice.github.io`

## 4) Deploy as project page

Push to any repo (example `geek-blog`), then in GitHub:

- `Settings` -> `Pages`
- `Source`: `Deploy from a branch`
- Branch: `main` / root

Your URL will be:

`https://alice.github.io/geek-blog`
