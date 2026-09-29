import { model, Schema } from "mongoose";

const tagSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

tagSchema.index({ userId: 1, name: 1 }, { unique: true });

export const TagModel = model("Tag", tagSchema);
