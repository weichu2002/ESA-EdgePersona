import React, { useState, useEffect, useRef } from 'react';
import { PersonaProfile, ChatMessage } from '../types';
import { Send, PlusCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { edgeClient } from '../services/edgeClient';

interface Props {
  profile: PersonaProfile;
  userId: string;
}

const ChatInterface: React.FC<Props> = ({ profile, userId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Event state
  const [eventContent, setEventContent] = useState('');
  const [eventMood, setEventMood] = useState('Neutral');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Welcome message simulation
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: `System Online. ${profile.name} initialized. What's on your mind today?`,
      timestamp: Date.now()
    }]);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await edgeClient.sendChat(userId, userMsg.content);
      setMessages(prev => [...prev, response]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'system', content: 'Connection to Edge Node interrupted.', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEvent = async () => {
    if(!eventContent) return;
    await edgeClient.logEvent(userId, {
        date: new Date().toISOString().split('T')[0],
        content: eventContent,
        mood: eventMood,
        weight: 5
    });
    setEventContent('');
    setShowEventModal(false);
    // Add system confirmation
    setMessages(prev => [...prev, { role: 'system', content: `[Memory Updated] Major event recorded: "${eventContent}"`, timestamp: Date.now() }]);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar (Desktop) / Topbar (Mobile) */}
      <div className="w-16 md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col p-4">
        <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
                {profile.name.charAt(0)}
            </div>
            <div className="hidden md:block">
                <h1 className="font-bold truncate">{profile.name}</h1>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    ESA Node Active
                </p>
            </div>
        </div>

        <button 
            onClick={() => setShowEventModal(true)}
            className="bg-gray-800 hover:bg-gray-700 p-3 rounded-xl flex items-center justify-center md:justify-start gap-3 transition-colors mb-4"
        >
            <PlusCircle size={20} className="text-blue-400" />
            <span className="hidden md:inline text-sm">Log Major Event</span>
        </button>

        <div className="mt-auto hidden md:block">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Core Traits</h3>
            <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                    <span>Intuition</span>
                    <span className="text-white">{(profile.traits.planningVsSpontaneity * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                    <span>Risk</span>
                    <span className="text-white">{(profile.traits.riskTaking * 100).toFixed(0)}%</span>
                </div>
            </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
            {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl ${
                        msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : msg.role === 'system'
                            ? 'bg-transparent text-gray-500 text-xs text-center w-full'
                            : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
                    }`}>
                        {msg.role !== 'system' && (
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}
                        {msg.role === 'system' && <p>{msg.content}</p>}
                        {msg.role === 'assistant' && (
                             <div className="mt-2 pt-2 border-t border-gray-700 flex justify-end">
                                 <button className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1">
                                     <AlertTriangle size={10} /> This isn't like me
                                 </button>
                             </div>
                        )}
                    </div>
                </div>
            ))}
            {isLoading && (
                 <div className="flex justify-start">
                     <div className="bg-gray-800 p-4 rounded-2xl rounded-bl-none border border-gray-700 flex items-center gap-2">
                         <RefreshCw size={16} className="animate-spin text-blue-400"/>
                         <span className="text-sm text-gray-400">Thinking via Edge...</span>
                     </div>
                 </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-900 border-t border-gray-800">
            <div className="max-w-4xl mx-auto relative">
                <input 
                    type="text" 
                    className="w-full bg-gray-800 text-white rounded-full pl-6 pr-14 py-4 focus:ring-2 focus:ring-blue-500 outline-none border border-gray-700 placeholder-gray-500"
                    placeholder="Talk to your digital mirror..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    disabled={isLoading}
                />
                <button 
                    onClick={handleSend}
                    disabled={isLoading}
                    className="absolute right-2 top-2 bg-blue-600 p-2 rounded-full hover:bg-blue-500 transition-colors disabled:opacity-50"
                >
                    <Send size={20} className="text-white" />
                </button>
            </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
                  <h2 className="text-xl font-bold mb-4">Log Major Life Event</h2>
                  <p className="text-gray-400 text-sm mb-4">This memory will be permanently etched into the long-term storage.</p>
                  
                  <textarea 
                    className="w-full bg-gray-800 rounded-xl p-3 mb-4 text-white focus:ring-2 focus:ring-blue-500 outline-none h-32"
                    placeholder="e.g., Won the primary election in NH..."
                    value={eventContent}
                    onChange={e => setEventContent(e.target.value)}
                  />
                  
                  <div className="flex gap-2 mb-6">
                      {['Happy', 'Angry', 'Proud', 'Anxious'].map(m => (
                          <button 
                            key={m}
                            onClick={() => setEventMood(m)}
                            className={`px-3 py-1 rounded-full text-xs border ${eventMood === m ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600 text-gray-400'}`}
                          >
                              {m}
                          </button>
                      ))}
                  </div>

                  <div className="flex gap-3">
                      <button onClick={() => setShowEventModal(false)} className="flex-1 py-3 text-gray-400 hover:bg-gray-800 rounded-xl">Cancel</button>
                      <button onClick={handleSaveEvent} className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200">Save Memory</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ChatInterface;