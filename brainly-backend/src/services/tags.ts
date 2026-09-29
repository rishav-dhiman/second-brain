import { Types } from "mongoose";
import { ContentModel } from "../models/content";
import { TagModel } from "../models/tags";
import { isDuplicateKeyError } from "../utils";

async function findOrCreateTag(userId: string, name: string) {
  const existing = await TagModel.findOne({ userId, name });
  if (existing) {
    return existing;
  }

  try {
    return await TagModel.create({ userId, name });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const raced = await TagModel.findOne({ userId, name });
      if (raced) {
        return raced;
      }
    }
    throw error;
  }
}

export async function resolveTagIds(
  userId: string,
  names: string[]
): Promise<Types.ObjectId[]> {
  const uniqueNames = [
    ...new Set(names.map((name) => name.trim().toLowerCase()).filter(Boolean)),
  ];

  const ids: Types.ObjectId[] = [];
  for (const name of uniqueNames) {
    const tag = await findOrCreateTag(userId, name);
    ids.push(tag._id);
  }
  return ids;
}

export async function pruneOrphanTags(userId: string): Promise<void> {
  const usedTagIds = await ContentModel.distinct("tags", { userId });
  await TagModel.deleteMany({ userId, _id: { $nin: usedTagIds } });
}
