const winston = require("winston");
const config = require("../config.js");

const { combine, timestamp, printf, colorize, errors, splat } = winston.format;

/**
 * Custom log format: [timestamp] LEVEL module: message
 */
const logFormat = printf(({ level, message, timestamp, module, ...rest }) => {
  const mod = module ? ` [${module}]` : "";
  const extra = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
  return `${timestamp} ${level}${mod}: ${message}${extra}`;
});

const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(
    errors({ stack: true }),
    splat(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  transports: [
    // Console with colors
    new winston.transports.Console({
      format: combine(colorize(), splat(), logFormat),
    }),
    // File for errors
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
    }),
    // File for all logs
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
});

/**
 * Create a child logger tagged with a module name.
 * Usage: const log = createLogger("facebook");
 *        log.info("Connected!");
 */
function createLogger(moduleName) {
  return logger.child({ module: moduleName });
}

module.exports = { createLogger, default: logger };
