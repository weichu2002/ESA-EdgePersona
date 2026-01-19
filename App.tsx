import React, { useState, useEffect } from 'react';
import InitFlow from './components/InitFlow';
import ChatInterface from './components/ChatInterface';
import { PersonaProfile, AppState } from './types';
import { edgeClient } from './services/edgeClient';
import { Cpu } from 'lucide-react';

// Hardcoded user ID for this demo (In real app, use Auth)
const DEMO_USER_ID = "trump_demo_001";

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [profile, setProfile] = useState<PersonaProfile | null>(null);

  useEffect(() => {
    const init = async () => {
      // Check if user exists in EdgeKV
      const existingProfile = await edgeClient.checkPersona(DEMO_USER_ID);
      
      if (existingProfile) {
        setProfile(existingProfile);
        setAppState(AppState.CHAT);
      } else {
        setAppState(AppState.INIT_INTRO);
      }
    };
    init();
  }, []);

  const handleStartInit = () => {
    setAppState(AppState.INIT_CARDS);
  };

  const handleInitComplete = async (newProfile: PersonaProfile) => {
    setAppState(AppState.LOADING);
    const success = await edgeClient.savePersona(newProfile);
    if (success) {
      setProfile(newProfile);
      setAppState(AppState.CHAT);
    } else {
      alert("Failed to save to EdgeKV. Please check connection.");
      setAppState(AppState.INIT_CARDS);
    }
  };

  if (appState === AppState.LOADING) {
    return (
      <div className="h-screen w-screen bg-gray-950 flex flex-col items-center justify-center text-white">
        <Cpu size={64} className="animate-pulse text-blue-500 mb-6" />
        <h2 className="text-xl font-mono tracking-widest">CONNECTING TO ESA EDGE NODE...</h2>
      </div>
    );
  }

  if (appState === AppState.INIT_INTRO) {
    return (
      <div className="h-screen w-screen bg-gray-950 flex flex-col items-center justify-center text-center p-6 text-white bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 to-gray-950">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          ESA EdgePersona
        </h1>
        <p className="max-w-xl text-gray-400 text-lg mb-12">
          Construct a dynamic digital mirror of yourself. Hosted privately on the edge, evolving with every interaction.
        </p>
        <button 
          onClick={handleStartInit}
          className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform"
        >
          Begin Construction
        </button>
      </div>
    );
  }

  if (appState === AppState.INIT_CARDS) {
    return <InitFlow userId={DEMO_USER_ID} onComplete={handleInitComplete} />;
  }

  if (appState === AppState.CHAT && profile) {
    return <ChatInterface profile={profile} userId={DEMO_USER_ID} />;
  }

  return null;
}

export default App;
