import { Router } from "express";
import bcrypt from "bcrypt";
import { requireAuth } from "../middleware/auth";
import { ContentModel } from "../models/content";
import { LinkModel } from "../models/link";
import { TagModel } from "../models/tags";
import { UserModel } from "../models/user";
import { escapeRegex, isDuplicateKeyError } from "../utils";
import {
  accountDeleteSchema,
  passwordChangeSchema,
  profileUpdateSchema,
  validateBody,
} from "../validation";

export const profileRouter = Router();

function usernameLookup(username: string) {
  return {
    username: { $regex: new RegExp(`^${escapeRegex(username)}$`, "i") },
  };
}

profileRouter.get("/", requireAuth, async (req, res) => {
  const userId = req.userId as string;

  const [user, contentCount, tagCount] = await Promise.all([
    UserModel.findById(userId),
    ContentModel.countDocuments({ userId }),
    TagModel.countDocuments({ userId }),
  ]);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({
    username: user.username,
    createdAt: user.createdAt ?? null,
    stats: { contents: contentCount, tags: tagCount },
  });
});

profileRouter.patch(
  "/",
  requireAuth,
  validateBody(profileUpdateSchema),
  async (req, res) => {
    const userId = req.userId as string;
    const { username } = req.body;

    const taken = await UserModel.findOne({
      ...usernameLookup(username),
      _id: { $ne: userId },
    });
    if (taken) {
      return res.status(409).json({
        message:
          "Username is already taken. Please choose a different username.",
      });
    }

    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { username },
        { returnDocument: "after" }
      );
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({ username: user.username });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return res.status(409).json({
          message:
            "Username is already taken. Please choose a different username.",
        });
      }
      throw error;
    }
  }
);

profileRouter.post(
  "/password",
  requireAuth,
  validateBody(passwordChangeSchema),
  async (req, res) => {
    const userId = req.userId as string;
    const { currentPassword, newPassword } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      // 403, not 401: the token is valid, so clients must not treat this as session expiry.
      return res.status(403).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "Password updated" });
  }
);

profileRouter.delete(
  "/",
  requireAuth,
  validateBody(accountDeleteSchema),
  async (req, res) => {
    const userId = req.userId as string;
    const { password } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // 403, not 401: the token is valid, so clients must not treat this as session expiry.
      return res.status(403).json({ message: "Password is incorrect" });
    }

    await Promise.all([
      ContentModel.deleteMany({ userId }),
      TagModel.deleteMany({ userId }),
      LinkModel.deleteOne({ userId }),
      UserModel.deleteOne({ _id: userId }),
    ]);

    return res.json({ message: "Account deleted" });
  }
);
