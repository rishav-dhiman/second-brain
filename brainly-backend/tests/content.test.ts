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

function createContent(token: string, body: Record<string, unknown> = {}) {
  return request(app)
    .post("/api/v1/content")
    .set("Authorization", token)
    .send({
      title: "Test title",
      link: "https://example.com",
      type: "document",
      ...body,
    });
}

describe("POST /api/v1/content", () => {
  it("creates content", async () => {
    const token = await signupAndSignin(app, "alice");

    const res = await createContent(token, { title: "My note" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Content added successfully");
    expect(typeof res.body.content._id).toBe("string");
    expect(res.body.content.title).toBe("My note");
    expect(res.body.content.tags).toEqual([]);
  });

  it("normalizes and populates tags", async () => {
    const token = await signupAndSignin(app, "alice");

    const res = await createContent(token, {
      tags: ["Backend", " react "],
    });

    expect(res.status).toBe(200);
    const names = (res.body.content.tags as { name: string }[])
      .map((tag) => tag.name)
      .sort();
    expect(names).toEqual(["backend", "react"]);
  });

  it("rejects a missing title", async () => {
    const token = await signupAndSignin(app, "alice");

    const res = await createContent(token, { title: "" });

    expect(res.status).toBe(400);
  });

  it("rejects an unknown content type", async () => {
    const token = await signupAndSignin(app, "alice");

    const res = await createContent(token, { type: "pdf" });

    expect(res.status).toBe(400);
  });

  it("rejects more than 10 tags", async () => {
    const token = await signupAndSignin(app, "alice");

    const res = await createContent(token, {
      tags: Array.from({ length: 11 }, (_, i) => `tag-${i}`),
    });

    expect(res.status).toBe(400);
  });

  it("requires authentication", async () => {
    const res = await request(app).post("/api/v1/content").send({
      title: "Test title",
      link: "https://example.com",
      type: "document",
    });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/content", () => {
  it("returns only the caller's content, newest first", async () => {
    const alice = await signupAndSignin(app, "alice");
    const bob = await signupAndSignin(app, "bob");

    await createContent(alice, { title: "first" });
    await delay(15);
    await createContent(alice, { title: "second" });
    await delay(15);
    await createContent(alice, { title: "third" });
    await createContent(bob, { title: "bob's note" });

    const res = await request(app)
      .get("/api/v1/content")
      .set("Authorization", alice);

    expect(res.status).toBe(200);
    const titles = (res.body.content as { title: string }[]).map(
      (item) => item.title
    );
    expect(titles).toEqual(["third", "second", "first"]);
  });
});

describe("PUT /api/v1/content", () => {
  it("updates title, link, and type", async () => {
    const token = await signupAndSignin(app, "alice");
    const created = await createContent(token);

    const res = await request(app)
      .put("/api/v1/content")
      .set("Authorization", token)
      .send({
        contentId: created.body.content._id,
        title: "Updated title",
        link: "https://updated.example.com",
        type: "youtube",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Content updated successfully");
    expect(res.body.content.title).toBe("Updated title");
    expect(res.body.content.link).toBe("https://updated.example.com");
    expect(res.body.content.type).toBe("youtube");
  });

  it("replaces tags", async () => {
    const token = await signupAndSignin(app, "alice");
    const created = await createContent(token, { tags: ["react"] });

    const res = await request(app)
      .put("/api/v1/content")
      .set("Authorization", token)
      .send({
        contentId: created.body.content._id,
        title: "Test title",
        link: "https://example.com",
        tags: ["node"],
      });

    expect(res.status).toBe(200);
    const names = (res.body.content.tags as { name: string }[]).map(
      (tag) => tag.name
    );
    expect(names).toEqual(["node"]);
  });

  it("returns 404 for another user's content", async () => {
    const alice = await signupAndSignin(app, "alice");
    const bob = await signupAndSignin(app, "bob");
    const created = await createContent(alice);

    const res = await request(app)
      .put("/api/v1/content")
      .set("Authorization", bob)
      .send({
        contentId: created.body.content._id,
        title: "Hijacked",
        link: "https://evil.example.com",
      });

    expect(res.status).toBe(404);
  });

  it("returns 404 for a nonexistent id", async () => {
    const token = await signupAndSignin(app, "alice");

    const res = await request(app)
      .put("/api/v1/content")
      .set("Authorization", token)
      .send({
        contentId: "0".repeat(24),
        title: "Ghost",
        link: "https://example.com",
      });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/v1/content", () => {
  it("deletes the caller's content", async () => {
    const token = await signupAndSignin(app, "alice");
    const created = await createContent(token);

    const res = await request(app)
      .delete("/api/v1/content")
      .set("Authorization", token)
      .send({ contentId: created.body.content._id });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Content deleted successfully");

    const list = await request(app)
      .get("/api/v1/content")
      .set("Authorization", token);
    expect(list.body.content).toEqual([]);
  });

  it("does not delete another user's content", async () => {
    const alice = await signupAndSignin(app, "alice");
    const bob = await signupAndSignin(app, "bob");
    const created = await createContent(alice);

    await request(app)
      .delete("/api/v1/content")
      .set("Authorization", bob)
      .send({ contentId: created.body.content._id });

    const list = await request(app)
      .get("/api/v1/content")
      .set("Authorization", alice);
    expect(list.body.content).toHaveLength(1);
  });
});

describe("GET /api/v1/search", () => {
  it("finds content by title, case-insensitively", async () => {
    const token = await signupAndSignin(app, "alice");
    await createContent(token, { title: "React performance notes" });
    await createContent(token, { title: "Cooking recipes" });

    const res = await request(app)
      .get("/api/v1/search")
      .query({ q: "REACT" })
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].title).toBe("React performance notes");
  });

  it("treats regex special characters literally", async () => {
    const token = await signupAndSignin(app, "alice");
    await createContent(token, { title: "React performance notes" });
    await createContent(token, { title: "Cooking recipes" });

    const res = await request(app)
      .get("/api/v1/search")
      .query({ q: ".*" })
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([]);
  });

  it("rejects a missing query", async () => {
    const token = await signupAndSignin(app, "alice");

    const res = await request(app)
      .get("/api/v1/search")
      .set("Authorization", token);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Query parameter 'q' is required");
  });
});
