/**
 * Bảng ánh xạ mã lỗi Firebase Auth sang thông báo tiếng Việt thân thiện
 */
export const FIREBASE_AUTH_ERROR_MAP: Record<string, string> = {
  'auth/invalid-credential': 'Email hoặc mật khẩu không chính xác.',
  'auth/user-not-found': 'Không tìm thấy tài khoản với email này.',
  'auth/wrong-password': 'Mật khẩu không chính xác.',
  'auth/email-already-in-use': 'Địa chỉ email này đã được sử dụng bởi một tài khoản khác.',
  'auth/invalid-email': 'Định dạng email không hợp lệ.',
  'auth/weak-password': 'Mật khẩu quá yếu. Vui lòng nhập tối thiểu 6 ký tự.',
  'auth/user-disabled': 'Tài khoản này đã bị vô hiệu hóa hoặc khóa.',
  'auth/operation-not-allowed': 'Phương thức đăng nhập này chưa được kích hoạt trên Firebase Console.',
  'auth/too-many-requests': 'Đã thử quá nhiều lần thất bại. Vui lòng thử lại sau ít phút.',
  'auth/network-request-failed': 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền internet.',
  'auth/popup-closed-by-user': 'Cửa sổ đăng nhập đã bị đóng trước khi hoàn tất.',
  'auth/popup-blocked': 'Trình duyệt đã chặn cửa sổ đăng nhập popup. Vui lòng cấp quyền mở popup.',
  'auth/cancelled-popup-request': 'Yêu cầu đăng nhập popup trước đó đã bị hủy.',
  'auth/requires-recent-login': 'Hành động này yêu cầu bạn phải đăng nhập lại gần đây.',
  'auth/expired-action-code': 'Liên kết xác thực hoặc đặt lại mật khẩu đã hết hạn.',
  'auth/invalid-action-code': 'Mã xác thực không hợp lệ hoặc đã qua sử dụng.',
};

/**
 * Trả về thông báo lỗi tiếng Việt thân thiện từ Error hoặc FirebaseError
 */
export function getFriendlyAuthErrorMessage(error: unknown): string {
  if (!error) return 'Đã có lỗi không xác định xảy ra.';
  
  if (typeof error === 'object' && error !== null) {
    const firebaseCode = (error as { code?: string }).code;
    if (firebaseCode && FIREBASE_AUTH_ERROR_MAP[firebaseCode]) {
      return FIREBASE_AUTH_ERROR_MAP[firebaseCode];
    }

    const message = (error as { message?: string }).message;
    if (message) {
      // Tìm xem có chứa code dạng auth/... không
      for (const [code, vietnameseMsg] of Object.entries(FIREBASE_AUTH_ERROR_MAP)) {
        if (message.includes(code)) {
          return vietnameseMsg;
        }
      }
      return message;
    }
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Đã có lỗi xảy ra trong quá trình xác thực.';
}
