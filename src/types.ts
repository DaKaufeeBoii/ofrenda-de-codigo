export interface DepartedRepo {
  id: string;
  name: string;
  fullName: string;
  yearsActive: string;
  birthYear: number;
  deathYear: number;
  starsAtSunset: number;
  peakWeeklyDownloads: string;
  category: 'JavaScript' | 'Python' | 'Web & CSS' | 'Build Tools' | 'Frameworks';
  epitaph: string;
  obituary: string;
  finalCommitMessage: string;
  authorOrMaintainer: string;
  causeOfDeath: string;
  tags: string[];
  vintageSnippet: {
    title: string;
    language: string;
    code: string;
  };
  modernResurrection: {
    title: string;
    language: string;
    code: string;
    explanation: string;
  };
  avatarUrl: string;
  candlesLit: number;
  offeringsCount: number;
}

export interface AltarOffering {
  id: string;
  repoId: string;
  repoName: string;
  authorName: string;
  offeringType: 'candle' | 'marigold' | 'coffee' | 'fork' | 'pan_de_muerto';
  message: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ghost';
  text: string;
  timestamp: string;
  ambientTone?: string;
}

export interface EulogyAudioResponse {
  audioBase64?: string;
  audioUrl?: string;
  transcript: string;
  source: 'elevenlabs' | 'ambient-synth';
}
