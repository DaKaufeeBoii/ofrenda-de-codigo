import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PANTHEON_REPOSITORIES } from './pantheon.js';
import { communeWithGhost, resurrectCodeSnippet } from './gemma.js';
import { generateSpokenEulogy } from './elevenlabs.js';
import { AltarOffering, DepartedRepo } from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In production, serve the built static frontend
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// In-memory store for live user offerings and candles
const liveRepos = new Map<string, DepartedRepo>();
PANTHEON_REPOSITORIES.forEach((r) => liveRepos.set(r.id, { ...r }));

const offeringsStore: AltarOffering[] = [
  {
    id: 'off-1',
    repoId: 'request',
    repoName: 'request',
    authorName: 'Alex M.',
    offeringType: 'marigold',
    message: 'Thank you for getting me through my first junior dev job in 2014. Rest well.',
    timestamp: '2026-10-30T10:14:00Z',
  },
  {
    id: 'off-2',
    repoId: 'moment',
    repoName: 'moment.js',
    authorName: 'Sarah K.',
    offeringType: 'candle',
    message: 'A candle for every time you parsed an impossible date format for me without complaining.',
    timestamp: '2026-10-30T11:22:00Z',
  },
  {
    id: 'off-3',
    repoId: 'coffeescript',
    repoName: 'CoffeeScript',
    authorName: 'David R.',
    offeringType: 'pan_de_muerto',
    message: 'You gave us arrow functions before the world was ready. A true pioneer.',
    timestamp: '2026-10-30T12:05:00Z',
  },
  {
    id: 'off-4',
    repoId: 'urllib2',
    repoName: 'urllib2 (Python 2)',
    authorName: 'Elena P.',
    offeringType: 'coffee',
    message: 'Farewell old friend of Python 2.7. You wrote the first web scrapers I ever ran.',
    timestamp: '2026-10-30T12:20:00Z',
  },
];

// GET /api/pantheon
app.get('/api/pantheon', (_req, res) => {
  res.json(Array.from(liveRepos.values()));
});

// GET /api/repo/:id
app.get('/api/repo/:id', (req, res) => {
  const repo = liveRepos.get(req.params.id);
  if (!repo) {
    res.status(404).json({ error: 'Repository not found on the ofrenda' });
    return;
  }
  res.json(repo);
});

// POST /api/altar/candle
app.post('/api/altar/candle', (req, res) => {
  const { repoId } = req.body;
  const repo = liveRepos.get(repoId);
  if (!repo) {
    res.status(404).json({ error: 'Repository not found' });
    return;
  }
  repo.candlesLit += 1;
  res.json({ success: true, candlesLit: repo.candlesLit });
});

// POST /api/altar/offering
app.post('/api/altar/offering', (req, res) => {
  const { repoId, authorName, offeringType, message } = req.body;
  const repo = liveRepos.get(repoId);
  if (!repo) {
    res.status(404).json({ error: 'Repository not found' });
    return;
  }

  const newOffering: AltarOffering = {
    id: `off-${Date.now()}`,
    repoId,
    repoName: repo.name,
    authorName: authorName || 'Anonymous Devotee',
    offeringType: offeringType || 'candle',
    message: message || 'Rest in peace among the immortals of open source.',
    timestamp: new Date().toISOString(),
  };

  offeringsStore.unshift(newOffering);
  repo.offeringsCount += 1;

  res.json({ success: true, offering: newOffering, offeringsCount: repo.offeringsCount });
});

// GET /api/altar/offerings
app.get('/api/altar/offerings', (_req, res) => {
  res.json(offeringsStore.slice(0, 30));
});

// POST /api/ghost/chat
app.post('/api/ghost/chat', async (req, res) => {
  try {
    const { repoId, messages, userMessage } = req.body;
    const repo = liveRepos.get(repoId);
    if (!repo) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    const reply = await communeWithGhost({
      repo,
      messages: messages || [],
      userMessage: userMessage || 'Hello spirit',
    });

    res.json(reply);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error communing with ghost' });
  }
});

// POST /api/resurrect
app.post('/api/resurrect', async (req, res) => {
  try {
    const { repoId, vintageCode } = req.body;
    const repo = liveRepos.get(repoId);
    if (!repo) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    const result = await resurrectCodeSnippet(repo, vintageCode || repo.vintageSnippet.code);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error resurrecting code' });
  }
});

// POST /api/eulogy/narrate
app.post('/api/eulogy/narrate', async (req, res) => {
  try {
    const { repoId } = req.body;
    const repo = liveRepos.get(repoId);
    if (!repo) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    const eulogy = await generateSpokenEulogy(repo);
    res.json(eulogy);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error generating eulogy audio' });
  }
});

// POST /api/analyze (Custom GitHub Repo Ingestion)
app.post('/api/analyze', async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) {
      res.status(400).json({ error: 'repoUrl is required' });
      return;
    }

    // Extract owner/repo
    const match = repoUrl.replace('https://github.com/', '').replace(/\/$/, '').split('/');
    if (match.length < 2) {
      res.status(400).json({ error: 'Invalid GitHub repository URL format' });
      return;
    }

    const owner = match[0];
    const repoName = match[1];
    const fullName = `${owner}/${repoName}`;

    // Check if already in live map
    for (const repo of liveRepos.values()) {
      if (repo.fullName.toLowerCase() === fullName.toLowerCase()) {
        res.json({ repo, source: 'existing' });
        return;
      }
    }

    // Fetch from GitHub REST API
    let ghData: any = null;
    try {
      const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
        headers: { 'User-Agent': 'Ofrenda-De-Codigo-Agent' },
      });
      if (ghRes.ok) {
        ghData = await ghRes.json();
      }
    } catch (_e) {
      // Offline fallback
    }

    const birthYear = ghData?.created_at ? new Date(ghData.created_at).getFullYear() : 2015;
    const deathYear = ghData?.pushed_at ? new Date(ghData.pushed_at).getFullYear() : 2021;
    const stars = ghData?.stargazers_count ?? 1200;
    const desc = ghData?.description || 'A forgotten open-source tool that once served the community faithfully.';

    const newCustomRepo: DepartedRepo = {
      id: repoName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: repoName,
      fullName: fullName,
      yearsActive: `${birthYear} – ${deathYear}`,
      birthYear,
      deathYear,
      starsAtSunset: stars,
      peakWeeklyDownloads: 'Uncounted Community Users',
      category: 'Web & CSS',
      authorOrMaintainer: ghData?.owner?.login || owner,
      epitaph: `${desc}. Archived in honour of its service to the open-source community.`,
      obituary: `${repoName} was conceived in ${birthYear} by ${owner}. It saw active commits until ${deathYear}, providing valuable solutions for developers worldwide before resting in the archives.`,
      finalCommitMessage: 'final maintenance commit: archiving repository',
      causeOfDeath: ghData?.archived ? 'Archived by maintainer on GitHub' : 'Inactivity and natural software succession',
      tags: ['Custom Altar', 'Open Source', 'Departed'],
      avatarUrl: ghData?.owner?.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
      candlesLit: 1,
      offeringsCount: 1,
      vintageSnippet: {
        title: `Legacy ${repoName} Usage`,
        language: 'javascript',
        code: `// Legacy code from ${fullName}\nconst legacyModule = require('${repoName}');\nconsole.log('Running legacy module from ${birthYear}...');`,
      },
      modernResurrection: {
        title: `Modernized 2026 Architecture`,
        language: 'typescript',
        code: `// Reborn with modern ESM and type safety\nimport { createClient } from '${repoName}/modern';\n\nconst client = createClient();\nawait client.initialize();`,
        explanation: 'Updated to standard ECMAScript modules (ESM) and async initialization.',
      },
    };

    liveRepos.set(newCustomRepo.id, newCustomRepo);
    res.json({ repo: newCustomRepo, source: 'analyzed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error analyzing repository' });
  }
});

// Fallback for SPA routing in production
if (fs.existsSync(distPath)) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🕯️ Ofrenda de Código server listening on http://localhost:${PORT}`);
});
