// app/api/cron/reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminMessaging } from '@/core/firebase/admin';

export const dynamic = 'force-dynamic';

const DAY_MAP: Record<number, string | null> = {
  1: 'Hai',
  2: 'Ba',
  3: 'Tư',
  4: 'Năm',
  5: 'Sáu',
  6: 'Bảy',
  0: null, // Chủ nhật
};

const DEFAULT_PERIOD_TIMES: Record<string, Record<number, { start: string; end: string }>> = {
  Sáng: {
    1: { start: '07:15', end: '08:00' },
    2: { start: '08:05', end: '08:50' },
    3: { start: '09:05', end: '09:50' },
    4: { start: '09:55', end: '10:40' },
    5: { start: '10:45', end: '11:30' },
  },
  Chiều: {
    1: { start: '13:00', end: '13:45' },
    2: { start: '13:50', end: '14:35' },
    3: { start: '14:50', end: '15:35' },
    4: { start: '15:40', end: '16:25' },
    5: { start: '16:30', end: '17:15' },
  },
};

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  // 1. Xác thực bảo mật CRON_SECRET (nếu có cấu hình)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!adminDb) {
    return NextResponse.json(
      {
        error: 'Firebase Admin Database chưa được khởi tạo. Vui lòng cấu hình FIREBASE_CLIENT_EMAIL và FIREBASE_PRIVATE_KEY trong biến môi trường.',
      },
      { status: 500 }
    );
  }

  // 2. Lấy thời gian hiện tại theo múi giờ Việt Nam (Asia/Ho_Chi_Minh)
  const vnDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const nowHours = String(vnDate.getHours()).padStart(2, '0');
  const nowMinutes = String(vnDate.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${nowHours}:${nowMinutes}`;
  const nowTotalMinutes = vnDate.getHours() * 60 + vnDate.getMinutes();

  const currentDayOfWeekIdx = vnDate.getDay();
  const currentDayOfWeek = DAY_MAP[currentDayOfWeekIdx];

  const results: any[] = [];

  try {
    // 3. Quét tất cả cấu hình nhắc nhở đang được bật
    const settingsSnap = await adminDb
      .collection('reminder_settings')
      .where('enabled', '==', true)
      .get();

    if (settingsSnap.empty) {
      return NextResponse.json({
        message: 'Không có cài đặt nhắc nhở nào đang kích hoạt',
        currentTime: currentTimeStr,
        processed: 0,
      });
    }

    for (const doc of settingsSnap.docs) {
      const setting = doc.data();
      const userId = setting.userId;
      const teacher = setting.selectedTeacher;

      if (!userId || !teacher) continue;

      // Lấy thời khóa biểu của user
      const timetablesSnap = await adminDb
        .collection('school_timetables')
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (timetablesSnap.empty) continue;

      const timetable = timetablesSnap.docs[0].data();
      const entries: any[] = timetable.entries || [];

      // Các tiết dạy hôm nay của giáo viên
      const todayEntries = currentDayOfWeek
        ? entries
            .filter((e) => e.teacher === teacher && e.dayOfWeek === currentDayOfWeek)
            .sort((a, b) => (a.session === b.session ? a.period - b.period : a.session === 'Sáng' ? -1 : 1))
        : [];

      let notificationToSend: { title: string; body: string; tag: string } | null = null;

      // A. Kiểm tra bản tin sáng (Morning Brief)
      if (setting.notifyMorningBrief && setting.morningBriefTime === currentTimeStr) {
        const count = todayEntries.length;
        let body = '';
        if (count === 0) {
          body = `Chào Thầy/Cô ${teacher}! Hôm nay Thầy/Cô không có tiết dạy nào. Chúc một ngày làm việc tràn đầy năng lượng!`;
        } else {
          const detail = todayEntries
            .map((e) => `${e.session} T${e.period}: ${e.className} (${e.subject})`)
            .join(', ');
          body = `Hôm nay Thầy/Cô có ${count} tiết: ${detail}. Chúc Thầy/Cô có ngày giảng dạy hiệu quả!`;
        }
        notificationToSend = {
          title: `🌅 Lịch dạy hôm nay: ${teacher}`,
          body,
          tag: `morning_${teacher}_${currentTimeStr}`,
        };
      }

      // B. Kiểm tra bản tin tối (Evening Brief)
      if (!notificationToSend && setting.notifyEveningBrief && setting.eveningBriefTime === currentTimeStr) {
        const tomorrow = new Date(vnDate.getTime() + 24 * 60 * 60 * 1000);
        const tomorrowDay = DAY_MAP[tomorrow.getDay()];
        const tomorrowEntries = tomorrowDay
          ? entries.filter((e) => e.teacher === teacher && e.dayOfWeek === tomorrowDay)
          : [];

        const count = tomorrowEntries.length;
        let body = '';
        if (count === 0) {
          body = `Ngày mai (${tomorrowDay ? 'Thứ ' + tomorrowDay : 'Chủ nhật'}) Thầy/Cô không có tiết dạy nào. Chúc Thầy/Cô nghỉ ngơi thư giãn!`;
        } else {
          const detail = tomorrowEntries
            .map((e) => `${e.session} T${e.period}: ${e.className} (${e.subject})`)
            .join(', ');
          body = `Ngày mai (${tomorrowDay}) Thầy/Cô có ${count} tiết: ${detail}. Thầy/Cô nhớ chuẩn bị giáo án nhé!`;
        }
        notificationToSend = {
          title: `🌙 Chuẩn bị lịch dạy ngày mai: ${teacher}`,
          body,
          tag: `evening_${teacher}_${currentTimeStr}`,
        };
      }

      // C. Kiểm tra nhắc trước giờ vào tiết
      if (!notificationToSend && setting.notifyBeforePeriod && todayEntries.length > 0) {
        for (const entry of todayEntries) {
          const startTime = DEFAULT_PERIOD_TIMES[entry.session]?.[entry.period]?.start || '07:30';
          const [h, m] = startTime.split(':').map(Number);
          const periodMinutes = h * 60 + m;
          const diffMinutes = periodMinutes - nowTotalMinutes;

          // Đúng số phút cài đặt trước giờ vào tiết
          if (diffMinutes === (setting.minutesBeforePeriod || 15)) {
            notificationToSend = {
              title: `⏰ Sắp đến giờ vào tiết (${entry.session} - Tiết ${entry.period})!`,
              body: `Thầy/Cô ${teacher} có tiết dạy lớp ${entry.className} (${entry.subject}) lúc ${startTime} (${diffMinutes} phút nữa).`,
              tag: `period_${teacher}_${entry.session}_${entry.period}`,
            };
            break;
          }
        }
      }

      // 4. Nếu có thông báo cần gửi ➔ Đẩy qua FCM Admin SDK
      if (notificationToSend) {
        // Lấy danh sách FCM tokens của thiết bị người dùng
        const subsSnap = await adminDb
          .collection('push_subscriptions')
          .where('userId', '==', userId)
          .where('enabled', '==', true)
          .get();

        const tokens: string[] = [];
        subsSnap.forEach((sDoc) => {
          const data = sDoc.data();
          if (data.fcmToken && typeof data.fcmToken === 'string' && data.fcmToken.trim() !== '') {
            tokens.push(data.fcmToken.trim());
          }
        });

        let pushResult = null;
        if (tokens.length > 0 && adminMessaging) {
          try {
            pushResult = await adminMessaging.sendEachForMulticast({
              tokens,
              notification: {
                title: notificationToSend.title,
                body: notificationToSend.body,
              },
              data: {
                url: '/?tab=teaching_schedule',
                tag: notificationToSend.tag,
                timestamp: String(Date.now()),
              },
              webpush: {
                notification: {
                  icon: '/icon.png',
                  badge: '/icon.png',
                  tag: notificationToSend.tag,
                },
                fcmOptions: {
                  link: '/?tab=teaching_schedule',
                },
              },
            });
          } catch (pushErr: any) {
            console.error('[Cron Reminders] FCM Push error:', pushErr);
            pushResult = { error: pushErr?.message };
          }
        }

        // 5. Gửi song song qua Zalo OA (nếu người dùng bật chế độ Zalo)
        let zaloResult = null;
        if (setting.zalo?.enabled) {
          const phone = setting.zalo?.phoneNumber?.trim()?.replace(/\s+/g, '');
          let zaloUid = setting.zalo?.zaloUserId;

          // Nếu chưa có Zalo UID trực tiếp, tìm kiếm từ mapping đã lưu
          if (!zaloUid && phone) {
            try {
              const mapDoc = await adminDb.collection('zalo_user_mappings').doc(phone).get();
              if (mapDoc.exists) {
                zaloUid = mapDoc.data()?.zaloUserId;
              }
            } catch (zErr) {
              console.warn('[Cron Reminders] Lỗi tra cứu mapping Zalo:', zErr);
            }
          }

          if (zaloUid) {
            try {
              const { ZaloService } = await import('@/core/notifications/zaloService');
              const zaloAccessToken = process.env.ZALO_OA_ACCESS_TOKEN || '';
              zaloResult = await ZaloService.sendMessage(zaloAccessToken, {
                recipientId: zaloUid,
                messageText: `🔔 [SỔ TAY BÉO - NHẮC LỊCH DẠY]\n${notificationToSend.title}\n\n${notificationToSend.body}`,
                buttons: [
                  {
                    title: 'Xem Thời Khóa Biểu',
                    type: 'oa.open.url',
                    payload: {
                      url: process.env.NEXT_PUBLIC_APP_URL || 'https://sotaybeo.vn/?tab=teaching_schedule',
                    },
                  },
                ],
              });
            } catch (zaloSendErr: any) {
              console.error('[Cron Reminders] Lỗi gửi tin Zalo:', zaloSendErr);
              zaloResult = { error: zaloSendErr?.message };
            }
          } else {
            zaloResult = { skipped: true, reason: 'Chưa có Zalo UID liên kết với số điện thoại này' };
          }
        }

        results.push({
          userId,
          teacher,
          notification: notificationToSend,
          deviceTokensCount: tokens.length,
          fcmPushResult: pushResult,
          zaloResult,
        });
      }
    }

    return NextResponse.json({
      success: true,
      currentTime: currentTimeStr,
      processedSettingsCount: settingsSnap.size,
      sentCount: results.length,
      details: results,
    });
  } catch (err: any) {
    console.error('[Cron Reminders Error]:', err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
