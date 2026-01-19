import React, { useState } from 'react';
import { PersonaProfile } from '../types';
import { Save, X, RotateCcw } from 'lucide-react';
import { edgeClient } from '../services/edgeClient';

interface Props {
  profile: PersonaProfile;
  onSave: (updatedProfile: PersonaProfile) => void;
  onCancel: () => void;
}

const PersonaEditor: React.FC<Props> = ({ profile, onSave, onCancel }) => {
  const [formData, setFormData] = useState<PersonaProfile>(JSON.parse(JSON.stringify(profile)));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await edgeClient.savePersona(formData);
    if (success) {
      onSave(formData);
    } else {
      alert("保存失败，请检查网络连接");
    }
    setIsSaving(false);
  };

  const updateTrait = (key: keyof typeof profile.traits, value: number) => {
    setFormData(prev => ({
      ...prev,
      traits: { ...prev.traits, [key]: value }
    }));
  };

  const updateArrayField = (section: 'coreIdentities' | 'domainExpertise', value: string) => {
      setFormData(prev => ({
          ...prev,
          [section]: value.split(/[,，]/).map(s => s.trim()).filter(Boolean)
      }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
            人格档案编辑器
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-800 rounded-full">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-8 pb-20">
            {/* Basic Info */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <h3 className="text-lg font-bold text-blue-400 mb-4 uppercase tracking-wider text-xs">基础信息</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">名称</label>
                        <input 
                            className="w-full bg-gray-800 p-3 rounded-lg text-white border border-gray-700 focus:border-blue-500 outline-none"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">核心身份 (逗号分隔)</label>
                        <input 
                            className="w-full bg-gray-800 p-3 rounded-lg text-white border border-gray-700 focus:border-blue-500 outline-none"
                            value={formData.coreIdentities.join(', ')}
                            onChange={e => updateArrayField('coreIdentities', e.target.value)}
                        />
                    </div>
                     <div>
                        <label className="block text-sm text-gray-400 mb-1">专业领域 (逗号分隔)</label>
                        <input 
                            className="w-full bg-gray-800 p-3 rounded-lg text-white border border-gray-700 focus:border-blue-500 outline-none"
                            value={formData.domainExpertise.join(', ')}
                            onChange={e => updateArrayField('domainExpertise', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Traits Sliders */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <h3 className="text-lg font-bold text-purple-400 mb-6 uppercase tracking-wider text-xs">性格光谱调整</h3>
                
                <div className="space-y-6">
                    <TraitSlider 
                        label="计划 vs 随性" 
                        left="周密计划" 
                        right="随性而为" 
                        value={formData.traits.planningVsSpontaneity} 
                        onChange={(v) => updateTrait('planningVsSpontaneity', v)} 
                    />
                     <TraitSlider 
                        label="理性 vs 感性" 
                        left="理性主导" 
                        right="感性主导" 
                        value={formData.traits.rationalityVsEmotion} 
                        onChange={(v) => updateTrait('rationalityVsEmotion', v)} 
                    />
                    <TraitSlider 
                        label="风险偏好" 
                        left="极度规避" 
                        right="热衷冒险" 
                        value={formData.traits.riskTaking} 
                        onChange={(v) => updateTrait('riskTaking', v)} 
                    />
                </div>
            </div>
            
            {/* Communication */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <h3 className="text-lg font-bold text-green-400 mb-4 uppercase tracking-wider text-xs">沟通风格</h3>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">口头禅 (逗号分隔)</label>
                    <input 
                         className="w-full bg-gray-800 p-3 rounded-lg text-white border border-gray-700 focus:border-blue-500 outline-none"
                         value={formData.communication.verbalTicks.join(', ')}
                         onChange={e => setFormData({
                             ...formData, 
                             communication: {
                                 ...formData.communication, 
                                 verbalTicks: e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean)
                             }
                         })}
                    />
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 w-full bg-gray-900 border-t border-gray-800 p-4 flex justify-center gap-4 z-50">
             <button 
                onClick={onCancel}
                className="px-6 py-3 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
             >
                取消
             </button>
             <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors flex items-center gap-2"
             >
                {isSaving ? <RotateCcw className="animate-spin" size={20} /> : <Save size={20} />}
                {isSaving ? '保存中...' : '保存更改'}
             </button>
        </div>
      </div>
    </div>
  );
};

const TraitSlider = ({ label, left, right, value, onChange }: { label: string, left: string, right: string, value: number, onChange: (v: number) => void }) => (
    <div>
        <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-white">{label}</span>
            <span className="text-xs text-blue-400 font-mono">{(value * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{left}</span>
            <span>{right}</span>
        </div>
        <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
    </div>
);

export default PersonaEditor;