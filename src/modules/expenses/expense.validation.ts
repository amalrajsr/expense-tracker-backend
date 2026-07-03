import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { generateAPIError } from "../../utils/apiError";

type RequestSource = "body" | "query" | "params";
type ValidatedRequestData = Partial<Record<RequestSource, unknown>>;

const idSchema = Joi.alternatives()
  .try(Joi.number().integer().positive(), Joi.string().trim().pattern(/^\d+$/))
  .custom((value) => String(value));

const amountSchema = Joi.alternatives()
  .try(Joi.number().positive(), Joi.string().trim())
  .custom((value, helpers) => {
    const amount = String(value).trim();

    if (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(amount)) {
      return helpers.error("number.precision");
    }

    if (Number(amount) <= 0 || Number(amount) > 9999999999.99) {
      return helpers.error("number.positive");
    }

    return amount;
  })
  .messages({
    "number.precision": "{{#label}} must be a positive amount with up to 2 decimal places",
  });

const dateSchema = Joi.string()
  .trim()
  .custom((value, helpers) => {
    const dateValue = String(value);
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);

    if (dateOnlyMatch) {
      const date = new Date(`${dateValue}T00:00:00.000Z`);

      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateValue) {
        return helpers.error("date.base");
      }

      return dateValue;
    }

    if (!/^\d{4}-\d{2}-\d{2}T.+$/.test(dateValue)) {
      return helpers.error("date.format");
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return helpers.error("date.base");
    }

    return dateValue;
  }, "ISO date validation")
  .messages({
    "date.format": "{{#label}} must be an ISO date or datetime",
  });

const categorySchema = Joi.string().trim().min(1).max(80);

function parseDateBoundary(value: string, endOfDay: boolean): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  }

  return new Date(value);
}

export const createExpenseSchema = Joi.object({
  amount: amountSchema.required(),
  categoryId: idSchema.required(),
  date: dateSchema.required(),
  note: Joi.string().trim().max(500).allow("", null).default(null),
});

export const listExpensesQuerySchema = Joi.object({
  categoryId: idSchema,
  from: dateSchema,
  to: dateSchema,
  search: Joi.string().trim().max(500).empty(""),
})
  .custom((value, helpers) => {
    if (value.from && value.to) {
      const from = parseDateBoundary(value.from, false);
      const to = parseDateBoundary(value.to, true);

      if (from > to) {
        return helpers.error("date.range");
      }
    }

    return value;
  })
  .messages({
    "date.range": "from must be earlier than or equal to to",
  });

export const expenseIdParamSchema = Joi.object({
  id: idSchema.required(),
});

export function getValidatedRequestData<T>(
  res: Response,
  source: RequestSource,
  fallback: unknown,
): T {
  const validatedRequest = res.locals.validatedRequest as
    | ValidatedRequestData
    | undefined;

  return (validatedRequest?.[source] ?? fallback) as T;
}

export function validateRequest(schema: Joi.ObjectSchema, source: RequestSource) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      allowUnknown: false,
    });

    if (error) {
      next(
        generateAPIError(
          "Validation failed",
          400,
          error.details.map((detail) => ({
            field: detail.path.join("."),
            message: detail.message,
          })),
        ),
      );
      return;
    }

    res.locals.validatedRequest = {
      ...((res.locals.validatedRequest as ValidatedRequestData | undefined) ??
        {}),
      [source]: value,
    };
    next();
  };
}

