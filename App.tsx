import { useState, useEffect } from 'react';
import InitFlow from './components/InitFlow';
import ChatInterface from './components/ChatInterface';
import PersonaEditor from './components/PersonaEditor';
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
      alert("无法保存到 ESA 边缘节点，请检查连接。");
      setAppState(AppState.INIT_CARDS);
    }
  };

  const handleEditProfile = () => {
    setAppState(AppState.EDITOR);
  };

  const handleProfileUpdate = (updatedProfile: PersonaProfile) => {
      setProfile(updatedProfile);
      setAppState(AppState.CHAT);
  };

  if (appState === AppState.LOADING) {
    return (
      <div className="h-screen w-screen bg-gray-950 flex flex-col items-center justify-center text-white">
        <Cpu size={64} className="animate-pulse text-blue-500 mb-6" />
        <h2 className="text-xl font-mono tracking-widest">正在连接 ESA 边缘节点...</h2>
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
          构建一个动态的数字镜像。托管于边缘，随每一次互动而进化。
        </p>
        <button 
          onClick={handleStartInit}
          className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform"
        >
          开始构建
        </button>
      </div>
    );
  }

  if (appState === AppState.INIT_CARDS) {
    return <InitFlow userId={DEMO_USER_ID} onComplete={handleInitComplete} />;
  }

  if (appState === AppState.EDITOR && profile) {
      return (
        <PersonaEditor 
            profile={profile} 
            onSave={handleProfileUpdate} 
            onCancel={() => setAppState(AppState.CHAT)} 
        />
      );
  }

  if (appState === AppState.CHAT && profile) {
    return (
        <ChatInterface 
            profile={profile} 
            userId={DEMO_USER_ID} 
            onEditProfile={handleEditProfile}
        />
    );
  }

  return null;
}

export default App;