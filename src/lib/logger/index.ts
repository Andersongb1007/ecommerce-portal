import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isServer = typeof window === 'undefined';

const config = {
  level: isProduction ? 'info' : 'debug',
  redact: {
    paths: ['password', 'token', 'authorization', 'cookie', 'creditCard'],
    censor: '[REDACTED]',
  },
};

let loggerInstance: ReturnType<typeof pino>;

if (isServer) {
  loggerInstance = pino({
    ...config,
    transport: !isProduction
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  });
} else {
  loggerInstance = pino({
    level: config.level,
    browser: {
      asObject: true,
    },
  });
}

export const logger = loggerInstance;
