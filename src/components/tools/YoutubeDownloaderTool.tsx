import React, { useState } from 'react';
import { Youtube, Download, Music, CheckCircle2, RefreshCw } from 'lucide-react';
import { getApiHeaders, safeResponseJson } from '../../lib/apiHelper';

export const YoutubeDownloaderTool: React.FC = () => {
  const [url, setUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [bitrate, setBitrate] = useState('320');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/youtube-to-mp3', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ url, bitrate })
      });

      const data = await safeResponseJson(response);
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to convert video');
      }
    } catch (err: any) {
      setError(err.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-[#121212]">
      <div className="flex items-center justify-between border-b border-[#121212]/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#121212] text-[#F7F5F2]">
            <Youtube className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-[#121212]">YouTube Audio Extractor</h3>
            <p className="text-xs text-[#121212]/60 font-serif italic">Extract high-bitrate audio streams from YouTube URL source</p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold px-2.5 py-1 bg-[#121212] text-[#F7F5F2]">
          320 KBPS HD
        </span>
      </div>

      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube Video URL (e.g., https://youtube.com/watch?v=...)"
              className="w-full bg-white border border-[#121212]/20 px-4 py-3 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none focus:border-[#121212] transition-all"
            />
          </div>

          <select
            value={bitrate}
            onChange={(e) => setBitrate(e.target.value)}
            className="bg-white border border-[#121212]/20 px-3 py-3 text-xs text-[#121212] focus:outline-none focus:border-[#121212]"
          >
            <option value="128">128 kbps (Standard)</option>
            <option value="256">256 kbps (High)</option>
            <option value="320">320 kbps (Studio HD)</option>
          </select>

          <button
            onClick={handleConvert}
            disabled={loading || !url.trim()}
            className="px-6 py-3 bg-[#121212] hover:bg-[#262626] text-[#F7F5F2] font-bold text-xs uppercase tracking-[0.2em] shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-[#F7F5F2]" /> : <Music className="w-4 h-4" />}
            <span>{loading ? 'Extracting...' : 'Extract Audio'}</span>
          </button>
        </div>

        {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-700 text-xs">{error}</div>}

        {/* Result Card */}
        {result && (
          <div className="bg-white border border-[#121212]/15 p-5 mt-4 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative w-full sm:w-40 h-28 bg-[#F7F5F2] border border-[#121212]/15 flex-shrink-0 overflow-hidden">
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-[#121212] text-[10px] font-mono text-[#F7F5F2]">
                  {result.duration}
                </div>
              </div>

              <div className="flex-1 space-y-1.5 text-left w-full">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] font-mono font-bold text-emerald-600 tracking-wider">EXTRACTION COMPLETE</span>
                </div>
                <h4 className="text-base font-serif font-bold text-[#121212] line-clamp-1">{result.title}</h4>
                <p className="text-xs text-[#121212]/60 font-serif italic">Channel: {result.channel} • Size: {result.fileSize}</p>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#F7F5F2] border border-[#121212]/15 text-[10px] font-mono font-bold text-[#121212]">
                  <span>Audio Spec: {result.bitrate} MP3</span>
                </div>
              </div>
            </div>

            {/* Audio Preview & Download */}
            <div className="pt-3 border-t border-[#121212]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <audio controls className="w-full sm:w-2/3 h-9">
                <source src={result.audioUrl} type="audio/mpeg" />
                Your browser does not support audio element.
              </audio>

              <a
                href={result.audioUrl}
                download="editorial_extracted.mp3"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 bg-[#121212] hover:bg-[#262626] text-[#F7F5F2] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download MP3</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
