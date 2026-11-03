'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
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
} from 'lucide-react';
import { useGeminiAI, gemini, promptTemplates, getCustomUserApiKey, setCustomUserApiKey } from '@/core';
import { SchoolTimetable } from '@/features/teaching-schedule/types';

interface GeminiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetable?: SchoolTimetable | null;
  teacherName?: string;
}

export const GeminiAssistantModal: React.FC<GeminiAssistantModalProps> = ({
  isOpen,
  onClose,
  timetable,
  teacherName,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'lesson' | 'config'>('chat');
  const [inputText, setInputText] = useState('');
  const [customKey, setCustomKey] = useState<string>(() => getCustomUserApiKey() || '');
  const [savedKeySuccess, setSavedKeySuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Lesson plan form state
  const [lessonSubject, setLessonSubject] = useState(timetable?.subjects[0] || 'Toán');
  const [lessonGrade, setLessonGrade] = useState('6');
  const [lessonTopic, setLessonTopic] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Context thời khóa biểu giáo viên
  const teacherEntries = timetable && teacherName
    ? timetable.entries.filter((e) => e.teacher.toLowerCase() === teacherName.toLowerCase())
    : [];

  const timetableSummary = teacherEntries.length > 0
    ? teacherEntries
        .map(
          (e) =>
            `- Thứ ${e.dayOfWeek}, ${e.session}, Tiết ${e.period}: Lớp ${e.className}, Môn ${e.subject}${e.room ? `, Phòng ${e.room}` : ''}`
        )
        .join('\n')
    : 'Chưa có thông tin tiết dạy của giáo viên này.';

  const systemInstruction = promptTemplates.teachingScheduleAssistant(
    teacherName || 'Thầy/Cô',
    timetableSummary
  );

  const {
    isLoading,
    error,
    chatMessages,
    sendMessage,
    clearMessages,
  } = useGeminiAI({
    systemInstruction,
    model: 'gemini-2.5-flash',
  });

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    await sendMessage(text);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col h-[85vh] max-h-[700px] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Trợ Lý Gemini AI
                </h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Gemini 2.5 Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Core AI dùng chung cho Sổ Tay Béo • Phục vụ giảng dạy & học vụ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Hỏi đáp Lịch Dạy</span>
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
            <span>Soạn Giáo Án Nhanh</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ml-auto ${
              activeTab === 'config'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Cài đặt Key</span>
          </button>
        </div>

        {/* Tab 1: Chat Hỏi Đáp Lịch Dạy */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-900/50">
            {/* Vùng Tin Nhắn */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Xin chào {teacherName ? `Thầy/Cô ${teacherName}` : 'Thầy/Cô'}!
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                      Tôi là trợ lý AI đã nắm rõ toàn bộ lịch dạy tuần này. Bạn có thể hỏi tôi bất kỳ điều gì:
                    </p>
                  </div>

                  {/* Câu hỏi gợi ý */}
                  <div className="flex flex-col gap-1.5 max-w-sm mx-auto pt-2 text-left">
                    {[
                      'Tuần này tôi có những buổi nào trống tiết?',
                      'Hôm nay tôi dạy những lớp nào, tiết mấy?',
                      'Soạn tin nhắn dặn dò học sinh chuẩn bị bài cho ngày mai',
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setInputText(q);
                        }}
                        className="text-xs p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400 hover:text-purple-600 transition cursor-pointer text-left shadow-2xs"
                      >
                        💡 {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div
                    key={msg.id || i}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role !== 'user' && (
                      <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-tr-xs shadow-sm'
                          : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.role !== 'user' && (
                        <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
                          <button
                            onClick={() => handleCopy(msg.content, `chat_${i}`)}
                            className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-purple-600 cursor-pointer"
                          >
                            {copiedId === `chat_${i}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
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
                <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini đang suy nghĩ câu trả lời...</span>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSend}
              className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Nhập câu hỏi cho trợ lý Gemini AI..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gửi</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Soạn Kế Hoạch Bài Dạy (Giáo Án) */}
        {activeTab === 'lesson' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">
                  Môn học
                </label>
                <input
                  type="text"
                  value={lessonSubject}
                  onChange={(e) => setLessonSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">
                  Khối lớp
                </label>
                <select
                  value={lessonGrade}
                  onChange={(e) => setLessonGrade(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="6">Khối 6</option>
                  <option value="7">Khối 7</option>
                  <option value="8">Khối 8</option>
                  <option value="9">Khối 9</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">
                  Tên bài học / Chủ đề
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phép cộng phân số"
                  value={lessonTopic}
                  onChange={(e) => setLessonTopic(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateLessonPlan}
              disabled={!lessonTopic.trim() || isGeneratingPlan}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-purple-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isGeneratingPlan ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini đang soạn giáo án theo chuẩn GDPT 2018...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Sinh Kế Hoạch Bài Dạy Chuẩn 4 Hoạt Động</span>
                </>
              )}
            </button>

            {generatedPlan && (
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="font-extrabold text-xs text-purple-700 dark:text-purple-300">
                    Kế hoạch bài dạy đã tạo:
                  </span>
                  <button
                    onClick={() => handleCopy(generatedPlan, 'lesson')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 text-xs font-semibold hover:text-purple-600 cursor-pointer"
                  >
                    {copiedId === 'lesson' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'lesson' ? 'Đã sao chép' : 'Sao chép giáo án'}</span>
                  </button>
                </div>
                <div className="text-xs whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto text-slate-800 dark:text-slate-200 font-sans">
                  {generatedPlan}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Cấu hình Gemini Key */}
        {activeTab === 'config' && (
          <div className="p-5 space-y-4">
            <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl p-4 text-xs space-y-1.5 text-blue-900 dark:text-blue-200">
              <span className="font-bold flex items-center gap-1.5">
                <Key className="w-4 h-4 text-blue-600" />
                Cơ chế quản lý API Key Gemini
              </span>
              <p className="text-[11px] leading-relaxed text-blue-800/80 dark:text-blue-300/80">
                Hệ thống ưu tiên sử dụng biến môi trường <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code> trên máy chủ.
                Nếu muốn dùng API Key riêng của cá nhân bạn (Bring Your Own Key), hãy nhập vào bên dưới:
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                API Key Gemini Cá Nhân (Tùy chọn)
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
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

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Lưu Khóa API
              </button>

              {customKey && (
                <button
                  onClick={() => {
                    setCustomKey('');
                    setCustomUserApiKey('');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
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
  );
};
