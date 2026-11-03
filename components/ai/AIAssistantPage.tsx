'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  BookOpen,
  Calendar,
  Key,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Plus,
  Trash2,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Search,
  ArrowLeft,
  HelpCircle,
  Globe,
  ChevronDown,
  Clock,
  GraduationCap,
  CalendarDays,
} from 'lucide-react';
import {
  useGeminiAI,
  gemini,
  promptTemplates,
  getCustomUserApiKey,
  setCustomUserApiKey,
  ChatMessage,
  AIContextScope,
  CONTEXT_SCOPE_OPTIONS,
  buildSystemContextPrompt,
} from '@/core';
import { useAuth } from '@/core/firebase';
import { useTeachingScheduleStore } from '@/features/teaching-schedule/stores/useTeachingScheduleStore';
import { useClassManager } from '@/features/class/hooks/useClassManager';
import { useScheduleManager } from '@/features/schedule/hooks/useScheduleManager';
import { useIncomeManager } from '@/features/income/hooks/useIncomeManager';
import { NavTabId } from '../layout/Sidebar';

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

const CHAT_SESSIONS_STORAGE_KEY = 'so_tay_beo_gemini_chat_sessions_v1';

interface AIAssistantPageProps {
  onNavigateTab?: (tab: NavTabId) => void;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const { timetable, selectedTeacher } = useTeachingScheduleStore();
  const { classes, students, sessions: classSessions } = useClassManager(user?.uid);
  const { appointments, customers } = useScheduleManager(user?.uid);
  const { transactions } = useIncomeManager(user?.uid);

  const [selectedScope, setSelectedScope] = useState<AIContextScope>('global');
  const [isScopeMenuOpen, setIsScopeMenuOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'chat' | 'lesson' | 'config'>('chat');
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');

  // Quản lý sessions lịch sử hội thoại
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  // Lesson plan form state
  const [lessonSubject, setLessonSubject] = useState(timetable?.subjects[0] || 'Toán');
  const [lessonGrade, setLessonGrade] = useState('6');
  const [lessonTopic, setLessonTopic] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // API Key config
  const [customKey, setCustomKey] = useState<string>(() => getCustomUserApiKey() || '');
  const [savedKeySuccess, setSavedKeySuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Tải danh sách sessions từ localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          return;
        }
      }
    } catch {}

    const initialSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'Cuộc trò chuyện mới',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setSessions([initialSession]);
    setCurrentSessionId(initialSession.id);
  }, []);

  const saveSessionsToStorage = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
      } catch {}
    }
  };

  const currentSession = useMemo(() => {
    return sessions.find((s) => s.id === currentSessionId) || sessions[0] || null;
  }, [sessions, currentSessionId]);

  const currentScopeConfig = useMemo(() => {
    return CONTEXT_SCOPE_OPTIONS.find((o) => o.id === selectedScope) || CONTEXT_SCOPE_OPTIONS[0];
  }, [selectedScope]);

  // Xây dựng system prompt đa bối cảnh toàn diện
  const systemInstruction = useMemo(() => {
    return buildSystemContextPrompt(selectedScope, {
      user: {
        name: user?.displayName || selectedTeacher || 'Thầy/Cô',
        email: user?.email,
      },
      timetable,
      selectedTeacher,
      classes,
      students,
      sessions: classSessions,
      appointments,
      customers,
      transactions,
    });
  }, [
    selectedScope,
    user,
    timetable,
    selectedTeacher,
    classes,
    students,
    classSessions,
    appointments,
    customers,
    transactions,
  ]);

  const {
    isLoading,
    error,
    chatMessages,
    setChatMessages,
    sendMessage,
  } = useGeminiAI({
    systemInstruction,
    model: 'gemini-2.5-flash',
  });

  const scopeSuggestions = useMemo(() => {
    switch (selectedScope) {
      case 'global':
        return [
          'Tuần này tôi có bị trùng ca dạy gia sư nào với thời khóa biểu trường không?',
          'Tổng hợp tình hình: số tiết dạy trường, số ca gia sư và danh sách lớp học',
          'Thống kê các lớp còn học sinh chưa nộp học phí và các khoản công nợ',
          'Hôm nay tôi có những lịch trình và tiết dạy nào cần lưu ý?',
        ];
      case 'teaching':
        return [
          'Tuần này tôi có những buổi nào trống tiết?',
          'Hôm nay tôi dạy những lớp nào, tiết mấy?',
          'Soạn tin nhắn dặn dò học sinh chuẩn bị bài cho ngày mai',
          'Thống kê tổng số tiết môn Toán tôi dạy tuần này',
        ];
      case 'classes':
        return [
          'Danh sách các lớp tôi đang quản lý và sĩ số từng lớp',
          'Có bao nhiêu học sinh chưa nộp học phí trong tháng này?',
          'Soạn thông báo nhắc đóng học phí gửi phụ huynh học sinh',
          'Thống kê tổng doanh thu học phí dự kiến từ tất cả các lớp',
        ];
      case 'schedule':
        return [
          'Sắp tới tôi có những ca dạy gia sư / lịch hẹn nào?',
          'Thống kê tổng số ca dạy tự do đã hoàn thành và chưa hoàn thành',
          'Ca hẹn tiếp theo diễn ra ở đâu, vào lúc mấy giờ?',
          'Tổng tiền thù lao từ các ca dạy tự do sắp tới là bao nhiêu?',
        ];
      case 'general':
        return [
          'Giúp tôi viết một bức thư cảm ơn phụ huynh bằng tiếng Việt trang trọng',
          'Gợi ý 5 phương pháp sư phạm tích cực giúp học sinh tập trung hơn',
          'Dịch bài phát biểu này sang tiếng Anh chuẩn phong cách giáo dục',
          'Lập dàn ý cho một tiết sinh hoạt lớp chủ đề Kỹ năng an toàn số',
        ];
      default:
        return [];
    }
  }, [selectedScope]);

  // Đồng bộ tin nhắn khi đổi session
  useEffect(() => {
    if (currentSession) {
      setChatMessages(currentSession.messages || []);
    }
  }, [currentSessionId, currentSession, setChatMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  const handleCreateNewChat = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'Cuộc trò chuyện mới',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    const updated = [newSession, ...sessions];
    saveSessionsToStorage(updated);
    setCurrentSessionId(newSession.id);
    setChatMessages([]);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== sessionId);
    if (updated.length === 0) {
      const fallback: ChatSession = {
        id: `session_${Date.now()}`,
        title: 'Cuộc trò chuyện mới',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      saveSessionsToStorage([fallback]);
      setCurrentSessionId(fallback.id);
      setChatMessages([]);
    } else {
      saveSessionsToStorage(updated);
      if (sessionId === currentSessionId) {
        setCurrentSessionId(updated[0].id);
        setChatMessages(updated[0].messages || []);
      }
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');

    let currentTitle = currentSession?.title || 'Cuộc trò chuyện mới';
    if (currentTitle === 'Cuộc trò chuyện mới' || !currentTitle) {
      currentTitle = text.slice(0, 38) + (text.length > 38 ? '...' : '');
    }

    const res = await sendMessage(text);

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const modelMsg: ChatMessage = {
      id: `model_${Date.now()}`,
      role: 'model',
      content: res || 'Xin lỗi, không có phản hồi từ AI.',
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...chatMessages, userMsg, modelMsg];

    const updatedSessions = sessions.map((s) => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          title: currentTitle,
          updatedAt: new Date().toISOString(),
          messages: newMessages,
        };
      }
      return s;
    });

    saveSessionsToStorage(updatedSessions);
  };

  const handleSaveApiKey = () => {
    setCustomUserApiKey(customKey);
    setSavedKeySuccess(true);
    setTimeout(() => setSavedKeySuccess(false), 3000);
  };

  const handleGenerateLessonPlan = async () => {
    if (!lessonTopic.trim() || isGeneratingPlan) return;
    setIsGeneratingPlan(true);
    try {
      const prompt = promptTemplates.lessonPlanGenerator(lessonSubject, `Khối ${lessonGrade}`, lessonTopic);
      const res = await gemini.generateText(prompt, {
        temperature: 0.6,
      });
      if (res.success && res.data) {
        setGeneratedPlan(res.data);
      } else {
        alert(res.error || 'Không thể soạn giáo án lúc này.');
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi gọi Gemini AI.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSessions = sessions.filter((s) =>
    (s.title || '').toLowerCase().includes(searchHistoryQuery.toLowerCase())
  );

  return (
    <div className="w-full flex-1 flex flex-col bg-background min-h-0 overflow-hidden animate-fadeIn">
      {/* 1. Thanh Tiêu Đề Phân Hệ Trợ Lý AI */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={isSidebarOpen ? 'Thu gọn lịch sử' : 'Mở thanh lịch sử'}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5 text-purple-600" />}
          </button>

          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                Trợ Lý Gemini AI
              </h2>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
              Hỗ trợ thời khóa biểu, soạn giáo án & lưu trữ lịch sử hỏi đáp
            </p>
          </div>
        </div>

        {/* Nút quay lại lịch dạy học */}
        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('teaching_schedule')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-slate-700 transition cursor-pointer shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Xem Lịch dạy học</span>
            <span className="sm:hidden text-[11px]">Lịch dạy</span>
          </button>
        )}
      </div>

      {/* 2. Thân chính: Bố cục 2 cột (Left Sidebar: Lịch sử, Right Area: Nội dung) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* CỘT TRÁI: SIDEBAR LỊCH SỬ HỘI THOẠI */}
        {isSidebarOpen && (
          <div className="w-72 sm:w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col shrink-0">
            {/* Nút Cuộc trò chuyện mới */}
            <div className="p-3 border-b border-slate-200/80 dark:border-slate-800 space-y-2">
              <button
                onClick={handleCreateNewChat}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Cuộc trò chuyện mới</span>
              </button>

              {/* Ô tìm kiếm lịch sử */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm trong lịch sử..."
                  value={searchHistoryQuery}
                  onChange={(e) => setSearchHistoryQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Danh sách các phiên trò chuyện */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Lịch sử hỏi đáp ({filteredSessions.length})</span>
              </div>

              {filteredSessions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Chưa có cuộc trò chuyện nào
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const isActive = session.id === currentSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        setCurrentSessionId(session.id);
                        setActiveTab('chat');
                      }}
                      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer select-none ${
                        isActive
                          ? 'bg-purple-100/90 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border border-purple-200/80 dark:border-purple-800'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-6">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold leading-tight">{session.title}</p>
                          <p className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                            {session.messages?.length || 0} tin nhắn • {new Date(session.updatedAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>

                      {/* Nút xóa session */}
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-slate-400 hover:text-red-600 transition cursor-pointer shrink-0 absolute right-2"
                        title="Xóa cuộc trò chuyện này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* CỘT PHẢI: KHUNG LÀM VIỆC CHÍNH (CHAT / SOẠN GIÁO ÁN / CẤU HÌNH) */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
          {/* Thanh điều hướng Tab bên phải & Bộ chọn Bối cảnh Dữ liệu */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* BỘ CHỌN BỐI CẢNH DỮ LIỆU ĐỘNG */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsScopeMenuOpen(!isScopeMenuOpen)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-300/80 dark:border-purple-800/80 font-bold transition shadow-2xs cursor-pointer"
                  title="Nhấn để đổi phạm vi bối cảnh dữ liệu nạp cho AI"
                >
                  {selectedScope === 'global' && <Globe className="w-3.5 h-3.5 text-purple-600" />}
                  {selectedScope === 'teaching' && <CalendarDays className="w-3.5 h-3.5 text-blue-600" />}
                  {selectedScope === 'classes' && <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />}
                  {selectedScope === 'schedule' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                  {selectedScope === 'general' && <Sparkles className="w-3.5 h-3.5 text-pink-600" />}
                  <span>Bối cảnh: <strong className="font-extrabold">{currentScopeConfig.shortLabel}</strong></span>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${isScopeMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isScopeMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsScopeMenuOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 space-y-1 animate-fadeIn">
                      <div className="px-3 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Phạm vi bối cảnh dữ liệu
                      </div>
                      {CONTEXT_SCOPE_OPTIONS.map((opt) => {
                        const isSelected = opt.id === selectedScope;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setSelectedScope(opt.id);
                              setIsScopeMenuOpen(false);
                            }}
                            className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition cursor-pointer ${
                              isSelected
                                ? 'bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {opt.id === 'global' && <Globe className="w-4 h-4 text-purple-600" />}
                              {opt.id === 'teaching' && <CalendarDays className="w-4 h-4 text-blue-600" />}
                              {opt.id === 'classes' && <GraduationCap className="w-4 h-4 text-emerald-600" />}
                              {opt.id === 'schedule' && <Clock className="w-4 h-4 text-amber-600" />}
                              {opt.id === 'general' && <Sparkles className="w-4 h-4 text-pink-600" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                  {opt.label}
                                </span>
                                {opt.badge && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-purple-600 text-white">
                                    {opt.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                {opt.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

              {/* Chế độ tương tác */}
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Trò chuyện AI</span>
              </button>

              <button
                onClick={() => setActiveTab('lesson')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  activeTab === 'lesson'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Soạn Giáo Án 2018</span>
              </button>

              <button
                onClick={() => setActiveTab('config')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  activeTab === 'config'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Cài đặt Key</span>
              </button>
            </div>

            {currentSession && activeTab === 'chat' && (
              <span className="text-[11px] text-slate-400 font-medium truncate max-w-[200px] hidden md:block">
                Đang mở: <strong className="text-slate-700 dark:text-slate-200">{currentSession.title}</strong>
              </span>
            )}
          </div>

          {/* TAB 1: KHUNG CHAT TOÀN DIỆN */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/40 dark:bg-slate-950/20">
              {/* Vùng Tin Nhắn */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="max-w-4xl 2xl:max-w-5xl mx-auto py-12 text-center space-y-4">
                    <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-purple-500/15 to-indigo-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-sm">
                      {selectedScope === 'global' ? <Globe className="w-7 h-7" /> : <Bot className="w-7 h-7" />}
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
                        Xin chào {user?.displayName || selectedTeacher || 'Thầy/Cô'}!
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl mx-auto leading-relaxed">
                        Đang kích hoạt bối cảnh: <strong className="text-purple-600 dark:text-purple-400">{currentScopeConfig.label}</strong>.
                        {selectedScope === 'global'
                          ? ' Trợ lý đã nắm toàn bộ dữ liệu TKB trường, Lớp học, Lịch tự do và Thu nhập để sẵn sàng đối soát chéo cho bạn:'
                          : ' Thầy/Cô có thể đặt câu hỏi hoặc yêu cầu bất kỳ điều gì:'}
                      </p>
                    </div>

                    {/* Câu hỏi gợi ý theo bối cảnh */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-left">
                      {scopeSuggestions.map((q) => (
                        <button
                          key={q}
                          onClick={() => setInputText(q)}
                          className="text-xs p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400 hover:text-purple-600 transition cursor-pointer text-left shadow-2xs leading-relaxed group flex items-start gap-2"
                        >
                          <span className="text-purple-500 mt-0.5">💡</span>
                          <span className="group-hover:text-purple-600 transition-colors">{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div
                      key={msg.id || i}
                      className={`flex gap-3 max-w-5xl 2xl:max-w-6xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role !== 'user' && (
                        <div className="w-8 h-8 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white rounded-tr-xs shadow-sm font-medium'
                            : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-xs'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        {msg.role !== 'user' && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                            <span>Mô hình: Gemini 2.5 Flash</span>
                            <button
                              onClick={() => handleCopy(msg.content, `chat_${i}`)}
                              className="inline-flex items-center gap-1 hover:text-purple-600 cursor-pointer"
                            >
                              {copiedId === `chat_${i}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>{copiedId === `chat_${i}` ? 'Đã sao chép' : 'Sao chép'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="flex items-center gap-2 max-w-5xl 2xl:max-w-6xl mx-auto text-xs text-purple-600 dark:text-purple-400 pl-11">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini đang phân tích và soạn câu trả lời...</span>
                  </div>
                )}

                {error && (
                  <div className="max-w-5xl 2xl:max-w-6xl mx-auto p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar Rộng Rãi */}
              <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <div className="max-w-5xl 2xl:max-w-6xl mx-auto flex items-end gap-2.5">
                  <textarea
                    rows={2}
                    placeholder="Nhập câu hỏi cho trợ lý Gemini AI (Nhấn Enter để xuống dòng thoải mái)..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100 resize-none max-h-36 min-h-[48px]"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputText.trim() || isLoading}
                    className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shadow-md shadow-purple-500/20 shrink-0 mb-0.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>Gửi</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SOẠN KẾ HOẠCH BÀI DẠY (GIÁO ÁN) */}
          {activeTab === 'lesson' && (
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 max-w-5xl 2xl:max-w-6xl mx-auto w-full">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Môn học
                  </label>
                  <input
                    type="text"
                    value={lessonSubject}
                    onChange={(e) => setLessonSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Khối lớp
                  </label>
                  <select
                    value={lessonGrade}
                    onChange={(e) => setLessonGrade(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  >
                    <option value="6">Khối 6</option>
                    <option value="7">Khối 7</option>
                    <option value="8">Khối 8</option>
                    <option value="9">Khối 9</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Tên bài học / Chủ đề
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Phép cộng phân số"
                    value={lessonTopic}
                    onChange={(e) => setLessonTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateLessonPlan}
                disabled={!lessonTopic.trim() || isGeneratingPlan}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isGeneratingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini đang soạn giáo án 4 bước theo GDPT 2018...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Sinh Kế Hoạch Bài Dạy Chuẩn 4 Hoạt Động</span>
                  </>
                )}
              </button>

              {generatedPlan && (
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
                    <span className="font-extrabold text-sm text-purple-700 dark:text-purple-300">
                      Kế hoạch bài dạy đã tạo:
                    </span>
                    <button
                      onClick={() => handleCopy(generatedPlan, 'lesson')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:text-purple-600 cursor-pointer shadow-xs"
                    >
                      {copiedId === 'lesson' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'lesson' ? 'Đã sao chép' : 'Sao chép giáo án'}</span>
                    </button>
                  </div>
                  <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto text-slate-800 dark:text-slate-200 font-sans">
                    {generatedPlan}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CẤU HÌNH API KEY */}
          {activeTab === 'config' && (
            <div className="p-6 sm:p-8 space-y-5 max-w-4xl 2xl:max-w-5xl mx-auto w-full">
              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-3xl p-5 text-xs space-y-2 text-blue-900 dark:text-blue-200">
                <span className="font-bold flex items-center gap-1.5 text-sm">
                  <Key className="w-4 h-4 text-blue-600" />
                  Cơ chế quản lý API Key Gemini
                </span>
                <p className="text-xs leading-relaxed text-blue-800/80 dark:text-blue-300/80">
                  Hệ thống ưu tiên sử dụng biến môi trường <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code> trên máy chủ.
                  Nếu muốn dùng API Key riêng của cá nhân bạn (Bring Your Own Key), hãy nhập vào bên dưới:
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  API Key Gemini Cá Nhân (Tùy chọn)
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  Nhận khóa API miễn phí từ Google tại{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 dark:text-purple-400 underline font-semibold"
                  >
                    Google AI Studio
                  </a>.
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  onClick={handleSaveApiKey}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer shadow-sm"
                >
                  Lưu Khóa API
                </button>

                {customKey && (
                  <button
                    onClick={() => {
                      setCustomKey('');
                      setCustomUserApiKey('');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Xóa Key cá nhân (Dùng mặc định hệ thống)
                  </button>
                )}

                {savedKeySuccess && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Đã lưu cấu hình thành công!
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
