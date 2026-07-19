type Fields = Record<string, unknown>;
type LogInput = string | Fields;

export type Logger = {
  child(fields: Fields): Logger;
  error(input: LogInput, message?: string): void;
  warn(input: LogInput, message?: string): void;
};

function createLogger(context: Fields = {}): Logger {
  const write = (level: "error" | "warn", input: LogInput, message?: string) => {
    const text = typeof input === "string" ? input : (message ?? level);
    const fields = typeof input === "string" ? context : { ...context, ...input };
    console[level](text, fields);
  };

  return {
    child: (fields) => createLogger({ ...context, ...fields }),
    error: (input, message) => write("error", input, message),
    warn: (input, message) => write("warn", input, message),
  };
}

export const logger = createLogger();
