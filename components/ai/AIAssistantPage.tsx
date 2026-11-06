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
  Cpu,
  Settings,
  DollarSign,
  Compass,
  Wallet,
  Paperclip,
  Image as ImageIcon,
  FileText,
  File,
  X,
  Maximize2,
  UploadCloud,
  ArrowUp,
  Cloud,
  HeartPulse,
} from 'lucide-react';
import {
  useGeminiAI,
  gemini,
  promptTemplates,
  getCustomUserApiKey,
  setCustomUserApiKey,
  getCustomUserModel,
  setCustomUserModel,
  AVAILABLE_GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL,
  ChatMessage,
  ChatAttachment,
  AIChatSession,
  AIContextScope,
  CONTEXT_SCOPE_OPTIONS,
  buildSystemContextPrompt,
  extractAgentActions,
  executeAgentAction,
  formatFileSize,
  processChatFileAttachment,
  getLocalCachedSessions,
  subscribeToUserAIChatSessions,
  saveAIChatSession,
  deleteAIChatSession,
  autoSyncLocalSessionsToCloud,
} from '@/core';
import { useAuth } from '@/core/firebase';
import { useTeachingScheduleStore } from '@/features/teaching-schedule/stores/useTeachingScheduleStore';
import { useClassManager } from '@/features/class/hooks/useClassManager';
import { useScheduleManager } from '@/features/schedule/hooks/useScheduleManager';
import { useIncomeManager } from '@/features/income/hooks/useIncomeManager';
import { useTravelStore } from '@/features/travel/stores/useTravelStore';
import { useSpendingStore } from '@/features/spending/stores/useSpendingStore';
import { useHealthStore } from '@/features/health/stores/useHealthStore';
import { MarkdownRenderer } from './MarkdownRenderer';
import { NavTabId } from '../layout/Sidebar';

interface AIAssistantPageProps {
  onNavigateTab?: (tab: NavTabId) => void;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const { timetable, selectedTeacher, myTeacher } = useTeachingScheduleStore();
  const { classes, students, schedulePatterns, sessions: classSessions } = useClassManager(user?.uid);
  const { appointments, customers } = useScheduleManager(user?.uid);
  const { transactions } = useIncomeManager(user?.uid);
  const { trips, fetchTrips } = useTravelStore();
  const { expenses, monthlyBudget, customCategories, initStore: initSpendingStore } = useSpendingStore();
  const {
    records: healthRecords,
    metrics: healthMetrics,
    checkupSessions: healthCheckupSessions,
    initStore: initHealthStore,
  } = useHealthStore();

  useEffect(() => {
    if (user?.uid) {
      fetchTrips(user.uid);
      const unsubSpending = initSpendingStore(user.uid);
      const unsubHealth = initHealthStore(user.uid);
      return () => {
        unsubSpending();
        unsubHealth();
      };
    }
  }, [user?.uid, fetchTrips, initSpendingStore, initHealthStore]);

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

  // Quản lý sessions lịch sử hội thoại (Cloud Firestore + Local Cache)
  const [sessions, setSessions] = useState<AIChatSession[]>(() => getLocalCachedSessions());
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const cached = getLocalCachedSessions();
    return cached[0]?.id || `session_${Date.now()}`;
  });
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

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

  // Quản lý Mô hình AI (Model)
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return getCustomUserModel() || DEFAULT_GEMINI_MODEL;
    }
    return DEFAULT_GEMINI_MODEL;
  });
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    setCustomUserModel(modelId);
    setIsModelMenuOpen(false);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tự động co giãn chiều cao của Textarea nhập liệu theo độ dài văn bản (như Gemini)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollH, 44), 180)}px`;
    }
  }, [inputText]);

  // Attachment states cho AI Chat (Đính kèm tệp & Dán ảnh)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  const handleAddFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsUploadingAttachment(true);
    try {
      const newAttachments: ChatAttachment[] = [];
      for (const file of fileArray) {
        // Tự động upload lên Cloudflare R2 để lưu trữ vĩnh viễn và lấy CDN URL
        const att = await processChatFileAttachment(file, user?.uid);
        newAttachments.push(att);
      }
      setAttachments((prev) => [...prev, ...newAttachments]);
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi tải tệp lên.');
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = Array.from(clipboardData.items || []);
    const filesToUpload: File[] = [];

    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          filesToUpload.push(file);
        }
      }
    }

    if (filesToUpload.length > 0) {
      e.preventDefault();
      await handleAddFiles(filesToUpload);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 1. Tải danh sách sessions ban đầu từ Local Cache (hiển thị tức thì)
  useEffect(() => {
    const cached = getLocalCachedSessions();
    if (cached.length > 0) {
      setSessions(cached);
      setCurrentSessionId((prev) => (cached.some((s) => s.id === prev) ? prev : cached[0].id));
    } else {
      const initialSession: AIChatSession = {
        id: `session_${Date.now()}`,
        userId: user?.uid,
        title: 'Cuộc trò chuyện mới',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      setSessions([initialSession]);
      setCurrentSessionId(initialSession.id);
      saveAIChatSession(initialSession, user?.uid);
    }
  }, []);

  // 2. Tự động đồng bộ Đa thiết bị qua Cloud Firestore khi người dùng đăng nhập
  useEffect(() => {
    if (!user?.uid) return;

    setIsCloudSyncing(true);
    // Tự động đẩy các phiên offline trước đó lên Cloud Firestore mà không cần hỏi
    autoSyncLocalSessionsToCloud(user.uid).finally(() => {
      setIsCloudSyncing(false);
    });

    // Lắng nghe Realtime Firestore: máy khác cập nhật thì máy này tự động tải về ngay
    const unsub = subscribeToUserAIChatSessions(
      user.uid,
      (cloudSessions) => {
        if (cloudSessions.length > 0) {
          setSessions(cloudSessions);
          setCurrentSessionId((prev) => {
            const found = cloudSessions.some((s) => s.id === prev);
            return found ? prev : cloudSessions[0].id;
          });
        }
      },
      (err) => {
        console.warn('Lỗi đồng bộ Realtime Firestore AI Chat:', err);
      }
    );

    return () => {
      unsub();
    };
  }, [user?.uid]);

  const currentSession = useMemo(() => {
    return sessions.find((s) => s.id === currentSessionId) || sessions[0] || null;
  }, [sessions, currentSessionId]);

  const currentScopeConfig = useMemo(() => {
    return CONTEXT_SCOPE_OPTIONS.find((o) => o.id === selectedScope) || CONTEXT_SCOPE_OPTIONS[0];
  }, [selectedScope]);

  // Xây dựng system prompt đa bối cảnh toàn diện cho AI Agent
  const systemInstruction = useMemo(() => {
    return buildSystemContextPrompt(selectedScope, {
      user: {
        name: user?.displayName || myTeacher || selectedTeacher || 'Thầy/Cô',
        email: user?.email,
      },
      timetable,
      selectedTeacher,
      myTeacher,
      classes,
      students,
      schedulePatterns,
      sessions: classSessions,
      appointments,
      customers,
      transactions,
      trips,
      expenses,
      customCategories,
      monthlyBudget,
      healthRecords,
      healthMetrics,
      checkupSessions: healthCheckupSessions,
    });
  }, [
    selectedScope,
    user,
    timetable,
    selectedTeacher,
    myTeacher,
    classes,
    students,
    schedulePatterns,
    classSessions,
    appointments,
    customers,
    transactions,
    trips,
    expenses,
    customCategories,
    monthlyBudget,
    healthRecords,
    healthMetrics,
    healthCheckupSessions,
  ]);

  const {
    isLoading,
    error,
    chatMessages,
    setChatMessages,
    sendMessage,
  } = useGeminiAI({
    systemInstruction,
    model: selectedModel as any,
  });

  const scopeSuggestions = useMemo(() => {
    switch (selectedScope) {
      case 'global':
        return [
          'Xem cho tôi ngày nào ít tiết học nhất để tôi xin nghỉ',
          'Tuần này tôi có những buổi nào hoàn toàn trống lịch để nhận thêm việc?',
          'Tháng này tôi đã chi tiêu bao nhiêu tiền, còn trong hạn mức không?',
          'Tổng hợp 360 độ: TKB trường, lớp học, học sinh, thù lao, chi tiêu và du lịch',
        ];
      case 'teaching':
        return [
          'Xem cho tôi ngày nào ít tiết học nhất để tôi xin nghỉ',
          'Tuần này tôi có những buổi nào trống tiết (sáng/chiều)?',
          'Hôm nay tôi dạy những lớp nào, môn gì và tiết mấy?',
          'Thống kê tổng số tiết dạy và các lớp tôi phụ trách trong tuần',
        ];
      case 'classes':
        return [
          'Danh sách các lớp tôi đang quản lý và sĩ số từng lớp',
          'Lịch học cố định trong tuần của các lớp ra sao?',
          'Danh sách học sinh của các lớp và thông tin phụ huynh',
          'Thống kê các buổi dạy và điểm danh gần nhất',
        ];
      case 'schedule':
        return [
          'Sắp tới tôi có những ca dạy gia sư / lịch hẹn nào?',
          'Thống kê tổng số ca dạy tự do đã hoàn thành và chưa hoàn thành',
          'Ca hẹn tiếp theo diễn ra ở đâu, vào lúc mấy giờ?',
          'Tổng tiền thù lao từ các ca dạy tự do sắp tới là bao nhiêu?',
        ];
      case 'income':
        return [
          'Tổng hợp thù lao đã thực nhận và các khoản công nợ đang chờ',
          'Thống kê doanh thu từ các lớp học và các ca gia sư',
          'Chi tiết các giao dịch thu nhập gần nhất',
          'Tình hình tài chính tổng thể của tôi trong tháng này',
        ];
      case 'spending':
        return [
          'Ghi nhận chi tiêu: Vừa đổ xăng xe máy 80 nghìn',
          'Tháng này tôi đã chi tiêu hết bao nhiêu tiền rồi?',
          'So sánh chi tiêu thực tế với hạn mức ngân sách tháng',
          'Nhóm chi tiêu nào đang chiếm tỷ trọng lớn nhất?',
        ];
      case 'travel':
        return [
          'Tôi có những chuyến đi du lịch nào sắp diễn ra?',
          'Lịch du lịch có bị trùng buổi dạy nào ở trường hay lớp học không?',
          'Tổng ngân sách và chi phí đã chi cho các chuyến đi',
          'Gợi ý kế hoạch xin nghỉ hoặc dạy bù để chuẩn bị cho chuyến đi',
        ];
      case 'health':
        return [
          'Hôm nay tôi vừa đo cân nặng 67.5 kg, huyết áp 120/80 mmHg, hãy lưu lại giúp tôi',
          'Đây là kết quả xét nghiệm máu: Đường huyết 5.2, Men gan AST 26, ALT 29, Cholesterol 4.7. Hãy lưu vào hệ thống',
          'Sửa lại chỉ số huyết áp hôm nay thành 118/78 mmHg',
          'Đánh giá các chỉ số sức khỏe gần đây của tôi xem có chỉ số nào bất thường cần lưu ý không?',
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

  const handleCreateNewChat = async () => {
    const newSession: AIChatSession = {
      id: `session_${Date.now()}`,
      userId: user?.uid,
      title: 'Cuộc trò chuyện mới',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    await saveAIChatSession(newSession, user?.uid);
    setSessions((prev) => [newSession, ...prev.filter((s) => s.id !== newSession.id)]);
    setCurrentSessionId(newSession.id);
    setChatMessages([]);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteAIChatSession(sessionId, user?.uid);
    const updated = sessions.filter((s) => s.id !== sessionId);
    if (updated.length === 0) {
      const fallback: AIChatSession = {
        id: `session_${Date.now()}`,
        userId: user?.uid,
        title: 'Cuộc trò chuyện mới',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      await saveAIChatSession(fallback, user?.uid);
      setSessions([fallback]);
      setCurrentSessionId(fallback.id);
      setChatMessages([]);
    } else {
      setSessions(updated);
      if (sessionId === currentSessionId) {
        setCurrentSessionId(updated[0].id);
        setChatMessages(updated[0].messages || []);
      }
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && attachments.length === 0) || isLoading) return;
    const text = inputText.trim();
    const currentAttachments = [...attachments];
    setInputText('');
    setAttachments([]);

    let currentTitle = currentSession?.title || 'Cuộc trò chuyện mới';
    if (currentTitle === 'Cuộc trò chuyện mới' || !currentTitle) {
      if (text) {
        currentTitle = text.slice(0, 38) + (text.length > 38 ? '...' : '');
      } else if (currentAttachments.length > 0) {
        currentTitle = `Tệp: ${currentAttachments[0].name.slice(0, 30)}`;
      }
    }

    const res = await sendMessage(text, {
      systemInstruction,
      model: selectedModel as any,
      attachments: currentAttachments,
    });

    if (res) {
      // 1. Phân tích và thực thi các hành động dữ liệu do AI Agent yêu cầu
      const { cleanContent, commands } = extractAgentActions(res);
      let actionNotification = '';

      if (commands.length > 0) {
        for (const cmd of commands) {
          const actionResult = await executeAgentAction(cmd, user?.uid);
          if (actionResult.success) {
            actionNotification += `\n\n> ✅ **Hệ thống xác nhận:** ${actionResult.message}`;
          } else {
            actionNotification += `\n\n> ⚠️ **Thông báo:** ${actionResult.message}`;
          }
        }
        // Làm mới dữ liệu chuyến đi và chi tiêu
        if (user?.uid) {
          fetchTrips(user.uid);
          initSpendingStore(user.uid);
        }
      }

      const finalModelText = (cleanContent || res) + actionNotification;

      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: text || (currentAttachments.length > 0 ? 'Phân tích và giải thích nội dung trong tệp/hình ảnh đính kèm.' : ''),
        timestamp: new Date().toISOString(),
        attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      };

      const modelMsg: ChatMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        content: finalModelText,
        timestamp: new Date().toISOString(),
      };

      // Cập nhật lại model message cuối cùng trong chatMessages để loại bỏ code block và gắn xác nhận
      setChatMessages((prev) => {
        const withoutLast = prev.slice(0, -1);
        return [...withoutLast, modelMsg];
      });

      const newMessages = [...chatMessages, userMsg, modelMsg];

      const targetSession = sessions.find((s) => s.id === currentSessionId);
      const updatedSession: AIChatSession = {
        ...(targetSession || {
          id: currentSessionId,
          createdAt: new Date().toISOString(),
          messages: [],
        }),
        id: currentSessionId,
        userId: user?.uid,
        title: currentTitle,
        updatedAt: new Date().toISOString(),
        messages: newMessages,
      };

      // Lưu đồng thời vào Cloud Firestore và Local Cache
      await saveAIChatSession(updatedSession, user?.uid);
      setSessions((prev) =>
        prev.map((s) => (s.id === currentSessionId ? updatedSession : s))
      );
    }
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
        model: selectedModel as any,
      });
      if (res.success && res.data) {
        setGeneratedPlan(res.data);
      } else {
        alert(res.error || 'Không thể soạn giáo án lúc này.');
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi kết nối dịch vụ Trợ lý AI.');
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

          {/* 2 tabs: Trò chuyện & Soạn Giáo Án */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'chat'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
            >
              <Bot className="w-3.5 h-3.5 shrink-0" />
              <span>Trò chuyện</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('lesson')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'lesson'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Soạn Giáo Án</span>
            </button>
          </div>
        </div>

        {/* Nút Cài đặt (Icon bánh răng) */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'config' ? 'chat' : 'config')}
          className={`p-2 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center shrink-0 ${activeTab === 'config'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
            }`}
          title={activeTab === 'config' ? 'Quay lại Trò chuyện' : 'Cài đặt'}
          aria-label="Cài đặt"
        >
          <Settings className="w-4 h-4" />
        </button>
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
                    className="w-full pl-8 pr-3 py-1.5 text-base sm:text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-300 text-zinc-900 dark:text-zinc-100 font-normal"
                  />
                </div>
              </div>

              {/* Danh sách các phiên trò chuyện */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <div className="px-2 py-1 text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Lịch sử ({filteredSessions.length})</span>
                  {user?.uid ? (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold lowercase tracking-normal bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20"
                      title="Lịch sử chat và tệp đính kèm được tự động đồng bộ đám mây đa thiết bị"
                    >
                      <Cloud className={`w-2.5 h-2.5 text-emerald-500 ${isCloudSyncing ? 'animate-pulse' : ''}`} />
                      <span>{isCloudSyncing ? 'đang đồng bộ' : 'cloud sync'}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-400 lowercase tracking-normal font-normal">
                      cục bộ máy này
                    </span>
                  )}
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
                        className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer select-none ${isActive
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
          {/* TAB 1: KHUNG CHAT TOÀN DIỆN */}
          {activeTab === 'chat' && (
            <div
              className="relative flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Drag and Drop Overlay */}
              {isDragging && (
                <div className="absolute inset-0 z-40 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-xs border-2 border-dashed border-primary m-2 rounded-2xl flex flex-col items-center justify-center text-white pointer-events-none animate-in fade-in">
                  <div className="p-4 rounded-full bg-primary/20 text-primary mb-3 shadow-lg">
                    <UploadCloud className="w-10 h-10 animate-bounce" />
                  </div>
                  <p className="text-base font-bold">Thả ảnh hoặc tệp vào đây</p>
                  <p className="text-xs text-zinc-300 mt-1 max-w-sm text-center">
                    Hỗ trợ đính kèm hình ảnh (PNG, JPG, WEBP), tệp PDF, tài liệu Word/Excel và file văn bản
                  </p>
                </div>
              )}

              {/* Vùng Tin Nhắn */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="w-full py-8 text-center space-y-6 px-2 sm:px-4 max-w-4xl mx-auto my-auto flex flex-col justify-center min-h-[50vh]">
                    <div className="space-y-2 text-left sm:text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 text-xs font-medium mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Trợ lý AI Thông Minh</span>
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          Xin chào, {user?.displayName || selectedTeacher || 'Thầy/Cô'}
                        </span>
                      </h2>
                      <p className="text-xl sm:text-2xl font-medium text-zinc-400 dark:text-zinc-500">
                        Tôi có thể giúp gì cho Thầy/Cô hôm nay?
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1 leading-relaxed max-w-xl sm:mx-auto">
                        Bối cảnh dữ liệu đang kết nối: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{currentScopeConfig.label}</span>. Thầy/Cô có thể hỏi lịch dạy, tra cứu thù lao, tính toán chi tiêu hoặc đính kèm ảnh/tài liệu.
                      </p>
                    </div>

                    {/* Câu hỏi gợi ý theo bối cảnh phong cách Gemini */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-left">
                      {scopeSuggestions.map((q) => (
                        <button
                          key={q}
                          onClick={() => setInputText(q)}
                          className="p-4 rounded-2xl bg-[#f0f4f9] hover:bg-[#e3e8ee] dark:bg-[#1e1f20] dark:hover:bg-[#28292a] border border-transparent hover:border-zinc-300/60 dark:hover:border-zinc-700/60 transition-all cursor-pointer text-left flex flex-col justify-between group min-h-[120px] shadow-2xs hover:shadow-xs"
                        >
                          <span className="text-xs sm:text-[13px] text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                            {q}
                          </span>
                          <div className="flex justify-end pt-2">
                            <div className="w-7 h-7 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shadow-2xs">
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div
                      key={msg.id || i}
                      className={`flex gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role !== 'user' && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500/15 via-indigo-500/10 to-purple-500/15 border border-blue-200/60 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      <div
                        className={`max-w-[88%] sm:max-w-[82%] xl:max-w-[78%] rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${msg.role === 'user'
                            ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-xs font-normal shadow-xs'
                            : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-xs shadow-xs'
                          }`}
                      >
                        {/* Hiển thị tệp đính kèm của người dùng */}
                        {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
                          <div className="mb-2.5 flex flex-wrap gap-2 justify-end">
                            {msg.attachments.map((att) => {
                              const fileUrl = att.url || (att.data?.startsWith('http') ? att.data : undefined);
                              const isImg =
                                att.type?.startsWith('image/') ||
                                !!att.previewUrl ||
                                Boolean(fileUrl && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileUrl));
                              const imgSrc =
                                att.previewUrl || fileUrl || (att.data?.startsWith('data:image') ? att.data : undefined);

                              if (isImg && imgSrc) {
                                return (
                                  <div
                                    key={att.id}
                                    onClick={() => setPreviewModalImage(imgSrc)}
                                    className="relative group cursor-pointer overflow-hidden rounded-xl border border-zinc-700/40 bg-zinc-800/80 shadow-xs"
                                    title="Nhấn để phóng to ảnh"
                                  >
                                    <img
                                      src={imgSrc}
                                      alt={att.name}
                                      className="h-28 w-28 sm:h-36 sm:w-36 object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Maximize2 className="w-5 h-5 text-white drop-shadow" />
                                    </div>
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[10px] text-zinc-200 truncate">
                                      {att.name}
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <a
                                  key={att.id}
                                  href={fileUrl || undefined}
                                  target={fileUrl ? '_blank' : undefined}
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-850 border border-zinc-700/60 text-zinc-100 text-xs shadow-xs max-w-[260px] transition hover:bg-zinc-800 ${
                                    fileUrl ? 'cursor-pointer hover:border-zinc-500' : ''
                                  }`}
                                  title={fileUrl ? `Mở/tải tệp "${att.name}" từ Cloud` : att.name}
                                >
                                  <div className="p-1.5 rounded-lg bg-zinc-700 text-zinc-300 shrink-0">
                                    {att.type === 'application/pdf' ? (
                                      <FileText className="w-4 h-4 text-red-400" />
                                    ) : (
                                      <File className="w-4 h-4 text-blue-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1 text-left">
                                    <p className="font-medium truncate text-xs text-white">{att.name}</p>
                                    <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                                      <span>{formatFileSize(att.size)}</span>
                                      {fileUrl && (
                                        <span className="text-[9px] text-emerald-400 font-medium">• Cloud</span>
                                      )}
                                    </p>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        )}

                        <MarkdownRenderer content={msg.content} isUser={msg.role === 'user'} />

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

                      {/* Avatar người dùng bên phải cho tin nhắn của người dùng */}
                      {msg.role === 'user' && (
                        <div className="shrink-0 mt-0.5">
                          {user?.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName || 'Người dùng'}
                              className="w-7 h-7 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-semibold flex items-center justify-center shadow-2xs">
                              {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="flex items-center gap-2.5 w-full text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500/15 via-indigo-500/10 to-purple-500/15 border border-blue-200/60 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span>Trợ lý AI đang phân tích và xử lý câu trả lời...</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="w-full p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar phong cách Gemini Capsule */}
              <div className="p-3 sm:p-5 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-zinc-950 dark:via-zinc-950/95 dark:to-transparent shrink-0">
                <div className="max-w-4xl xl:max-w-5xl mx-auto w-full">
                  {/* The Gemini Capsule Container */}
                  <div
                    onClick={() => textareaRef.current?.focus()}
                    className="relative w-full rounded-[26px] bg-[#f0f4f9] dark:bg-[#1e1f20] border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:shadow-sm focus-within:shadow-md focus-within:bg-white dark:focus-within:bg-[#1e1f20] focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-all duration-200 flex flex-col cursor-text"
                  >
                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json,.md,.html,.py,.java,.cpp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleAddFiles(e.target.files);
                        e.target.value = '';
                      }}
                    />

                    {/* Trạng thái tải tệp lên Cloudflare R2 */}
                    {isUploadingAttachment && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200/50 dark:border-blue-900/50 text-[11px] text-blue-600 dark:text-blue-400 animate-in fade-in">
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                        <span>Đang tải tệp lên Cloudflare R2 để lưu trữ đám mây đa thiết bị...</span>
                      </div>
                    )}

                    {/* Preview danh sách tệp đính kèm bên trong capsule */}
                    {attachments.length > 0 && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex flex-wrap gap-2 p-3 pb-1 border-b border-zinc-200/60 dark:border-zinc-800/60 max-h-40 overflow-y-auto"
                      >
                        {attachments.map((att) => {
                          const isImg = att.type?.startsWith('image/') || !!att.previewUrl;
                          return (
                            <div
                              key={att.id}
                              className="relative group flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 shadow-2xs text-xs animate-in fade-in"
                            >
                              {isImg ? (
                                <img
                                  src={att.previewUrl || att.data}
                                  alt={att.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                                  {att.type === 'application/pdf' ? (
                                    <FileText className="w-4 h-4 text-red-500" />
                                  ) : (
                                    <File className="w-4 h-4 text-blue-500" />
                                  )}
                                </div>
                              )}
                              <div className="max-w-[130px] sm:max-w-[180px]">
                                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                  {att.name}
                                </p>
                                <p className="text-[10px] text-zinc-400">
                                  {formatFileSize(att.size)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveAttachment(att.id);
                                }}
                                className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
                                title="Xóa tệp này"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Textarea nhập liệu co giãn tự nhiên không viền */}
                    <div className="px-4 pt-3.5 pb-1">
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        placeholder="Đặt câu hỏi hoặc dán ảnh (Ctrl+V), kéo thả tệp vào đây..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        className="w-full bg-transparent border-0 ring-0 focus:ring-0 focus:outline-none resize-none text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 min-h-[44px] max-h-48 leading-relaxed font-normal"
                      />
                    </div>

                    {/* Toolbar bên trong Capsule phong cách Gemini */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-between px-3 pb-2.5 pt-1"
                    >
                      {/* Left Side: Nút Đính kèm & Scope Pill */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-250/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-xs font-medium group"
                          title="Đính kèm ảnh, PDF hoặc tệp tin (hoặc dán Ctrl+V)"
                        >
                          <Paperclip className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors" />
                          <span className="hidden sm:inline">Đính kèm</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('config')}
                          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 text-[11px] font-medium transition cursor-pointer"
                          title="Bấm để vào Cài đặt đổi Bối cảnh & Mô hình"
                        >
                          <Globe className="w-3 h-3 text-blue-500" />
                          <span>Bối cảnh: {currentScopeConfig.shortLabel}</span>
                          <Settings className="w-3 h-3 opacity-60 ml-0.5" />
                        </button>
                      </div>

                      {/* Right Side: Shift+Enter Hint & Nút Gửi tròn */}
                      <div className="flex items-center gap-2">
                        {inputText.trim().length > 0 && (
                          <span className="text-[11px] text-zinc-400 hidden sm:inline mr-1 select-none">
                            Shift + Enter để xuống dòng
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={handleSend}
                          disabled={(!inputText.trim() && attachments.length === 0) || isLoading}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${(!inputText.trim() && attachments.length === 0) || isLoading
                              ? 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                              : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:scale-105 active:scale-95 shadow-md shadow-zinc-900/10'
                            }`}
                          title="Gửi câu hỏi (Enter)"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AI Disclaimer */}
                  <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 select-none">
                    Hệ thống AI có thể đưa ra câu trả lời chưa chính xác, hãy luôn kiểm tra lại các thông tin tài chính và lịch dạy quan trọng.
                  </p>
                </div>
              </div>

              {/* Lightbox Modal phóng to ảnh xem chi tiết */}
              {previewModalImage && (
                <div
                  className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
                  onClick={() => setPreviewModalImage(null)}
                >
                  <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
                    <button
                      onClick={() => setPreviewModalImage(null)}
                      className="absolute -top-10 right-0 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                      title="Đóng xem ảnh"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <img
                      src={previewModalImage}
                      alt="Xem ảnh phóng to"
                      className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SOẠN KẾ HOẠCH BÀI DẠY (GIÁO ÁN) */}
          {activeTab === 'lesson' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                    Môn học
                  </label>
                  <input
                    type="text"
                    value={lessonSubject}
                    onChange={(e) => setLessonSubject(e.target.value)}
                    className="w-full px-3 py-2 text-base sm:text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-normal focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                    Khối lớp
                  </label>
                  <select
                    value={lessonGrade}
                    onChange={(e) => setLessonGrade(e.target.value)}
                    className="w-full px-3 py-2 text-base sm:text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-normal focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
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
                    className="w-full px-3 py-2 text-base sm:text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-normal focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  />
                </div>
              </div>

              <button
                type="button"
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
                      type="button"
                      onClick={() => handleCopy(generatedPlan, 'lesson')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-normal hover:text-zinc-900 cursor-pointer"
                    >
                      {copiedId === 'lesson' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'lesson' ? 'Đã sao chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                  <div className="max-h-[50vh] overflow-y-auto pr-1">
                    <MarkdownRenderer content={generatedPlan} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CÀI ĐẶT TRỢ LÝ AI & BỐI CẢNH */}
          {activeTab === 'config' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl 2xl:max-w-5xl mx-auto w-full animate-fadeIn pb-12">
              {/* Header của mục cài đặt */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" />
                    Cài Đặt Trợ Lý AI & Bối Cảnh Dữ Liệu
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Tùy chỉnh phạm vi dữ liệu mà AI được phép truy cập và chọn mô hình xử lý phù hợp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Quay lại Trò chuyện</span>
                </button>
              </div>

              {/* 1. PHẠM VI BỐI CẢNH DỮ LIỆU */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Phạm vi Bối cảnh Dữ liệu (Context Scope)
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Chọn nguồn dữ liệu mà Trợ lý AI được phép kết nối và tổng hợp khi phân tích hoặc trả lời câu hỏi của Thầy/Cô.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CONTEXT_SCOPE_OPTIONS.map((opt) => {
                    const isSelected = opt.id === selectedScope;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedScope(opt.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 ring-1 ring-blue-400/40 shadow-xs'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                              <div className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shrink-0">
                                {opt.id === 'global' && <Globe className="w-3.5 h-3.5" />}
                                {opt.id === 'teaching' && <CalendarDays className="w-3.5 h-3.5" />}
                                {opt.id === 'classes' && <GraduationCap className="w-3.5 h-3.5" />}
                                {opt.id === 'schedule' && <Clock className="w-3.5 h-3.5" />}
                                {opt.id === 'income' && <DollarSign className="w-3.5 h-3.5" />}
                                {opt.id === 'spending' && <Wallet className="w-3.5 h-3.5" />}
                                {opt.id === 'travel' && <Compass className="w-3.5 h-3.5" />}
                                {opt.id === 'health' && <HeartPulse className="w-3.5 h-3.5 text-rose-500" />}
                                {opt.id === 'general' && <Bot className="w-3.5 h-3.5" />}
                              </div>
                              <span>{opt.label}</span>
                            </span>
                            {opt.badge && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            {opt.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="mt-2.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đang áp dụng</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. LỰA CHỌN MÔ HÌNH AI (MODE) */}
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    Lựa chọn Mô hình AI (Mode)
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Chọn chế độ xử lý phù hợp với nhu cầu và tốc độ mong muốn. Lựa chọn sẽ được lưu trên thiết bị này.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {AVAILABLE_GEMINI_MODELS.map((m) => {
                    const isSelected = m.id === selectedModel;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectModel(m.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${isSelected
                            ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-400 dark:border-purple-700 ring-1 ring-purple-400/40 shadow-xs'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              {isSelected ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                              ) : (
                                <Cpu className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              )}
                              <span>{m.name}</span>
                            </span>
                            {m.badge && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0 ${m.recommended
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                  }`}
                              >
                                {m.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            {m.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="mt-2.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đang hoạt động</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. CẤU HÌNH KHÓA DỊCH VỤ CÁ NHÂN (API KEY - TÙY CHỌN) */}
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-xs space-y-1.5 text-zinc-800 dark:text-zinc-200">
                  <span className="font-semibold flex items-center gap-1.5 text-xs">
                    <Key className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                    Khóa dịch vụ AI cá nhân (Tùy chọn)
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Mặc định hệ thống đã được thiết lập sẵn sàng sử dụng. Nếu muốn sử dụng hạn mức khóa dịch vụ cá nhân riêng của bạn, hãy nhập mã khóa vào bên dưới:
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Khóa dịch vụ cá nhân (API Key)
                  </label>
                  <input
                    type="password"
                    placeholder="Nhập mã khóa cá nhân..."
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    className="w-full px-3 py-2 text-base sm:text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  />
                  <p className="text-[11px] text-zinc-400">
                    Khóa được lưu cục bộ trên trình duyệt của bạn và bảo mật tuyệt đối.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium text-xs transition cursor-pointer shadow-xs"
                  >
                    Lưu cấu hình
                  </button>

                  {customKey && (
                    <button
                      type="button"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
