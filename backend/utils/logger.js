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