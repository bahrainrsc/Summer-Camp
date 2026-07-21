# 📊 Google Sheets Setup Guide — Funfinity Summer Camp

Follow these steps to connect the registration system to Google Sheets.
Once done, every new registration will **automatically appear in your Sheet** in real time — split across:
- **"All Registrations"** tab — every registration
- **"Muharraq Zone"** tab — Gudaibiya, Caseno, Hidd, Juffair
- **"Manama Zone"** tab — Salmabad, Salmaniya, Budayya
- **"Riffa Zone"** tab — Khaleefa, Sanad, Hamad Town, Isa Town

---

## Step 1 — Create a Google Cloud Project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **"New Project"**
3. Name it `Funfinity Summer Camp` → click **Create**

---

## Step 2 — Enable the Google Sheets API

1. In the left menu: **APIs & Services → Library**
2. Search for **"Google Sheets API"**
3. Click it → click **Enable**

---

## Step 3 — Create a Service Account

1. Go to **APIs & Services → Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"Service account"**
3. Name it `summer-shine-sheets` → click **Create and Continue**
4. Skip the optional steps → click **Done**

---

## Step 4 — Download the Credentials JSON

1. On the Credentials page, click your new service account email
2. Go to the **"Keys"** tab
3. Click **"Add Key" → "Create new key"**
4. Choose **JSON** → click **Create**
5. A file downloads automatically (e.g. `summer-shine-3-xxxx.json`)
6. **Rename it to `credentials.json`**
7. **Place it in the project folder** (same folder as `server.js`)

> ⚠️ Keep this file private — do NOT share it or commit it to Git.

---

## Step 5 — Create Your Google Sheet

1. Go to [https://sheets.google.com](https://sheets.google.com)
2. Create a **new blank spreadsheet**
3. Name it **"Funfinity Summer Camp Registrations"**
4. Leave the first tab as-is (headers will be written automatically)

---

## Step 6 — Share the Sheet with the Service Account

1. Open your `credentials.json` file — find the `"client_email"` field
   - It will look like: `summer-shine-sheets@your-project.iam.gserviceaccount.com`
2. In Google Sheets, click **Share** (top right)
3. Paste that service account email into the share box
4. Set permission to **Editor**
5. Click **Send**

---

## Step 7 — Get Your Spreadsheet ID

1. Look at the URL of your Google Sheet:
   ```
   https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit
   ```
2. Copy the long ID between `/d/` and `/edit`:
   ```
   1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
   ```

---

## Step 8 — Enable in sheets-config.js

Open `sheets-config.js` in the project folder and update it:

```js
module.exports = {
  ENABLED: true,                                    // ← change to true
  SPREADSHEET_ID: 'PASTE_YOUR_SHEET_ID_HERE',       // ← paste your Sheet ID
  SHEET_NAME: 'All Registrations',
};
```

---

## Step 9 — Restart the Server

Stop the server (Ctrl+C) and restart:
```
node server.js
```

You should see this in the console:
```
[Sheets] ✔ Google Sheets API connected
```

---

## ✅ What Happens After Setup

| Event | Google Sheets |
|---|---|
| New registration submitted | Row appended to **All Registrations** + correct zone tab |
| Registration edited in admin | An **[UPDATED]** row is appended as an audit trail |
| Registration deleted in admin | No change in Sheets (Sheets is the permanent log) |

> The SQLite database remains the **authoritative source** for the admin dashboard.
> Google Sheets is a live mirror for easy sharing and reporting.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `credentials.json not found` | Make sure the file is in the project root folder |
| `SPREADSHEET_ID not set` | Check `sheets-config.js` — ENABLED must be `true` and ID must be filled |
| Rows not appearing | Check the service account email was shared as **Editor** on the sheet |
| `insufficient permissions` | Re-share the sheet with the service account as Editor |
| Console error on startup | Check your `credentials.json` is valid and not corrupted |
