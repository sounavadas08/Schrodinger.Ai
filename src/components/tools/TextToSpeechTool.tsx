import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Pause, Square, Download, Loader2, AlertCircle } from 'lucide-react';
import { getApiHeaders } from '../../lib/apiHelper';

export const TextToSpeechTool: React.FC = () => {
  const [text, setText] = useState('Welcome to SchrodingerAi. Automate your creation, scale your workflow, and focus on high-impact editorial strategy.');
  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');

  // Browser speechSynthesis fallback state
  const [browserSpeaking, setBrowserSpeaking] = useState(false);
  const [browserPaused, setBrowserPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isPlaying = !!audioUrl && audioRef.current && !audioRef.current.paused;

  const synthesize = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ text, lang: 'en' }),
      });
      const data = await response.json();
      if (data.success && data.audioUrl) {
        // Revoke previous object URL if we used one (we use data URLs, so safe to just replace)
        setAudioUrl(data.audioUrl);
        setSource(data.source || 'cloudflare');
        // Auto-play
        setTimeout(() => {
          audioRef.current?.play().catch(() => {});
        }, 0);
      } else {
        setError(data.error || 'Failed to synthesize speech');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el || !audioUrl) return;
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  };

  const stop = () => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = 'schrodinger_ai_speech.mp3';
    a.click();
  };

  // ---- Browser speechSynthesis fallback (no Cloudflare configured) ----
  const speakBrowser = () => {
    if (!('speechSynthesis' in window)) return;
    if (browserPaused) {
      window.speechSynthesis.resume();
      setBrowserPaused(false);
      setBrowserSpeaking(true);
      return;
    }
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.onend = () => { setBrowserSpeaking(false); setBrowserPaused(false); };
    utterance.onerror = () => { setBrowserSpeaking(false); setBrowserPaused(false); };
    window.speechSynthesis.speak(utterance);
    setBrowserSpeaking(true);
    setBrowserPaused(false);
  };

  const pauseBrowser = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setBrowserPaused(true);
      setBrowserSpeaking(true);
    }
  };

  const stopBrowser = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setBrowserSpeaking(false);
      setBrowserPaused(false);
    }
  };

  const downloadScript = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'editorial_speech_script.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const usingBrowserFallback = !!error && error.includes('Configure a Cloudflare');

  return (
    <div className="space-y-6 text-[#121212]">
      <div className="flex items-center justify-between border-b border-[#121212]/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#121212] text-[#F7F5F2]">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-[#121212]">Text to Speech Synthesizer</h3>
            <p className="text-xs text-[#121212]/60 font-serif italic">Convert narrative scripts into natural spoken audio articulation</p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold px-2.5 py-1 bg-[#121212] text-[#F7F5F2]">
          VOICE SYNTH
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Text Script */}
        <div className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-[#121212]/80 mb-2">
              Voiceover Script
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste script to articulate..."
              rows={6}
              className="w-full bg-white border border-[#121212]/20 p-3.5 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none focus:border-[#121212] transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#121212]/80 mb-1 font-bold">Playback Speed ({rate}x)</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-[#121212] cursor-pointer mt-2"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={synthesize}
                disabled={loading || !text.trim()}
                className="w-full py-2.5 bg-[#121212] hover:bg-[#262626] text-[#F7F5F2] font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Synthesizing...</span></>) : (<><Volume2 className="w-3.5 h-3.5" /><span>Generate Audio</span></>)}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-700 text-xs font-serif flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {source && audioUrl && (
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#121212]/50">
              Audio source: <span className="text-[#121212] font-bold">{source}</span>
            </div>
          )}
        </div>

        {/* Audio Player & Controls */}
        <div className="bg-white border border-[#121212]/15 p-6 flex flex-col justify-between items-center text-center shadow-xs">
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between text-[10px] text-[#121212]/60 font-mono font-bold tracking-widest">
              <span>AUDIO PLAYER</span>
              <span className={audioUrl ? 'text-[#121212] font-bold' : 'text-[#121212]/40'}>
                {audioUrl ? '● READY' : 'STANDBY'}
              </span>
            </div>

            {/* Equalizer Bars */}
            <div className="h-28 bg-[#F7F5F2] border border-[#121212]/15 flex items-center justify-center gap-1.5 px-4 overflow-hidden">
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 transition-all duration-150 ${audioUrl ? 'bg-[#121212]' : 'bg-[#121212]/20 h-2'}`}
                  style={{
                    height: audioUrl ? `${Math.floor(Math.random() * 80) + 10}%` : '8px',
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>

            <audio
              ref={audioRef}
              src={audioUrl || undefined}
              onPlay={() => setAudioUrl(audioUrl)}
              className="w-full"
              controls
            />
          </div>

          {/* Controls Button Bar */}
          <div className="w-full pt-6 flex items-center justify-center gap-3 border-t border-[#121212]/10">
            <button
              onClick={togglePlay}
              disabled={!audioUrl}
              className="px-6 py-3 bg-[#121212] hover:bg-[#262626] text-[#F7F5F2] font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={stop}
              disabled={!audioUrl}
              className="p-3 bg-[#F7F5F2] border border-[#121212]/20 text-[#121212] hover:bg-[#121212] hover:text-[#F7F5F2] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Stop"
            >
              <Square className="w-4 h-4" />
            </button>

            <button
              onClick={downloadAudio}
              disabled={!audioUrl}
              className="p-3 bg-[#F7F5F2] border border-[#121212]/20 text-[#121212] hover:bg-[#121212] hover:text-[#F7F5F2] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Download MP3"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {usingBrowserFallback && (
            <div className="w-full pt-4 flex items-center justify-center gap-3 border-t border-[#121212]/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#121212]/50">Or use browser voice:</span>
              {!browserSpeaking ? (
                <button onClick={speakBrowser} className="px-4 py-2 bg-[#121212]/10 border border-[#121212] text-[#121212] font-bold text-xs uppercase tracking-wider cursor-pointer">
                  {browserPaused ? 'Resume' : 'Speak (Browser)'}
                </button>
              ) : (
                <button onClick={pauseBrowser} className="px-4 py-2 bg-[#121212]/10 border border-[#121212] text-[#121212] font-bold text-xs uppercase tracking-wider cursor-pointer">
                  Pause
                </button>
              )}
              <button onClick={stopBrowser} disabled={!browserSpeaking && !browserPaused} className="p-2 bg-[#F7F5F2] border border-[#121212]/20 text-[#121212] hover:bg-[#121212] hover:text-[#F7F5F2] disabled:opacity-30 cursor-pointer transition-colors" title="Stop">
                <Square className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={downloadScript}
            className="mt-4 text-[10px] font-mono uppercase tracking-widest text-[#121212]/50 hover:text-[#121212] underline cursor-pointer"
          >
            Download Script (.txt)
          </button>
        </div>
      </div>
    </div>
  );
};
