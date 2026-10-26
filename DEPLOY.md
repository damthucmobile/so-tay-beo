# HƯỚNG DẪN DEPLOY FIREBASE - SỔ TAY BÉO

Tài liệu này hướng dẫn cách deploy Firestore Security Rules, Chỉ mục (Indexes) và ứng dụng Next.js (Hosting) lên Firebase.

---

## 1. Yêu Cầu Cài Đặt Ban Đầu

1. Đảm bảo máy tính đã cài đặt **Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```
2. Đăng nhập tài khoản Google quản trị Firebase:
   ```bash
   firebase login
   ```
3. Kiểm tra project đang trỏ tới:
   ```bash
   cd so-tay-beo
   firebase use
   # Hoặc chọn project chỉ định:
   firebase use workscheduler190720
   ```

---

## 2. Bật Tính Năng Web Frameworks (Cho Next.js)

Firebase CLI hỗ trợ deploy trực tiếp Next.js SSR & API Routes thông qua tính năng Web Frameworks:
```bash
firebase experiments:enable webframeworks
```

---

## 3. Các Lệnh Deploy (NPM Scripts)

Trong thư mục `so-tay-beo`, bạn có thể chạy các lệnh sau:

| Lệnh | Mô tả |
| :--- | :--- |
| `npm run deploy:rules` | Deploy quy tắc bảo mật `firestore.rules` lên Firestore |
| `npm run deploy:indexes` | Deploy chỉ mục truy vấn `firestore.indexes.json` lên Firestore |
| `npm run deploy:hosting` | Build Next.js và deploy lên Firebase Hosting |
| `npm run deploy` | Deploy toàn bộ (bao gồm cả Rules, Indexes và Hosting) |

### Ví dụ deploy từng phần:
- **Chỉ cập nhật Rules bảo mật (rất nhanh, không cần build web)**:
  ```bash
  npm run deploy:rules
  ```

- **Deploy phiên bản Web mới**:
  ```bash
  npm run deploy:hosting
  ```

---

## 4. Cấu Hình Biến Môi Trường (.env)

Trước khi deploy Hosting, đảm bảo file `.env` hoặc `.env.local` đã đầy đủ thông tin:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=workscheduler190720.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=workscheduler190720
NEXT_PUBLIC_FIREBASE_DATABASE_ID=(default)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=workscheduler190720.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## 5. Chạy Thử Nghiệm Emulator Tại Local (Tùy Chọn)

Để test rules và database trên máy local trước khi deploy thật:
```bash
npm run firebase:emulators
```
