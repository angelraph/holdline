// Tavily, used as an accuracy mechanism: every search is locked to an allowlist of
// primary or trusted domains, and every result URL is re-checked here before use.

const API = "https://api.tavily.com";

export function hasTavily() {
  return !!process.env.TAVILY_API_KEY;
}

export function hostAllowed(url: string, allow: string[]): boolean {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return allow.some((d) => host === d || host.endsWith(`.${d}`));
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.TAVILY_API_KEY}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!r.ok) throw new Error(`Tavily ${path} ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return (await r.json()) as T;
}

export type SearchHit = { title: string; url: string; content: string };

export async function searchLocked(query: string, domains: string[], max = 5): Promise<{ hits: SearchHit[]; rejected: string[] }> {
  const res = await post<{ results: SearchHit[] }>("/search", {
    query,
    include_domains: domains,
    max_results: max,
    search_depth: "basic",
  });
  const hits: SearchHit[] = [];
  const rejected: string[] = [];
  for (const h of res.results ?? []) {
    if (hostAllowed(h.url, domains)) hits.push(h);
    else rejected.push(h.url);
  }
  return { hits, rejected };
}

export async function extract(urls: string[]): Promise<{ url: string; raw_content: string }[]> {
  const res = await post<{ results: { url: string; raw_content: string }[] }>("/extract", { urls, extract_depth: "basic" });
  return res.results ?? [];
}
