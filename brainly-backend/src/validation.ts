import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const contentTypeSchema = z.enum([
  "youtube",
  "twitter",
  "document",
  "link",
]);

const tagsSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Tags cannot be empty")
      .max(30, "Each tag must be at most 30 characters")
  )
  .max(10, "A maximum of 10 tags is allowed");

const objectIdSchema = (label: string) =>
  z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, `A valid ${label} is required`);

export const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be between 3 and 20 characters")
    .max(20, "Username must be between 3 and 20 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signinSchema = z.object({
  username: z.string().trim().min(1, "Username and password are required"),
  password: z.string().min(1, "Username and password are required"),
});

export const contentCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title, link/content, and type are required")
    .max(300, "Title must be at most 300 characters"),
  link: z
    .string()
    .trim()
    .min(1, "Title, link/content, and type are required")
    .max(50000, "Content is too long"),
  type: contentTypeSchema,
  tags: tagsSchema.default([]),
});

export const contentUpdateSchema = z.object({
  contentId: objectIdSchema("contentId"),
  title: z
    .string()
    .trim()
    .min(1, "contentId, title, and link/content are required")
    .max(300, "Title must be at most 300 characters"),
  link: z
    .string()
    .trim()
    .min(1, "contentId, title, and link/content are required")
    .max(50000, "Content is too long"),
  type: contentTypeSchema.optional(),
  tags: tagsSchema.optional(),
});

export const contentDeleteSchema = z.object({
  contentId: objectIdSchema("contentId"),
});

export const shareSchema = z.object({
  share: z.boolean().default(false),
  // Minutes until the link expires; null/undefined = never
  expiresIn: z.number().int().positive().max(525600).nullish(),
  // When true, rotate the hash instead of refreshing the existing link
  regenerate: z.boolean().optional().default(false),
});

export const profileUpdateSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be between 3 and 20 characters")
    .max(20, "Username must be between 3 and 20 characters"),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .max(72, "New password must be at most 72 characters"),
});

export const accountDeleteSchema = z.object({
  password: z.string().min(1, "Password is required to delete your account"),
});

export const tagDeleteSchema = z.object({
  tagId: objectIdSchema("tagId"),
});

export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error.issues[0];
      const path = issue?.path.join(".");
      const message =
        issue?.code === "invalid_type" && path
          ? `'${path}' is required`
          : issue?.message || "Invalid request body";
      return res.status(400).json({ message });
    }
    req.body = result.data;
    next();
  };
}
