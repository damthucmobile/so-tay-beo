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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');

  // Tự động mở sidebar trên desktop (>= 768px), thu gọn trên mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);

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
    <div className="w-full flex-1 flex flex-col bg-white dark:bg-zinc-950 min-h-0 overflow-hidden">
      {/* 1. Thanh Tiêu Đề Phân Hệ Trợ Lý AI */}
      <div className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title={isSidebarOpen ? 'Thu gọn lịch sử' : 'Mở thanh lịch sử'}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />}
          </button>

          <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              Trợ Lý AI
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate hidden sm:block">
              Hỗ trợ thời khóa biểu, quản lý lớp học và giải đáp thông tin
            </p>
          </div>
        </div>

        {/* Nút quay lại lịch dạy học */}
        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('teaching_schedule')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium border border-zinc-200 dark:border-zinc-700 transition cursor-pointer shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            <span className="hidden sm:inline">Xem Lịch dạy học</span>
            <span className="sm:hidden text-[11px]">Lịch dạy</span>
          </button>
        )}
      </div>

      {/* 2. Thân chính: Bố cục 2 cột (Left Sidebar: Lịch sử, Right Area: Nội dung) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* CỘT TRÁI: SIDEBAR LỊCH SỬ HỘI THOẠI (Drawer trên Mobile, Cột cố định trên Desktop) */}
        {isSidebarOpen && (
          <>
            {/* Backdrop trên màn hình nhỏ */}
            <div
              className="fixed inset-0 bg-black/40 z-30 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-40 md:static md:z-auto w-72 max-w-[85vw] border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shrink-0 shadow-xl md:shadow-none">
              {/* Nút Cuộc trò chuyện mới */}
              <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
                <button
                  onClick={() => {
                    handleCreateNewChat();
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cuộc trò chuyện mới</span>
                </button>

                {/* Ô tìm kiếm lịch sử */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Tìm trong lịch sử..."
                    value={searchHistoryQuery}
                    onChange={(e) => setSearchHistoryQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-300 text-zinc-900 dark:text-zinc-100 font-normal"
                  />
                </div>
              </div>

              {/* Danh sách các phiên trò chuyện */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <div className="px-2 py-1 text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Lịch sử ({filteredSessions.length})</span>
                </div>

                {filteredSessions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-400">
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
                          if (typeof window !== 'undefined' && window.innerWidth < 768) {
                            setIsSidebarOpen(false);
                          }
                        }}
                        className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer select-none ${
                          isActive
                            ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 font-normal'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-6">
                          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`} />
                          <div className="min-w-0">
                            <p className="truncate text-xs leading-tight">{session.title}</p>
                            <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                              {session.messages?.length || 0} tin nhắn • {new Date(session.updatedAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        {/* Nút xóa session */}
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-red-600 transition cursor-pointer shrink-0 absolute right-2"
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
          </>
        )}

        {/* CỘT PHẢI: KHUNG LÀM VIỆC CHÍNH (CHAT / SOẠN GIÁO ÁN / CẤU HÌNH) */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950">
          {/* Thanh điều hướng Tab bên phải & Bộ chọn Bối cảnh Dữ liệu */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* BỘ CHỌN BỐI CẢNH DỮ LIỆU ĐỘNG */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsScopeMenuOpen(!isScopeMenuOpen)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-medium transition cursor-pointer"
                  title="Nhấn để đổi phạm vi bối cảnh dữ liệu"
                >
                  {selectedScope === 'global' && <Globe className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />}
                  {selectedScope === 'teaching' && <CalendarDays className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />}
                  {selectedScope === 'classes' && <GraduationCap className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />}
                  {selectedScope === 'schedule' && <Clock className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />}
                  {selectedScope === 'general' && <Bot className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />}
                  <span>Bối cảnh: <span className="font-semibold">{currentScopeConfig.shortLabel}</span></span>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${isScopeMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isScopeMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsScopeMenuOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-1.5 w-80 sm:w-88 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg p-1.5 z-50 space-y-0.5">
                      <div className="px-2.5 py-1 text-[10px] font-semibold uppercase text-zinc-400 tracking-wider">
                        Phạm vi bối cảnh
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
                            className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition cursor-pointer ${
                              isSelected
                                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 font-normal'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0 text-zinc-500 dark:text-zinc-400">
                              {opt.id === 'global' && <Globe className="w-4 h-4" />}
                              {opt.id === 'teaching' && <CalendarDays className="w-4 h-4" />}
                              {opt.id === 'classes' && <GraduationCap className="w-4 h-4" />}
                              {opt.id === 'schedule' && <Clock className="w-4 h-4" />}
                              {opt.id === 'general' && <Bot className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs text-zinc-900 dark:text-zinc-100 font-medium">
                                  {opt.label}
                                </span>
                                {opt.badge && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                                    {opt.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
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

              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

              {/* Chế độ tương tác */}
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Trò chuyện</span>
              </button>

              <button
                onClick={() => setActiveTab('lesson')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'lesson'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Soạn Giáo Án</span>
              </button>

              <button
                onClick={() => setActiveTab('config')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'config'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Cài đặt Key</span>
              </button>
            </div>

            {currentSession && activeTab === 'chat' && (
              <span className="text-[11px] text-zinc-400 font-normal truncate max-w-[200px] hidden md:block">
                Đang mở: <span className="text-zinc-700 dark:text-zinc-300 font-medium">{currentSession.title}</span>
              </span>
            )}
          </div>

          {/* TAB 1: KHUNG CHAT TOÀN DIỆN */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950">
              {/* Vùng Tin Nhắn */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="max-w-3xl 2xl:max-w-4xl mx-auto py-12 text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center mx-auto">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        Xin chào {user?.displayName || selectedTeacher || 'Thầy/Cô'}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-lg mx-auto leading-relaxed">
                        Bối cảnh đang chọn: <span className="font-medium text-zinc-800 dark:text-zinc-200">{currentScopeConfig.label}</span>.
                        Bạn có thể chọn các câu hỏi mẫu bên dưới hoặc nhập yêu cầu trực tiếp:
                      </p>
                    </div>

                    {/* Câu hỏi gợi ý theo bối cảnh */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-left">
                      {scopeSuggestions.map((q) => (
                        <button
                          key={q}
                          onClick={() => setInputText(q)}
                          className="text-xs p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer text-left leading-relaxed font-normal"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div
                      key={msg.id || i}
                      className={`flex gap-3 max-w-4xl 2xl:max-w-5xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role !== 'user' && (
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-xs font-normal shadow-xs'
                            : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-xs shadow-xs'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        {msg.role !== 'user' && (
                          <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end text-[11px] text-zinc-400">
                            <button
                              onClick={() => handleCopy(msg.content, `chat_${i}`)}
                              className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                            >
                              {copiedId === `chat_${i}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
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
                  <div className="flex items-center gap-2 max-w-4xl 2xl:max-w-5xl mx-auto text-xs text-zinc-500 dark:text-zinc-400 pl-10">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xử lý câu trả lời...</span>
                  </div>
                )}

                {error && (
                  <div className="max-w-4xl 2xl:max-w-5xl mx-auto p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar Rộng Rãi */}
              <div className="p-3 sm:p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                <div className="max-w-4xl 2xl:max-w-5xl mx-auto flex items-end gap-2">
                  <textarea
                    rows={2}
                    placeholder="Nhập câu hỏi... (Nhấn Enter để xuống dòng)"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-zinc-900 dark:text-zinc-100 resize-none max-h-36 min-h-[44px] font-normal"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputText.trim() || isLoading}
                    className="px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-medium text-xs sm:text-sm transition cursor-pointer flex items-center gap-1.5 shrink-0 mb-0.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SOẠN KẾ HOẠCH BÀI DẠY (GIÁO ÁN) */}
          {activeTab === 'lesson' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl 2xl:max-w-5xl mx-auto w-full">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                    Môn học
                  </label>
                  <input
                    type="text"
                    value={lessonSubject}
                    onChange={(e) => setLessonSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-normal focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                    Khối lớp
                  </label>
                  <select
                    value={lessonGrade}
                    onChange={(e) => setLessonGrade(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-normal focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  >
                    <option value="6">Khối 6</option>
                    <option value="7">Khối 7</option>
                    <option value="8">Khối 8</option>
                    <option value="9">Khối 9</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                    Tên bài học / Chủ đề
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Phép cộng phân số"
                    value={lessonTopic}
                    onChange={(e) => setLessonTopic(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-normal focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateLessonPlan}
                disabled={!lessonTopic.trim() || isGeneratingPlan}
                className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium text-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 transition shadow-xs"
              >
                {isGeneratingPlan ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang soạn giáo án...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Tạo Kế Hoạch Bài Dạy Chuẩn 4 Hoạt Động</span>
                  </>
                )}
              </button>

              {generatedPlan && (
                <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                      Kế hoạch bài dạy đã tạo:
                    </span>
                    <button
                      onClick={() => handleCopy(generatedPlan, 'lesson')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-normal hover:text-zinc-900 cursor-pointer"
                    >
                      {copiedId === 'lesson' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'lesson' ? 'Đã sao chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                  <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto text-zinc-800 dark:text-zinc-200 font-sans">
                    {generatedPlan}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CẤU HÌNH API KEY */}
          {activeTab === 'config' && (
            <div className="p-4 sm:p-6 space-y-4 max-w-3xl 2xl:max-w-4xl mx-auto w-full">
              <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-xs space-y-1.5 text-zinc-800 dark:text-zinc-200">
                <span className="font-semibold flex items-center gap-1.5 text-xs">
                  <Key className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                  Cấu hình khóa API cá nhân
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Mặc định hệ thống đã được cấu hình sẵn. Nếu muốn sử dụng hạn mức API cá nhân riêng của bạn, hãy nhập khóa vào bên dưới:
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Khóa API (Tùy chọn)
                </label>
                <input
                  type="password"
                  placeholder="Nhập API Key cá nhân..."
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
                <p className="text-[11px] text-zinc-400">
                  Khóa được lưu cục bộ trên trình duyệt của bạn và bảo mật tuyệt đối.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium text-xs transition cursor-pointer shadow-xs"
                >
                  Lưu cấu hình
                </button>

                {customKey && (
                  <button
                    onClick={() => {
                      setCustomKey('');
                      setCustomUserApiKey('');
                    }}
                    className="px-3 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-normal cursor-pointer"
                  >
                    Dùng mặc định hệ thống
                  </button>
                )}

                {savedKeySuccess && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã lưu thành công
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
