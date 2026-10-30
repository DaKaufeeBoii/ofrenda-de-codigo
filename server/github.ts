export interface LiveGitHubData {
  owner: string;
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  createdAt: string;
  pushedAt: string;
  archived: boolean;
  license: string;
  primaryLanguage: string;
  languages: Record<string, number>;
  latestCommits: {
    sha: string;
    message: string;
    author: string;
    date: string;
  }[];
  readmeSnippet: string;
  avatarUrl: string;
}

/**
 * Strips raw git trailers, Co-authored-by tags, PR numbers (#123), and newlines
 */
export function sanitizeCommitMessage(rawMessage: string): string {
  if (!rawMessage) return 'Archived repository';
  
  // Take first line only (the subject line)
  const firstLine = rawMessage.split('\n')[0].trim();
  
  // Clean up PR references (#123) and commit metadata
  const cleaned = firstLine
    .replace(/\s*\(\#[0-9]+\)/g, '')
    .replace(/^Merge pull request.*$/i, 'Final merge before sunset')
    .replace(/^Co-authored-by:.*$/gim, '')
    .trim();

  return cleaned || 'Maintained with dedication until final sunset';
}

export async function fetchLiveGitHubRepo(owner: string, repo: string): Promise<LiveGitHubData> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Ofrenda-De-Codigo-3D',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // 1. Fetch Repository Metadata
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) {
    throw new Error(`GitHub API returned status ${repoRes.status}: ${repoRes.statusText}`);
  }
  const repoJson: any = await repoRes.json();

  // 2. Fetch Recent Commits
  let latestCommits: any[] = [];
  try {
    const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`, { headers });
    if (commitsRes.ok) {
      const commitsJson: any = await commitsRes.json();
      latestCommits = commitsJson.map((c: any) => ({
        sha: c.sha.substring(0, 7),
        message: sanitizeCommitMessage(c.commit.message),
        author: c.commit.author?.name || c.author?.login || 'Maintainer',
        date: c.commit.author?.date || c.commit.committer?.date || '',
      }));
    }
  } catch (_e) {
    // Continue
  }

  // 3. Fetch Languages
  let languages: Record<string, number> = {};
  try {
    const langRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers });
    if (langRes.ok) {
      languages = (await langRes.json()) as Record<string, number>;
    }
  } catch (_e) {
    // Continue
  }

  // 4. Fetch README snippet
  let readmeSnippet = '';
  try {
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
    if (readmeRes.ok) {
      const readmeJson: any = await readmeRes.json();
      if (readmeJson.content) {
        const decoded = Buffer.from(readmeJson.content, 'base64').toString('utf-8');
        readmeSnippet = decoded.slice(0, 1500);
      }
    }
  } catch (_e) {
    // Continue
  }

  return {
    owner,
    name: repo,
    fullName: repoJson.full_name,
    description: repoJson.description || 'No description provided on GitHub.',
    stars: repoJson.stargazers_count,
    forks: repoJson.forks_count,
    openIssues: repoJson.open_issues_count,
    createdAt: repoJson.created_at,
    pushedAt: repoJson.pushed_at,
    archived: repoJson.archived || false,
    license: repoJson.license?.spdx_id || repoJson.license?.name || 'Open Source',
    primaryLanguage: repoJson.language || Object.keys(languages)[0] || 'Unknown',
    languages,
    latestCommits,
    readmeSnippet,
    avatarUrl: repoJson.owner?.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
  };
}
