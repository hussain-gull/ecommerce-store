// Normalises a raw phone input to +92XXXXXXXXXX (Pakistani E.164).
// Accepts: 03XXXXXXXXX (11 digits), 923XXXXXXXXX (12 digits), +923XXXXXXXXX
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0"))
    return "+92" + digits.slice(1);
  if (digits.length === 12 && digits.startsWith("92")) return "+" + digits;
  return raw.trim();
}

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiResponseBody<T = unknown> = {
  success: true;
  statusCode: number;
  message: string;
  response: {
    data: T[];
    paginationMeta: PaginationMeta | null;
  };
};

export type ApiErrorBody = {
  success: false;
  statusCode: number;
  message: string;
  errors: ApiFieldError[];
};

export type ApiFieldError = {
  field: string | null;
  message: string;
};
