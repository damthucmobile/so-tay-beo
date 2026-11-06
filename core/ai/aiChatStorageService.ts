/**
 * Core Service: Quản lý Lưu trữ và Tự động Đồng bộ Lịch sử Chat AI & Tệp đính kèm Đa thiết bị
 * Kết hợp Cloud Firestore (đồng bộ đám mây theo tài khoản) + Cloudflare R2 (lưu tệp vĩnh viễn) + Local Cache
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { getDb, COLLECTIONS, cleanUndefinedFields } from '@/core/firebase';
import { AIChatSession, ChatAttachment, ChatMessage } from './types';

export const CHAT_SESSIONS_STORAGE_KEY = 'so_tay_beo_gemini_chat_sessions_v1';
export const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25MB (Cloudflare R2 hỗ trợ upload lớn)

/**
 * Format kích thước tệp người dùng dễ đọc
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Lấy danh sách sessions từ bộ nhớ Cache Local
 */
export function getLocalCachedSessions(): AIChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Ghi danh sách sessions vào bộ nhớ Cache Local (được dọn sạch Base64 nặng để tránh QuotaExceededError)
 */
export function setLocalCachedSessions(sessions: AIChatSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    const sanitized = sessions.map((s) => sanitizeSessionForStorage(s));
    localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.warn('[AIChatStorage] Lỗi lưu cache local:', e);
  }
}

/**
 * Làm sạch tin nhắn trước khi lưu vào Cloud Firestore hoặc LocalStorage:
 * - Bỏ chuỗi Base64 `data` khổng lồ nếu đã có URL trên Cloudflare R2 hoặc data quá lớn
 * - Giữ lại URL, previewUrl, thông tin file, văn bản text
 * - LOẠI BỎ TRIỆT ĐỂ CÁC TRƯỜNG `undefined` (Vì Firestore SDK sẽ ném Exception nếu gặp undefined)
 */
export function sanitizeSessionForStorage(session: AIChatSession): AIChatSession {
  const sanitized: Record<string, any> = {
    id: session.id,
    title: session.title || 'Cuộc trò chuyện mới',
    createdAt: session.createdAt || new Date().toISOString(),
    updatedAt: session.updatedAt || new Date().toISOString(),
    messages: (session.messages || []).map((m) => {
      const msgCopy: Record<string, any> = {
        id: m.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        role: m.role || 'user',
        content: m.content || '',
        timestamp: m.timestamp || new Date().toISOString(),
      };

      if (m.attachments && Array.isArray(m.attachments) && m.attachments.length > 0) {
        msgCopy.attachments = m.attachments.map((a) => {
          const hasCloudUrl = Boolean(a.url);
          const attCopy: Record<string, any> = {
            id: a.id,
            name: a.name,
            type: a.type,
            size: a.size || 0,
            data: hasCloudUrl || (a.data && a.data.length > 100000) ? '' : a.data || '',
          };
          if (a.url) attCopy.url = a.url;
          if (a.fileKey) attCopy.fileKey = a.fileKey;
          if (a.previewUrl || a.url) attCopy.previewUrl = a.previewUrl || a.url;
          if (typeof a.isText === 'boolean') attCopy.isText = a.isText;
          if (a.textContent && a.textContent.length < 30000) attCopy.textContent = a.textContent;
          return attCopy;
        });
      }

      return msgCopy;
    }),
  };

  if (session.userId) sanitized.userId = session.userId;
  if (session.scope) sanitized.scope = session.scope;
  if (session.model) sanitized.model = session.model;
  if (typeof session.pinned === 'boolean') sanitized.pinned = session.pinned;

  return cleanUndefinedFields(sanitized) as AIChatSession;
}

/**
 * Tải file lên Cloudflare R2 qua API /api/media/upload
 * Trả về Cloudflare R2 Public/CDN URL và FileKey
 */
export async function uploadFileToCloudStorage(
  file: File,
  userId?: string
): Promise<{ url: string; fileKey: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'attachments');
  if (userId) {
    formData.append('userId', userId);
  }

  const res = await fetch('/api/media/upload', {
    method: 'POST',
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Không thể tải tệp lên Cloudflare R2.');
  }

  return {
    url: json.publicUrl,
    fileKey: json.fileKey,
  };
}

/**
 * Đọc file từ thiết bị người dùng và chuẩn bị ChatAttachment:
 * 1. Đọc nội dung Base64 / Text để gọi AI ngay lập tức
 * 2. Tự động upload lên Cloudflare R2 trong nền để lấy URL vĩnh viễn (nếu online)
 */
export async function processChatFileAttachment(
  file: File,
  userId?: string
): Promise<ChatAttachment> {
  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error(
      `Tệp "${file.name}" quá lớn (${formatFileSize(file.size)}). Giới hạn tối đa là 25MB.`
    );
  }

  const isImage = file.type.startsWith('image/');
  const isText =
    file.type.startsWith('text/') ||
    file.name.endsWith('.txt') ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.csv') ||
    file.name.endsWith('.json') ||
    file.name.endsWith('.js') ||
    file.name.endsWith('.ts') ||
    file.name.endsWith('.tsx') ||
    file.name.endsWith('.html') ||
    file.name.endsWith('.css') ||
    file.name.endsWith('.py');

  // Đọc nội dung cục bộ trước để AI xử lý tức thì
  const localDataPromise = new Promise<{
    data: string;
    previewUrl?: string;
    textContent?: string;
  }>((resolve, reject) => {
    const reader = new FileReader();
    if (isText) {
      reader.onload = () => {
        const textContent = reader.result as string;
        resolve({
          data: textContent,
          textContent,
        });
      };
      reader.onerror = () => reject(new Error(`Không thể đọc tệp "${file.name}"`));
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({
          data: dataUrl,
          previewUrl: isImage ? dataUrl : undefined,
        });
      };
      reader.onerror = () => reject(new Error(`Không thể đọc tệp "${file.name}"`));
      reader.readAsDataURL(file);
    }
  });

  // Tải file lên Cloudflare R2 đồng thời
  const cloudUploadPromise = uploadFileToCloudStorage(file, userId).catch((err) => {
    console.warn('[AIChatStorage] Không thể tải tệp lên Cloudflare R2:', err);
    return null;
  });

  const [localData, cloudResult] = await Promise.all([localDataPromise, cloudUploadPromise]);

  return {
    id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    type: file.type || (isImage ? 'image/jpeg' : 'application/octet-stream'),
    size: file.size,
    data: localData.data,
    previewUrl: cloudResult?.url || localData.previewUrl,
    url: cloudResult?.url,
    fileKey: cloudResult?.fileKey,
    isText,
    textContent: localData.textContent,
  };
}

/**
 * Lắng nghe Realtime danh sách Sessions của User từ Firestore
 * Tự động cập nhật cache local khi có thay đổi từ máy khác
 */
export function subscribeToUserAIChatSessions(
  userId: string,
  onUpdate: (sessions: AIChatSession[]) => void,
  onError?: (error: any) => void
): () => void {
  if (!userId || userId === 'anonymous') {
    onUpdate(getLocalCachedSessions());
    return () => {};
  }

  try {
    const db = getDb();
    const q = query(
      collection(db, COLLECTIONS.AI_CHAT_SESSIONS),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const sessions: AIChatSession[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as AIChatSession;
          sessions.push({
            ...data,
            id: docSnap.id,
          });
        });

        // Sắp xếp các cuộc trò chuyện theo thời gian cập nhật mới nhất trước
        sessions.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        // Cập nhật Cache Local
        setLocalCachedSessions(sessions);
        onUpdate(sessions);
      },
      (err) => {
        console.error('[AIChatStorage] Lỗi lắng nghe Firestore sessions:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.error('[AIChatStorage] Không thể khởi tạo Firestore listener:', err);
    onUpdate(getLocalCachedSessions());
    return () => {};
  }
}

/**
 * Lưu hoặc Cập nhật 1 Session vào Cloud Firestore và Local Cache
 */
export async function saveAIChatSession(
  session: AIChatSession,
  userId?: string | null
): Promise<void> {
  const sanitized = sanitizeSessionForStorage({
    ...session,
    userId: userId || session.userId,
    updatedAt: new Date().toISOString(),
  });

  // 1. Cập nhật Cache Local trước để giao diện mượt mà tức thì
  const localList = getLocalCachedSessions();
  const existsIndex = localList.findIndex((s) => s.id === sanitized.id);
  let updatedList: AIChatSession[];
  if (existsIndex >= 0) {
    updatedList = localList.map((s) => (s.id === sanitized.id ? sanitized : s));
  } else {
    updatedList = [sanitized, ...localList];
  }
  setLocalCachedSessions(updatedList);

  // 2. Đồng bộ lên Cloud Firestore nếu người dùng đã đăng nhập
  const effectiveUid = userId || sanitized.userId;
  if (effectiveUid && effectiveUid !== 'anonymous') {
    try {
      const db = getDb();
      const docRef = doc(db, COLLECTIONS.AI_CHAT_SESSIONS, sanitized.id);
      const firestorePayload = cleanUndefinedFields({
        ...sanitized,
        userId: effectiveUid,
      });
      await setDoc(docRef, firestorePayload, { merge: true });
    } catch (e) {
      console.error('[AIChatStorage] Lỗi lưu session lên Firestore:', e);
    }
  }
}

/**
 * Xóa 1 Session khỏi Cloud Firestore và Local Cache
 */
export async function deleteAIChatSession(
  sessionId: string,
  userId?: string | null
): Promise<void> {
  // 1. Xóa khỏi local cache
  const localList = getLocalCachedSessions();
  const updatedList = localList.filter((s) => s.id !== sessionId);
  setLocalCachedSessions(updatedList);

  // 2. Xóa trên Firestore nếu có tài khoản
  if (userId && userId !== 'anonymous') {
    try {
      const db = getDb();
      const docRef = doc(db, COLLECTIONS.AI_CHAT_SESSIONS, sessionId);
      await deleteDoc(docRef);
    } catch (e) {
      console.error('[AIChatStorage] Lỗi xóa session trên Firestore:', e);
    }
  }
}

/**
 * TỰ ĐỘNG ĐỒNG BỘ: Đẩy các session local trước đó lên Cloud Firestore ngay khi người dùng đăng nhập
 */
export async function autoSyncLocalSessionsToCloud(userId: string): Promise<void> {
  if (!userId || userId === 'anonymous') return;

  const localSessions = getLocalCachedSessions();
  if (localSessions.length === 0) return;

  try {
    const db = getDb();
    // Lấy danh sách ID đã có trên Cloud để không ghi đè mất mát
    const q = query(
      collection(db, COLLECTIONS.AI_CHAT_SESSIONS),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const cloudSessionIds = new Set(snapshot.docs.map((d) => d.id));

    // Đẩy các session chưa có trên cloud lên
    for (const session of localSessions) {
      if (!cloudSessionIds.has(session.id) && session.messages && session.messages.length > 0) {
        const sanitized = sanitizeSessionForStorage({
          ...session,
          userId,
        });
        const docRef = doc(db, COLLECTIONS.AI_CHAT_SESSIONS, session.id);
        const firestorePayload = cleanUndefinedFields(sanitized);
        await setDoc(docRef, firestorePayload, { merge: true });
      }
    }
  } catch (err) {
    console.warn('[AIChatStorage] Tự động đồng bộ local sessions lên cloud gặp lỗi:', err);
  }
}
