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
import { clearDatabase, startTestServer, stopTestServer } from "./helpers";

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

describe("POST /api/v1/signup", () => {
  it("creates an account and signs the user in", async () => {
    const res = await request(app)
      .post("/api/v1/signup")
      .send({ username: "alice", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Account created successfully");
    expect(typeof res.body.token).toBe("string");
    expect(res.body.username).toBe("alice");
  });

  it("rejects duplicate usernames case-insensitively", async () => {
    await request(app)
      .post("/api/v1/signup")
      .send({ username: "alice", password: "password123" })
      .expect(201);

    const res = await request(app)
      .post("/api/v1/signup")
      .send({ username: "ALICE", password: "password123" });

    expect(res.status).toBe(409);
  });

  it("rejects short usernames", async () => {
    const res = await request(app)
      .post("/api/v1/signup")
      .send({ username: "ab", password: "password123" });

    expect(res.status).toBe(400);
  });

  it("rejects short passwords", async () => {
    const res = await request(app)
      .post("/api/v1/signup")
      .send({ username: "alice", password: "123" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/signin", () => {
  it("returns a token for valid credentials", async () => {
    await request(app)
      .post("/api/v1/signup")
      .send({ username: "alice", password: "password123" });

    const res = await request(app)
      .post("/api/v1/signin")
      .send({ username: "Alice", password: "password123" });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.username).toBe("alice");
  });

  it("returns the same error for wrong password and unknown user", async () => {
    await request(app)
      .post("/api/v1/signup")
      .send({ username: "alice", password: "password123" });

    const wrongPassword = await request(app)
      .post("/api/v1/signin")
      .send({ username: "alice", password: "not-the-password" });

    const unknownUser = await request(app)
      .post("/api/v1/signin")
      .send({ username: "nobody", password: "password123" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body.message).toBe("Invalid username or password");
    expect(unknownUser.body.message).toBe(wrongPassword.body.message);
  });

  it("rejects signin without a password", async () => {
    const res = await request(app)
      .post("/api/v1/signin")
      .send({ username: "alice" });

    expect(res.status).toBe(400);
  });
});

describe("auth middleware", () => {
  it("rejects protected routes without a token", async () => {
    const res = await request(app).get("/api/v1/content");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("You are not logged in");
  });

  it("rejects invalid tokens", async () => {
    const res = await request(app)
      .get("/api/v1/content")
      .set("Authorization", "definitely-not-a-jwt");

    expect(res.status).toBe(401);
  });

  it("accepts both raw and Bearer-prefixed tokens", async () => {
    await request(app)
      .post("/api/v1/signup")
      .send({ username: "alice", password: "password123" });
    const signin = await request(app)
      .post("/api/v1/signin")
      .send({ username: "alice", password: "password123" });
    const token = signin.body.token as string;

    const raw = await request(app)
      .get("/api/v1/content")
      .set("Authorization", token);
    const bearer = await request(app)
      .get("/api/v1/content")
      .set("Authorization", `Bearer ${token}`);

    expect(raw.status).toBe(200);
    expect(bearer.status).toBe(200);
  });
});
