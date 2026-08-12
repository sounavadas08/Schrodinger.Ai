import React, { useState } from 'react';
import { Calendar, Copy, Check, RefreshCw, Clock, PenLine, Sparkles } from 'lucide-react';
import { CreatorRoutine, GeneratedScript } from '../../types';
import { getApiHeaders, safeResponseJson } from '../../lib/apiHelper';

export const AIRoutineMakerTool: React.FC = () => {
  const [tab, setTab] = useState<'routine' | 'script'>('routine');

  // Routine state
  const [niche, setNiche] = useState('Tech & AI Content Creator');
  const [frequency, setFrequency] = useState('Daily Uploads');
  const [hoursPerDay, setHoursPerDay] = useState('4');
  const [lifestyle, setLifestyle] = useState('');
  const [routineLoading, setRoutineLoading] = useState(false);
  const [routine, setRoutine] = useState<CreatorRoutine | null>(null);
  const [routineError, setRoutineError] = useState<string | null>(null);
  const [routineCopied, setRoutineCopied] = useState(false);

  // Script state
  const [genre, setGenre] = useState('YouTube Explainer');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('engaging');
  const [scriptLoading, setScriptLoading] = useState(false);
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [scriptCopied, setScriptCopied] = useState(false);

  React.useEffect(() => {
    const handleTrigger = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.topic) {
        setTab('script');
        setTopic(customEvent.detail.topic);
        const resolvedGenre = customEvent.detail.genre || 'YouTube Explainer';
        setGenre(resolvedGenre);
        
        // Execute generation with delay
        setTimeout(() => {
          triggerScriptDirectly(customEvent.detail.topic, resolvedGenre);
        }, 100);
      }
    };
    window.addEventListener('trigger-script-gen', handleTrigger);
    return () => window.removeEventListener('trigger-script-gen', handleTrigger);
  }, [tone]);

  const triggerScriptDirectly = async (targetTopic: string, targetGenre: string) => {
    setScriptLoading(true);
    setScriptError(null);
    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ genre: targetGenre, topic: targetTopic, tone })
      });
      const data = await safeResponseJson(response);
      if (data.success) {
        setScript(data.script);
      } else {
        setScriptError(data.error || 'Failed to generate script');
      }
    } catch (err: any) {
      setScriptError(err.message || 'Error generating script');
    } finally {
      setScriptLoading(false);
    }
  };

  const handleGenerateRoutine = async () => {
    setRoutineLoading(true);
    setRoutineError(null);
    try {
      const response = await fetch('/api/generate-routine', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ niche, frequency, hoursPerDay, lifestyle })
      });
      const data = await safeResponseJson(response);
      if (data.success) {
        setRoutine(data);
      } else {
        setRoutineError(data.error || 'Failed to generate schedule');
      }
    } catch (err: any) {
      setRoutineError(err.message || 'Error generating routine');
    } finally {
      setRoutineLoading(false);
    }
  };

  const copyRoutine = () => {
    if (!routine) return;
    const text = `EDITORIAL CREATOR ROUTINE (${routine.niche})\n\n${routine.summary}\n\n` +
      routine.items.map(item => `• ${item.time} [${item.category}]: ${item.activity} - ${item.description}`).join('\n');
    navigator.clipboard.writeText(text);
    setRoutineCopied(true);
    setTimeout(() => setRoutineCopied(false), 2000);
  };

  const handleGenerateScript = async () => {
    if (!topic.trim()) {
      setScriptError('Please enter a content topic.');
      return;
    }
    await triggerScriptDirectly(topic, genre);
  };

  const copyScript = () => {
    if (!script) return;
    const text = `${script.title}\n\nHOOK: ${script.hook}\n\n` +
      script.sections.map(s => `## ${s.heading}\n${s.narration}\n[${s.direction}]\n`).join('\n') +
      `\nOUTRO: ${script.outro}`;
    navigator.clipboard.writeText(text);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-[#121212]">
      <div className="flex items-center justify-between border-b border-[#121212]/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#121212] text-[#F7F5F2]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-[#121212]">AI Routine Architect & Script Studio</h3>
            <p className="text-xs text-[#121212]/60 font-serif italic">Personalized schedules and ready-to-record scripts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('routine')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border cursor-pointer transition-colors ${tab === 'routine' ? 'bg-[#121212] text-[#F7F5F2] border-[#121212]' : 'bg-white text-[#121212] border-[#121212]/15 hover:bg-[#121212]/5'}`}
          >
            Routine
          </button>
          <button
            onClick={() => setTab('script')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border cursor-pointer transition-colors flex items-center gap-1.5 ${tab === 'script' ? 'bg-[#121212] text-[#F7F5F2] border-[#121212]' : 'bg-white text-[#121212] border-[#121212]/15 hover:bg-[#121212]/5'}`}
          >
            <PenLine className="w-3.5 h-3.5" /> Script
          </button>
        </div>
      </div>

      {tab === 'routine' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    className={`py-2 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${hoursPerDay === hr ? 'bg-[#121212] text-[#F7F5F2] border-[#121212]' : 'bg-white text-[#121212] border-[#121212]/15 hover:bg-[#121212]/5'}`}
                  >
                    {hr} Hours
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#121212]/80 mb-1 font-bold">Your Lifestyle (customize the routine)</label>
              <textarea
                value={lifestyle}
                onChange={(e) => setLifestyle(e.target.value)}
                rows={4}
                placeholder="Describe your lifestyle — e.g. 'I'm a night owl, workout at 7am, have a 9-5 job, family dinner at 7pm, can only create content after 9pm, get tired by midnight...'"
                className="w-full bg-white border border-[#121212]/20 px-3.5 py-2.5 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none focus:border-[#121212] resize-none"
              />
              <p className="text-[10px] text-[#121212]/50 font-serif italic mt-1">The AI tailors your schedule around your real life — energy, commitments, and limits.</p>
            </div>

            <button
              onClick={handleGenerateRoutine}
              disabled={routineLoading}
              className="w-full py-3.5 bg-[#121212] hover:bg-[#262626] text-[#F7F5F2] font-bold text-xs uppercase tracking-[0.2em] shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {routineLoading ? <RefreshCw className="w-4 h-4 animate-spin text-[#F7F5F2]" /> : <Sparkles className="w-4 h-4" />}
              <span>{routineLoading ? 'Synthesizing Schedule...' : 'Generate Routine'}</span>
            </button>

            {routineError && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-700 text-xs">{routineError}</div>}
          </div>

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
                    {routineCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{routineCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {routine.items.map((item, index) => (
                    <div key={index} className="p-3.5 bg-[#F7F5F2] border border-[#121212]/10 hover:border-[#121212]/30 transition-colors space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#121212]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{item.time}</span>
                        </div>
                        <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 bg-[#121212] text-[#F7F5F2] font-bold">{item.category}</span>
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
                <p className="text-xs text-[#121212]/60 font-serif italic max-w-sm">Describe your lifestyle, pick your frequency and hours, then click "Generate Routine".</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4 lg:col-span-1 text-left">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#121212]/80 mb-1 font-bold">Content Genre</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="YouTube Explainer, TikTok Hook, Podcast Intro..."
                className="w-full bg-white border border-[#121212]/20 px-3.5 py-2.5 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none focus:border-[#121212]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#121212]/80 mb-1 font-bold">Topic</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={4}
                placeholder="What should the script be about? e.g. '5 AI tools that replaced my whole editing team'"
                className="w-full bg-white border border-[#121212]/20 px-3.5 py-2.5 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none focus:border-[#121212] resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#121212]/80 mb-1 font-bold">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-white border border-[#121212]/20 px-3.5 py-2.5 text-xs text-[#121212] focus:outline-none focus:border-[#121212]"
              >
                <option value="engaging">Engaging</option>
                <option value="professional">Professional</option>
                <option value="funny">Funny</option>
                <option value="inspirational">Inspirational</option>
                <option value="casual">Casual</option>
              </select>
            </div>

            <button
              onClick={handleGenerateScript}
              disabled={scriptLoading}
              className="w-full py-3.5 bg-[#121212] hover:bg-[#262626] text-[#F7F5F2] font-bold text-xs uppercase tracking-[0.2em] shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {scriptLoading ? <RefreshCw className="w-4 h-4 animate-spin text-[#F7F5F2]" /> : <PenLine className="w-4 h-4" />}
              <span>{scriptLoading ? 'Writing Script...' : 'Generate Script'}</span>
            </button>

            {scriptError && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-700 text-xs">{scriptError}</div>}
          </div>

          <div className="lg:col-span-2 bg-white border border-[#121212]/15 p-5 space-y-4 text-left shadow-xs">
            {script ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#121212]/10 pb-3">
                  <div>
                    <h4 className="text-base font-serif font-bold text-[#121212]">{script.title}</h4>
                    <p className="text-xs font-serif italic text-[#121212]/70 mt-0.5">Hook: {script.hook}</p>
                  </div>
                  <button
                    onClick={copyScript}
                    className="px-3 py-1.5 bg-[#F7F5F2] hover:bg-[#121212]/10 border border-[#121212]/20 text-xs font-bold text-[#121212] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    {scriptCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{scriptCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {script.sections.map((s, i) => (
                    <div key={i} className="p-3.5 bg-[#F7F5F2] border border-[#121212]/10 space-y-1.5">
                      <h5 className="text-sm font-serif font-bold text-[#121212]">{s.heading}</h5>
                      <p className="text-xs text-[#121212]/80 font-serif leading-relaxed">{s.narration}</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-[#121212]/50">[ {s.direction} ]</p>
                    </div>
                  ))}
                  <div className="p-3.5 bg-[#121212] text-[#F7F5F2] border border-[#121212] space-y-1">
                    <h5 className="text-sm font-serif font-bold">Outro</h5>
                    <p className="text-xs font-serif leading-relaxed">{script.outro}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-center space-y-3">
                <div className="w-12 h-12 bg-[#F7F5F2] border border-[#121212]/15 flex items-center justify-center text-[#121212]/40">
                  <PenLine className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#121212]/80">No script written yet</p>
                <p className="text-xs text-[#121212]/60 font-serif italic max-w-sm">Enter a genre and topic, choose a tone, then click "Generate Script".</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
