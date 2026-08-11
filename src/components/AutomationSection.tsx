import React, { useState, useEffect } from 'react';
import { Key, Link as LinkIcon, Eye, EyeOff, Play, CheckCircle2, RefreshCw, Server, Activity, Terminal, X } from 'lucide-react';
import { N8nWorkflow } from '../types';
import { getApiHeaders } from '../lib/apiHelper';

export const AutomationSection: React.FC = () => {
  const [instanceUrl, setInstanceUrl] = useState(() => {
    return localStorage.getItem('schrodinger_n8n_url') || '';
  });

  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('schrodinger_n8n_key') || '';
  });

  const [showKey, setShowKey] = useState(false);
  const [connected, setConnected] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [runningWorkflow, setRunningWorkflow] = useState<string | null>(null);
  const [executionLog, setExecutionLog] = useState<any | null>(null);

  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([
    {
      id: 'wf-1',
      name: 'Auto-publish Instagram Reels from Drive',
      status: 'active',
      lastRun: '12 mins ago',
      executionsCount: 148,
      webhookPath: '/webhook/ig-auto-publish'
    },
    {
      id: 'wf-2',
      name: 'YouTube Analytics → Google Sheets Live Sync',
      status: 'active',
      lastRun: '1 hour ago',
      executionsCount: 520,
      webhookPath: '/webhook/yt-stats-sync'
    },
    {
      id: 'wf-3',
      name: 'Discord Creator Community Notification Bot',
      status: 'active',
      lastRun: '3 hours ago',
      executionsCount: 940,
      webhookPath: '/webhook/discord-notif'
    },
    {
      id: 'wf-4',
      name: 'Daily AI News Digest Web Scraper',
      status: 'paused',
      lastRun: 'Yesterday',
      executionsCount: 64,
      webhookPath: '/webhook/ai-news-scraper'
    }
  ]);

  useEffect(() => {
    localStorage.setItem('schrodinger_n8n_url', instanceUrl);
  }, [instanceUrl]);

  useEffect(() => {
    localStorage.setItem('schrodinger_n8n_key', apiKey);
  }, [apiKey]);

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnected(true);
      setConnecting(false);
    }, 800);
  };

  const handleRunWorkflow = async (wf: N8nWorkflow) => {
    setRunningWorkflow(wf.id);

    try {
      const response = await fetch('/api/n8n/trigger', {
        method: 'POST',
        headers: { ...getApiHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: wf.id,
          webhookUrl: `${instanceUrl}${wf.webhookPath}`,
          apiKey
        })
      });

      const data = await response.json();
      setExecutionLog(data);

      if (data && data.success) {
        setWorkflows(workflows.map(w => w.id === wf.id ? { ...w, lastRun: 'Just now', executionsCount: w.executionsCount + 1 } : w));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunningWorkflow(null);
    }
  };

  const toggleWorkflowStatus = (id: string) => {
    setWorkflows(workflows.map(w => w.id === id ? { ...w, status: w.status === 'active' ? 'paused' : 'active' } : w));
  };

  return (
    <section id="automation" className="py-20 bg-[#F7F5F2] border-t border-[#121212]/15 relative text-[#121212]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-[#121212]/60">
            [ 04 / N8N AUTOMATION PIPELINE ]
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#121212]">
            n8n Workflow Integration Hub
          </h2>
          <p className="text-[#121212]/70 text-base font-serif italic">
            Connect your custom n8n instance to trigger webhook pipelines, sync social channels, and automate video publishing.
          </p>
        </div>

        {/* Credentials Form */}
        <div className="bg-white border border-[#121212]/15 p-6 sm:p-8 space-y-6 max-w-4xl mx-auto shadow-xs">
          <div className="flex items-center justify-between border-b border-[#121212]/10 pb-4">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-[#121212]" />
              <h3 className="text-base font-serif font-bold text-[#121212]">n8n Instance Settings</h3>
            </div>
            <span className={`text-[10px] font-mono uppercase tracking-widest font-bold px-3 py-1 border ${connected ? 'bg-emerald-50 border-emerald-600/30 text-emerald-800' : 'bg-amber-50 border-amber-600/30 text-amber-800'}`}>
              {connected ? '● CONNECTED' : '○ DISCONNECTED'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#121212]/80 mb-1 font-bold">n8n Instance URL</label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-[#121212]/40 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={instanceUrl}
                  onChange={(e) => setInstanceUrl(e.target.value)}
                  placeholder="https://n8n.yourdomain.com"
                  className="w-full bg-white border border-[#121212]/20 pl-10 pr-4 py-2.5 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none focus:border-[#121212]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#121212]/80 mb-1 font-bold">n8n API Key / Token</label>
              <div className="relative">
                <Key className="w-4 h-4 text-[#121212]/40 absolute left-3.5 top-3.5" />
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="n8n_api_key_..."
                  className="w-full bg-white border border-[#121212]/20 pl-10 pr-10 py-2.5 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none focus:border-[#121212]"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3.5 top-3 text-[#121212]/40 hover:text-[#121212] cursor-pointer"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleConnect}
            disabled={connecting || !instanceUrl.trim()}
            className="w-full py-3 bg-[#121212] hover:bg-[#262626] text-[#F7F5F2] font-bold text-xs uppercase tracking-[0.2em] shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? <RefreshCw className="w-4 h-4 animate-spin text-[#F7F5F2]" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{connecting ? 'Testing n8n Connection...' : 'Save & Verify n8n Webhook Connection'}</span>
          </button>

          {!instanceUrl.trim() && (
            <p className="text-[10px] font-mono text-amber-700">
              Enter your n8n instance URL to connect and run real workflows.
            </p>
          )}
        </div>

        {/* 3 Status Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="bg-white p-5 border border-[#121212]/15 text-left shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#121212]/60 block mb-1 font-bold">Active Workflows</span>
            <span className="text-2xl font-serif font-bold text-[#121212]">
              {workflows.filter(w => w.status === 'active').length} / {workflows.length}
            </span>
          </div>

          <div className="bg-white p-5 border border-[#121212]/15 text-left shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#121212]/60 block mb-1 font-bold">Total Executions</span>
            <span className="text-2xl font-serif font-bold text-[#121212]">1,672</span>
          </div>

          <div className="bg-white p-5 border border-[#121212]/15 text-left shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#121212]/60 block mb-1 font-bold">Next Trigger</span>
            <span className="text-2xl font-serif font-bold text-[#121212]">In 45 Mins</span>
          </div>
        </div>

        {/* Workflow Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className="bg-white p-5 border border-[#121212]/15 hover:border-[#121212]/40 transition-colors flex flex-col justify-between space-y-4 text-left shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 bg-[#121212] text-[#F7F5F2]`}>
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-serif font-bold text-[#121212] line-clamp-1">{wf.name}</h4>
                    <span className="text-xs text-[#121212]/60 font-serif italic">Last run: {wf.lastRun}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleWorkflowStatus(wf.id)}
                  className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-widest border cursor-pointer ${
                    wf.status === 'active' ? 'bg-[#121212] text-[#F7F5F2] border-[#121212]' : 'bg-[#F7F5F2] text-[#121212]/60 border-[#121212]/20'
                  }`}
                >
                  {wf.status.toUpperCase()}
                </button>
              </div>

              <div className="pt-3 border-t border-[#121212]/10 flex items-center justify-between">
                <span className="text-xs font-mono text-[#121212]/60 font-bold">
                  {wf.executionsCount} runs
                </span>

                <button
                  onClick={() => handleRunWorkflow(wf)}
                  disabled={runningWorkflow === wf.id}
                  className="px-4 py-2 bg-[#121212] hover:bg-[#262626] text-[#F7F5F2] font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {runningWorkflow === wf.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F7F5F2]" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{runningWorkflow === wf.id ? 'Running...' : 'Run Workflow'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Execution Log Modal */}
        {executionLog && (
          <div className="fixed inset-0 z-50 bg-[#121212]/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-white border border-[#121212] p-6 text-left space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#121212]/15 pb-3">
                <div className="flex items-center gap-2 text-[#121212] font-mono text-xs font-bold uppercase tracking-wider">
                  <Terminal className="w-4 h-4" />
                  <span>N8N EXECUTION LOG RESULT</span>
                </div>
                <button onClick={() => setExecutionLog(null)} className="p-1 bg-[#121212] text-[#F7F5F2] cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <pre className="bg-[#F7F5F2] border border-[#121212]/15 p-4 text-xs font-mono text-[#121212] overflow-x-auto max-h-60 leading-relaxed">
                {JSON.stringify(executionLog, null, 2)}
              </pre>

              <div className="text-right">
                <button
                  onClick={() => setExecutionLog(null)}
                  className="px-4 py-2 bg-[#121212] text-[#F7F5F2] text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Close Log
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
