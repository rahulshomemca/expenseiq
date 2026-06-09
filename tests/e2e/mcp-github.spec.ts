import { test, expect } from "@playwright/test";

const GITHUB_API = "https://api.github.com";
const REPO_OWNER = "rahulshomemca";
const REPO_NAME = "expenseiq";
const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN ?? "";

test.describe("GitHub MCP: issue tracking integration", () => {
  test("issue #1 exists in the repository", async ({ request }) => {
    // This test requires GITHUB_PERSONAL_ACCESS_TOKEN to be set.
    // It will get a 401 without a token and a 404 if the issue doesn't exist.
    test.skip(!TOKEN, "GITHUB_PERSONAL_ACCESS_TOKEN not set — skipping");

    const response = await request.get(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/issues/1`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    // Issue must exist (200) or be a redirect (301)
    expect([200, 301]).toContain(response.status());
  });

  test("issue #1 is closed (bugfix pipeline complete)", async ({ request }) => {
    // FAILS until issue #1 is created and closed as part of the bugfix pipeline.
    test.skip(!TOKEN, "GITHUB_PERSONAL_ACCESS_TOKEN not set — skipping");

    const response = await request.get(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/issues/1`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    expect(response.status()).toBe(200);
    const issue = await response.json();
    expect(issue.state).toBe("closed");
  });
});
