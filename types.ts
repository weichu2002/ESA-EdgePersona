export interface PersonalityTraits {
  planningVsSpontaneity: number;
  rationalityVsEmotion: number;
  bigPictureVsDetail: number;
  independenceVsCollaboration: number;
  riskTaking: number;
}

export interface PersonaProfile {
  id: string;
  name: string; // The user's name
  coreIdentities: string[];
  domainExpertise: string[];
  lifeFocus: string;
  traits: PersonalityTraits;
  values: {
    priority: string[];
    integrity: string;
    trustedSources: string[];
    admiredTraits: string[];
  };
  emotional: {
    stressResponse: string;
    achievementDriver: string[];
    preferredTone: string;
  };
  communication: {
    verbalTicks: string[];
    sampleAnalysis: string; // Simplified for this demo
    metaphors: string[];
  };
  knowledge: {
    influences: string;
    futureConcerns: string[];
  };
  createdAt: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface LifeEvent {
  id: string;
  date: string;
  content: string;
  mood: string;
  weight: number; // 1-5, 5 being a landmark event
}

export enum AppState {
  LOADING = 'LOADING',
  INIT_INTRO = 'INIT_INTRO',
  INIT_CARDS = 'INIT_CARDS',
  CHAT = 'CHAT',
  EDITOR = 'EDITOR',
}

// Type for the card configuration
export type CardType = 'text' | 'choice' | 'slider' | 'multi-choice' | 'sort' | 'long-text';

export interface CardConfig {
  id: number;
  module: string;
  question: string;
  type: CardType;
  options?: string[]; // For choice/multi-choice
  leftLabel?: string; // For slider
  rightLabel?: string; // For slider
  key: string; // Key in the PersonaProfile to update (dot notation simplified)
}