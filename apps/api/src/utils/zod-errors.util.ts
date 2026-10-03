import { z } from "zod";
import { ApiFieldError } from "@ecommerce/contracts";

export const zodErrors = (err: z.ZodError): ApiFieldError[] => {
  return err.issues.map((issue) => ({
    field: issue.path.length > 0 ? String(issue.path[0]) : null,
    message: issue.message,
  }));
};
