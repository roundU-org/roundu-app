import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function buildPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
  };
}

export function sendSuccess<T>(res: Response, data: T, message?: string): Response {
  const body: Record<string, unknown> = { success: true, data };
  if (message) body.message = message;
  return res.status(200).json(body);
}

export function sendCreated<T>(res: Response, data: T, message?: string): Response {
  const body: Record<string, unknown> = { success: true, data };
  if (message) body.message = message;
  return res.status(201).json(body);
}

export function sendPaginated<T>(res: Response, data: T[], meta: PaginationMeta): Response {
  return res.status(200).json({ success: true, data, meta });
}

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  return res.status(status).json({
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  });
}
