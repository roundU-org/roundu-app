import cors, { CorsOptions } from 'cors';
import { env } from '../config/env';

export function corsMiddleware() {
  const allowAll = env.corsOrigins.includes('*');
  const options: CorsOptions = {
    origin: (env.isDevelopment || allowAll)
      ? true
      : (origin, cb) => {
          if (!origin) return cb(null, true);
          if (env.corsOrigins.includes(origin)) return cb(null, true);
          return cb(new Error(`Origin ${origin} not allowed by CORS`));
        },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 600,
  };
  return cors(options);
}
