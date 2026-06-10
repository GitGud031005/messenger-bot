const { createLogger } = require("../utils/logger.js");

const log = createLogger("handler:event");

/**
 * Handle non-message events (joins, leaves, reactions, etc.)
 * Currently logs events for debugging. Extend as needed.
 *
 * @param {object} api - FCA API instance
 * @param {object} event - Event object from FCA
 */
async function handleEvent(api, event) {
  switch (event.logMessageType) {
    case "log:subscribe":
      // Someone was added to the group
      log.info(
        "User(s) added to thread %s: %s",
        event.threadID,
        JSON.stringify(event.logMessageData?.addedParticipants?.map((p) => p.fullName))
      );
      break;

    case "log:unsubscribe":
      // Someone left or was removed from the group
      log.info(
        "User left/removed from thread %s: %s",
        event.threadID,
        event.logMessageData?.leftParticipantFbId
      );
      break;

    case "log:thread-name":
      // Group name was changed
      log.info(
        "Thread %s renamed to: %s",
        event.threadID,
        event.logMessageData?.name
      );
      break;

    default:
      log.debug("Unhandled event type: %s in thread %s", event.logMessageType, event.threadID);
  }
}

module.exports = { handleEvent };
