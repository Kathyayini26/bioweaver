# BioWeaver Production Deployment Guide: Client Routing Rewrites

The BioWeaver application uses the HTML5 History API for path-based routing between `/` (Landing Page) and `/workspace` (Research Workspace).

While client-side navigation handles page swaps natively, direct browser requests to `/workspace` (e.g., via refreshing the page or loading a bookmarked link) will return a `404 Not Found` error in production unless the hosting server is configured with a **rewrite fallback rule**.

Below are the server rewrite configurations for common hosting providers:

---

## 1. Nginx
Add a `try_files` directive to your server block to route all unmatched requests to `index.html`:

```nginx
server {
    listen 80;
    server_name yourbioweaverdomain.com;
    root /var/www/bioweaver/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 2. Apache (`.htaccess`)
Create a `.htaccess` file inside the build output directory (`dist/` or `public/`) with the following Rewrite rule:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

---

## 3. Vercel (`vercel.json`)
Create a `vercel.json` file in the repository root to specify rewrite behavior:

```json
{
  "rewrites": [
    {
      "source": "/((?!api|assets|favicon.svg).*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 4. Netlify (`_redirects`)
Add a `_redirects` file in the build folder:

```text
/*   /index.html   200
```

---

## 5. Local Development (Vite)
During local development, Vite handles history rewrites automatically. Direct loads to `http://localhost:5173/workspace` will resolve correctly without any action.
