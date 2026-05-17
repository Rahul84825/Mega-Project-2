const timestamp = () => new Date().toISOString();

const serializeMeta = (meta) => {
  if (meta === undefined || meta === null) {
    return "";
  }

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch (_error) {
    return " [unserializable meta]";
  }
};

export const logger = {
  info(message, meta) {
    console.log(`[INFO] ${timestamp()} ${message}${serializeMeta(meta)}`);
  },
  warn(message, meta) {
    console.warn(`[WARN] ${timestamp()} ${message}${serializeMeta(meta)}`);
  },
  error(message, meta) {
    console.error(`[ERROR] ${timestamp()} ${message}${serializeMeta(meta)}`);
  }
};

// Backwards-compatible debug logger. Use console.debug when available; fall back to console.log.
logger.debug = (message, meta) => {
  if (process.env.NODE_ENV === "production") {
    // In production, keep debug no-op to avoid verbose logs unless explicitly enabled
    return;
  }

  if (typeof console.debug === "function") {
    console.debug(`[DEBUG] ${timestamp()} ${message}${serializeMeta(meta)}`);
  } else {
    console.log(`[DEBUG] ${timestamp()} ${message}${serializeMeta(meta)}`);
  }
};