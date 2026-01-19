import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CARDS } from '../constants';
import { PersonaProfile, CardConfig } from '../types';
import { ArrowRight, Check } from 'lucide-react';

interface Props {
  onComplete: (profile: PersonaProfile) => void;
  userId: string;
}

const InitFlow: React.FC<Props> = ({ onComplete, userId }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentInput, setCurrentInput] = useState<any>('');

  const currentCard = CARDS[currentIndex];
  const progress = ((currentIndex + 1) / CARDS.length) * 100;

  const handleNext = () => {
    // Save current answer
    const newAnswers = { ...answers, [currentCard.key]: currentInput };
    setAnswers(newAnswers);

    if (currentIndex < CARDS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      // Reset input for next card, try to pre-fill if navigating back (not implemented for simplicity here)
      setCurrentInput(getDefaultInput(CARDS[currentIndex + 1]));
    } else {
      finish(newAnswers);
    }
  };

  const getDefaultInput = (card: CardConfig) => {
    if (card.type === 'slider') return 0.5;
    if (card.type === 'multi-choice') return [];
    if (card.type === 'sort') return card.options;
    return '';
  };

  const finish = (finalAnswers: Record<string, any>) => {
    // Transform flat answers to nested PersonaProfile object
    // This is a simplified mapper. In a real app, use lodash.set or proper mapping
    const profile: PersonaProfile = {
      id: userId,
      name: "My Digital Self",
      createdAt: Date.now(),
      coreIdentities: parseList(finalAnswers['coreIdentities']),
      domainExpertise: parseList(finalAnswers['domainExpertise']),
      lifeFocus: finalAnswers['lifeFocus'],
      traits: {
        planningVsSpontaneity: finalAnswers['traits.planningVsSpontaneity'] || 0.5,
        rationalityVsEmotion: finalAnswers['traits.rationalityVsEmotion'] || 0.5,
        bigPictureVsDetail: finalAnswers['traits.bigPictureVsDetail'] || 0.5,
        independenceVsCollaboration: finalAnswers['traits.independenceVsCollaboration'] || 0.5,
        riskTaking: finalAnswers['traits.riskTaking'] || 0.5,
      },
      values: {
        priority: finalAnswers['values.priority'],
        integrity: finalAnswers['values.integrity'],
        trustedSources: finalAnswers['values.trustedSources'],
        admiredTraits: parseList(finalAnswers['values.admiredTraits']),
      },
      emotional: {
        stressResponse: finalAnswers['emotional.stressResponse'],
        achievementDriver: finalAnswers['emotional.achievementDriver'],
        preferredTone: finalAnswers['emotional.preferredTone'],
      },
      communication: {
        verbalTicks: parseList(finalAnswers['communication.verbalTicks']),
        sampleAnalysis: finalAnswers['communication.sampleAnalysis'],
        metaphors: finalAnswers['communication.metaphors'],
      },
      knowledge: {
        influences: finalAnswers['knowledge.influences'],
        futureConcerns: parseList(finalAnswers['knowledge.futureConcerns']),
      }
    };
    onComplete(profile);
  };

  const parseList = (input: any): string[] => {
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') return input.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    return [];
  };

  // Render Input based on type
  const renderInput = () => {
    switch (currentCard.type) {
      case 'text':
      case 'long-text':
        return (
          <div className="w-full">
            {currentCard.type === 'long-text' ? (
              <textarea
                className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white h-32"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Type here..."
              />
            ) : (
              <input
                type="text"
                className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Separate multiple items with commas..."
              />
            )}
          </div>
        );
      case 'slider':
        return (
          <div className="w-full py-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{currentCard.leftLabel}</span>
              <span>{currentCard.rightLabel}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={currentInput || 0.5}
              onChange={(e) => setCurrentInput(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        );
      case 'choice':
        return (
          <div className="flex flex-col gap-3">
            {currentCard.options?.map(opt => (
              <button
                key={opt}
                onClick={() => setCurrentInput(opt)}
                className={`p-4 rounded-xl text-left transition-all ${currentInput === opt ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        );
      case 'multi-choice':
        const selected = (currentInput as string[]) || [];
        const toggle = (opt: string) => {
          if (selected.includes(opt)) setCurrentInput(selected.filter(s => s !== opt));
          else setCurrentInput([...selected, opt]);
        };
        return (
          <div className="flex flex-col gap-3">
            {currentCard.options?.map(opt => (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className={`p-4 rounded-xl text-left transition-all flex justify-between ${selected.includes(opt) ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                <span>{opt}</span>
                {selected.includes(opt) && <Check size={20} />}
              </button>
            ))}
          </div>
        );
      case 'sort':
        // Simplified sort: just rendering list, assume user accepts default order for this demo to save complex DnD code
        // In full version, implement drag and drop
        return (
            <div className="text-gray-400 text-center italic">
               (Drag and Drop simulation) Priority: {currentCard.options?.join(' > ')}
               <button onClick={() => setCurrentInput(currentCard.options)} className="block mx-auto mt-4 text-blue-400">Confirm Order</button>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gray-800">
        <motion.div 
          className="h-full bg-blue-500" 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <div className="absolute top-10 right-10 text-gray-500 font-mono">
        {currentIndex + 1} / {CARDS.length}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="w-full max-w-2xl"
        >
          <div className="mb-2 text-blue-400 uppercase tracking-widest text-xs font-bold">
            {currentCard.module}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 leading-tight">
            {currentCard.question}
          </h2>

          <div className="mb-10">
            {renderInput()}
          </div>

          <button
            onClick={handleNext}
            className="group flex items-center gap-3 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition-colors ml-auto"
          >
            {currentIndex === CARDS.length - 1 ? "Initialize Persona" : "Continue"}
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default InitFlow;
