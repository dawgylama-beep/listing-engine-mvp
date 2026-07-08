# Listing Engine MVP

A minimal web prototype that turns item photos, a selected marketplace, and seller notes into a structured marketplace listing using the OpenAI API.

## START HERE FOR NON-TECHNICAL USERS

### What you need first

- A Windows computer.
- Your OpenAI API key.
- The `listing-engine-mvp` folder from this project.

### 1. Open the MVP folder

1. Open File Explorer.
2. Click the address bar at the top.
3. Paste this folder path:

```text
C:\Users\Kelly\Documents\Codex\2026-07-07\build-a-simple-web-mvp-for\outputs\listing-engine-mvp
```

4. Press Enter.

### 2. Create the `.env` file

Easiest method:

1. Double-click `SET_API_KEY.bat`.
2. Paste your OpenAI API key.
3. Press Enter.
4. The `.env` file will be created or updated for you.

Manual method:

1. In the `listing-engine-mvp` folder, find `.env.example`.
2. Right-click `.env.example`.
3. Click Copy.
4. Right-click an empty area in the same folder.
5. Click Paste.
6. Rename the copied file to:

```text
.env
```

If Windows warns you about changing the file name extension, click Yes.

### 3. Add your OpenAI API key

If you used `SET_API_KEY.bat`, you can skip this section.

1. Right-click the new `.env` file.
2. Click Open with.
3. Choose Notepad.
4. Replace this:

```text
OPENAI_API_KEY=sk-your-key-here
```

with this, using your real API key:

```text
OPENAI_API_KEY=paste-your-real-api-key-here
```

5. Click File.
6. Click Save.
7. Close Notepad.

Do not put spaces around the `=` sign.

### 4. Start or restart the app

Easy method:

1. Double-click `START_LISTING_ENGINE.bat`.
2. A terminal window will open.
3. It will stop any old Listing Engine server using port `5175`.
4. Leave that window open while using the app.

Command method:

1. Open the `listing-engine-mvp` folder in File Explorer.
2. Click the address bar.
3. Type:

```text
powershell
```

4. Press Enter.
5. Paste this command and press Enter:

```powershell
Get-NetTCPConnection -LocalPort 5175 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
powershell -ExecutionPolicy Bypass -File .\server.ps1
```

Leave the PowerShell window open. Closing it stops the app.

### 5. Test the app

1. Open Chrome, Edge, or another browser.
2. Click the address bar.
3. Type:

```text
http://localhost:5175
```

4. Press Enter.
5. Upload item photos, choose a marketplace, add notes, and click Generate Listing.

If something is already using `localhost:5175`, close old PowerShell windows running Listing Engine, then start it again.

## Run locally

1. Copy `.env.example` to `.env`.
2. Add your `OPENAI_API_KEY`.
3. Start the server:

```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1
```

Then open `http://localhost:5175`.

## Deploy Online With Vercel

This project is now Vercel-ready.

For online deployment, Vercel will use:

- `public/` for the website files.
- `api/generate-listing.js` for the secure server-side OpenAI call.
- Vercel Environment Variables for `OPENAI_API_KEY`.

Do not upload your local `.env` file. It contains your private API key. The `.gitignore` and `.vercelignore` files are included to help prevent that.

### 1. Create a GitHub repository

1. Go to GitHub.
2. Create a new repository.
3. Make it private while you are testing.
4. Upload the Listing Engine project files.
5. Do not upload `.env`.

### 2. Create a Vercel project

1. Go to Vercel.
2. Sign in with GitHub.
3. Click Add New Project.
4. Choose the GitHub repository for Listing Engine.
5. Keep the default project settings.

### 3. Add your OpenAI API key safely

1. In Vercel, open the Listing Engine project.
2. Go to Settings.
3. Click Environment Variables.
4. Add this variable:

```text
OPENAI_API_KEY
```

5. Paste your real OpenAI API key as the value.
6. Save it for Production.

Optional:

```text
OPENAI_MODEL
```

If you do not add `OPENAI_MODEL`, the app uses `gpt-4.1-mini`.

### 4. Deploy

1. Click Deploy in Vercel.
2. Wait for the deployment to finish.
3. Vercel will give you a public link like:

```text
https://your-project-name.vercel.app
```

### 5. Test the live app

1. Open the Vercel link.
2. Upload item photos.
3. Choose a marketplace platform.
4. Add item notes.
5. Click Generate Listing.

If generation fails, check that `OPENAI_API_KEY` is set in Vercel and redeploy.

## Scope

Included:

- Multiple item photo upload
- Marketplace platform selection
- Seller item notes
- OpenAI-powered listing generation
- Structured sections with individual copy buttons
- Copy all generated listing text
- Mobile-friendly layout

Not included yet:

- Marketplace posting integrations
- Subscriptions or billing
- Accounts, saved listings, or history
