# 🗄️ Reusable Firestore Database Module (React)

Module này cung cấp cấu hình kết nối Firestore và **bộ hàm xử lý chung (CRUD, Queries, Batch, Transaction, Realtime Listener và React Hooks)**, thiết kế độc lập để bạn có thể mang sang bất kỳ dự án React nào.

---

## 📁 Cấu trúc thư mục

```text
firebase/db/
├── config.ts                 # Kết nối Firestore instance, serverTimestamp, increment, deleteField
├── types.ts                  # Type TypeScript: BaseEntity, QueryOptions, QueryFilter, BatchOperation...
├── utils.ts                  # Loại bỏ undefined, format ngày giờ Timestamp DD/MM/YYYY HH:mm
├── firestoreService.ts       # Toàn bộ hàm CRUD, Queries, Batch, Transaction, Realtime
├── useFirestoreDoc.ts        # Hook lấy 1 document (tự động cập nhật realtime)
├── useFirestoreCollection.ts # Hook lấy danh sách document theo filter (realtime)
├── useFirestoreMutation.ts   # Hook thêm / sửa / xóa tài liệu
├── index.ts                  # Entrypoint export toàn bộ module DB
└── README.md                 # Hướng dẫn chi tiết & Ví dụ
```

---

## 🚀 1. Các hàm Service cốt lõi (`firestoreService.ts`)

Bạn có thể gọi trực tiếp các hàm này ở bất kỳ đâu (trong component, Redux thunk, Zustand store, hoặc event handler):

### A. Thêm mới tài liệu (Tự động sinh ID, tự gán `createdAt` & `updatedAt`)
```ts
import { addDocument } from './firebase/db';

const newDoc = await addDocument('tasks', {
  title: 'Họp giao ban',
  status: 'pending',
  userId: 'user_123',
});
console.log('ID tài liệu mới:', newDoc.id);
```

### B. Lưu tài liệu với ID chỉ định (hoặc ghi đè/merge)
```ts
import { setDocument } from './firebase/db';

await setDocument('user_settings', 'user_123', {
  theme: 'dark',
  notifications: true,
}, true); // merge: true
```

### C. Lấy 1 tài liệu theo ID
```ts
import { getDocument } from './firebase/db';

const task = await getDocument<Task>('tasks', 'task_id_123');
if (task) {
  console.log(task.title, task.createdAt);
}
```

### D. Truy vấn danh sách có bộ lọc, sắp xếp, phân trang
```ts
import { getDocuments } from './firebase/db';

const pendingTasks = await getDocuments<Task>('tasks', {
  filters: [
    { field: 'userId', operator: '==', value: 'user_123' },
    { field: 'status', operator: '==', value: 'pending' },
  ],
  orderBy: [
    { field: 'createdAt', direction: 'desc' },
  ],
  limit: 10,
});
```

### E. Lấy danh sách lọc nhanh theo 1 trường
```ts
import { getDocumentsByField } from './firebase/db';

const userTasks = await getDocumentsByField<Task>('tasks', 'userId', 'user_123');
```

### F. Cập nhật một phần (Tự động gán `updatedAt`)
```ts
import { updateDocument } from './firebase/db';

await updateDocument('tasks', 'task_id_123', {
  status: 'completed',
});
```

### G. Xóa tài liệu (Xóa vĩnh viễn hoặc Xóa mềm)
```ts
import { deleteDocument, softDeleteDocument } from './firebase/db';

// Hard delete: Xóa vĩnh viễn
await deleteDocument('tasks', 'task_id_123');

// Soft delete: Đánh dấu isDeleted: true và deletedAt
await softDeleteDocument('tasks', 'task_id_123');
```

### H. Đếm số lượng tài liệu (Siêu nhanh, tiết kiệm chi phí đọc)
```ts
import { countDocuments } from './firebase/db';

const totalCompleted = await countDocuments('tasks', [
  { field: 'status', operator: '==', value: 'completed' },
]);
console.log('Tổng số hoàn thành:', totalCompleted);
```

### I. Batch Write (Ghi hàng loạt tối đa 500 thao tác / 1 lần gọi)
```ts
import { batchWrite } from './firebase/db';

await batchWrite([
  { type: 'set', collection: 'tasks', id: 't1', data: { title: 'Việc 1' } },
  { type: 'update', collection: 'tasks', id: 't2', data: { status: 'done' } },
  { type: 'delete', collection: 'tasks', id: 't3' },
]);
```

### J. Lắng nghe thay đổi Realtime (`onSnapshot`)
```ts
import { subscribeCollection } from './firebase/db';

const unsubscribe = subscribeCollection<Task>(
  'tasks',
  (taskList) => {
    console.log('Danh sách task cập nhật tức thì:', taskList);
  },
  {
    filters: [{ field: 'userId', operator: '==', value: 'user_123' }],
  }
);

// Dừng lắng nghe khi không cần nữa:
unsubscribe();
```

---

## ⚛️ 2. Các React Hooks tiện ích cho Component

### Hook 1: `useFirestoreCollection` (Lấy danh sách Realtime)
```tsx
import React from 'react';
import { useFirestoreCollection } from './firebase/db';

export function TaskList({ userId }: { userId: string }) {
  const { data: tasks, isLoading, error } = useFirestoreCollection<Task>('tasks', {
    filters: [{ field: 'userId', operator: '==', value: userId }],
    orderBy: [{ field: 'createdAt', direction: 'desc' }],
    realtime: true, // Tự động cập nhật khi có ai thêm/sửa/xóa trên cloud
  });

  if (isLoading) return <div>Đang tải dữ liệu...</div>;
  if (error) return <div>Lỗi: {error.message}</div>;

  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>{task.title} - {task.status}</li>
      ))}
    </ul>
  );
}
```

### Hook 2: `useFirestoreDoc` (Lấy 1 tài liệu Realtime)
```tsx
import React from 'react';
import { useFirestoreDoc, formatFirestoreTimestamp } from './firebase/db';

export function TaskDetail({ taskId }: { taskId: string }) {
  const { data: task, isLoading } = useFirestoreDoc<Task>('tasks', taskId);

  if (isLoading) return <div>Đang tải chi tiết...</div>;
  if (!task) return <div>Không tìm thấy tài liệu.</div>;

  return (
    <div>
      <h2>{task.title}</h2>
      <p>Cập nhật lần cuối: {formatFirestoreTimestamp(task.updatedAt)}</p>
    </div>
  );
}
```

### Hook 3: `useFirestoreMutation` (Thêm / Sửa / Xóa)
```tsx
import React, { useState } from 'react';
import { useFirestoreMutation } from './firebase/db';

export function AddTaskForm({ userId }: { userId: string }) {
  const [title, setTitle] = useState('');
  const { add, isLoading } = useFirestoreMutation<Task>('tasks');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await add({
      title,
      userId,
      status: 'pending',
    });
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên công việc..." />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Đang lưu...' : 'Thêm mới'}
      </button>
    </form>
  );
}
```

---

## 🛡️ 3. An toàn dữ liệu & Tối ưu chi phí
- **Tự động làm sạch `undefined`**: Hàm `cleanUndefinedFields` tự động loại bỏ các thuộc tính `undefined` trước khi gửi lên Firebase, tránh lỗi văng runtime của Firestore.
- **Tiết kiệm chi phí**: `countDocuments` sử dụng cơ chế `getCountFromServer` của Firestore thay vì tải toàn bộ document về client.
- **Hỗ trợ Timestamp chuẩn**: Tiện ích `formatFirestoreTimestamp` giúp format ngày giờ chuẩn `DD/MM/YYYY HH:mm` cho người dùng Việt Nam.
