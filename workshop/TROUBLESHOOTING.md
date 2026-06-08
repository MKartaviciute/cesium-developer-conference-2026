# Troubleshooting Guide

This guide covers issues that are likely to affect workshop participants, particularly in a conference setting with 40+ people on shared Wi-Fi.

---

## Quick diagnostics checklist

Run these commands before the workshop starts to catch most problems early:

```bash
node --version      # must be v22.x.x or higher
pnpm --version      # must be 9.15.5 (or close)
```

Then from your lab folder:

```bash
cd workshop/lab1_lab2
pnpm install
pnpm dev
```

Open http://localhost:3000 — if the globe loads, you're good.

---

## Table of contents

1. [Port already in use](#1-port-already-in-use)
2. [pnpm not found after install](#2-pnpm-not-found-after-install)
3. [PowerShell execution policy (Windows)](#3-powershell-execution-policy-windows)
4. [Windows MAX_PATH limit (ENAMETOOLONG)](#4-windows-max_path-limit-enametoolong)
5. [Slow or failing pnpm install (conference Wi-Fi)](#5-slow-or-failing-pnpm-install-conference-wi-fi)
6. [API rate limits (OpenAI / Anthropic)](#6-api-rate-limits-openai--anthropic)
7. [Overpass API rate limiting](#7-overpass-api-rate-limiting)
8. [.env file not found or not filled in](#8-env-file-not-found-or-not-filled-in)
9. [API key invalid or trailing whitespace](#9-api-key-invalid-or-trailing-whitespace)
10. [CRLF line endings in .env (Windows Notepad)](#10-crlf-line-endings-in-env-windows-notepad)
11. [Node.js version too old](#11-nodejs-version-too-old)
12. [Running npm install instead of pnpm install](#12-running-npm-install-instead-of-pnpm-install)
13. [Wrong working directory for pnpm install](#13-wrong-working-directory-for-pnpm-install)
14. [MCP server status bar stays red](#14-mcp-server-status-bar-stays-red)
15. [WebGL disabled or not supported](#15-webgl-disabled-or-not-supported)
16. [Corporate proxy blocking npm/pnpm registry](#16-corporate-proxy-blocking-npmpnpm-registry)
17. [Antivirus interfering with node_modules](#17-antivirus-interfering-with-node_modules)
18. [Cannot find module / missing packages](#18-cannot-find-module--missing-packages)
19. [pnpm version mismatch between lab folders](#19-pnpm-version-mismatch-between-lab-folders)
20. [Low RAM — Next.js dev server killed](#20-low-ram--nextjs-dev-server-killed)

---

## 1. Port already in use

**Symptom:** Starting the app shows `EADDRINUSE: address already in use :::3000` (or `3001`, `3002`).

**Cause:** Another process is already listening on that port. Common culprits:
- A previous workshop session left a server running.
- Another Next.js / Node project is running.
- A corporate agent or proxy on port 3000.

**Fix:**

```bash
# Kill all three workshop ports at once
npx kill-port 3000 3001 3002
```

Or find and kill the specific process manually:

```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# macOS / Linux
lsof -ti:3000 | xargs kill -9
```

Then restart the app.

---

## 2. pnpm not found after install

**Symptom:** `pnpm: command not found` or `pnpm : The term 'pnpm' is not recognized` — even after running `npm install -g pnpm@9.15.5`.

**Cause:** The global npm bin directory is not on the system `PATH`, or the terminal was not restarted after install.

**Fix:**

1. Close and reopen the terminal completely (not just a new tab).
2. If still missing, check where npm installs global packages:

   ```bash
   npm config get prefix
   # e.g. C:\Users\YourName\AppData\Roaming\npm
   ```

3. Make sure that path + `\` is in your `PATH` environment variable.
   - **Windows:** Search for "Edit environment variables" → User variables → `Path` → Add the npm prefix path.
   - **macOS/Linux:** Add `export PATH="$(npm config get prefix)/bin:$PATH"` to `~/.zshrc` or `~/.bashrc`, then `source` it.

4. Verify:

   ```bash
   pnpm --version
   # expected: 9.15.5
   ```

---

## 3. PowerShell execution policy (Windows)

**Symptom:** Running `pnpm` in PowerShell shows:

```
pnpm.ps1 cannot be loaded because running scripts is disabled on this system.
```

**Cause:** Windows PowerShell blocks `.ps1` scripts by default on some corporate machines. pnpm installs a `.ps1` shim that triggers this policy.

**Fix (no admin required):**

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Then reopen the terminal and try `pnpm --version` again.

**Alternative:** Use Command Prompt (`cmd.exe`) or Git Bash instead of PowerShell — the `.cmd` shim is not affected by execution policy.

---

## 4. Windows MAX_PATH limit (ENAMETOOLONG)

**Symptom:** `pnpm install` fails with `ENAMETOOLONG` or files silently fail to copy. More likely if the project is in a deeply nested folder like `C:\Users\YourName\Documents\Conferences\2026\cesium-workshop\...`.

**Cause:** Windows has a default 260-character path limit. pnpm workspace `node_modules` paths can exceed this.

**Check:**

```powershell
(Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem").LongPathsEnabled
# 0 = disabled (problem), 1 = enabled (ok)
```

**Fix (requires admin):**

```powershell
# Run PowerShell as Administrator
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1
```

**Fix (no admin) — move the project to a shorter path:**

```bash
# Move the repo to a short root path, e.g.:
C:\ws\cesium-workshop\
```

---

## 5. Slow or failing pnpm install (conference Wi-Fi)

**Symptom:** `pnpm install` takes 10–20 minutes or times out. The CesiumJS + Next.js + AI SDK dependency tree downloads ~400–600 MB.

**Cause:** 40 people installing simultaneously on shared conference Wi-Fi saturates the network.

**Prevention (do this at home before the conference):**

```bash
cd workshop/lab1_lab2
pnpm install

cd ../lab3_lab4
pnpm install
```

Running install ahead of time populates the local pnpm cache (`~/.pnpm-store`). Subsequent installs — even on a fresh clone — will be near-instant because packages are hard-linked from cache.

**Fix during the conference:**

If install stalls, cancel with `Ctrl+C` and retry:

```bash
pnpm install --prefer-offline
```

This uses cached packages and only downloads what is truly missing.

---

## 6. API rate limits (OpenAI / Anthropic)

**Symptom:** AI responses return `429 Too Many Requests` or `Rate limit exceeded`.

**Cause:** 40 participants sharing one API key will quickly exhaust per-minute token (TPM) and request (RPM) limits on standard tiers.

**Fix:**
- Alternatively, deploy a lightweight proxy/gateway that fans out a high-limit key to participants — the `AI_BASE_URL` field in `.env` exists exactly for this. Participants keep their own `.env` pointing at the proxy; the proxy holds the real key.
- If you see 429s mid-workshop, wait 60 seconds and retry — limits reset per minute. Use different models to spread the load — try `gpt-5.1` instead of the default model by setting `AI_MODEL=gpt-5.1` in your `.env`.

---

## 7. Overpass API rate limiting

**Symptom:** POI searches return no results or a `429` / `too many requests` error from `overpass-api.de`.

**Cause:** The Overpass public API enforces per-IP and global rate limits. 40 people on the same conference IP hitting it simultaneously triggers throttling.

**Fix — switch to the mock Overpass file:**

Each lab folder ships a `mock-overpass.ts` drop-in replacement that returns real POI names and coordinates for **Paris, Barcelona, Rome, and Tokyo** without hitting the network.

**For Labs 1 & 2 / Labs 3 & 4** (`packages/mcp-poi`):

Open `packages/mcp-poi/src/tools/poi-tools.ts` and change the import:

```ts
// Before (real API)
import { searchPois } from "../overpass.js";

// After (mock)
import { searchPois } from "../mock-overpass.js";
```

**For Lab 4 MCPs** (`lab4_mcps/mcp-overpass`):

Open `lab4_mcps/mcp-overpass/src/tools/query-osm-features.ts` and change the import:

```ts
// Before (real API)
import { queryOverpass } from "../overpass.js";

// After (mock)
import { queryOverpass } from "../mock-overpass.js";
```

Save the file — the dev server will hot-reload automatically. No other code changes are needed; both mock files export the same function signature as the originals.

> [!NOTE]
> The mock returns data for the four cities used in lab prompts. For any other location it scatters plausible-sounding names around the requested coordinates.

**Alternative:** Space out queries — have participants stagger their testing so the shared IP isn't hammered simultaneously.

---

## 8. .env file not found or not filled in

**Symptom:** App starts but AI chat returns an error like `Missing environment variable OPENAI_API_KEY` or crashes silently.

**Cause:** The `.env.example` file was never copied to `.env`, or `.env` was left with empty values.

**Fix:**

```bash
cd workshop/lab1_lab2

# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Then open `.env` in VS Code and fill in at minimum `OPENAI_API_KEY`.

> [!NOTE]
> Make sure you're editing `.env`, not `.env.example`. Both files will appear in the VS Code Explorer.

---

## 9. API key invalid or trailing whitespace

**Symptom:** AI returns `401 Unauthorized` or `Invalid API key` even though the key looks correct.

**Common causes:**

- The key was split across two sources (email + gist) and not concatenated correctly.
- There is a space or quote character around the key in `.env`.
- The key was copied with a trailing newline.

**Fix:**

Open `.env` and verify:

```
# WRONG — has quotes
OPENAI_API_KEY="sk-abc123..."

# WRONG — has a leading space
OPENAI_API_KEY= sk-abc123...

# CORRECT
OPENAI_API_KEY=sk-abc123...
```

If assembling from two parts (email + gist): concatenate with no spaces, no newline, no quotes between them.

---

## 10. CRLF line endings in .env (Windows Notepad)

**Symptom:** API key appears correct but auth still fails. The key value includes a hidden `\r` character at the end.

**Cause:** Windows Notepad saves files with CRLF (`\r\n`) line endings. Some dotenv parsers treat `\r` as part of the value, silently corrupting the key.

**Fix:** Edit `.env` in VS Code (not Notepad). VS Code handles line endings correctly.

To check and fix in VS Code:
- Look at the bottom-right status bar — it will show `CRLF` or `LF`.
- Click `CRLF` and switch to `LF`, then save.

---

## 11. Node.js version too old

**Symptom:** Build errors mentioning unsupported syntax, missing APIs, or the dev server crashes immediately.

**Check:**

```bash
node --version
# must be v22.x.x or higher
```

**Fix:**

Download and install Node.js LTS (22+) from [nodejs.org](https://nodejs.org/).

If you use `nvm` (Node Version Manager):

```bash
nvm install 22
nvm use 22
node --version
```

---

## 12. Running npm install instead of pnpm install

**Symptom:** Dependencies install but the app fails to start with workspace resolution errors, or packages from `packages/mcp-poi` are not found.

**Cause:** `npm` does not understand pnpm workspaces (`pnpm-workspace.yaml`). Running `npm install` creates a `package-lock.json` and ignores the workspace setup entirely.

**Fix:**

1. Delete the incorrectly created files:

   ```bash
   # From the lab folder (e.g. workshop/lab1_lab2)
   Remove-Item -Recurse -Force node_modules    # Windows PowerShell
   Remove-Item package-lock.json               # Windows PowerShell

   # macOS / Linux
   rm -rf node_modules package-lock.json
   ```

2. Install correctly:

   ```bash
   pnpm install
   ```

> [!WARNING]
> **Coming from the CesiumGS workshop?** That workshop uses `npm`. Do **not** run `npm install` in this workshop's folders.

---

## 13. Wrong working directory for pnpm install

**Symptom:** `pnpm install` runs but installs nothing, or shows `No projects matched the filters`.

**Cause:** Install was run from the repository root (`cesium-developer-conference-2026/`) instead of the lab folder.

**Fix:** Always run install from the lab folder:

```bash
cd workshop/lab1_lab2
pnpm install

# or for labs 3 & 4:
cd workshop/lab3_lab4
pnpm install
```

---

## 14. MCP server status bar stays red

**Symptom:** The app loads but the status bar in the bottom-left of the UI stays red (MCP not connected).

**Causes and fixes:**

| Cause | Fix |
|---|---|
| MCP server not started yet | Start it — see [Running the apps](README.md#running-the-apps). |
| MCP server crashed on startup | Check the MCP server terminal panel for errors. Usually a missing `.env` or a port conflict on 3001/3002. |
| Started too quickly | Wait ~5 seconds after startup for the health check to pass. |
| Opened Lab 1 with "Start everything" | In Lab 1 the POI server has no tools — expected to error. Use **Lab 1 & 2: App (port 3000)** task instead. |

---

## 15. WebGL disabled or not supported

**Symptom:** The Cesium globe is blank or shows an error like `CesiumWidget constructor error: WebGL is not supported` or `Failed to create WebGL context`.

**Cause:** WebGL 2 is required by CesiumJS. Some corporate-managed browsers disable it via policy.

**Check in Chrome/Edge:**

Navigate to `chrome://gpu` (or `edge://gpu`) and look for:
- `WebGL: Hardware accelerated` ✅
- `WebGL2: Hardware accelerated` ✅

If it shows `Software only` or `Disabled`, WebGL is blocked.

**Fix:**

- Try a different browser (Firefox, Chrome, Edge — whichever is not managed by IT policy).
- If all browsers are policy-managed, ask IT to whitelist WebGL for the session.
- As a last resort, try enabling software rendering in Chrome: add `--enable-unsafe-webgl` to the Chrome shortcut (not recommended for security, workshop use only).

---

## 16. Corporate proxy blocking npm/pnpm registry

**Symptom:** `pnpm install` hangs or fails with `ETIMEDOUT`, `ECONNREFUSED`, or `certificate verify failed`.

**Cause:** A corporate proxy or firewall is intercepting HTTPS traffic to `registry.npmjs.org`.

**Fix:**

```bash
# Set proxy for npm/pnpm
npm config set proxy http://your-proxy:port
npm config set https-proxy http://your-proxy:port

# If using a self-signed corporate certificate:
npm config set strict-ssl false   # only as a last resort in a workshop setting
```

Ask your IT department for the proxy address, or use your phone's mobile hotspot as a workaround.

---

## 17. Antivirus interfering with node_modules

**Symptom:** `pnpm install` is very slow (10+ minutes), files randomly fail to write, or `ENOENT` errors appear mid-install on files that should exist.

**Cause:** Real-time antivirus scanning intercepts every file write into `node_modules` (tens of thousands of files).

**Fix:**

Add the project folder and the pnpm store to your antivirus exclusions:

- **Windows Defender:** Settings → Windows Security → Virus & threat protection → Exclusions → Add the folder `workshop\lab1_lab2\node_modules` and `%LOCALAPPDATA%\pnpm\store`.
- **macOS / Linux:** Add `workshop/lab1_lab2/node_modules` and the pnpm store (`$(pnpm store path)`) to your AV exclusions or trusted paths.
- **Other AV:** Consult product documentation for exclusion/whitelist settings.

---

## 18. Cannot find module / missing packages

**Symptom:** TypeScript errors or runtime crashes like `Cannot find module '@ai-sdk/anthropic'` or `Module not found`.

**Causes and fixes:**

| Cause | Fix |
|---|---|
| `pnpm install` was never run | Run `pnpm install` from the lab folder. |
| Install ran but from wrong directory | See [issue 13](#13-wrong-working-directory-for-pnpm-install). |
| `npm install` was run instead of `pnpm install` | See [issue 12](#12-running-npm-install-instead-of-pnpm-install). |
| node_modules was deleted | Re-run `pnpm install`. |

---

## 19. pnpm version mismatch between lab folders

**Symptom:** Warning during install: `ERR_PNPM_BAD_PM_VERSION This project is configured to use v9.15.5 of pnpm`.

**Cause:** A different version of pnpm is active than the one pinned in the workspace.

**Fix:**

```bash
# Install the exact pinned version
npm install -g pnpm@9.15.5

# Verify
pnpm --version
# expected: 9.15.5
```

---

## 20. Low RAM — Next.js dev server killed

**Symptom:** The dev server starts then suddenly stops with no error, or the terminal shows `Killed` (Linux/macOS) or a process exit with code `1`.

**Cause:** Next.js dev mode with TypeScript + CesiumJS can use 1.5–2 GB of RAM during the initial compile. On machines with 4 GB or less, the OS OOM-killer may terminate it.

**Fix:**

- Close other applications (especially browsers with many tabs, Slack, Teams) before running the dev server.
- If on macOS, check Activity Monitor → Memory Pressure; on Windows, check Task Manager → Memory.
- Minimum recommended: **8 GB RAM**.

If you are at or below 4 GB with no way to free memory, try running just one lab folder at a time and closing VS Code's language server extensions temporarily.

---

## Still stuck?

Ask a workshop facilitator. For post-workshop questions, use the [Cesium Community Forum](https://community.cesium.com).
