import type { Express } from "express";
import request from "supertest";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { ContentModel } from "../src/models/content";
import { LinkModel } from "../src/models/link";
import { TagModel } from "../src/models/tags";
import { UserModel } from "../src/models/user";
import {
  clearDatabase,
  signupAndSignin,
  startTestServer,
  stopTestServer,
} from "./helpers";

let app: Express;

beforeAll(async () => {
  app = await startTestServer();
});

afterAll(async () => {
  await stopTestServer();
});

beforeEach(async () => {
  await clearDatabase();
});

function getProfile(token: string) {
  return request(app).get("/api/v1/profile").set("Authorization", token);
}

describe("GET /api/v1/profile", () => {
  it("returns the account overview with stats", async () => {
    const token = await signupAndSignin(app, "alice");
    await request(app)
      .post("/api/v1/content")
      .set("Authorization", token)
      .send({
        title: "Note",
        link: "https://example.com",
        type: "document",
        tags: ["react", "node"],
      })
      .expect(200);

    const res = await getProfile(token);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe("alice");
    expect(res.body.createdAt).toBeTruthy();
    expect(res.body.stats).toEqual({ contents: 1, tags: 2 });
  });

  it("requires authentication", async () => {
    await request(app).get("/api/v1/profile").expect(401);
  });
});

describe("PATCH /api/v1/profile", () => {
  it("updates the username", async () => {
    const token = await signupAndSignin(app, "alice");

    const res = await request(app)
      .patch("/api/v1/profile")
      .set("Authorization", token)
      .send({ username: "alice2" });

    expect(res.status).toBe(200);
    expect(res.body.username).toBe("alice2");

    await request(app)
      .post("/api/v1/signin")
      .send({ username: "alice2", password: "password123" })
      .expect(200);
  });

  it("rejects a username taken by another account (case-insensitive)", async () => {
    await signupAndSignin(app, "bob");
    const token = await signupAndSignin(app, "alice");

    const res = await request(app)
      .patch("/api/v1/profile")
      .set("Authorization", token)
      .send({ username: "BOB" });

    expect(res.status).toBe(409);
  });

  it("allows a case-only change of your own username", async () => {
    const token = await signupAndSignin(app, "alice");

    const res = await request(app)
      .patch("/api/v1/profile")
      .set("Authorization", token)
      .send({ username: "Alice" });

    expect(res.status).toBe(200);
    expect(res.body.username).toBe("Alice");
  });

  it("validates username length", async () => {
    const token = await signupAndSignin(app, "alice");

    const res = await request(app)
      .patch("/api/v1/profile")
      .set("Authorization", token)
      .send({ username: "ab" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/profile/password", () => {
  it("changes the password", async () => {
    const token = await signupAndSignin(app, "alice");

    const res = await request(app)
      .post("/api/v1/profile/password")
      .set("Authorization", token)
      .send({ currentPassword: "password123", newPassword: "newpassword456" });

    expect(res.status).toBe(200);
    await request(app)
      .post("/api/v1/signin")
      .send({ username: "alice", password: "newpassword456" })
      .expect(200);
    await request(app)
      .post("/api/v1/signin")
      .send({ username: "alice", password: "password123" })
      .expect(401);
  });

  it("rejects an incorrect current password", async () => {
    const token = await signupAndSignin(app, "alice");

    const res = await request(app)
      .post("/api/v1/profile/password")
      .set("Authorization", token)
      .send({
        currentPassword: "wrong-password",
        newPassword: "newpassword456",
      });

    expect(res.status).toBe(403);
  });

  it("validates the new password length", async () => {
    const token = await signupAndSignin(app, "alice");

    const res = await request(app)
      .post("/api/v1/profile/password")
      .set("Authorization", token)
      .send({ currentPassword: "password123", newPassword: "short" });

    expect(res.status).toBe(400);
  });

  it("requires authentication", async () => {
    await request(app)
      .post("/api/v1/profile/password")
      .send({ currentPassword: "password123", newPassword: "newpassword456" })
      .expect(401);
  });
});

describe("DELETE /api/v1/profile", () => {
  it("deletes the account and all associated data", async () => {
    const token = await signupAndSignin(app, "alice");
    await request(app)
      .post("/api/v1/content")
      .set("Authorization", token)
      .send({
        title: "Note",
        link: "https://example.com",
        type: "document",
        tags: ["react"],
      })
      .expect(200);
    await request(app)
      .post("/api/v1/brain/share")
      .set("Authorization", token)
      .send({ share: true })
      .expect(200);

    const res = await request(app)
      .delete("/api/v1/profile")
      .set("Authorization", token)
      .send({ password: "password123" });

    expect(res.status).toBe(200);
    expect(await UserModel.countDocuments()).toBe(0);
    expect(await ContentModel.countDocuments()).toBe(0);
    expect(await TagModel.countDocuments()).toBe(0);
    expect(await LinkModel.countDocuments()).toBe(0);

    await request(app)
      .post("/api/v1/signin")
      .send({ username: "alice", password: "password123" })
      .expect(401);
  });

  it("rejects an incorrect password and keeps the account", async () => {
    const token = await signupAndSignin(app, "alice");

    const res = await request(app)
      .delete("/api/v1/profile")
      .set("Authorization", token)
      .send({ password: "wrong-password" });

    expect(res.status).toBe(403);
    expect(await UserModel.countDocuments()).toBe(1);
  });

  it("requires authentication", async () => {
    await request(app)
      .delete("/api/v1/profile")
      .send({ password: "password123" })
      .expect(401);
  });
});
