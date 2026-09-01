import type { GitHubRepository } from "@/content/types";

export type GitHubFetchOptions = {
  fetcher?: typeof fetch;
  token?: string | undefined;
  timeoutMs?: number;
  requestInit?: RequestInit;
};

type GitHubRepositoryResponse = { stargazers_count?: unknown };

export function canUseGitHubE2EFixture(runtime: {
  nodeEnv: string | undefined;
  e2eTest: string | undefined;
}): boolean {
  return runtime.nodeEnv === "development" && runtime.e2eTest === "1";
}

export async function fetchRepositoryStars(
  repository: GitHubRepository,
  options: GitHubFetchOptions = {},
): Promise<number | null> {
  const { fetcher = fetch, token, timeoutMs = 3_500, requestInit } = options;
  const headers = new Headers(requestInit?.headers);
  headers.set("Accept", "application/vnd.github+json");
  headers.set("X-GitHub-Api-Version", "2022-11-28");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  try {
    const response = await fetcher(
      `https://api.github.com/repos/${repository}`,
      {
        ...requestInit,
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      },
    );
    if (!response.ok) return null;

    const payload = (await response.json()) as GitHubRepositoryResponse;
    return typeof payload.stargazers_count === "number" &&
      Number.isSafeInteger(payload.stargazers_count) &&
      payload.stargazers_count >= 0
      ? payload.stargazers_count
      : null;
  } catch {
    return null;
  }
}

export async function mapWithConcurrency<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError("Concurrency must be a positive integer.");
  }
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      const value = values[index];
      if (value !== undefined) results[index] = await mapper(value);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, worker),
  );
  return results;
}

export async function fetchStarsForRepositories(
  repositories: readonly GitHubRepository[],
  options: GitHubFetchOptions & { concurrency?: number } = {},
): Promise<Map<GitHubRepository, number | null>> {
  const uniqueRepositories = [...new Set(repositories)];
  const entries = await mapWithConcurrency(
    uniqueRepositories,
    options.concurrency ?? 4,
    async (repository) =>
      [repository, await fetchRepositoryStars(repository, options)] as const,
  );
  return new Map(entries);
}

const compactNumberFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatStarCount = (count: number): string =>
  count >= 1_000 ? compactNumberFormatter.format(count) : count.toString();
