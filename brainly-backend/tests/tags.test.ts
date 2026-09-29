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

function listTags(token: string) {
  return request(app).get("/api/v1/tags").set("Authorization", token);
}

type TagRow = { _id: string; name: string; count: number };

describe("GET /api/v1/tags", () => {
  it("lists tags with usage counts, sorted by name", async () => {
    const token = await signupAndSignin(app, "alice");
    await createContent(token, { tags: ["react", "backend"] });
    await createContent(token, { title: "Second", tags: ["react"] });

    const res = await listTags(token);

    expect(res.status).toBe(200);
    const tags = res.body.tags as TagRow[];
    expect(tags.map((tag) => [tag.name, tag.count])).toEqual([
      ["backend", 1],
      ["react", 2],
    ]);
    expect(typeof tags[0]?._id).toBe("string");
  });

  it("returns an empty list when no tags exist", async () => {
    const token = await signupAndSignin(app, "alice");
    const res = await listTags(token);
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual([]);
  });

  it("isolates tags per user", async () => {
    const alice = await signupAndSignin(app, "alice");
    const bob = await signupAndSignin(app, "bob");
    await createContent(alice, { tags: ["react"] });

    const bobTags = await listTags(bob);
    expect(bobTags.body.tags).toEqual([]);

    await createContent(bob, { tags: ["react"] });
    const aliceTags = await listTags(alice);

    expect(aliceTags.body.tags).toHaveLength(1);
    expect(aliceTags.body.tags[0].count).toBe(1);
  });

  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/tags");
    expect(res.status).toBe(401);
  });
});

describe("tag lifecycle", () => {
  it("deduplicates tag names case-insensitively", async () => {
    const token = await signupAndSignin(app, "alice");

    const created = await createContent(token, {
      tags: ["React", "react", " react "],
    });

    expect(created.status).toBe(200);
    expect(created.body.content.tags).toHaveLength(1);

    const tags = (await listTags(token)).body.tags as TagRow[];
    expect(tags).toHaveLength(1);
    expect(tags[0]?.name).toBe("react");
  });

  it("prunes tags that are removed on update", async () => {
    const token = await signupAndSignin(app, "alice");
    const created = await createContent(token, { tags: ["react", "backend"] });

    await request(app)
      .put("/api/v1/content")
      .set("Authorization", token)
      .send({
        contentId: created.body.content._id,
        title: "Test title",
        link: "https://example.com",
        tags: ["react"],
      })
      .expect(200);

    const tags = (await listTags(token)).body.tags as TagRow[];
    expect(tags.map((tag) => tag.name)).toEqual(["react"]);
  });

  it("prunes tags that become unused after a content delete", async () => {
    const token = await signupAndSignin(app, "alice");
    const created = await createContent(token, { tags: ["react"] });

    await request(app)
      .delete("/api/v1/content")
      .set("Authorization", token)
      .send({ contentId: created.body.content._id })
      .expect(200);

    const tags = (await listTags(token)).body.tags as TagRow[];
    expect(tags).toEqual([]);
  });
});

describe("DELETE /api/v1/tags", () => {
  it("deletes a tag and pulls it from content", async () => {
    const token = await signupAndSignin(app, "alice");
    await createContent(token, { tags: ["react", "backend"] });
    const tags = (await listTags(token)).body.tags as TagRow[];
    const reactTag = tags.find((tag) => tag.name === "react");

    const res = await request(app)
      .delete("/api/v1/tags")
      .set("Authorization", token)
      .send({ tagId: reactTag?._id });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Tag deleted successfully");

    const remaining = (await listTags(token)).body.tags as TagRow[];
    expect(remaining.map((tag) => tag.name)).toEqual(["backend"]);

    const content = await request(app)
      .get("/api/v1/content")
      .set("Authorization", token);
    const names = (
      content.body.content[0].tags as { name: string }[]
    ).map((tag) => tag.name);
    expect(names).toEqual(["backend"]);
  });

  it("does not delete another user's tag", async () => {
    const alice = await signupAndSignin(app, "alice");
    const bob = await signupAndSignin(app, "bob");
    await createContent(alice, { tags: ["react"] });
    const aliceTag = ((await listTags(alice)).body.tags as TagRow[])[0];

    await request(app)
      .delete("/api/v1/tags")
      .set("Authorization", bob)
      .send({ tagId: aliceTag?._id })
      .expect(200);

    const tags = (await listTags(alice)).body.tags as TagRow[];
    expect(tags).toHaveLength(1);
  });

  it("rejects an invalid tag id", async () => {
    const token = await signupAndSignin(app, "alice");

    const res = await request(app)
      .delete("/api/v1/tags")
      .set("Authorization", token)
      .send({ tagId: "not-an-object-id" });

    expect(res.status).toBe(400);
  });
});
