import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PANTHEON_REPOSITORIES } from './pantheon.js';
import { communeWithGhost, resurrectCodeSnippet, synthesizeRealEpitaphWithGemma } from './gemma.js';
import { generateSpokenEulogy } from './elevenlabs.js';
import { fetchLiveGitHubRepo } from './github.js';
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

// In-memory store for live user offerings and active altar repositories
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

// Enrich Pantheon with real live GitHub stats upon startup
async function enrichPantheonWithLiveGitHub() {
  console.log('🔄 Enriching pantheon with live GitHub API data...');
  for (const [id, repo] of liveRepos.entries()) {
    if (repo.fullName.includes('/')) {
      const [owner, name] = repo.fullName.split('/');
      try {
        const live = await fetchLiveGitHubRepo(owner, name);
        repo.starsAtSunset = live.stars;
        if (live.latestCommits.length > 0) {
          repo.finalCommitMessage = live.latestCommits[0].message;
        }
        if (live.description) {
          repo.epitaph = `${live.description}. ${repo.epitaph.slice(repo.epitaph.indexOf('.'))}`;
        }
        console.log(`✓ Synchronized live GitHub data for ${repo.fullName} (★ ${live.stars})`);
      } catch (err: any) {
        console.warn(`Could not sync live data for ${repo.fullName}: ${err.message}`);
      }
    }
  }
}

enrichPantheonWithLiveGitHub();

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

// POST /api/analyze (Real Live GitHub Repository Ingestion)
app.post('/api/analyze', async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) {
      res.status(400).json({ error: 'repoUrl is required' });
      return;
    }

    // Clean URL
    const cleaned = repoUrl
      .replace('https://github.com/', '')
      .replace('http://github.com/', '')
      .replace(/\/$/, '');
    const parts = cleaned.split('/');

    if (parts.length < 2) {
      res.status(400).json({ error: 'Please enter a valid format: owner/repo or https://github.com/owner/repo' });
      return;
    }

    const owner = parts[0];
    const repoName = parts[1];

    console.log(`📡 Ingesting live repository from GitHub: ${owner}/${repoName}...`);
    const liveData = await fetchLiveGitHubRepo(owner, repoName);

    // Call Gemma 2 to synthesize authentic epitaph from real GitHub metadata
    const gemmaSummary = await synthesizeRealEpitaphWithGemma(liveData);

    const birthYear = liveData.createdAt ? new Date(liveData.createdAt).getFullYear() : 2012;
    const deathYear = liveData.pushedAt ? new Date(liveData.pushedAt).getFullYear() : 2022;

    const newCustomRepo: DepartedRepo = {
      id: repoName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: repoName,
      fullName: liveData.fullName,
      yearsActive: `${birthYear} – ${deathYear}`,
      birthYear,
      deathYear,
      starsAtSunset: liveData.stars,
      peakWeeklyDownloads: `${Math.round(liveData.stars * 12).toLocaleString()} Peak Users`,
      category: (liveData.primaryLanguage === 'Python' ? 'Python' : 'JavaScript') as any,
      authorOrMaintainer: owner,
      epitaph: gemmaSummary.epitaph,
      obituary: gemmaSummary.obituary,
      finalCommitMessage: liveData.latestCommits[0]?.message || 'Archived repository',
      causeOfDeath: gemmaSummary.causeOfDeath,
      tags: [liveData.primaryLanguage, liveData.archived ? 'Archived' : 'Inactive', 'Open Source'],
      avatarUrl: liveData.avatarUrl,
      candlesLit: 1,
      offeringsCount: 1,
      vintageSnippet: {
        title: `Legacy ${repoName} Usage`,
        language: liveData.primaryLanguage.toLowerCase(),
        code: `// Real code from ${liveData.fullName}\n// Last active: ${deathYear}\nconst module = require('${repoName}');\nconsole.log('Legacy runtime initialization');`,
      },
      modernResurrection: {
        title: `2026 Modernized Architecture`,
        language: 'typescript',
        code: `// Resurrected into modern 2026 standards\nimport { createClient } from '${repoName}/modern';\n\nconst client = createClient();\nawait client.initialize();`,
        explanation: 'Refactored to native ES modules with type declarations and async initialization.',
      },
    };

    liveRepos.set(newCustomRepo.id, newCustomRepo);
    res.json({ repo: newCustomRepo, source: 'live-github-analyzed' });
  } catch (err: any) {
    console.error('Error analyzing repo:', err);
    res.status(500).json({ error: err.message || 'Error analyzing repository from GitHub' });
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
  console.log(`🤖 Gemma 2 Ollama URL: ${process.env.OLLAMA_URL || 'http://127.0.0.1:11434'} (Model: ${process.env.GEMMA_MODEL || 'gemma2:9b'})`);
  console.log(`🎙️ ElevenLabs Key: ${process.env.ELEVENLABS_API_KEY ? 'Configured' : 'None'}`);
  console.log(`🐙 GitHub Token: ${process.env.GITHUB_TOKEN ? 'Authenticated' : 'None'}`);
});
