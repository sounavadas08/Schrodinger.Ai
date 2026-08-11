import React, { useState } from 'react';
import { Instagram, Download, Heart, Eye, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getApiHeaders } from '../../lib/apiHelper';

export const InstagramDownloaderTool: React.FC = () => {
  const [url, setUrl] = useState('https://www.instagram.com/reel/C_example123');
  const [format, setFormat] = useState<'MP4 Video' | 'High-Res Image'>('MP4 Video');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ig-download', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ url, format })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to parse Instagram link');
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
            <Instagram className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-[#121212]">Instagram Media Extractor</h3>
            <p className="text-xs text-[#121212]/60 font-serif italic">Download Reels, Posts & Carousels in full HD resolution</p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold px-2.5 py-1 bg-[#121212] text-[#F7F5F2]">
          REELS & POSTS
        </span>
      </div>

      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste Instagram Post or Reel URL..."
            className="flex-1 bg-white border border-[#121212]/20 px-4 py-3 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none focus:border-[#121212] transition-all"
          />

          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            className="bg-white border border-[#121212]/20 px-3 py-3 text-xs text-[#121212] focus:outline-none focus:border-[#121212]"
          >
            <option value="MP4 Video">MP4 Video</option>
            <option value="High-Res Image">High-Res Photo</option>
          </select>

          <button
            onClick={handleExtract}
            disabled={loading || !url.trim()}
            className="px-6 py-3 bg-[#121212] hover:bg-[#262626] text-[#F7F5F2] font-bold text-xs uppercase tracking-[0.2em] shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-[#F7F5F2]" /> : <Instagram className="w-4 h-4" />}
            <span>{loading ? 'Fetching...' : 'Download Media'}</span>
          </button>
        </div>

        {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-700 text-xs">{error}</div>}

        {/* Result Card */}
        {result && (
          <div className="bg-white border border-[#121212]/15 p-5 mt-4 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:w-44 h-44 bg-[#F7F5F2] border border-[#121212]/15 flex-shrink-0 overflow-hidden">
                <img
                  src={result.thumbnail}
                  alt={result.author}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#121212] text-[10px] font-mono text-[#F7F5F2]">
                  {result.format}
                </div>
              </div>

              <div className="flex-1 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#121212]">{result.author}</span>
                  <div className="flex items-center gap-3 text-xs font-mono text-[#121212]/60">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-[#121212]" /> {result.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-[#121212]" /> {result.views}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#121212]/80 line-clamp-3 bg-[#F7F5F2] p-3 border border-[#121212]/10 leading-relaxed font-serif italic">
                  "{result.caption}"
                </p>

                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-mono font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>VERIFIED MEDIA ASSET</span>
                  </div>

                  <a
                    href={result.downloadUrl}
                    download={result.mediaType === 'image' ? 'editorial_instagram_photo.jpg' : 'editorial_instagram_media.mp4'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 bg-[#121212] hover:bg-[#262626] text-[#F7F5F2] font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {format}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
