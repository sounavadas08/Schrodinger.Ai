import React, { useState } from 'react';
import { Calendar, Copy, Check, RefreshCw, Clock } from 'lucide-react';
import { CreatorRoutine } from '../../types';
import { getApiHeaders } from '../../lib/apiHelper';

export const AIRoutineMakerTool: React.FC = () => {
  const [niche, setNiche] = useState('Tech & AI Content Creator');
  const [frequency, setFrequency] = useState('Daily Uploads');
  const [hoursPerDay, setHoursPerDay] = useState('4');
  const [loading, setLoading] = useState(false);
  const [routine, setRoutine] = useState<CreatorRoutine | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-routine', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ niche, frequency, hoursPerDay })
      });

      const data = await response.json();
      if (data.success) {
        setRoutine(data);
      } else {
        setError(data.error || 'Failed to generate schedule');
      }
    } catch (err: any) {
      setError(err.message || 'Error generating routine');
    } finally {
      setLoading(false);
    }
  };

  const copyRoutine = () => {
    if (!routine) return;
    const text = `EDITORIAL CREATOR ROUTINE (${routine.niche})\n\n${routine.summary}\n\n` +
      routine.items.map(item => `• ${item.time} [${item.category}]: ${item.activity} - ${item.description}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-[#121212]">
      <div className="flex items-center justify-between border-b border-[#121212]/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#121212] text-[#F7F5F2]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-[#121212]">AI Routine Architect</h3>
            <p className="text-xs text-[#121212]/60 font-serif italic">Gemini-powered editorial schedule optimizer for maximum output</p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold px-2.5 py-1 bg-[#121212] text-[#F7F5F2]">
          SCHEDULE ENGINE
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="space-y-4 lg:col-span-1 text-left">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#121212]/80 mb-1 font-bold">Creator Niche</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. Tech Reviewer, Fashion Journal, Gaming..."
              className="w-full bg-white border border-[#121212]/20 px-3.5 py-2.5 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none focus:border-[#121212]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#121212]/80 mb-1 font-bold">Publishing Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full bg-white border border-[#121212]/20 px-3.5 py-2.5 text-xs text-[#121212] focus:outline-none focus:border-[#121212]"
            >
              <option value="Daily Uploads">Daily Uploads (High-Frequency)</option>
              <option value="3x per Week">3x per Week (Balanced)</option>
              <option value="Weekly Deep-Dive">Weekly Deep-Dive (High Production)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#121212]/80 mb-1 font-bold">Available Hours / Day</label>
            <div className="grid grid-cols-3 gap-2">
              {['2', '4', '8'].map((hr) => (
                <button
                  key={hr}
                  onClick={() => setHoursPerDay(hr)}
                  className={`py-2 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                    hoursPerDay === hr
                      ? 'bg-[#121212] text-[#F7F5F2] border-[#121212]'
                      : 'bg-white text-[#121212] border-[#121212]/15 hover:bg-[#121212]/5'
                  }`}
                >
                  {hr} Hours
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3.5 bg-[#121212] hover:bg-[#262626] text-[#F7F5F2] font-bold text-xs uppercase tracking-[0.2em] shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-[#F7F5F2]" /> : null}
            <span>{loading ? 'Synthesizing Schedule...' : 'Generate Routine'}</span>
          </button>

          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-700 text-xs">{error}</div>}
        </div>

        {/* Schedule Display */}
        <div className="lg:col-span-2 bg-white border border-[#121212]/15 p-5 space-y-4 text-left shadow-xs">
          {routine ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#121212]/10 pb-3">
                <div>
                  <h4 className="text-base font-serif font-bold text-[#121212]">{routine.niche} Schedule</h4>
                  <p className="text-xs font-serif italic text-[#121212]/70 mt-0.5">{routine.summary}</p>
                </div>

                <button
                  onClick={copyRoutine}
                  className="px-3 py-1.5 bg-[#F7F5F2] hover:bg-[#121212]/10 border border-[#121212]/20 text-xs font-bold text-[#121212] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {routine.items.map((item, index) => (
                  <div
                    key={index}
                    className="p-3.5 bg-[#F7F5F2] border border-[#121212]/10 hover:border-[#121212]/30 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#121212]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.time}</span>
                      </div>
                      <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 bg-[#121212] text-[#F7F5F2] font-bold">
                        {item.category}
                      </span>
                    </div>
                    <h5 className="text-sm font-serif font-bold text-[#121212]">{item.activity}</h5>
                    <p className="text-xs text-[#121212]/70 font-serif leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-center space-y-3">
              <div className="w-12 h-12 bg-[#F7F5F2] border border-[#121212]/15 flex items-center justify-center text-[#121212]/40">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#121212]/80">No routine generated yet</p>
              <p className="text-xs text-[#121212]/60 font-serif italic max-w-sm">
                Set your niche, publishing frequency, and available daily hours, then click "Generate Routine".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
