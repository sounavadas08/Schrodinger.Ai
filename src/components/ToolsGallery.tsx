import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image, Volume2, Youtube, Instagram, Calendar } from 'lucide-react';
import { ImageGeneratorTool } from './tools/ImageGeneratorTool';
import { TextToSpeechTool } from './tools/TextToSpeechTool';
import { YoutubeDownloaderTool } from './tools/YoutubeDownloaderTool';
import { InstagramDownloaderTool } from './tools/InstagramDownloaderTool';
import { AIRoutineMakerTool } from './tools/AIRoutineMakerTool';

export const ToolsGallery: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('image-gen');

  const tools = [
    { id: 'image-gen', label: 'Image Generator', icon: Image, badge: 'AI Vision' },
    { id: 'tts', label: 'Text to Speech', icon: Volume2, badge: 'Voice Synth' },
    { id: 'youtube', label: 'YouTube to MP3', icon: Youtube, badge: '320kbps HD' },
    { id: 'instagram', label: 'Instagram Downloader', icon: Instagram, badge: 'Reels & Media' },
    { id: 'routine', label: 'AI Routine Maker', icon: Calendar, badge: 'Schedule AI' },
  ];

  return (
    <section id="tools" className="py-20 relative bg-[#F7F5F2] dark:bg-[#121212] border-b border-[#121212]/10 dark:border-[#F7F5F2]/10 text-[#121212] dark:text-[#F7F5F2] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121212] dark:bg-[#F7F5F2] text-[#F7F5F2] dark:text-[#121212] text-[10px] uppercase tracking-[0.2em] font-bold transition-colors">
            <span>INTERACTIVE AI STUDIO SUITE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif tracking-tight text-[#121212] dark:text-[#F7F5F2]">
            Five Essential Tools.{' '}
            <span className="italic font-normal">Zero Friction.</span>
          </h2>
          <p className="text-[#121212]/70 dark:text-[#F7F5F2]/70 text-sm font-serif italic max-w-xl mx-auto">
            Select a studio utility below to generate media, process content, or optimize your creation workflow.
          </p>
        </div>

        {/* Tab Navigation Gallery Pills */}
        <div className="flex items-center justify-start md:justify-center flex-nowrap md:flex-wrap gap-2 overflow-x-auto md:overflow-x-visible pb-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTab(tool.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-[#121212] text-[#F7F5F2] border-[#121212] dark:bg-[#F7F5F2] dark:text-[#121212] dark:border-[#F7F5F2] shadow-sm'
                    : 'bg-white text-[#121212] border-[#121212]/15 dark:bg-[#191919] dark:text-[#F7F5F2] dark:border-[#F7F5F2]/10 hover:bg-[#121212]/5 dark:hover:bg-[#F7F5F2]/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#F7F5F2] dark:text-[#121212]' : 'text-[#121212]/70'}`} />
                <span>{tool.label}</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 ${
                    isActive ? 'bg-[#F7F5F2]/20 text-[#F7F5F2] dark:bg-[#121212]/20 dark:text-[#121212]' : 'bg-[#121212]/5 text-[#121212]/60 dark:bg-[#F7F5F2]/5 dark:text-[#F7F5F2]/60'
                  }`}
                >
                  {tool.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Tool Stage */}
        <div className="bg-white dark:bg-[#191919] border border-[#121212]/15 dark:border-[#F7F5F2]/10 p-6 sm:p-8 relative min-h-[460px] shadow-xs transition-colors duration-300">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'image-gen' && <ImageGeneratorTool />}
              {activeTab === 'tts' && <TextToSpeechTool />}
              {activeTab === 'youtube' && <YoutubeDownloaderTool />}
              {activeTab === 'instagram' && <InstagramDownloaderTool />}
              {activeTab === 'routine' && <AIRoutineMakerTool />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
