import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { ContentModel } from "../models/content";
import { pruneOrphanTags, resolveTagIds } from "../services/tags";
import {
  contentCreateSchema,
  contentDeleteSchema,
  contentUpdateSchema,
  validateBody,
} from "../validation";

export const contentRouter = Router();

contentRouter.use(requireAuth);

contentRouter.post(
  "/",
  validateBody(contentCreateSchema),
  async (req, res) => {
    const { title, link, type, tags } = req.body;
    const userId = req.userId as string;

    const tagIds = await resolveTagIds(userId, tags);
    const content = await ContentModel.create({
      title,
      link,
      type,
      userId,
      tags: tagIds,
    });

    const populated = await content.populate("tags", "name");

    return res.json({
      message: "Content added successfully",
      content: populated,
    });
  }
);

contentRouter.get("/", async (req, res) => {
  const userId = req.userId as string;

  const content = await ContentModel.find({ userId })
    .sort({ createdAt: -1 })
    .populate("tags", "name");

  res.json({ content });
});

contentRouter.put(
  "/",
  validateBody(contentUpdateSchema),
  async (req, res) => {
    const { contentId, title, link, type, tags } = req.body;
    const userId = req.userId as string;

    const update: Record<string, unknown> = { title, link };
    if (type) {
      update.type = type;
    }
    if (tags) {
      update.tags = await resolveTagIds(userId, tags);
    }

    const updated = await ContentModel.findOneAndUpdate(
      { _id: contentId, userId },
      { $set: update },
      { returnDocument: "after" }
    ).populate("tags", "name");

    if (!updated) {
      return res.status(404).json({
        message: "Content not found or unauthorized",
      });
    }

    if (tags) {
      await pruneOrphanTags(userId);
    }

    return res.json({
      message: "Content updated successfully",
      content: updated,
    });
  }
);

contentRouter.delete(
  "/",
  validateBody(contentDeleteSchema),
  async (req, res) => {
    const userId = req.userId as string;

    await ContentModel.deleteOne({ _id: req.body.contentId, userId });
    await pruneOrphanTags(userId);

    return res.json({ message: "Content deleted successfully" });
  }
);
