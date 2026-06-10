# 🤖 Messenger Bot — Powered by Google Gemini

An AI bot for Facebook Messenger group chats, using Google Gemini to answer questions, remember information, and support your group.

## ✨ Features

- **🧠 Smart AI** — Answers questions using Google Gemini (3.1 Flash Lite + fallback 2.5 Flash Lite)
- **📌 Read Pinned Messages** — Summarizes the content of pinned messages when asked
- **💾 Memorization** — Remembers important information (meetings, deadlines, etc.) when requested
- **🔔 Reminders** — Recalls memorized information when asked
- **💬 Vietnamese Support** — Communicates naturally in Vietnamese (the bot's system prompt is optimized for Vietnamese)
- **⏱️ Conversation Memory** — Remembers conversation context per chat thread

---

## 📋 System Requirements

| Requirement | Details |
|---|---|
| **Node.js** | Version **18** or higher — [Download here](https://nodejs.org/) |
| **Git** | To clone the project — [Download here](https://git-scm.com/) |
| **Facebook Account** | A **test/secondary account** is recommended (risk of being locked/banned if using a main account) |
| **Google Gemini API Key** | Free — [Get it here](https://aistudio.google.com/) |
| **Chrome/Edge Browser** | To install the extension for exporting Facebook cookies |

---

## 🚀 Installation Guide (Step-by-Step)

### Step 1 — Clone the project and install dependencies

Open **Terminal** (or **Command Prompt** / **PowerShell** on Windows):

```bash
git clone https://github.com/GitGud031005/messenger-bot.git
cd messenger-bot
npm install
```

> ✅ If you see `added XXX packages` → successful.
> ❌ If you get `node: command not found` error → Node.js is not installed, [download here](https://nodejs.org/).

---

### Step 2 — Get Google Gemini API Key

1. Go to **[Google AI Studio](https://aistudio.google.com/)**
2. Log in with your Google account
3. Click **"Get API Key"** (or **"Create API Key"**)
4. Click **"Create API key in new project"**
5. **Copy the API key** (looks like `AIzaSy...`) — save it for Step 4

> 💡 The API key is free with daily usage limits, which is sufficient for small group chats.

---

### Step 3 — Get AppState (Facebook Login Cookie)

AppState is a file containing your Facebook login session cookies, allowing the bot to "log in" without needing an email or password.

#### 3.1 — Install the C3C UFC Utility extension

1. Open **Chrome** or **Edge** browser
2. Go to the [Chrome Web Store](https://chromewebstore.google.com/) and search for **"C3C UFC Utility"**
3. Click **"Add to Chrome"** → **"Add extension"**

> ⚠️ If you cannot find it on the Chrome Web Store, search for "C3C UFC Utility github" on Google to install it manually.

#### 3.2 — Export Facebook cookies

1. Open a new tab → Go to [facebook.com](https://www.facebook.com)
2. **Log in with the Facebook account** you want the bot to use
3. After logging in successfully, click the **C3C UFC Utility extension icon** in the top right corner of the browser
4. Click the **"Export"** button
5. A JSON file will be downloaded

#### 3.3 — Place the file in the project

1. **Rename** the downloaded file to `appstate.json`
2. **Move** the file to the **root directory** of the project:

```
messenger-bot/
├── appstate.json   ← PLACE FILE HERE
├── package.json
├── src/
└── ...
```

> 🔒 **SECURITY:** The `appstate.json` file contains your Facebook session. Anyone with this file can access your Facebook account. **NEVER** share this file. The file has been added to `.gitignore` so it won't be pushed to GitHub.

---

### Step 4 — Configure the .env file

#### 4.1 — Create the .env file

**Windows (Command Prompt):**
```cmd
copy .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

#### 4.2 — Edit the .env file

Open the `.env` file with any text editor (VS Code, Notepad, etc.) and modify the values:

```env
# ──────────────────────────────────────────────
# Google Gemini
# ──────────────────────────────────────────────
GEMINI_API_KEY=AIzaSy...paste_your_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_FALLBACK_MODEL=gemini-2.5-flash-lite

# ──────────────────────────────────────────────
# Bot Configuration
# ──────────────────────────────────────────────
BOT_NAME=BotDisplayName
# Cooldown in seconds between commands per user
COOLDOWN_SECONDS=5
# Chat memory expiry in minutes (per thread)
MEMORY_EXPIRY_MINUTES=30

# ──────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────
LOG_LEVEL=info
```

**Variable Explanations:**

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | API key from Google AI Studio (Step 2) |
| `GEMINI_MODEL` | No | Primary AI model (default: `gemini-3.1-flash-lite`) |
| `GEMINI_FALLBACK_MODEL` | No | Fallback model when the primary fails (default: `gemini-2.5-flash-lite`) |
| `BOT_NAME` | No | Display name in logs (default: `GeminiBot`) |
| `COOLDOWN_SECONDS` | No | Cooldown time in seconds between commands (default: `5` seconds) |
| `MEMORY_EXPIRY_MINUTES` | No | Conversation context memory duration (default: `30` minutes) |
| `LOG_LEVEL` | No | Logging level: `error`, `warn`, `info`, `debug` (default: `info`) |

---

### Step 5 — Run the bot (Locally)

```bash
# Development Mode (auto-restarts when files change)
npm run dev

# Production Mode
npm start
```

**When the bot starts successfully, you will see:**
```
2026-06-10 15:00:00 info [main]: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2026-06-10 15:00:00 info [main]: 🤖 Messenger Bot — Starting up...
2026-06-10 15:00:00 info [commands]: Loaded command: /ai
2026-06-10 15:00:00 info [commands]: Loaded command: /help
2026-06-10 15:00:00 info [commands]: Loaded command: /ping
2026-06-10 15:00:01 info [facebook]: ✅ Logged in successfully! Bot user ID: 100xxx
2026-06-10 15:00:01 info [main]: 👂 Listening for messages...
2026-06-10 15:00:01 info [main]: ✅ Bot is ready!
```

> 💡 Press `Ctrl + C` to stop the bot.

---

## ☁️ Deploy to Cloud for Free (Render.com)

If you want the bot to run 24/7 without keeping your computer on, deploy it to Render.

### Step 1 — Encode AppState to Base64

On cloud servers, you cannot directly upload the `appstate.json` file. Instead, encode it into a Base64 string and set it as an environment variable.

Run the following command in the project directory (ensure `appstate.json` exists in the root):

```bash
node scripts/encode-appstate.js
```

**A long string will be outputted. Copy the entire string.**

### Step 2 — Push Code to GitHub

```bash
git add -A
git commit -m "deploy to render"
git push origin main
```

> ⚠️ Ensure `appstate.json` and `.env` are **NOT** pushed (they are already included in `.gitignore`).

### Step 3 — Create a Render Account

1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up using **GitHub** (recommended/easiest)

### Step 4 — Create a New Web Service

1. On the Dashboard, click **"New +"** → select **"Web Service"**
2. Choose **"Build and deploy from a Git repository"** → **Next**
3. Find and select your **`messenger-bot`** repository → **Connect**

### Step 5 — Configure the Service

Fill in the configuration details as follows:

| Field | Value |
|---|---|
| **Name** | `messenger-bot` (or any name you prefer) |
| **Region** | `Singapore` (closest to Vietnam) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

### Step 6 — Add Environment Variables

Scroll down to the **"Environment Variables"** section and click **"Add Environment Variable"** for each of the following:

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | Your Google AI Studio API key |
| `APPSTATE_BASE64` | The Base64 string copied from Step 1 |
| `BOT_NAME` | Bot display name (e.g., `GeminiBot`) |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` |
| `GEMINI_FALLBACK_MODEL` | `gemini-2.5-flash-lite` |

> 💡 The `RENDER_EXTERNAL_URL` variable is automatically provided by Render. The bot uses it to self-ping and prevent the service from spinning down.

### Step 7 — Deploy!

1. Click **"Create Web Service"**
2. Render will automatically build and deploy the application
3. Wait for the logs to show **"✅ Bot is ready!"** → The bot is online!
4. Visit the service URL (e.g., `https://messenger-bot-xxxx.onrender.com/health`) to verify status

---

## 💬 How to Use

### Mention the Bot in Group Chats

Open the Messenger group chat where the bot account is added, mention (tag) the bot, and ask:

```
@BotName what is the weather like today?
@BotName remember that we have a meeting tomorrow at 9 AM
@BotName what are the deadlines for this week?
@BotName read the pinned messages please
```

### Prefix Commands (Using `/`)

| Command | Description | Example |
|---|---|---|
| `/ai <question>` | Ask the AI anything | `/ai tell a joke` |
| `/help` | View the list of commands | `/help` |
| `/ping` | Check if the bot is responsive | `/ping` |

### Aliases (Shortcuts)

| Alias | Equivalent to |
|---|---|
| `/hỏi` | `/ai` |
| `/ask` | `/ai` |
| `/menu` | `/help` |
| `/lệnh` | `/help` |
| `/p` | `/ping` |

### Memorization Feature

The bot will automatically memorize information when you use keywords like:

```
@Bot nhớ giùm là thứ 6 deadline nộp bài
@Bot ghi nhớ số điện thoại anh A là 0901234567
@Bot remind me lịch họp ngày mai lúc 2h chiều
```

And you can ask it to recall those reminders at any time:

```
@Bot deadline tuần này là gì?
@Bot nhắc lại số điện thoại anh A
```

---

## 🏗️ Project Structure

```
messenger-bot/
├── src/
│   ├── index.js              # Entry point + HTTP keep-alive server
│   ├── config.js             # Environment variables configuration
│   ├── commands/
│   │   ├── index.js          # Autoloads all commands
│   │   ├── ai.js             # /ai command — query Gemini AI
│   │   ├── help.js           # /help command — list available commands
│   │   └── ping.js           # /ping command — verify bot status
│   ├── handlers/
│   │   ├── message.js        # Handles incoming messages (mention & prefix routing)
│   │   └── event.js          # Handles group events (user join/leave)
│   ├── services/
│   │   ├── facebook.js       # Facebook login & session manager
│   │   └── gemini.js         # Gemini AI integration + conversation memory
│   └── utils/
│       ├── logger.js         # Winston logger (console + files)
│       ├── cooldown.js       # Anti-spam rate limiting
│       └── formatter.js      # Formats message responses for Messenger
├── scripts/
│   └── encode-appstate.js    # Encodes appstate.json to Base64
├── appstate.json             # Facebook session cookies (⚠️ DO NOT COMMIT!)
├── .env                      # API keys & configuration (⚠️ DO NOT COMMIT!)
├── .env.example              # Template file for environment variables
├── .gitignore                # Prevents committing sensitive files
├── package.json              # Project dependencies & scripts
└── README.md                 # This file
```

---

## ⚠️ Important Considerations

- **DO NOT** use your primary Facebook account — there is a significant risk of account suspension/ban.
- **DO NOT** commit `appstate.json` or `.env` to GitHub.
- **DO NOT** spam messages continuously — Facebook will flag and lock the account.
- The `@dongdev/fca-unofficial` library may stop working if Facebook changes its protocol.
- It is recommended to keep `COOLDOWN_SECONDS` at `5` or higher to avoid bot detection.
- The AppState (cookie) will expire over time — you will need to re-export it if login errors occur.

---

## 🔧 Troubleshooting Common Errors

| Error | Root Cause | Solution |
|---|---|---|
| `No appstate found` | Missing `appstate.json` or environment variable | Export cookies using C3C UFC Utility (see Step 3) |
| `Not logged in` | Cookies/session expired | Log back into Facebook → re-export `appstate.json` |
| `login-approval` | Facebook requires security verification (2FA/approvals) | Log in manually, approve the login, then re-export AppState |
| `Both models failed` | Invalid API key or quota exceeded | Check your API key at [AI Studio](https://aistudio.google.com/) |
| `Missing required environment variable` | Missing `.env` file or environment variables | Copy `.env.example` to `.env` and fill in all fields |
| Bot does not reply | Bot account is not in the group or incorrect tag | Add the bot account to the group, and tag its exact display name |
| `APPSTATE_BASE64` error on Render | Corrupted or truncated Base64 string | Run `node scripts/encode-appstate.js` again and copy the string carefully |
| Render service stopped | Reached free tier limit (750 free hours/month) | Wait for the next month or upgrade your Render plan |

---

## 📄 License

MIT
