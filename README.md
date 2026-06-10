# 🤖 Messenger Bot — Powered by Google Gemini

Bot AI cho nhóm chat Facebook Messenger, sử dụng Google Gemini để trả lời câu hỏi, ghi nhớ thông tin, và hỗ trợ nhóm bạn.

## ✨ Tính năng

- **🧠 AI thông minh** — Trả lời câu hỏi bằng Google Gemini (3.1 Flash Lite + fallback 2.5 Flash Lite)
- **📌 Đọc tin nhắn ghim** — Tóm tắt nội dung tin nhắn ghim khi được hỏi
- **💾 Ghi nhớ** — Nhớ các thông tin quan trọng (lịch hẹn, deadline, v.v.) khi được nhờ
- **🔔 Nhắc nhở** — Nhắc lại thông tin đã ghi nhớ khi được hỏi
- **💬 Tiếng Việt** — Giao tiếp tự nhiên bằng tiếng Việt
- **⏱️ Bộ nhớ hội thoại** — Nhớ ngữ cảnh cuộc trò chuyện theo từng thread

## 📋 Yêu cầu

- [Node.js](https://nodejs.org/) **v18+**
- Tài khoản Facebook (nên dùng tài khoản test)
- [Google Gemini API Key](https://aistudio.google.com/) (miễn phí)
- Extension **C3C UFC Utility** (Chrome/Edge/Firefox)

## 🚀 Cài đặt

### 1. Clone và cài dependencies

```bash
git clone <your-repo-url>
cd messenger-bot
npm install
```

### 2. Lấy Gemini API Key

1. Truy cập [Google AI Studio](https://aistudio.google.com/)
2. Tạo API key mới
3. Copy key

### 3. Lấy AppState (Cookie Facebook)

1. Cài extension **C3C UFC Utility** cho trình duyệt
2. Đăng nhập Facebook bằng **tài khoản bot** (KHÔNG dùng tài khoản chính!)
3. Bấm vào extension → **Export**
4. Lưu file thành `appstate.json` tại thư mục gốc của project

### 4. Cấu hình .env

```bash
cp .env.example .env
```

Mở file `.env` và điền thông tin:

```env
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_FALLBACK_MODEL=gemini-2.5-flash-lite
BOT_NAME=TênBotCủaBạn
```

### 5. Chạy bot

```bash
# Development (auto-restart khi thay đổi code)
npm run dev

# Production
npm start
```

## 💬 Cách sử dụng

### Tag bot trong nhóm chat

```
@TênBot hôm nay trời thế nào?
@TênBot nhớ giùm là mai họp lúc 9h sáng
@TênBot deadline tuần này là gì?
```

### Lệnh prefix

| Lệnh | Mô tả |
|---|---|
| `/ai <câu hỏi>` | Hỏi AI bất cứ điều gì |
| `/help` | Xem danh sách lệnh |
| `/ping` | Kiểm tra bot có đang hoạt động không |

### Aliases (lệnh tắt)

- `/hỏi` = `/ai`
- `/ask` = `/ai`
- `/menu` = `/help`
- `/lệnh` = `/help`
- `/p` = `/ping`

## 🏗️ Cấu trúc dự án

```
messenger-bot/
├── src/
│   ├── index.js              # Entry point
│   ├── config.js             # Cấu hình environment
│   ├── commands/
│   │   ├── index.js          # Auto-load commands
│   │   ├── ai.js             # Lệnh /ai
│   │   ├── help.js           # Lệnh /help
│   │   └── ping.js           # Lệnh /ping
│   ├── handlers/
│   │   ├── message.js        # Xử lý tin nhắn
│   │   └── event.js          # Xử lý sự kiện nhóm
│   ├── services/
│   │   ├── facebook.js       # Đăng nhập & quản lý session
│   │   └── gemini.js         # Tích hợp Gemini AI
│   └── utils/
│       ├── logger.js         # Logging với Winston
│       ├── cooldown.js       # Chống spam
│       └── formatter.js      # Format tin nhắn
├── appstate.json             # Cookie Facebook (KHÔNG COMMIT!)
├── .env                      # API keys (KHÔNG COMMIT!)
├── .env.example              # Template .env
├── .gitignore
├── package.json
└── README.md
```

## ☁️ Deploy miễn phí

### Render.com (Recommended)

1. Push code lên GitHub (đảm bảo `.gitignore` đã loại `appstate.json` và `.env`)
2. Tạo tài khoản [Render](https://render.com)
3. New → **Background Worker**
4. Connect GitHub repo
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Thêm Environment Variables:
   - `GEMINI_API_KEY` = your key
   - `GEMINI_MODEL` = gemini-3.1-flash-lite
   - `GEMINI_FALLBACK_MODEL` = gemini-2.5-flash-lite
   - `BOT_NAME` = TênBot
8. Với `appstate.json`: Encode nội dung thành base64, thêm env var `APPSTATE_BASE64`
   - Cần chỉnh code để đọc từ env var nếu file không tồn tại

### Railway.app (Alternative)

1. Tạo tài khoản [Railway](https://railway.app)
2. New Project → Deploy from GitHub
3. Thêm environment variables tương tự

## ⚠️ Lưu ý quan trọng

- **KHÔNG** dùng tài khoản Facebook chính — nguy cơ bị khóa tài khoản
- **KHÔNG** commit `appstate.json` hoặc `.env` lên GitHub
- **KHÔNG** gửi tin nhắn spam — Facebook sẽ khóa tài khoản
- Thư viện `fca-unofficial` có thể ngưng hoạt động khi Facebook cập nhật
- Nên giữ cooldown ≥ 5 giây để tránh bị phát hiện

## 🔧 Khắc phục lỗi

| Lỗi | Giải pháp |
|---|---|
| `appstate.json not found` | Xuất lại cookie bằng C3C UFC Utility |
| `Not logged in` | Session hết hạn → xuất lại appstate.json |
| `login-approval` | Facebook yêu cầu xác minh → đăng nhập thủ công rồi xuất lại |
| `Both models failed` | Kiểm tra API key và quota tại [AI Studio](https://aistudio.google.com/) |
| Bot không phản hồi | Kiểm tra bot có trong nhóm chat không, và đã tag đúng tên bot |

## 📄 License

MIT
