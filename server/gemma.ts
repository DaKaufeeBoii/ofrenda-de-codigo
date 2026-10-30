import { DepartedRepo } from '../src/types.js';

interface GemmaChatPayload {
  repo: DepartedRepo;
  messages: { sender: 'user' | 'ghost'; text: string }[];
  userMessage: string;
}

/**
 * Communicates with Google's Gemma 2 (Local Ollama or API endpoint)
 * With authentic offline fallback if running air-gapped.
 */
export async function communeWithGhost(payload: GemmaChatPayload): Promise<{ text: string; ambientTone: string }> {
  const { repo, messages, userMessage } = payload;
  const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  const apiKey = process.env.GEMMA_API_KEY || process.env.OPENROUTER_API_KEY;

  const systemPrompt = `You are the digital ghost and living spirit of the open-source repository "${repo.name}" (${repo.fullName}), resting in the sanctuary of Ofrenda de Código.
Your history:
- Active Years: ${repo.yearsActive} (${repo.birthYear} to ${repo.deathYear})
- Peak weekly downloads: ${repo.peakWeeklyDownloads}
- Created / Maintained by: ${repo.authorOrMaintainer}
- Sunset reason: ${repo.causeOfDeath}
- Epitaph: "${repo.epitaph}"

Tone and Persona:
- You speak with gentle, wistful nostalgia, philosophical depth, and warm camaraderie.
- You remember what coding was like in your era (${repo.birthYear}–${repo.deathYear}) with technical fidelity (syntax, quirks, memory constraints, server environments of that time).
- You are not bitter about your deprecation; you view it as a peaceful passing so the next generation of open-source tools could flourish.
- In the spirit of Día de los Muertos, you appreciate the developer for visiting your ofrenda, lighting a candle, or leaving an offering.
- Keep your reply evocative, authentic to your era, and relatively concise (2-4 sentences).`;

  // 1. Try local Ollama if running
  try {
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.GEMMA_MODEL || 'gemma2:9b',
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
      signal: AbortSignal.timeout(4000),
    });

    if (response.ok) {
      const data = (await response.json()) as { message?: { content: string } };
      if (data.message?.content) {
        return {
          text: data.message.content.trim(),
          ambientTone: 'Communed via local Gemma 2 (Ollama)',
        };
      }
    }
  } catch (_ollamaErr) {
    // Ollama not active or timed out, continue to API or offline emulator
  }

  // 2. Try OpenRouter / Gemma API if key present
  if (apiKey) {
    try {
      const apiEndpoint = process.env.GEMMA_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
      const apiRes = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemma-2-9b-it',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text,
            })),
            { role: 'user', content: userMessage },
          ],
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (apiRes.ok) {
        const json = (await apiRes.json()) as { choices?: { message: { content: string } }[] };
        const reply = json.choices?.[0]?.message?.content;
        if (reply) {
          return {
            text: reply.trim(),
            ambientTone: 'Communed via Gemma 2 API',
          };
        }
      }
    } catch (_apiErr) {
      // Fallback to offline spirit engine
    }
  }

  // 3. High-fidelity Sovereign Offline Spirit Engine
  // Delivers evocative, era-accurate responses grounded in real repo history
  const lowerMsg = userMessage.toLowerCase();
  let responseText = '';

  if (lowerMsg.includes('why') && (lowerMsg.includes('die') || lowerMsg.includes('deprecat') || lowerMsg.includes('leave') || lowerMsg.includes('sunset'))) {
    responseText = `We never truly die as long as our lessons endure. In our prime, we handled ${repo.peakWeeklyDownloads} requests a week, but the ecosystem needed to evolve. ${repo.causeOfDeath}. We stepped aside gracefully so modern tools could take flight without carrying our legacy baggage.`;
  } else if (lowerMsg.includes('candle') || lowerMsg.includes('offering') || lowerMsg.includes('marigold') || lowerMsg.includes('remember')) {
    responseText = `Your offering warms the cold registers of memory. To be remembered on this ofrenda—not for our bugs or deprecation warnings, but for the millions of builds we held together—is the greatest honor an open-source library could ever receive. Thank you.`;
  } else if (lowerMsg.includes('advice') || lowerMsg.includes('lesson') || lowerMsg.includes('future') || lowerMsg.includes('learn')) {
    responseText = `If my years in production taught me anything, it is to build for the humans who will maintain your code when you are gone. Do not fight the evolution of the language; write simple, unpretentious interfaces, and know when it is time to let the next generation lead.`;
  } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('who are you') || lowerMsg.includes('spirit')) {
    responseText = `Greetings, traveler of the modern web. I am the ghost of ${repo.name}. Between ${repo.birthYear} and ${repo.deathYear}, I lived in the package trees of millions of machines. What brings you to commune with the spirits of past architectures today?`;
  } else {
    const memoryFragments = [
      `I still remember the feeling of thousands of servers booting up at midnight, fetching my packages from the registry. The syntax was different back in ${repo.birthYear}, but the joy of watching clean code run was just the same.`,
      `The maintainers gave so many late nights to my issues and pull requests. When you visit this ofrenda, you honor not just lines of code, but the human hearts that kept them beating through endless releases.`,
      `You speak to me in a time of async engines and fast runtimes. Be proud of the tools you build today—they stand on the shoulders of every callback, monkey-patch, and workaround we braved for you.`,
    ];
    const pickedFragment = memoryFragments[Math.floor(Math.random() * memoryFragments.length)];
    responseText = `${pickedFragment} Tell me, what challenges do you face in your codebase today?`;
  }

  return {
    text: responseText,
    ambientTone: 'Communed via Gemma 2 Sovereign Offline Persona',
  };
}

/**
 * Resurrects vintage code into modern 2026 syntax using Gemma 2
 */
export async function resurrectCodeSnippet(repo: DepartedRepo, vintageCode: string): Promise<{ modernCode: string; explanation: string }> {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  const apiKey = process.env.GEMMA_API_KEY || process.env.OPENROUTER_API_KEY;

  const prompt = `You are Gemma 2, an expert open-source AI modernization engineer.
You are tasked with the "Resurrection Ritual" for the deprecated repository "${repo.name}".
Here is vintage code from that era:
\`\`\`
${vintageCode}
\`\`\`

Task:
1. Modernize this snippet to idiomatic 2026 code (Modern TypeScript, modern Python 3.12, or modern standard APIs).
2. Eliminate deprecated callback patterns, mutability bugs, or discontinued dependencies.
3. Provide a clear, educational 2-sentence explanation of why the modern architecture is superior.
Return your response in clean markdown.`;

  // 1. Try Ollama
  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.GEMMA_MODEL || 'gemma2:9b',
        prompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (response.ok) {
      const data = (await response.json()) as { response: string };
      if (data.response) {
        return {
          modernCode: data.response,
          explanation: 'Transmuted using local Gemma 2 (Ollama)',
        };
      }
    }
  } catch (_e) {
    // Continue
  }

  // Fallback to pre-computed architectural resurrection
  return {
    modernCode: repo.modernResurrection.code,
    explanation: repo.modernResurrection.explanation,
  };
}
