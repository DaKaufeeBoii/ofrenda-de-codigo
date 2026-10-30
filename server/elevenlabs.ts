import { DepartedRepo, EulogyAudioResponse } from '../src/types.js';

export async function generateSpokenEulogy(repo: DepartedRepo): Promise<EulogyAudioResponse> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Adam (warm, deep, narrative)

  const transcript = `In memory of ${repo.name}. Born in ${repo.birthYear}, laid to rest in ${repo.deathYear}. ${repo.epitaph} You carried the weight of millions of developers, and your memory shall never fade from the ofrenda.`;

  if (apiKey && apiKey.startsWith('sk_')) {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: transcript,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.8,
            style: 0.35,
            use_speaker_boost: true,
          },
        }),
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');
        return {
          audioBase64: `data:audio/mp3;base64,${base64Audio}`,
          transcript,
          source: 'elevenlabs',
        };
      } else {
        const errJson: any = await response.json().catch(() => ({}));
        console.warn(`[ElevenLabs API Warning] status: ${response.status}`, errJson);
      }
    } catch (err: any) {
      console.warn('[ElevenLabs API Error]', err.message);
    }
  }

  // High-fidelity fallback for offline or invalid API key
  return {
    transcript,
    source: 'ambient-synth',
  };
}

export async function generateWhisperAudio(text: string, repoName?: string): Promise<EulogyAudioResponse> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_WHISPER_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

  const transcript = repoName ? `In memory of ${repoName}. ${text}` : text;

  if (apiKey && apiKey.startsWith('sk_')) {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: transcript,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.65,
            similarity_boost: 0.85,
            style: 0.20,
            use_speaker_boost: false,
          },
        }),
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');
        return {
          audioBase64: `data:audio/mp3;base64,${base64Audio}`,
          transcript,
          source: 'elevenlabs',
        };
      }
    } catch (err: any) {
      console.warn('[ElevenLabs Whisper Error]', err.message);
    }
  }

  return {
    transcript,
    source: 'ambient-synth',
  };
}
