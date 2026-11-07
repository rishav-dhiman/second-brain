import { model, Schema } from "mongoose";

const contentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    link: { type: String, required: true },
    type: { type: String, required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

contentSchema.index({ userId: 1, createdAt: -1 });

export const ContentModel = model("Content", contentSchema);
