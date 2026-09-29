import { Router } from "express";
import { Types } from "mongoose";
import { requireAuth } from "../middleware/auth";
import { ContentModel } from "../models/content";
import { TagModel } from "../models/tags";
import { tagDeleteSchema, validateBody } from "../validation";

export const tagsRouter = Router();

tagsRouter.use(requireAuth);

tagsRouter.get("/", async (req, res) => {
  const userId = req.userId as string;

  const tags = await TagModel.aggregate([
    { $match: { userId: new Types.ObjectId(userId) } },
    {
      $lookup: {
        from: ContentModel.collection.name,
        localField: "_id",
        foreignField: "tags",
        as: "relatedContents",
      },
    },
    { $project: { name: 1, count: { $size: "$relatedContents" } } },
    { $sort: { name: 1 } },
  ]);

  res.json({ tags });
});

tagsRouter.delete("/", validateBody(tagDeleteSchema), async (req, res) => {
  const userId = req.userId as string;
  const tagId = new Types.ObjectId(req.body.tagId);

  await TagModel.deleteOne({ _id: tagId, userId });
  await ContentModel.updateMany({ userId }, { $pull: { tags: tagId } });

  res.json({ message: "Tag deleted successfully" });
});
