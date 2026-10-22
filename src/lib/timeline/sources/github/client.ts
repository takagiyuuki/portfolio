import { z } from 'astro/zod';

const api = 'https://api.github.com';

function headers(): Record<string, string> {
  const result: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'yukit.dev-timeline',
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    result.Authorization = `Bearer ${token}`;
  }
  return result;
}

/** Returns the parsed body as unknown so callers must validate its shape. */
export async function githubRest(path: string): Promise<unknown> {
  const response = await fetch(`${api}${path}`, { headers: headers() });
  if (!response.ok) {
    throw new Error(`GitHub ${path}: ${response.status} ${response.statusText}`);
  }
  const body: unknown = await response.json();
  return body;
}

const graphqlResponse = z.object({
  data: z.unknown().optional(),
  errors: z.array(z.object({ message: z.string() })).optional(),
});

/** GraphQL reports failures with HTTP 200 and an `errors` array, so both are checked. */
export async function githubGraphql(
  query: string,
  variables: Record<string, unknown>,
): Promise<unknown> {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GitHub GraphQL requires GITHUB_TOKEN');
  }
  const response = await fetch(`${api}/graphql`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new Error(`GitHub GraphQL: ${response.status} ${response.statusText}`);
  }
  const body = graphqlResponse.parse(await response.json());
  if (body.errors && body.errors.length > 0) {
    throw new Error(`GitHub GraphQL: ${body.errors.map((e) => e.message).join('; ')}`);
  }
  return body.data;
}
