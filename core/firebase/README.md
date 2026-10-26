# 📦 Firebase Full Stack Module for React (Auth + Firestore DB)

Thư mục này là **Module tích hợp hoàn chỉnh sẵn sàng copy sang bất kỳ dự án React nào** (Vite, Next.js, CRA, hoặc Desktop Tauri/Electron).

## 📁 Cấu trúc Module

```text
firebase/
├── index.ts               # Entrypoint chung: export * from './auth' và './db'
├── auth/                  # Module Xác thực (Google, Email/Password, Tokens, Form UI)
│   ├── config.ts
│   ├── types.ts
│   ├── authErrors.ts
│   ├── authService.ts
│   ├── AuthContext.tsx
│   ├── useAuth.ts
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   ├── AuthModal.tsx
│   │   └── ProtectedRoute.tsx
│   ├── .env.example
│   └── README.md
└── db/                    # Module Cơ sở dữ liệu Firestore
    ├── config.ts          # Kết nối Firestore & serverTimestamp, increment, deleteField
    ├── types.ts           # Type TypeScript: QueryOptions, QueryFilter, BatchOperation...
    ├── utils.ts           # Làm sạch undefined, format Timestamp DD/MM/YYYY HH:mm
    ├── firestoreService.ts# Các hàm xử lý chung: CRUD, Queries, Batch, Transaction, Realtime
    ├── useFirestoreDoc.ts        # React Hook lấy 1 document (Realtime)
    ├── useFirestoreCollection.ts # React Hook lấy danh sách theo filter (Realtime)
    ├── useFirestoreMutation.ts   # React Hook Thêm / Sửa / Xóa
    └── README.md
```

## 🚀 Cách import trong dự án React

Bạn có thể import từ gốc hoặc theo từng phân hệ:

```ts
// Cách 1: Import tất cả từ thư mục gốc
import {
  useAuth,
  LoginForm,
  addDocument,
  getDocuments,
  useFirestoreCollection,
} from './firebase';

// Cách 2: Import phân tách rõ ràng
import { useAuth, LoginForm } from './firebase/auth';
import { addDocument, useFirestoreDoc } from './firebase/db';
```
