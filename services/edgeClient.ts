import { PersonaProfile, ChatMessage, LifeEvent } from '../types';

// The base URL is relative because the Edge Function serves /api/* on the same domain
const API_BASE = '/api';

export const edgeClient = {
  // Check if user has a persona
  async checkPersona(userId: string): Promise<PersonaProfile | null> {
    try {
      const res = await fetch(`${API_BASE}/persona?userId=${userId}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch persona');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  // Save the initialization package
  async savePersona(profile: PersonaProfile): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/persona`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  // Send a chat message
  async sendChat(userId: string, message: string): Promise<ChatMessage> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, message }),
    });

    if (!res.ok) {
      // Attempt to read the error details
      let errorMessage = `Chat failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || JSON.stringify(errorData);
        console.error("Server API Error Detail:", errorMessage);
      } catch (e) {
        // If not JSON, try text
        const text = await res.text();
        console.error("Server API Error Text:", text);
      }
      throw new Error(errorMessage);
    }
    
    return await res.json(); 
  },

  // Log a life event
  async logEvent(userId: string, event: Omit<LifeEvent, 'id'>): Promise<boolean> {
    const res = await fetch(`${API_BASE}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, event }),
    });
    return res.ok;
  },
  
  // Clear Memory (Dev tool)
  async reset(userId: string): Promise<void> {
    await fetch(`${API_BASE}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  }
};