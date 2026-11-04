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
    <div className="fixed bottom-6 right-6 z-40 select-none print:hidden">
      <button
        onClick={onOpenAI}
        className="flex items-center gap-2 py-2.5 px-4 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-medium shadow-md border border-zinc-700/20 dark:border-zinc-300/20 transition-all hover:scale-102 active:scale-98 cursor-pointer"
        title="Mở Trợ lý AI"
      >
        <Bot className="w-4 h-4 text-zinc-300 dark:text-zinc-700" />
        <span className="tracking-normal">Trợ lý AI</span>
      </button>
    </div>
  );
};
