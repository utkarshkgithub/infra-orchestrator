import {env} from './env.js'
import pino from 'pino';

const isProduction = env.NODE_ENV === 'production';

export const logger = pino({
  level: isProduction ? 'warn' : 'debug',

  base: {
    service: 'backend',
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }),
});