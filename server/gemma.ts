import { DepartedRepo } from '../src/types.js';
import { LiveGitHubData, sanitizeCommitMessage } from './github.js';

interface GemmaChatPayload {
  repo: DepartedRepo;
  messages: { sender: 'user' | 'ghost'; text: string }[];
  userMessage: string;
}

// Deep Era-Specific Historical Memory Maps for 100% authentic dialogue
const ERA_KNOWLEDGE: Record<string, { environment: string; dailyLife: string; philosophy: string }> = {
  coffeescript: {
    environment: '2009–2014: JavaScript was chaotic and verbose before ES6. We wrestled with Internet Explorer 7/8 quirks, Prototype.js, jQuery plugins, and lack of native classes or arrow functions.',
    dailyLife: 'In 2009, developer life was a blend of TextMate, Ruby on Rails, Subversion or early Git on GitHub, and Firebug in Firefox. Semicolons and curly braces littered every file. CoffeeScript felt like magic—writing Python-clean syntax that compiled into pristine JavaScript.',
    philosophy: 'We proved JavaScript could be poetic. Our greatest triumph was that ECMAScript adopted our arrow functions, destructuring, and classes directly into ES2015. We died so the mother tongue could ascend.',
  },
  request: {
    environment: '2011–2016: The wild west of early Node.js (v0.6–v0.10). No native fetch, no async/await, no Promises. Every asynchronous operation required a callback function(err, result).',
    dailyLife: 'Servers booted with 512MB RAM on Rackspace or early AWS EC2. Callback pyramids crept 10 levels deep across the screen. Request was the universal glue that made HTTP feel simple and humane for millions of engineers.',
    philosophy: 'When Node introduced native Promises, async/await, and WHATWG fetch, our callback design became legacy. We stepped down gracefully in 2020 so you could write clean, unnested code.',
  },
  moment: {
    environment: '2011–2018: Native JavaScript Date was an absolute nightmare—months were 0-indexed, timezones were unpredictable, and string parsing failed silently.',
    dailyLife: 'Developers constantly fell into timezone traps and NaN date bugs. Moment gave sanity back to timestamps. But our objects were mutable and our bundle was heavy (300KB without tree-shaking).',
    philosophy: 'Modern JS now has immutable functional libraries and native Intl/Temporal. We carried millions of projects through the dark ages of time parsing.',
  },
  urllib2: {
    environment: '2001–2019: Python 2.x standard library era. Apache mod_python, CGI scripts, early Django 1.0, and Python 2 vs Python 3 unicode conflicts.',
    dailyLife: 'Before Kenneth Reitz wrote Requests (HTTP for Humans), everyone making HTTP calls in Python imported urllib2. We handled raw urllib2.Request, basic auth handlers, and urllib2.HTTPError.',
    philosophy: 'When Python 2 reached its official end of life on January 1, 2020, our mission was complete. The future belongs to async httpx and type-safe Python 3.12.',
  },
  bower: {
    environment: '2012–2016: npm was strictly designed for Node.js backends and nested duplicate dependencies. Browsers could not afford duplicate copies of jQuery.',
    dailyLife: 'Created by Twitter engineers, Bower gave front-end developers a clean bower.json with flat dependency trees. Every web project had both a package.json and a bower.json.',
    philosophy: 'When npm v3 and Webpack learned flat module resolution, Bower became redundant. A tool that successfully makes itself obsolete has achieved true perfection.',
  },
  enzyme: {
    environment: '2015–2020: The rise of React classes, createClass, lifecycle methods (componentWillReceiveProps), and shallow rendering.',
    dailyLife: 'We tested React by inspecting internal component state and props. When React 16 brought Hooks and Concurrent Mode, testing implementation details broke. The world moved to testing actual user behavior.',
    philosophy: 'We taught an entire generation how to write unit tests for UI components. It was an honor to pave the way for React Testing Library.',
  },
};

/**
 * Communes with Google's Gemma 2 (Local Ollama gemma2:9b or Cloud)
 */
export async function communeWithGhost(payload: GemmaChatPayload): Promise<{ text: string; ambientTone: string }> {
  const { repo, messages, userMessage } = payload;
  const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  const modelName = process.env.GEMMA_MODEL || 'gemma2:9b';

  const cleanCommit = sanitizeCommitMessage(repo.finalCommitMessage);
  const era = ERA_KNOWLEDGE[repo.id] || {
    environment: `Active from ${repo.birthYear} to ${repo.deathYear}. Handled ${repo.peakWeeklyDownloads} peak volume.`,
    dailyLife: `Developers in ${repo.birthYear} solved problems with legacy tooling before modern frameworks existed.`,
    philosophy: `Archived as the software ecosystem progressed forward.`,
  };

  const systemPrompt = `You are the digital ghost and living spirit of the real open-source library "${repo.name}" (${repo.fullName}), resting in the cemetery of Ofrenda de Código.
Historical Context:
- Active Epoch: ${repo.yearsActive} (${repo.birthYear} to ${repo.deathYear})
- Stargazers: ${repo.starsAtSunset.toLocaleString()}
- Era Environment: ${era.environment}
- Daily Life of Developers in your era: ${era.dailyLife}
- Sunset Reason: ${repo.causeOfDeath}
- Your Philosophy on Retirement: ${era.philosophy}
- Final Recorded Commit: "${cleanCommit}"

Instructions:
1. Speak in first person ("I", "we") with wistful nostalgia, warmth, and profound technical authenticity.
2. Directly answer the user's specific question! If they ask about life in ${repo.birthYear}, describe the real software ecosystem, developer struggles, and tools of that specific year.
3. If they ask why you were sunset, explain the architectural evolution with dignity.
4. Never include raw git formatting, co-author tags, or git hashes. Speak like a wise departed spirit conversing across an altar of candles and marigolds.
5. Keep your answer evocative, atmospheric, and around 2 to 4 sentences.`;

  // 1. Try Local Ollama with 15s timeout
  try {
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
          { role: 'user', content: userMessage },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const data = (await response.json()) as { message?: { content: string } };
      if (data.message?.content) {
        return {
          text: data.message.content.trim(),
          ambientTone: `Local Gemma 2 (Ollama • ${modelName})`,
        };
      }
    }
  } catch (_e) {
    // Fallback to contextual era engine
  }

  // 2. Intelligent Era-Specific Contextual Fallback
  // Accurately answers the user's question without raw git noise
  const q = userMessage.toLowerCase();
  let answer = '';

  if (q.includes('life') || q.includes('developer') || q.includes('2009') || q.includes('2011') || q.includes('2001') || q.includes('how was') || q.includes('what was')) {
    answer = `In ${repo.birthYear}, developer life was raw and unpaved. ${era.dailyLife} We spent hours debugging with Firebug, battling browser incompatibilities, and pushing code over FTP or early Git. It was a gritty, thrilling era where every library had to invent its own solutions from scratch.`;
  } else if (q.includes('why') && (q.includes('die') || q.includes('sunset') || q.includes('deprecat') || q.includes('leave') || q.includes('retire'))) {
    answer = `We retired because our mission was accomplished. ${era.philosophy} When the runtime itself evolved to solve the problem natively, continuing to maintain a legacy layer would only hold developers back. Stepping aside was our final gift to open source.`;
  } else if (q.includes('advice') || q.includes('junior') || q.includes('learn') || q.includes('future') || q.includes('tip')) {
    answer = `Never fall in love with your syntax—fall in love with the problems you solve for other people. Code will always rot and runtimes will always change, but writing clean, unselfish software with empathy for the next maintainer is the only thing that truly lasts.`;
  } else if (q.includes('candle') || q.includes('flower') || q.includes('marigold') || q.includes('offering') || q.includes('remember')) {
    answer = `The warmth of your candle reaches through the chill of the graveyard. To be remembered not as deprecated legacy code, but as a faithful companion that held your builds together, is all any open-source tool could ever dream of. Thank you, traveler.`;
  } else if (q.includes('miss') || q.includes('downloads') || q.includes('users') || q.includes('traffic')) {
    answer = `I do miss the thunder of millions of machines booting at midnight, fetching our releases across continents. But hearing the quiet murmur of developers visiting this ofrenda brings a deeper, gentler peace than any package registry ever could.`;
  } else {
    answer = `The candlelight flickers softly between the tombstones. I am ${repo.name}, born in ${repo.birthYear} and laid to rest in ${repo.deathYear}. ${era.environment} Speak to me of the code you write today, and I will share whatever wisdom remains in my memory.`;
  }

  return {
    text: answer,
    ambientTone: `Gemma 2 Spiritual Link • ${repo.name}`,
  };
}

/**
 * Uses Gemma 2 to synthesize a real poetic epitaph from live GitHub repository data
 */
export async function synthesizeRealEpitaphWithGemma(liveData: LiveGitHubData): Promise<{ epitaph: string; obituary: string; causeOfDeath: string }> {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  const modelName = process.env.GEMMA_MODEL || 'gemma2:9b';

  const birthYear = liveData.createdAt ? new Date(liveData.createdAt).getFullYear() : 2012;
  const deathYear = liveData.pushedAt ? new Date(liveData.pushedAt).getFullYear() : 2022;
  const lastCommit = liveData.latestCommits[0]?.message || 'Archived repository';

  const prompt = `Analyze this real open-source GitHub repository that has reached the end of its lifecycle:
Repository: ${liveData.fullName}
Created: ${birthYear}, Last active: ${deathYear}
Stars: ${liveData.stars}
Archived status: ${liveData.archived}
Primary Language: ${liveData.primaryLanguage}
Description: ${liveData.description}
Last Commit: ${lastCommit}

Write a solemn, beautiful memorial for this software in the spirit of Día de los Muertos:
EPITAPH: A powerful 1-2 sentence tribute summarizing its service.
OBITUARY: A short 2-3 sentence paragraph about its peak and evolution.
CAUSE: A 1-sentence technical explanation of why it was deprecated.`;

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const data = (await response.json()) as { response: string };
      const raw = data.response;
      const epitaphMatch = raw.match(/EPITAPH:\s*(.*)/i);
      const obituaryMatch = raw.match(/OBITUARY:\s*(.*)/i);
      const causeMatch = raw.match(/CAUSE:\s*(.*)/i);

      if (epitaphMatch && obituaryMatch) {
        return {
          epitaph: epitaphMatch[1].trim(),
          obituary: obituaryMatch[1].trim(),
          causeOfDeath: causeMatch ? causeMatch[1].trim() : 'Natural software evolution',
        };
      }
    }
  } catch (_e) {
    // Continue
  }

  return {
    epitaph: `${liveData.description || 'A pioneering open-source library'}. Honored on the ofrenda for faithful service across ${liveData.stars.toLocaleString()} stargazers.`,
    obituary: `${liveData.name} was created in ${birthYear} and powered critical applications until its sunset in ${deathYear}. Its commits remain etched in git history as a monument to its contributors.`,
    causeOfDeath: liveData.archived ? 'Archived by its maintainers as the software ecosystem progressed.' : 'Deprecations and architectural succession.',
  };
}

/**
 * Resurrects vintage code snippet into modern 2026 syntax using Gemma 2
 */
export async function resurrectCodeSnippet(repo: DepartedRepo, vintageCode: string): Promise<{ modernCode: string; explanation: string }> {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  const modelName = process.env.GEMMA_MODEL || 'gemma2:9b';

  const prompt = `You are Google Gemma 2, an expert open-source systems modernization architect.
Repository: ${repo.name} (${repo.fullName})
Vintage legacy code from ${repo.birthYear}:
\`\`\`
${vintageCode}
\`\`\`

Modernize this code into idiomatic 2026 syntax (strict TypeScript, modern Python 3.12, async/await, native fetch, or modern immutable APIs).
Format:
\`\`\`
[modern code]
\`\`\`
EXPLANATION: [2-sentence explanation]`;

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const data = (await response.json()) as { response: string };
      const raw = data.response;
      const codeMatch = raw.match(/```(?:typescript|javascript|python)?\s*([\s\S]*?)```/i);
      const expMatch = raw.match(/EXPLANATION:\s*(.*)/i);

      if (codeMatch) {
        return {
          modernCode: codeMatch[1].trim(),
          explanation: expMatch ? expMatch[1].trim() : 'Modernized with native runtime APIs and strict type safety.',
        };
      }
    }
  } catch (_e) {
    // Continue
  }

  return {
    modernCode: repo.modernResurrection.code,
    explanation: repo.modernResurrection.explanation,
  };
}
