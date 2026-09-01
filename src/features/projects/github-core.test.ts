import { describe, expect, it, vi } from "vitest";
import type { GitHubRepository } from "@/content/types";
import {
  canUseGitHubE2EFixture,
  fetchRepositoryStars,
  fetchStarsForRepositories,
  formatStarCount,
  mapWithConcurrency,
} from "./github-core";

const repository = "owner/repository" as GitHubRepository;

const mockFetcher = (
  implementation: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>,
) => vi.fn(implementation) as unknown as typeof fetch;

describe("GitHub stars", () => {
  it("never enables browser fixtures in production", () => {
    expect(
      canUseGitHubE2EFixture({ nodeEnv: "production", e2eTest: "1" }),
    ).toBe(false);
    expect(
      canUseGitHubE2EFixture({ nodeEnv: "development", e2eTest: "1" }),
    ).toBe(true);
  });

  it("returns zero stars honestly", async () => {
    const fetcher = mockFetcher(async () =>
      Response.json({ stargazers_count: 0 }),
    );
    await expect(fetchRepositoryStars(repository, { fetcher })).resolves.toBe(
      0,
    );
  });

  it.each([404, 403, 429])("gracefully handles HTTP %s", async (status) => {
    const fetcher = mockFetcher(async () => new Response(null, { status }));
    await expect(
      fetchRepositoryStars(repository, { fetcher }),
    ).resolves.toBeNull();
  });

  it.each([
    {},
    { stargazers_count: "12" },
    { stargazers_count: -1 },
    { stargazers_count: 1.5 },
  ])("rejects malformed repository payloads", async (payload) => {
    const fetcher = mockFetcher(async () => Response.json(payload));
    await expect(
      fetchRepositoryStars(repository, { fetcher }),
    ).resolves.toBeNull();
  });

  it("sets API and optional authentication headers", async () => {
    const fetcher = mockFetcher(async (_input, init) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer secret-token");
      expect(headers.get("Accept")).toBe("application/vnd.github+json");
      expect(headers.get("X-GitHub-Api-Version")).toBe("2022-11-28");
      return Response.json({ stargazers_count: 12 });
    });
    await fetchRepositoryStars(repository, { fetcher, token: "secret-token" });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("returns null when a request times out", async () => {
    const fetcher = mockFetcher(
      async (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(init.signal?.reason),
          );
        }),
    );
    await expect(
      fetchRepositoryStars(repository, { fetcher, timeoutMs: 5 }),
    ).resolves.toBeNull();
  });

  it("deduplicates repositories and bounds concurrent requests", async () => {
    let active = 0;
    let maximumActive = 0;
    const fetcher = mockFetcher(async () => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return Response.json({ stargazers_count: 3 });
    });
    const repositories = [
      "a/one",
      "b/two",
      "a/one",
      "c/three",
    ] as GitHubRepository[];
    const result = await fetchStarsForRepositories(repositories, {
      fetcher,
      concurrency: 2,
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(maximumActive).toBeLessThanOrEqual(2);
    expect(result).toEqual(
      new Map([
        ["a/one", 3],
        ["b/two", 3],
        ["c/three", 3],
      ]),
    );
  });

  it("rejects invalid concurrency", async () => {
    await expect(
      mapWithConcurrency([1], 0, async (value) => value),
    ).rejects.toThrow(RangeError);
  });

  it("compacts only values at or above one thousand", () => {
    expect(formatStarCount(999)).toBe("999");
    expect(formatStarCount(1_000)).toBe("1K");
    expect(formatStarCount(12_345)).toBe("12.3K");
  });
});
