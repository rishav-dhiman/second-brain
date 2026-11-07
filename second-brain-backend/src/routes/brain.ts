import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { ContentModel } from "../models/content";
import { LinkModel } from "../models/link";
import { UserModel } from "../models/user";
import { generateShareHash } from "../utils";
import { shareSchema, validateBody } from "../validation";

export const brainRouter = Router();

// Share status for the current user (used by the share modal)
brainRouter.get("/share", requireAuth, async (req, res) => {
  const userId = req.userId as string;
  const link = await LinkModel.findOne({ userId });

  if (!link) {
    return res.json({ share: false, hash: null, expiresAt: null, createdAt: null });
  }

  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
    await LinkModel.deleteOne({ _id: link._id });
    return res.json({ share: false, hash: null, expiresAt: null, createdAt: null });
  }

  return res.json({
    share: true,
    hash: link.hash,
    expiresAt: link.expiresAt ?? null,
    createdAt: link.createdAt ?? null,
  });
});

// Revoke the current share link
brainRouter.delete("/share", requireAuth, async (req, res) => {
  const userId = req.userId as string;
  await LinkModel.deleteOne({ userId });
  return res.json({ share: false, message: "Link revoked" });
});

brainRouter.post(
  "/share",
  requireAuth,
  validateBody(shareSchema),
  async (req, res) => {
    const userId = req.userId as string;
    const { share, expiresIn, regenerate } = req.body;

    if (!share) {
      await LinkModel.deleteOne({ userId });
      return res.json({ share: false, message: "Removed Link" });
    }

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 60 * 1000)
      : null;

    const existing = await LinkModel.findOne({ userId });
    const existingExpired =
      !!existing?.expiresAt && existing.expiresAt.getTime() < Date.now();

    // Keep the current hash unless explicitly asked to regenerate
    const shouldRotate = regenerate || !existing || existingExpired;
    const hash = shouldRotate ? generateShareHash() : existing.hash;

    if (existing) {
      existing.hash = hash;
      existing.expiresAt = expiresAt;
      await existing.save();
    } else {
      await LinkModel.create({ userId, hash, expiresAt });
    }

    return res.json({
      share: true,
      message: "/" + hash,
      hash,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      createdAt: (existing?.createdAt ?? new Date()).toISOString(),
    });
  }
);

brainRouter.get("/:sharelink", async (req, res) => {
  const hash = req.params.sharelink ?? "";
  if (!hash) {
    return res.status(404).json({
      message: "Shared brain link not found or expired",
    });
  }

  const link = await LinkModel.findOne({ hash });
  if (!link) {
    return res.status(404).json({
      message: "Shared brain link not found or expired",
    });
  }

  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
    await LinkModel.deleteOne({ _id: link._id });
    return res.status(410).json({
      message: "This shared brain link has expired.",
    });
  }

  const [user, content] = await Promise.all([
    UserModel.findById(link.userId),
    ContentModel.find({ userId: link.userId })
      .sort({ createdAt: -1 })
      .populate("tags", "name"),
  ]);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({
    username: user.username,
    content,
    expiresAt: link.expiresAt ?? null,
    createdAt: link.createdAt ?? null,
  });
});
