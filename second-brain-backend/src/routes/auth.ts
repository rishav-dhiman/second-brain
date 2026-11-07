import { Router } from "express";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config";
import { UserModel } from "../models/user";
import { escapeRegex, isDuplicateKeyError } from "../utils";
import { signinSchema, signupSchema, validateBody } from "../validation";

export const authRouter = Router();

// Hash used to equalize bcrypt timing when the username does not exist
const dummyHashPromise = bcrypt.hash("timing-equalizer-placeholder", 10);

function usernameLookup(username: string) {
  return {
    username: { $regex: new RegExp(`^${escapeRegex(username)}$`, "i") },
  };
}

function signToken(userId: unknown) {
  return jwt.sign({ id: userId }, config.jwtPassword, {
    expiresIn: config.jwtExpiresIn as NonNullable<SignOptions["expiresIn"]>,
    algorithm: "HS256",
  });
}

authRouter.post("/signup", validateBody(signupSchema), async (req, res) => {
  const { username, password } = req.body;

  const existingUser = await UserModel.findOne(usernameLookup(username));
  if (existingUser) {
    return res.status(409).json({
      message:
        "Username is already taken. Please choose a different username or sign in.",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let user;
  try {
    user = await UserModel.create({ username, password: hashedPassword });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({
        message: "Username is already taken. Please choose another username.",
      });
    }
    throw error;
  }

  return res.status(201).json({
    message: "Account created successfully",
    token: signToken(user._id),
    username: user.username,
  });
});

authRouter.post("/signin", validateBody(signinSchema), async (req, res) => {
  const { username, password } = req.body;

  const existingUser = await UserModel.findOne(usernameLookup(username));
  const hashToCompare = existingUser?.password ?? (await dummyHashPromise);
  const passwordMatch = await bcrypt.compare(password, hashToCompare);

  if (!existingUser || !passwordMatch) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = signToken(existingUser._id);

  return res.json({ token, username: existingUser.username });
});
