import type { NextFunction, Request, Response } from 'express';

// Global error handler that avoids leaking implementation details
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // TODO: hook into winston logger; keep this minimal for now
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return res.status(500).json({ error: 'Something went wrong' });
}


