# GeoScope Workbench Frontend

This folder contains the static frontend for GeoScope.

## Deploy To Vercel

Vercel cannot import a local folder name such as `geoscope-workbench` directly. It needs a Git repository.

### 1. Push this project to GitHub

Example:

```powershell
cd c:\Users\Admin\Desktop\WEBSITE
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
```

### 2. Import to Vercel

- Open Vercel dashboard
- Click `Add New...` -> `Project`
- Import your GitHub repository URL
- Set `Root Directory` to `geoscope-workbench`
- Framework preset: `Other`
- Build command: leave empty
- Output directory: leave empty

### 3. Backend note

This frontend calls the backend API. For production, update `script.js` to use your deployed backend URL instead of localhost.

## Local Preview

You can open `index.html` directly in a browser for static preview, but login/order features require the backend from the `geoscope` folder to be running.