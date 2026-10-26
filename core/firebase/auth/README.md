# 🚀 Reusable Firebase Authentication Module (React)

Module này được thiết kế và tổng hợp độc lập, **hoàn toàn có thể copy sang bất kỳ dự án React nào sau này** (Vite, Next.js, Create React App, Webpack, hoặc Desktop Tauri/Electron) mà không cần cấu hình lại từ đầu.

---

## 📁 Cấu trúc thư mục

```text
firebase/
├── config.ts              # Khởi tạo Firebase App, Auth, Firestore, Storage (hỗ trợ Vite, Next.js, CRA)
├── types.ts               # Khai báo TypeScript types (AuthUser, AuthContextState, v.v.)
├── authErrors.ts          # Bộ từ điển dịch mã lỗi Firebase sang Tiếng Việt thân thiện
├── authService.ts         # Service chứa toàn bộ logic API (Email, Google, Reset Password, v.v.)
├── AuthContext.tsx        # React Context & AuthProvider quản lý State toàn cục
├── useAuth.ts             # Custom hook useAuth() tiện dụng
├── components/
│   ├── LoginForm.tsx      # Giao diện Form Đăng nhập / Đăng ký / Quên mật khẩu hoàn chỉnh
│   ├── AuthModal.tsx      # Hộp thoại Modal Popup đăng nhập
│   └── ProtectedRoute.tsx # Component bảo vệ Route (chỉ cho phép user đã đăng nhập)
├── .env.example           # File mẫu biến môi trường
├── index.ts               # Entrypoint export toàn bộ module
└── README.md              # Tài liệu hướng dẫn sử dụng
```

---

## 🛠️ 1. Cài đặt thư viện phụ thuộc

Trong dự án React mới của bạn, chỉ cần cài đặt thư viện chính thức `firebase`:

```bash
npm install firebase
# hoặc
yarn add firebase
# hoặc
pnpm add firebase
```

---

## ⚙️ 2. Cấu hình biến môi trường (`.env`)

Tạo hoặc thêm vào file `.env` của dự án bạn các thông số lấy từ **Firebase Console** -> **Project Settings**:

### Với dự án Vite / Tauri (tiền tố `VITE_`):
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef...
```

### Với dự án Next.js (tiền tố `NEXT_PUBLIC_`):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef...
```

---

## 💡 3. Hướng dẫn sử dụng nhanh

### Bước 1: Bọc `AuthProvider` ở gốc ứng dụng (`App.tsx` hoặc `main.tsx`)

```tsx
import React from 'react';
import { AuthProvider } from './firebase'; // đường dẫn đến thư mục firebase bạn đã copy
import { MainApp } from './MainApp';

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
```

---

### Bước 2: Sử dụng Hook `useAuth()` trong bất kỳ Component nào

```tsx
import React from 'react';
import { useAuth } from './firebase';

export const UserProfileBar = () => {
  const { user, isAuthenticated, isLoading, logout, loginWithGooglePopup } = useAuth();

  if (isLoading) {
    return <div>Đang tải thông tin đăng nhập...</div>;
  }

  if (!isAuthenticated) {
    return (
      <button onClick={() => loginWithGooglePopup()}>
        Đăng nhập với Google
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {user?.photoURL && (
        <img
          src={user.photoURL}
          alt={user.displayName || 'Avatar'}
          style={{ width: 32, height: 32, borderRadius: '50%' }}
        />
      )}
      <span>Xin chào, {user?.displayName} ({user?.email})</span>
      <button onClick={logout}>Đăng xuất</button>
    </div>
  );
};
```

---

### Bước 3: Dùng các giao diện có sẵn

#### A. Form Đăng nhập đầy đủ (`<LoginForm />`)
Đã tích hợp sẵn:
- Đăng nhập bằng Email & Mật khẩu
- Đăng ký tài khoản mới + Họ tên
- Quên mật khẩu (gửi email reset)
- Nút bấm Đăng nhập nhanh bằng Google
- Tự động hiển thị mã lỗi Tiếng Việt nếu nhập sai

```tsx
import { LoginForm } from './firebase';

export function LoginPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <LoginForm onSuccess={() => console.log('Đăng nhập thành công!')} />
    </div>
  );
}
```

#### B. Hộp thoại Popup đăng nhập (`<AuthModal />`)
```tsx
import { useState } from 'react';
import { AuthModal } from './firebase';

export function Header() {
  const [openAuth, setOpenAuth] = useState(false);

  return (
    <header>
      <button onClick={() => setOpenAuth(true)}>Đăng nhập</button>
      <AuthModal isOpen={openAuth} onClose={() => setOpenAuth(false)} />
    </header>
  );
}
```

#### C. Bảo vệ các trang nội bộ (`<ProtectedRoute />`)
```tsx
import { ProtectedRoute, LoginForm } from './firebase';
import { Dashboard } from './Dashboard';

export function AppRoutes() {
  return (
    <ProtectedRoute fallback={<LoginForm />}>
      <Dashboard />
    </ProtectedRoute>
  );
}
```

---

## 📚 4. Bảng tham khảo API từ `useAuth()`

| Tên phương thức / Thuộc tính | Kiểu dữ liệu / Chữ ký | Mô tả |
| :--- | :--- | :--- |
| `user` | `AuthUser \| null` | Thông tin người dùng hiện tại (`uid`, `email`, `displayName`, `photoURL`, ...) |
| `isAuthenticated` | `boolean` | `true` nếu đã đăng nhập |
| `isLoading` | `boolean` | `true` khi đang khởi tạo hoặc đang xử lý đăng nhập / đăng xuất |
| `error` | `string \| null` | Thông báo lỗi Tiếng Việt nếu đăng nhập / đăng ký thất bại |
| `loginWithEmail` | `(email, pass) => Promise<AuthUser>` | Đăng nhập tài khoản bằng email & mật khẩu |
| `signupWithEmail` | `(email, pass, name?) => Promise<AuthUser>` | Tạo mới tài khoản và cập nhật tên người dùng |
| `loginWithGooglePopup` | `() => Promise<AuthUser>` | Mở popup Google Sign-in chuẩn trên trình duyệt web |
| `loginWithGoogleRedirect` | `() => Promise<void>` | Điều hướng sang trang Google (hữu ích cho Mobile Web) |
| `loginWithGoogleTokens` | `(tokens) => Promise<AuthUser>` | Đăng nhập Firebase bằng ID Token / Access Token (Dành cho Desktop Tauri / Native) |
| `sendPasswordReset` | `(email) => Promise<void>` | Gửi email khôi phục mật khẩu |
| `logout` | `() => Promise<void>` | Đăng xuất người dùng |
| `clearError` | `() => void` | Xóa trạng thái lỗi hiện tại |

---

## 🌐 5. Cấu hình trên Firebase Console

1. Truy cập [Firebase Console](https://console.firebase.google.com/) -> Chọn Project của bạn.
2. Vào mục **Build** -> **Authentication** -> **Sign-in method**.
3. Kích hoạt **Email/Password** và **Google**.
4. Vào tab **Settings** -> **Authorized domains**: Thêm tên miền web của bạn (ví dụ `localhost`, `ten-mien-cua-ban.com`).
