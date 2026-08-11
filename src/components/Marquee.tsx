import React, { useState } from 'react';

export const Marquee: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);

  const items = [
    'IMAGE GENERATOR',
    'TEXT TO SPEECH',
    'YOUTUBE TO MP3',
    'INSTAGRAM DOWNLOADER',
    'AI ROUTINE MAKER',
    'AUTOMATION PIPELINE',
  ];

  return (
    <div className="relative py-4 bg-[#EFECE6] border-y border-[#121212]/15 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#EFECE6] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#EFECE6] to-transparent z-10 pointer-events-none" />

      <div
        className="flex whitespace-nowrap overflow-x-hidden cursor-default"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={`flex items-center gap-8 ${
            isPaused ? '[animation-play-state:paused]' : ''
          }`}
          style={{
            animation: 'marquee 25s linear infinite',
          }}
        >
          {[...items, ...items, ...items, ...items].map((item, idx) => (
            <div key={idx} className="flex items-center gap-8">
              <span className="text-xs font-mono font-bold tracking-[0.2em] text-[#121212]">
                {item}
              </span>
              <span className="text-[#121212] text-xs">■</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};
