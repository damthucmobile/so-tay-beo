'use client';

import React from 'react';
import { Sparkles, Bot } from 'lucide-react';
import { NavTabId } from '../layout/Sidebar';

interface AIFloatingButtonProps {
  currentTab: NavTabId;
  onOpenAI: () => void;
}

export const AIFloatingButton: React.FC<AIFloatingButtonProps> = ({
  currentTab,
  onOpenAI,
}) => {
  // Khi đang ở chính màn hình AI Assistant thì ẩn nút Floating
  if (currentTab === 'ai_assistant') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none print:hidden animate-fadeIn">
      <button
        onClick={onOpenAI}
        className="group relative flex items-center gap-2.5 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-500/35 hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border border-white/20 backdrop-blur-md"
        title="Mở Không gian Trợ lý Gemini AI"
      >
        {/* Glowing Ping Effect */}
        <span className="animate-ping absolute -top-1 -right-1 inline-flex h-3 w-3 rounded-full bg-purple-400 opacity-75" />
        <span className="absolute -top-1 -right-1 inline-flex h-3 w-3 rounded-full bg-purple-500" />

        <div className="w-6 h-6 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        </div>

        <span className="tracking-wide">Trợ lý AI</span>
      </button>
    </div>
  );
};
