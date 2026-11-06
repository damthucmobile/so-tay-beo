<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# QUY TẮC CỐT LÕI BẮT BUỘC (MANDATORY AGENT WORKFLOW RULES)

Dưới đây là các điều kiện tiên quyết mà AI Agent **BẮT BUỘC PHẢI LUÔN KIỂM TRA VÀ THỰC HIỆN** mà không được bỏ sót:

---

### 1. QUY TRÌNH BẮT BUỘC KHI TẠO HOẶC SỬA FIRESTORE COLLECTION MỚI
Bất cứ khi nào tạo mới hoặc sửa đổi một collection trong Firestore:
1. **Khai báo Constants**: Thêm tên collection vào `core/firebase/db/constants.ts`.
2. **Cập nhật Security Rules (BẮT BUỘC)**: Mở ngay `firestore.rules`, định nghĩa rõ quyền `allow read, write` theo `userId` hoặc `isAuthenticated()`. Tuyệt đối không để collection mới rơi vào luật `match /{document=**} { allow read, write: if false; }`.
3. **Triển khai Rules lên Cloud**: Chạy ngay lệnh `npx firebase deploy --only firestore:rules` để luật có hiệu lực trên Firebase Cloud của dự án.
4. **Kiểm tra Runtime Permissions**: Mở trình duyệt kiểm tra Console / Network logs, đảm bảo KHÔNG còn lỗi `FirebaseError: Missing or insufficient permissions`.

---

### 2. QUY TRÌNH BẮT BUỘC KHI UPLOAD VÀ LƯU TRỮ TỆP / MEDIA (STORAGE)
1. **Kiểm tra Cloudflare R2 / S3**: Kiểm tra biến môi trường (`CLOUDFLARE_R2_*`, `FIREBASE_STORAGE_*`) trước khi gọi API.
2. **Không lưu Base64 nặng vào DB**: Chỉ lưu đường dẫn CDN/Public URL và metadata tệp vào Firestore và LocalStorage để tránh `QuotaExceededError`.
3. **Luôn có Fallback**: Phải có cơ chế xử lý khi upload lỗi hoặc người dùng đang offline.

---

### 3. TIÊU CHUẨN XÁC MINH HOÀN THÀNH (DEFINITION OF DONE)
Không được coi một tính năng là hoàn thành nếu chỉ chạy `npx tsc --noEmit`. Agent phải:
1. `npx tsc --noEmit` đạt 0 lỗi.
2. Dùng `browser_subagent` mở trực tiếp trang web, thao tác thực tế và **soi toàn bộ Console Logs của trình duyệt** để đảm bảo không có cảnh báo quyền (Permission Denied), lỗi 403, 404, hoặc crash giao diện.
3. Làm mới trang (Reload) để kiểm tra tính bền vững của dữ liệu (Data Persistence).
