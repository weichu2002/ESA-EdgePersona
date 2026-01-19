import React, { useState, useEffect, useRef } from 'react';
import { PersonaProfile, ChatMessage } from '../types';
import { Send, PlusCircle, AlertTriangle, RefreshCw, Settings, Type } from 'lucide-react';
import { edgeClient } from '../services/edgeClient';

interface Props {
  profile: PersonaProfile;
  userId: string;
  onEditProfile: () => void;
}

const MAX_CHAR_COUNT = 500;

const ChatInterface: React.FC<Props> = ({ profile, userId, onEditProfile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Event state
  const [eventContent, setEventContent] = useState('');
  const [eventMood, setEventMood] = useState('平静');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Welcome message simulation
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: `系统上线。${profile.name} 已激活。今天想聊点什么？`,
      timestamp: Date.now()
    }]);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if(textareaRef.current) textareaRef.current.style.height = 'auto'; // Reset height
    setIsLoading(true);

    try {
      const response = await edgeClient.sendChat(userId, userMsg.content);
      setMessages(prev => [...prev, response]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'system', content: '连接边缘节点中断。', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
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
    setMessages(prev => [...prev, { role: 'system', content: `[记忆更新] 已记录重大事件: "${eventContent}"`, timestamp: Date.now() }]);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar (Desktop) / Topbar (Mobile) */}
      <div className="w-16 md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col p-4 z-20">
        <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white shrink-0">
                {profile.name.charAt(0)}
            </div>
            <div className="hidden md:block overflow-hidden">
                <h1 className="font-bold truncate">{profile.name}</h1>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    ESA 节点在线
                </p>
            </div>
        </div>

        <button 
            onClick={() => setShowEventModal(true)}
            className="bg-gray-800 hover:bg-gray-700 p-3 rounded-xl flex items-center justify-center md:justify-start gap-3 transition-colors mb-4"
            title="记录大事记"
        >
            <PlusCircle size={20} className="text-blue-400 shrink-0" />
            <span className="hidden md:inline text-sm">记录大事记</span>
        </button>

        <button 
            onClick={onEditProfile}
            className="bg-gray-800 hover:bg-gray-700 p-3 rounded-xl flex items-center justify-center md:justify-start gap-3 transition-colors mb-4"
            title="设置与人格档案"
        >
            <Settings size={20} className="text-gray-400 shrink-0" />
            <span className="hidden md:inline text-sm">人格档案设置</span>
        </button>

        <div className="mt-auto hidden md:block">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">核心特质</h3>
            <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                    <span>直觉度</span>
                    <span className="text-white">{(profile.traits.planningVsSpontaneity * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                    <span>风险偏好</span>
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
                                     <AlertTriangle size={10} /> 这不像我
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
                         <span className="text-sm text-gray-400">正在思考...</span>
                     </div>
                 </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-900 border-t border-gray-800">
            <div className="max-w-4xl mx-auto relative">
                <div className="relative bg-gray-800 rounded-2xl border border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                    <textarea 
                        ref={textareaRef}
                        className="w-full bg-transparent text-white rounded-2xl pl-4 pr-14 py-4 outline-none resize-none max-h-32 min-h-[56px] placeholder-gray-500"
                        placeholder="与你的数字镜像交谈..."
                        value={input}
                        maxLength={MAX_CHAR_COUNT}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        rows={1}
                    />
                    
                    {/* Character Counter & Markdown Hint */}
                    <div className="absolute bottom-2 left-4 text-[10px] text-gray-600 flex gap-3 select-none pointer-events-none">
                        <span className="flex items-center gap-1"><Type size={10}/> 支持 Markdown</span>
                    </div>
                    <div className={`absolute bottom-2 right-14 text-[10px] ${input.length >= MAX_CHAR_COUNT ? 'text-red-500' : 'text-gray-600'}`}>
                        {input.length}/{MAX_CHAR_COUNT}
                    </div>

                    <button 
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 bottom-2 bg-blue-600 p-2 rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} className="text-white" />
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
                  <h2 className="text-xl font-bold mb-4">记录人生大事记</h2>
                  <p className="text-gray-400 text-sm mb-4">这条记忆将被永久刻入长期存储，深刻影响人格。</p>
                  
                  <textarea 
                    className="w-full bg-gray-800 rounded-xl p-3 mb-4 text-white focus:ring-2 focus:ring-blue-500 outline-none h-32"
                    placeholder="例如：赢得了新罕布什尔州的初选..."
                    value={eventContent}
                    onChange={e => setEventContent(e.target.value)}
                  />
                  
                  <div className="flex gap-2 mb-6">
                      {['开心', '愤怒', '自豪', '焦虑'].map(m => (
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
                      <button onClick={() => setShowEventModal(false)} className="flex-1 py-3 text-gray-400 hover:bg-gray-800 rounded-xl">取消</button>
                      <button onClick={handleSaveEvent} className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200">保存记忆</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ChatInterface;