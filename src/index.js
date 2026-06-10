import http from "http";
import config from "./config.js";
import { loginFacebook } from "./services/facebook.js";
import { cleanupSessions } from "./services/gemini.js";
import { loadCommands } from "./commands/index.js";
import { handleMessage } from "./handlers/message.js";
import { handleEvent } from "./handlers/event.js";
import { createLogger } from "./utils/logger.js";

const log = createLogger("main");

/**
 * ┌─────────────────────────────────────────────┐
 * │  Messenger Bot — Powered by Google Gemini   │
 * └─────────────────────────────────────────────┘
 */
async function main() {
  log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log.info("🤖 Messenger Bot — Starting up...");
  log.info("   Model: %s (fallback: %s)", config.geminiModel, config.geminiFallbackModel);
  log.info("   Bot name: %s", config.botName);
  log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Step 1: Load commands
  await loadCommands();

  // Step 2: Login to Facebook
  let api;
  try {
    api = await loginFacebook();
  } catch (err) {
    log.error("Failed to start: %s", err.message);
    process.exit(1);
  }

  // Step 3: Start listening for events
  log.info("👂 Listening for messages...");

  api.listen((err, event) => {
    if (err) {
      log.error("Listen error: %s", err.message || err);

      // If the error is fatal (e.g., session expired), exit
      if (err.error === "Not logged in" || err.type === "close") {
        log.error("Fatal: Session closed. Exiting...");
        process.exit(1);
      }
      return;
    }

    // Route to appropriate handler
    switch (event.type) {
      case "message":
      case "message_reply":
        handleMessage(api, event).catch((err) => {
          log.error("Unhandled message handler error: %s", err.message);
        });
        break;

      case "event":
        handleEvent(api, event).catch((err) => {
          log.error("Unhandled event handler error: %s", err.message);
        });
        break;

      default:
        log.debug("Ignored event type: %s", event.type);
    }
  });

  // Step 4: Periodic cleanup of expired Gemini sessions
  setInterval(() => {
    cleanupSessions();
  }, 5 * 60 * 1000); // Every 5 minutes

  // Step 5: Start HTTP health-check server (required for Render free tier)
  startKeepAliveServer();

  log.info("✅ Bot is ready! Tag @%s in a group chat to interact.", config.botName);
}

// ─── HTTP Keep-Alive Server ───
// Render free tier requires an HTTP listener and spins down after 15 min idle.
// This minimal server provides a /health endpoint for uptime monitors.
function startKeepAliveServer() {
  const startTime = Date.now();

  const server = http.createServer((req, res) => {
    if (req.url === "/health" || req.url === "/") {
      const uptime = Math.floor((Date.now() - startTime) / 1000);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: "ok",
        bot: config.botName,
        uptime: `${uptime}s`,
        timestamp: new Date().toISOString(),
      }));
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  server.listen(config.port, () => {
    log.info("🌐 Keep-alive server running on port %d", config.port);
    log.info("   Health check: http://localhost:%d/health", config.port);
  });

  // Self-ping every 13 minutes to prevent Render's 15-min idle spin-down
  if (process.env.RENDER_EXTERNAL_URL) {
    const pingUrl = `${process.env.RENDER_EXTERNAL_URL}/health`;
    setInterval(async () => {
      try {
        await fetch(pingUrl);
        log.debug("Self-ping OK → %s", pingUrl);
      } catch (err) {
        log.warn("Self-ping failed: %s", err.message);
      }
    }, 13 * 60 * 1000); // Every 13 minutes
    log.info("🔄 Self-ping enabled → %s (every 13 min)", pingUrl);
  }
}

// ─── Global error handlers ───
process.on("uncaughtException", (err) => {
  log.error("Uncaught exception: %s", err.message);
  log.error(err.stack);
});

process.on("unhandledRejection", (reason) => {
  log.error("Unhandled rejection: %s", reason);
});

// ─── Graceful shutdown ───
function shutdown(signal) {
  log.info("Received %s. Shutting down gracefully...", signal);
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ─── Start the bot ───
main().catch((err) => {
  log.error("Fatal startup error: %s", err.message);
  process.exit(1);
});
