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

  log.info("✅ Bot is ready! Tag @%s in a group chat to interact.", config.botName);
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
