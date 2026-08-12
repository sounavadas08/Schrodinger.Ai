import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Power, FileSpreadsheet, Sparkles, CheckCircle2, Trash2, RefreshCw, PenLine } from 'lucide-react';
import { ContentRow } from '../types';
import { getApiHeaders, safeResponseJson } from '../lib/apiHelper';
import { AIRoutineMakerTool } from './tools/AIRoutineMakerTool';

export const ContentCreatorAgent: React.FC = () => {
  const [agentActive, setAgentActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('schrodinger_agent_active');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [sheetsSynced, setSheetsSynced] = useState<boolean>(() => {
    const saved = localStorage.getItem('schrodinger_sheets_synced');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [rows, setRows] = useState<ContentRow[]>(() => {
    const saved = localStorage.getItem('schrodinger_content_rows');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: '1',
        date: '2026-08-12',
        platform: 'YouTube',
        theme: 'Top 5 AI Tools Replacing Video Editors',
        snippet: 'Hook: "If you are still spending 4 hours cutting jump cuts manually, watch this..."',
        status: 'Approved'
      },
      {
        id: '2',
        date: '2026-08-14',
        platform: 'Instagram',
        theme: 'Automating Creator Workflows with n8n',
        snippet: 'Reel: 3-step automation diagram showing Drive → Whisper → Captions → Sheet.',
        status: 'Scheduled'
      },
      {
        id: '3',
        date: '2026-08-16',
        platform: 'X (Twitter)',
        theme: 'Multi-Agent Autonomous Frameworks Breakdown',
        snippet: 'Thread: "1/8 Why 2026 is the year single-purpose chatbots die and agent teams take over..."',
        status: 'Drafted'
      }
    ];
  });

  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    localStorage.setItem('schrodinger_agent_active', JSON.stringify(agentActive));
  }, [agentActive]);

  useEffect(() => {
    localStorage.setItem('schrodinger_sheets_synced', JSON.stringify(sheetsSynced));
  }, [sheetsSynced]);

  useEffect(() => {
    localStorage.setItem('schrodinger_content_rows', JSON.stringify(rows));
  }, [rows]);

  const toggleAgent = () => {
    setAgentActive(!agentActive);
  };

  const handleGenerateIdeas = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/plan-content', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ niche: 'Tech & Creator Automation', platform: 'YouTube' })
      });

      const data = await safeResponseJson(response);
      if (data.success && Array.isArray(data.items)) {
        const newRows: ContentRow[] = data.items.map((item: any, i: number) => ({
          id: Date.now().toString() + i,
          date: item.date || new Date().toISOString().split('T')[0],
          platform: item.platform || 'YouTube',
          theme: item.theme || 'AI Agent Content Strategy',
          snippet: item.snippet || 'Generated content concept',
          status: 'Drafted'
        }));
        setRows([...newRows, ...rows]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const deleteRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  const updateRowStatus = (id: string, newStatus: ContentRow['status']) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
  };

  const handleWriteScript = (row: ContentRow) => {
    // Map row platform to suitable genre
    let genre = 'YouTube Explainer';
    if (row.platform.toLowerCase().includes('instagram') || row.platform.toLowerCase().includes('reels')) {
      genre = 'Instagram Reel';
    } else if (row.platform.toLowerCase().includes('tiktok') || row.platform.toLowerCase().includes('short')) {
      genre = 'TikTok Hook';
    } else if (row.platform.toLowerCase().includes('twitter') || row.platform.toLowerCase().includes('x')) {
      genre = 'Twitter Thread';
    }
    
    window.dispatchEvent(new CustomEvent('trigger-script-gen', { 
      detail: { topic: row.theme, genre } 
    }));
    
    const el = document.getElementById('routine-script-studio-vault');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="content-creator" className="py-20 bg-[#F7F5F2] border-t border-[#121212]/15 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header & Main Toggle */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-[#121212]/15 pb-8">
          <div className="space-y-2 text-left max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-[#121212]/60">
              [ 03 / AUTONOMOUS AGENT HUB ]
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#121212]">
              Content Creator Agent Engine
            </h2>
            <p className="text-[#121212]/70 text-sm font-serif italic">
              Activate the AI agent to continuously plan, draft, and synchronize your editorial content calendar with Google Sheets.
            </p>
          </div>

          {/* Large Pill Toggle Switch */}
          <div className="bg-white p-3 border border-[#121212]/20 flex items-center gap-4 shadow-xs">
            <div className="text-right">
              <span className="block text-[10px] font-mono uppercase tracking-widest text-[#121212]/60 font-bold">
                Agent Status
              </span>
              <span className={`text-xs font-bold font-mono ${agentActive ? 'text-emerald-700' : 'text-[#121212]/40'}`}>
                {agentActive ? '● ACTIVE & PLANNING' : '○ AGENT OFF'}
              </span>
            </div>

            <button
              onClick={toggleAgent}
              className={`w-16 h-8 p-0.5 border border-[#121212] transition-colors duration-200 flex items-center cursor-pointer ${
                agentActive ? 'bg-[#121212]' : 'bg-[#F7F5F2]'
              }`}
              title="Toggle AI Agent"
            >
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`w-6 h-6 bg-white border border-[#121212] flex items-center justify-center ${
                  agentActive ? 'translate-x-8 text-[#121212]' : 'translate-x-0 text-[#121212]/60'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
              </motion.div>
            </button>
          </div>
        </div>

        {/* Dynamic State Stage */}
        <AnimatePresence mode="wait">
          {!agentActive ? (
            /* OFF STATE */
            <motion.div
              key="off-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white border border-[#121212]/15 p-10 text-center space-y-4 max-w-xl mx-auto shadow-xs"
            >
              <div className="w-14 h-14 bg-[#121212] text-[#F7F5F2] flex items-center justify-center mx-auto">
                <Bot className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#121212]">Content Creator Agent is Paused</h3>
              <p className="text-xs text-[#121212]/70 font-serif italic leading-relaxed">
                Turn on the agent switch above to allow SchrodingerAi to automatically construct content calendars, generate hooks, and sync with Google Sheets.
              </p>
              <button
                onClick={toggleAgent}
                className="px-6 py-2.5 bg-[#121212] hover:bg-[#262626] text-[#F7F5F2] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Turn On Agent
              </button>
            </motion.div>
          ) : (
            /* ON STATE - RICH DASHBOARD */
            <motion.div
              key="on-state"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white border border-[#121212]/15 p-6 sm:p-8 space-y-6 shadow-xs"
            >
              {/* Agent Status Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#F7F5F2] border border-[#121212]/15 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#121212] text-[#F7F5F2] flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-serif font-bold text-[#121212]">Autonomous Strategy Engine</span>
                      <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 bg-[#121212] text-[#F7F5F2] font-bold">
                        Workflow Optimized
                      </span>
                    </div>
                    <p className="text-xs text-[#121212]/60 font-serif italic">Agent is actively planning & updating your weekly calendar...</p>
                  </div>
                </div>

                {/* Google Sheets Sync Pill */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open('/export-sheets.html', '_blank')}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-mono border transition-colors cursor-pointer bg-emerald-50 border-emerald-600/30 text-emerald-800 hover:bg-emerald-100/50"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-[10px] tracking-wider uppercase">Connect Sheets</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  </button>

                  <button
                    onClick={handleGenerateIdeas}
                    disabled={generating}
                    className="px-4 py-2 bg-[#121212] hover:bg-[#262626] text-[#F7F5F2] font-bold text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F7F5F2]" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Auto-Plan Calendar</span>
                  </button>
                </div>
              </div>

              {/* Content Table */}
              <div className="overflow-x-auto border border-[#121212]/15">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212] text-[#F7F5F2] font-mono uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Platform</th>
                      <th className="p-3.5">Content Theme / Topic</th>
                      <th className="p-3.5">AI Output Snippet</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#121212]/10 text-[#121212]">
                    {rows.map((row) => (
                      <tr key={row.id} className="hover:bg-[#F7F5F2] transition-colors">
                        <td className="p-3.5 font-mono font-bold text-[#121212]">{row.date}</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 border border-[#121212]/20 font-mono text-[10px] uppercase font-bold text-[#121212] bg-white">
                            {row.platform}
                          </span>
                        </td>
                        <td className="p-3.5 font-serif font-bold text-[#121212] max-w-xs">{row.theme}</td>
                        <td className="p-3.5 text-[#121212]/70 font-serif italic max-w-sm line-clamp-2">{row.snippet}</td>
                        <td className="p-3.5">
                          <select
                            value={row.status}
                            onChange={(e) => updateRowStatus(row.id, e.target.value as any)}
                            className="bg-white border border-[#121212]/20 p-1.5 text-xs text-[#121212] font-mono focus:outline-none"
                          >
                            <option value="Drafted">Drafted</option>
                            <option value="Approved">Approved</option>
                            <option value="Scheduled">Scheduled</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => deleteRow(row.id)}
                            className="p-1.5 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Merged Routine & Script Studio Section */}
              <div id="routine-script-studio-vault" className="mt-12 pt-8 border-t border-[#121212]/10 scroll-mt-24">
                <AIRoutineMakerTool />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
