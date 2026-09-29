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
import { LinkModel } from "../src/models/link";
import {
  clearDatabase,
  signupAndSignin,
  startTestServer,
  stopTestServer,
} from "./helpers";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

function share(token: string, body: Record<string, unknown> = { share: true }) {
  return request(app)
    .post("/api/v1/brain/share")
    .set("Authorization", token)
    .send(body);
}

function hashFrom(message: string): string {
  return message.replace(/^\//, "");
}

async function createContent(
  token: string,
  body: Record<string, unknown> = {}
) {
  const res = await request(app)
    .post("/api/v1/content")
    .set("Authorization", token)
    .send({
      title: "Test title",
      link: "https://example.com",
      type: "document",
      ...body,
    });
  expect(res.status).toBe(200);
  return res.body.content;
}

describe("POST /api/v1/brain/share", () => {
  it("creates a permanent share link by default", async () => {
    const token = await signupAndSignin(app, "alice");
    await createContent(token, { title: "My note" });

    const res = await share(token);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/^\/[A-Za-z0-9_-]+$/);
    expect(res.body.expiresAt).toBeNull();

    const hash = hashFrom(res.body.message);
    const shared = await request(app).get(`/api/v1/brain/${hash}`);

    expect(shared.status).toBe(200);
    expect(shared.body.username).toBe("alice");
    expect(shared.body.content).toHaveLength(1);
    expect(shared.body.content[0].title).toBe("My note");
    expect(shared.body.expiresAt).toBeNull();
  });

  it("creates an expiring link when expiresIn is set", async () => {
    const token = await signupAndSignin(app, "alice");

    const before = Date.now();
    const res = await share(token, { share: true, expiresIn: 60 });
    const expiresAtMs = new Date(res.body.expiresAt).getTime();

    expect(res.status).toBe(200);
    expect(expiresAtMs).toBeGreaterThan(before + 59 * 60 * 1000);
    expect(expiresAtMs).toBeLessThan(Date.now() + 61 * 60 * 1000);
  });

  it("includes tags on shared content", async () => {
    const token = await signupAndSignin(app, "alice");
    await createContent(token, { tags: ["react"] });

    const res = await share(token);
    const shared = await request(app).get(
      `/api/v1/brain/${hashFrom(res.body.message)}`
    );

    expect(shared.body.content[0].tags).toHaveLength(1);
    expect(shared.body.content[0].tags[0].name).toBe("react");
  });

  it("sorts shared content newest first", async () => {
    const token = await signupAndSignin(app, "alice");
    await createContent(token, { title: "older" });
    await delay(15);
    await createContent(token, { title: "newer" });

    const res = await share(token);
    const shared = await request(app).get(
      `/api/v1/brain/${hashFrom(res.body.message)}`
    );

    expect(
      (shared.body.content as { title: string }[]).map((item) => item.title)
    ).toEqual(["newer", "older"]);
  });

  it("unshares an existing link", async () => {
    const token = await signupAndSignin(app, "alice");
    const first = await share(token);
    const hash = hashFrom(first.body.message);

    const res = await share(token, { share: false });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Removed Link");
    await request(app).get(`/api/v1/brain/${hash}`).expect(404);
  });

  it("reuses the existing link when sharing again", async () => {
    const token = await signupAndSignin(app, "alice");
    const first = await share(token);
    const firstHash = hashFrom(first.body.message);

    const second = await share(token);

    expect(second.body.hash).toBe(firstHash);
    await request(app).get(`/api/v1/brain/${firstHash}`).expect(200);
  });

  it("rotates the hash when regenerate is true", async () => {
    const token = await signupAndSignin(app, "alice");
    const first = await share(token);
    const firstHash = hashFrom(first.body.message);

    const second = await share(token, { share: true, regenerate: true });
    const secondHash = hashFrom(second.body.message);

    expect(secondHash).not.toBe(firstHash);
    await request(app).get(`/api/v1/brain/${firstHash}`).expect(404);
    await request(app).get(`/api/v1/brain/${secondHash}`).expect(200);
  });

  it("updates expiry on an existing link without rotating the hash", async () => {
    const token = await signupAndSignin(app, "alice");
    const first = await share(token, { share: true, expiresIn: 60 });

    const second = await share(token, { share: true, expiresIn: 1440 });

    expect(second.body.hash).toBe(first.body.hash);
    expect(new Date(second.body.expiresAt).getTime()).toBeGreaterThan(
      new Date(first.body.expiresAt).getTime()
    );
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .post("/api/v1/brain/share")
      .send({ share: true });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/brain/:hash", () => {
  it("returns 404 for an unknown hash", async () => {
    const res = await request(app).get("/api/v1/brain/unknown-hash");
    expect(res.status).toBe(404);
  });

  it("returns 410 and deletes the link once expired", async () => {
    const token = await signupAndSignin(app, "alice");
    const res = await share(token, { share: true, expiresIn: 60 });
    const hash = hashFrom(res.body.message);

    await LinkModel.updateOne(
      { hash },
      { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );

    const expired = await request(app).get(`/api/v1/brain/${hash}`);
    expect(expired.status).toBe(410);
    expect(expired.body.message).toBe("This shared brain link has expired.");

    await request(app).get(`/api/v1/brain/${hash}`).expect(404);
    expect(await LinkModel.countDocuments()).toBe(0);
  });
});

describe("GET /api/v1/brain/share", () => {
  function status(token: string) {
    return request(app).get("/api/v1/brain/share").set("Authorization", token);
  }

  it("reports share:false when no link exists", async () => {
    const token = await signupAndSignin(app, "alice");
    const res = await status(token);

    expect(res.status).toBe(200);
    expect(res.body.share).toBe(false);
    expect(res.body.hash).toBeNull();
    expect(res.body.expiresAt).toBeNull();
  });

  it("returns the active link details", async () => {
    const token = await signupAndSignin(app, "alice");
    const created = await share(token, { share: true, expiresIn: 60 });

    const res = await status(token);

    expect(res.body.share).toBe(true);
    expect(res.body.hash).toBe(hashFrom(created.body.message));
    expect(new Date(res.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(res.body.createdAt).not.toBeNull();
  });

  it("reports share:false and cleans up once expired", async () => {
    const token = await signupAndSignin(app, "alice");
    const created = await share(token, { share: true, expiresIn: 60 });
    await LinkModel.updateOne(
      { hash: hashFrom(created.body.message) },
      { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );

    const res = await status(token);

    expect(res.body.share).toBe(false);
    expect(await LinkModel.countDocuments()).toBe(0);
  });

  it("requires authentication", async () => {
    await request(app).get("/api/v1/brain/share").expect(401);
  });
});

describe("DELETE /api/v1/brain/share", () => {
  it("revokes the active link", async () => {
    const token = await signupAndSignin(app, "alice");
    const created = await share(token);
    const hash = hashFrom(created.body.message);

    const res = await request(app)
      .delete("/api/v1/brain/share")
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.share).toBe(false);
    await request(app).get(`/api/v1/brain/${hash}`).expect(404);
  });

  it("requires authentication", async () => {
    await request(app).delete("/api/v1/brain/share").expect(401);
  });
});
