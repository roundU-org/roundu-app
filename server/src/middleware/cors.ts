import cors, { CorsOptions } from 'cors';
import { env } from '../config/env';

// Vercel generates a distinct preview URL per branch/PR/commit for this project
// (e.g. roundu-app-git-main-arjun-30s-projects.vercel.app), in addition to the
// production domain — allow all of them rather than listing each one.
const VERCEL_PREVIEW_ORIGIN = /^https:\/\/roundu-app(-[a-z0-9-]+)?\.vercel\.app$/;

export function corsMiddleware() {
  const allowAll = env.corsOrigins.includes('*');
  const options: CorsOptions = {
    origin: (env.isDevelopment || allowAll)
      ? true
      : (origin, cb) => {
          if (!origin) return cb(null, true);
          if (env.corsOrigins.includes(origin)) return cb(null, true);
          if (VERCEL_PREVIEW_ORIGIN.test(origin)) return cb(null, true);
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
