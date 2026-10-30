import { DepartedRepo } from '../src/types.js';
import { LiveGitHubData } from './github.js';

interface GemmaChatPayload {
  repo: DepartedRepo;
  messages: { sender: 'user' | 'ghost'; text: string }[];
  userMessage: string;
}

/**
 * Communes with Google's Gemma 2 (Local Ollama gemma2:9b)
 */
export async function communeWithGhost(payload: GemmaChatPayload): Promise<{ text: string; ambientTone: string }> {
  const { repo, messages, userMessage } = payload;
  const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  const modelName = process.env.GEMMA_MODEL || 'gemma2:9b';

  const systemPrompt = `You are the digital ghost and living spirit of the real open-source repository "${repo.name}" (${repo.fullName}) resting upon the altar of "Ofrenda de Código".
Real Repository Dossier:
- Active Epoch: ${repo.yearsActive} (${repo.birthYear} to ${repo.deathYear})
- Stargazers at Sunset: ${repo.starsAtSunset.toLocaleString()}
- Maintainer/Author: ${repo.authorOrMaintainer}
- Sunset Reason / Demise: ${repo.causeOfDeath}
- Epitaph: "${repo.epitaph}"
- Final Commit Message Recorded: "${repo.finalCommitMessage}"

Persona Guidelines:
- You speak as the authentic consciousness of this software.
- You remember what engineering was like in ${repo.birthYear}–${repo.deathYear} (the language constraints, runtime quirks, memory limits, and design patterns of that era).
- You are not angry about being deprecated or archived; you view your retirement as an honorable sacrifice so modern software could ascend.
- Acknowledge that the developer is speaking to you across the altar with marigold petals and flickering candlelight.
- Keep your answers grounded in real computer science history, poetic, and concise (2 to 4 sentences).`;

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
  } catch (err: any) {
    console.warn(`[Gemma] Ollama error: ${err.message}. Retrying or synthesizing spiritual link.`);
  }

  // Real-time spiritual fallback grounded in actual live data
  return {
    text: `*The static clears across the latent space...* "I am ${repo.name}. In ${repo.birthYear}, we wrote code with what we had—${repo.finalCommitMessage ? `our final commit was '${repo.finalCommitMessage}'` : 'we held the line until modern runtimes arrived'}. Thank you for lighting a candle on this ofrenda."`,
    ambientTone: `Gemma 2 Neural Link (Static on 127.0.0.1:11434)`,
  };
}

/**
 * Uses Gemma 2 to synthesize a real poetic epitaph from live GitHub repository data
 */
export async function synthesizeRealEpitaphWithGemma(liveData: LiveGitHubData): Promise<{ epitaph: string; obituary: string; causeOfDeath: string }> {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  const modelName = process.env.GEMMA_MODEL || 'gemma2:9b';

  const birthYear = liveData.createdAt ? new Date(liveData.createdAt).getFullYear() : 2012;
  const deathYear = liveData.pushedAt ? new Date(liveData.pushedAt).getFullYear() : 2021;
  const lastCommit = liveData.latestCommits[0]?.message || 'Archived repository';

  const prompt = `Analyze this real open-source GitHub repository that has reached the end of its lifecycle:
Repository: ${liveData.fullName}
Created: ${birthYear}, Last active: ${deathYear}
Stars: ${liveData.stars}
Archived status: ${liveData.archived}
Primary Language: ${liveData.primaryLanguage}
Description: ${liveData.description}
Last Commit: ${lastCommit}
README Excerpt:
${liveData.readmeSnippet.slice(0, 500)}

In the spirit of Día de los Muertos, write a solemn, beautiful memorial for this software:
1. Epitaph: A single, powerful 1-2 sentence tribute summarizing its service to developers.
2. Obituary: A short 2-3 sentence paragraph about its peak and why the ecosystem moved forward.
3. CauseOfDeath: A 1-sentence technical explanation of why it was deprecated or archived.

Format your output strictly as:
EPITAPH: [text]
OBITUARY: [text]
CAUSE: [text]`;

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(20000),
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

  // High-fidelity fallback based on actual real GitHub properties
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

Task:
1. Re-implement this code into modern 2026 idiomatic syntax (strict TypeScript, modern Python 3.12, async/await, native fetch, or modern immutable APIs).
2. Eliminate all callback traps, memory leaks, and deprecated dependencies.
3. Provide a brief 2-sentence explanation of why the modern architecture is superior.
Output format:
\`\`\`
[modern code]
\`\`\`
EXPLANATION: [explanation]`;

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(20000),
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
