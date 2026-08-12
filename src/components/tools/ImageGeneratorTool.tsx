import React, { useState, useEffect } from 'react';
import { Image, Download, Copy, Check, RefreshCw, ZoomIn, X, History, Star, Trash2, Search, ArrowUpRight, Sparkles, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PromptHistoryItem } from '../../types';
import { getApiHeaders, safeResponseJson } from '../../lib/apiHelper';
import {
  fetchPromptHistory,
  addPromptHistoryItem,
  toggleFavoritePrompt,
  deletePromptHistoryItem,
  clearAllPromptHistory
} from '../../lib/promptHistoryService';

export const ImageGeneratorTool: React.FC = () => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [zoomModal, setZoomModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History states
  const [historyItems, setHistoryItems] = useState<PromptHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');

  const presets = [
    'Editorial magazine fashion portrait in monochrome high contrast lighting',
    '3D architectural blueprint render of an obsidian library with warm interior spotlighting',
    'Minimalist typography artwork with serif headlines on vintage cream paper canvas',
    'High fashion studio photography background with dramatic soft shadows'
  ];

  // Load history on mount or user change
  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  useEffect(() => {
    const handleTrigger = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.prompt) {
        setPrompt(customEvent.detail.prompt);
        setActiveTab('generator');
        handleGenerate(customEvent.detail.prompt);
      }
    };
    window.addEventListener('trigger-image-gen', handleTrigger);
    return () => window.removeEventListener('trigger-image-gen', handleTrigger);
  }, []);

  const loadHistory = async () => {
    const items = await fetchPromptHistory(user?.id);
    setHistoryItems(items);
  };

  const handleGenerate = async (customPrompt?: string) => {
    const targetPrompt = customPrompt || prompt;
    if (!targetPrompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ prompt: targetPrompt, aspectRatio })
      });

      const data = await safeResponseJson(response);
      if (data.success && data.imageUrl) {
        setResultImage(data.imageUrl);

        // Record prompt into history automatically
        const newHistoryItem = await addPromptHistoryItem(
          {
            prompt: targetPrompt,
            aspectRatio,
            imageUrl: data.imageUrl,
            source: data.source || 'gemini'
          },
          user?.id
        );

        setHistoryItems((prev) => [newHistoryItem, ...prev]);
      } else {
        setError(data.error || 'Failed to generate image');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const updated = await toggleFavoritePrompt(id, user?.id);
    setHistoryItems(updated);
  };

  const handleDeleteHistory = async (id: string) => {
    const updated = await deletePromptHistoryItem(id, user?.id);
    setHistoryItems(updated);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your entire prompt history?')) {
      await clearAllPromptHistory(user?.id);
      setHistoryItems([]);
    }
  };

  const handleReusePrompt = (item: PromptHistoryItem) => {
    setPrompt(item.prompt);
    setAspectRatio(item.aspectRatio);
    setActiveTab('generator');
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter history items
  const filteredHistory = historyItems.filter((item) => {
    const matchesQuery = item.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorite = favoritesOnly ? item.isFavorite : true;
    return matchesQuery && matchesFavorite;
  });

  return (
    <div className="space-y-6 text-[#121212]">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#121212]/10 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#121212] text-[#F7F5F2]">
            <Image className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-[#121212]">AI Visual Generator & Prompt Vault</h3>
            <p className="text-xs text-[#121212]/60 font-serif italic">Synthesize artwork and archive generation history with Supabase sync</p>
          </div>
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
              activeTab === 'generator'
                ? 'bg-[#121212] text-[#F7F5F2] border-[#121212]'
                : 'bg-white text-[#121212] border-[#121212]/15 hover:bg-[#121212]/5'
            }`}
          >
            <span>Studio Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-[#121212] text-[#F7F5F2] border-[#121212]'
                : 'bg-white text-[#121212] border-[#121212]/15 hover:bg-[#121212]/5'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Prompt History ({historyItems.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'generator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-4 text-left">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-[#121212]/80">
                  Image Composition Prompt
                </label>
                <span className="text-[10px] font-mono text-[#121212]/50 font-bold uppercase">
                  Auto-Saved to History
                </span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the aesthetic composition, lighting, subject, and style..."
                rows={4}
                className="w-full bg-white border border-[#121212]/20 p-3.5 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none focus:border-[#121212] transition-all resize-none"
              />
            </div>

            {/* Presets */}
            <div>
              <span className="block text-[10px] font-mono uppercase tracking-widest text-[#121212]/60 mb-2 font-bold">Sample Editorial Prompts:</span>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPrompt(preset);
                      handleGenerate(preset);
                    }}
                    className="text-xs text-[#121212] bg-[#F7F5F2] hover:bg-[#121212] hover:text-[#F7F5F2] border border-[#121212]/15 px-2.5 py-1.5 transition-colors text-left line-clamp-1 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#121212]/80 mb-2 font-bold">Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-2">
                {(['1:1', '16:9', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-2 px-3 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      aspectRatio === ratio
                        ? 'bg-[#121212] text-[#F7F5F2] border-[#121212]'
                        : 'bg-white text-[#121212] border-[#121212]/15 hover:bg-[#121212]/5'
                    }`}
                  >
                    {ratio} {ratio === '1:1' ? '(Square)' : ratio === '16:9' ? '(Landscape)' : '(Portrait)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={() => handleGenerate()}
              disabled={loading || !prompt.trim()}
              className="w-full py-3.5 bg-[#121212] hover:bg-[#262626] text-[#F7F5F2] font-bold text-xs uppercase tracking-[0.2em] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#F7F5F2]" />
                  <span>Synthesizing Pixel Matrix...</span>
                </>
              ) : (
                <span>Generate & Save to History</span>
              )}
            </button>

            {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-700 text-xs font-serif italic">{error}</div>}
          </div>

          {/* Output Display */}
          <div className="bg-white border border-[#121212]/15 p-4 flex flex-col items-center justify-center min-h-[320px] relative">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <RefreshCw className="w-8 h-8 text-[#121212] animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#121212]">Processing Image Rendering...</span>
              </div>
            ) : resultImage ? (
              <div className="w-full h-full flex flex-col items-center justify-between gap-3">
                <div className="relative w-full max-h-[280px] overflow-hidden bg-[#F7F5F2] border border-[#121212]/15 group">
                  <img
                    src={resultImage}
                    alt={prompt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain max-h-[280px]"
                  />
                  <button
                    onClick={() => setZoomModal(true)}
                    className="absolute top-3 right-3 p-2 bg-[#121212] text-[#F7F5F2] border border-[#121212] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Expand"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-full flex items-center justify-between gap-2 pt-2 border-t border-[#121212]/10">
                  <button
                    onClick={copyPrompt}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F5F2] hover:bg-[#121212]/10 border border-[#121212]/20 text-xs font-bold text-[#121212] uppercase tracking-wider cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
                  </button>

                  <a
                    href={resultImage}
                    download="editorial_ai_image.png"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#121212] hover:bg-[#262626] text-xs font-bold text-[#F7F5F2] uppercase tracking-wider cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2 p-6">
                <div className="w-12 h-12 bg-[#F7F5F2] border border-[#121212]/15 flex items-center justify-center mx-auto text-[#121212]/40">
                  <Image className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#121212]/80">No visual generated yet</p>
                <p className="text-xs text-[#121212]/60 font-serif italic max-w-xs mx-auto">
                  Enter a composition prompt or select a sample prompt above and click Generate.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Prompt History Tab View */
        <div className="space-y-6 text-left">
          {/* History Filters & Controls */}
          <div className="bg-white border border-[#121212]/15 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#121212]/40 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search past prompts..."
                  className="w-full bg-[#F7F5F2] border border-[#121212]/20 pl-9 pr-3 py-2 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none focus:border-[#121212]"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  onClick={() => setFavoritesOnly(!favoritesOnly)}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 cursor-pointer transition-colors ${
                    favoritesOnly
                      ? 'bg-[#121212] text-[#F7F5F2] border-[#121212]'
                      : 'bg-white text-[#121212] border-[#121212]/20 hover:bg-[#121212]/5'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
                  <span>Starred Only</span>
                </button>

                {historyItems.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="px-3 py-2 bg-white text-red-700 hover:bg-red-50 border border-red-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Prompt History Grid */}
          {filteredHistory.length === 0 ? (
            <div className="bg-white border border-[#121212]/15 p-12 text-center space-y-3">
              <History className="w-8 h-8 text-[#121212]/30 mx-auto" />
              <h4 className="text-base font-serif font-bold text-[#121212]">No Prompts Found</h4>
              <p className="text-xs text-[#121212]/60 font-serif italic max-w-sm mx-auto">
                {searchQuery || favoritesOnly
                  ? 'No prompts match your current search filter.'
                  : 'Your generated prompts and images will automatically be saved here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#121212]/15 p-4 flex flex-col justify-between space-y-3 hover:border-[#121212] transition-colors relative group"
                >
                  <div className="space-y-2">
                    {/* Image Thumbnail */}
                    <div className="relative w-full h-36 bg-[#F7F5F2] border border-[#121212]/10 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.prompt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#121212] text-[#F7F5F2] text-[9px] font-mono font-bold uppercase tracking-widest">
                        {item.aspectRatio}
                      </span>
                      <button
                        onClick={() => handleToggleFavorite(item.id)}
                        className="absolute top-2 right-2 p-1.5 bg-[#121212] text-[#F7F5F2] cursor-pointer"
                        title={item.isFavorite ? 'Unstar prompt' : 'Star prompt'}
                      >
                        <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>

                    {/* Prompt text */}
                    <p className="text-xs text-[#121212] font-serif line-clamp-3 leading-relaxed">
                      "{item.prompt}"
                    </p>
                  </div>

                  {/* Actions & Meta Footer */}
                  <div className="pt-2 border-t border-[#121212]/10 flex items-center justify-between text-[10px] font-mono text-[#121212]/60">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteHistory(item.id)}
                        className="p-1 hover:text-red-700 cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleReusePrompt(item)}
                        className="px-2.5 py-1 bg-[#121212] hover:bg-[#262626] text-[#F7F5F2] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Reuse</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Zoom Modal */}
      {zoomModal && resultImage && (
        <div className="fixed inset-0 z-50 bg-[#121212]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-[#F7F5F2] border border-[#121212] p-4">
            <button
              onClick={() => setZoomModal(false)}
              className="absolute top-4 right-4 p-2 bg-[#121212] text-[#F7F5F2] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={resultImage} alt="Expanded" referrerPolicy="no-referrer" className="w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
