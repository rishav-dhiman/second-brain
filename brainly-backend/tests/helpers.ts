import type { Express } from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app";
import { connectDB, disconnectDB } from "../src/db";

let mongod: MongoMemoryServer | undefined;

export async function startTestServer(): Promise<Express> {
  mongod = await MongoMemoryServer.create();
  await connectDB(mongod.getUri());
  return createApp();
}

export async function stopTestServer(): Promise<void> {
  await disconnectDB();
  if (mongod) {
    await mongod.stop();
    mongod = undefined;
  }
}

export async function clearDatabase(): Promise<void> {
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({});
  }
}

export async function signupAndSignin(
  app: Express,
  username: string,
  password = "password123"
): Promise<string> {
  await request(app)
    .post("/api/v1/signup")
    .send({ username, password })
    .expect(201);

  const res = await request(app)
    .post("/api/v1/signin")
    .send({ username, password })
    .expect(200);

  return res.body.token as string;
}
