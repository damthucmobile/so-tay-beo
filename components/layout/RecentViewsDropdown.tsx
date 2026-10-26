'use client';

import React, { useState, useRef, useEffect } from 'react';
import { History, Clock, BookOpen, User, FileText, X, ChevronRight, LayoutGrid } from 'lucide-react';
import { useActivityTracker, deleteRecentViewItem, RecentViewItem } from '@/core/firebase';
import { useAuth } from '@/core/firebase';

interface RecentViewsDropdownProps {
  onSelectItem?: (item: RecentViewItem) => void;
}

export const RecentViewsDropdown: React.FC<RecentViewsDropdownProps> = ({ onSelectItem }) => {
  const { recentViews, isLoadingRecent } = useActivityTracker();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleDelete = async (e: React.MouseEvent, item: RecentViewItem) => {
    e.stopPropagation();
    if (user?.uid && item.id) {
      await deleteRecentViewItem(user.uid, item.id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'class':
        return <BookOpen className="w-3.5 h-3.5 text-blue-500" />;
      case 'customer':
        return <User className="w-3.5 h-3.5 text-emerald-500" />;
      case 'tab':
        return <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />;
      case 'document':
      default:
        return <FileText className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const formatTime = (ts: any) => {
    if (!ts) return 'Vừa xem';
    try {
      const date = ts?.toDate ? ts.toDate() : new Date(ts);
      const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
      if (diffMinutes < 1) return 'Vừa xem';
      if (diffMinutes < 60) return `${diffMinutes} phút trước`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return `${Math.floor(diffHours / 24)} ngày trước`;
    } catch {
      return 'Gần đây';
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Nút kích hoạt Dropdown */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer relative ${
          isOpen ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : ''
        }`}
        title="Nội dung đã xem gần đây"
      >
        <History className="w-4 h-4" />
        {recentViews.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
        )}
      </button>

      {/* Popup Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Xem Gần Đây</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {recentViews.length}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Tự động lưu</span>
          </div>

          {/* Body List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoadingRecent && recentViews.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Đang tải lịch sử xem...
              </div>
            ) : recentViews.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 px-4">
                Chưa có nội dung nào được xem gần đây.
              </div>
            ) : (
              recentViews.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (onSelectItem) onSelectItem(item);
                    setIsOpen(false);
                  }}
                  className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {getIcon(item.contentType)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.subtitle && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {item.subtitle}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatTime(item.lastViewedAt)}
                        </span>
                        {item.viewCount > 1 && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                            {item.viewCount} lượt
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, item)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition"
                    title="Xóa khỏi danh sách"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
