import "server-only";
import type { GitHubRepository } from "@/content/types";
import {
  canUseGitHubE2EFixture,
  fetchStarsForRepositories,
  type GitHubFetchOptions,
} from "./github-core";

const CACHE_SECONDS = 60 * 60 * 24;

function readE2EFixture(): Map<GitHubRepository, number | null> | null {
  if (
    !canUseGitHubE2EFixture({
      nodeEnv: process.env.NODE_ENV,
      e2eTest: process.env.E2E_TEST,
    }) ||
    !process.env.E2E_GITHUB_STARS
  ) {
    return null;
  }
  try {
    return new Map(
      Object.entries(JSON.parse(process.env.E2E_GITHUB_STARS) as object).map(
        ([repository, count]) => [
          repository as GitHubRepository,
          typeof count === "number" ? count : null,
        ],
      ),
    );
  } catch {
    return new Map();
  }
}

export async function getGitHubStars(
  repositories: readonly GitHubRepository[],
): Promise<Map<GitHubRepository, number | null>> {
  const fixture = readE2EFixture();
  if (fixture) return fixture;

  const requestInit: GitHubFetchOptions["requestInit"] & {
    next: { revalidate: number; tags: string[] };
  } = {
    next: { revalidate: CACHE_SECONDS, tags: ["github-stars"] },
  };
  return fetchStarsForRepositories(repositories, {
    token: process.env.GITHUB_TOKEN,
    timeoutMs: 3_500,
    concurrency: 4,
    requestInit,
  });
}
