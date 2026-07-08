# Listing Engine Deployment Checklist

Use this checklist before uploading Listing Engine to GitHub and Vercel.

## Preflight Safety Check

- Confirm `.gitignore` exists.
- Confirm `.gitignore` includes:

```text
.env
.env.*
!.env.example
```

- Do not upload `.env`.
- It is okay to upload `.env.example`.
- Do not paste your real OpenAI API key into GitHub files.
- Add the real key only inside Vercel Environment Variables.

## Correct Vercel Settings

Use these settings when importing the GitHub repository into Vercel:

```text
Framework Preset: Other
Build Command: leave empty
Output Directory: public
Install Command: leave default / do not override
Root Directory: leave blank if the GitHub repo root is listing-engine-mvp
```

Important:

- `public` is the correct Output Directory for this project.
- Do not leave Output Directory blank unless Vercel auto-fills or auto-detects `public`.
- If you upload a parent folder instead of the `listing-engine-mvp` contents, set Root Directory to the folder that contains `public`, `api`, and `package.json`.

## 1. Create a Private GitHub Repo

1. Open your browser.
2. Go to `https://github.com`.
3. Sign in.
4. Click the `+` button in the top-right corner.
5. Click `New repository`.
6. In `Repository name`, type:

```text
listing-engine-mvp
```

7. Choose `Private`.
8. Do not check `Add a README file`.
9. Do not add a `.gitignore`.
10. Do not choose a license.
11. Click `Create repository`.

## 2. Upload The Project Safely

1. On the empty GitHub repo page, click `uploading an existing file`.
2. If you do not see that, click `Add file`.
3. Click `Upload files`.
4. Open File Explorer.
5. Go to:

```text
C:\Users\Kelly\Documents\Codex\2026-07-07\build-a-simple-web-mvp-for\outputs\listing-engine-mvp
```

6. Select these items:

```text
api
public
.env.example
.gitignore
.vercelignore
DEPLOYMENT_CHECKLIST.md
package.json
PRODUCT_ROADMAP.md
README.md
server.ps1
SET_API_KEY.bat
START_LISTING_ENGINE.bat
```

7. Do not select this file:

```text
.env
```

8. Drag the selected items into the GitHub upload area.
9. Wait for upload to finish.
10. Scroll to `Commit changes`.
11. Type this commit message:

```text
Initial Listing Engine MVP upload
```

12. Click `Commit changes`.

## 3. Confirm `.env` Is Not Uploaded

After the upload finishes:

1. Look at the file list in GitHub.
2. Confirm you do not see `.env`.
3. Confirm you do see `.env.example`.
4. If you accidentally uploaded `.env`, stop and delete it from GitHub immediately before continuing.

## 4. Import Into Vercel

1. Go to `https://vercel.com`.
2. Sign in with GitHub.
3. Click `Add New`.
4. Click `Project`.
5. Find `listing-engine-mvp`.
6. Click `Import`.
7. In the project settings screen, use:

```text
Framework Preset: Other
Build Command: leave empty
Output Directory: public
Install Command: leave default / do not override
```

## 5. Add `OPENAI_API_KEY` In Vercel

1. In the Vercel import screen, find `Environment Variables`.
2. In `Name`, type:

```text
OPENAI_API_KEY
```

3. In `Value`, paste your real OpenAI API key.
4. Click `Add`.
5. Make sure it is available for `Production`.

Optional:

```text
OPENAI_MODEL=gpt-4.1-mini
```

If you do not add `OPENAI_MODEL`, the app uses `gpt-4.1-mini`.

## 6. Deploy

1. Click `Deploy`.
2. Wait for Vercel to finish.
3. When Vercel says the deployment succeeded, click `Visit`.
4. Copy the public website link.

## 7. Test The Public Link

1. Open the public Vercel link.
2. Upload an item photo.
3. Choose a marketplace platform.
4. Add item notes.
5. Click `Generate Listing`.
6. Confirm the listing appears.
7. Click one section `Copy` button.
8. Click `Copy All`.

## If Something Fails

- If the page does not load, confirm Output Directory is `public`.
- If generation fails with `Missing OPENAI_API_KEY`, add the key in Vercel Environment Variables and redeploy.
- If `/api/generate-listing` is missing, confirm the `api` folder was uploaded.
- If Vercel cannot find the app, confirm Root Directory points to the folder containing `public`, `api`, and `package.json`.
