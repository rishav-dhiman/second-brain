import { model, Schema } from "mongoose";

const linkSchema = new Schema(
  {
    hash: { type: String, required: true, unique: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// TTL cleanup: MongoDB removes links once expiresAt passes (docs with null never expire)
linkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const LinkModel = model("Link", linkSchema);
