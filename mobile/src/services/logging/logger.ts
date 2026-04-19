type LoggerContext = Record<string, unknown> | undefined;

const serializeContext = (context?: LoggerContext) =>
  context ? ` ${JSON.stringify(context)}` : '';

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }

  return {
    message: typeof error === 'string' ? error : 'Unknown error',
    stack: undefined,
    name: 'UnknownError',
  };
};

export const logger = {
  info(message: string, context?: LoggerContext) {
    if (__DEV__) {
      console.log(`[SFC] ${message}${serializeContext(context)}`);
    }
  },

  warn(message: string, context?: LoggerContext) {
    console.warn(`[SFC] ${message}${serializeContext(context)}`);
  },

  error(message: string, context?: LoggerContext) {
    console.error(`[SFC] ${message}${serializeContext(context)}`);
  },

  captureException(error: unknown, context?: LoggerContext) {
    const normalized = normalizeError(error);
    console.error(
      `[SFC] ${normalized.name}: ${normalized.message}${serializeContext(context)}`,
      normalized.stack,
    );
  },
};
