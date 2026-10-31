// features/travel/services/travelFirebaseService.ts
'use client';

import {
  setDocument,
  getDocument,
  getDocuments,
  deleteDocument,
  getDocumentsByField,
} from '@/core/firebase/db/firestoreService';
import { COLLECTIONS } from '@/core/firebase/db/constants';
import { Trip } from '../types';

export interface TripFirebaseDoc extends Trip {
  userId?: string;
}

/**
 * 1. Lưu hoặc cập nhật một chuyến đi lên Firebase Firestore
 */
export async function saveTripToFirebase(trip: Trip, userId?: string): Promise<void> {
  try {
    const payload: TripFirebaseDoc = {
      ...trip,
      ...(userId ? { userId } : {}),
      updatedAt: new Date().toISOString(),
    };
    await setDocument(COLLECTIONS.TRAVEL_TRIPS, trip.id, payload, true);
  } catch (error) {
    console.error('Lỗi khi lưu chuyến đi lên Firebase:', error);
    throw error;
  }
}

/**
 * 2. Xóa chuyến đi khỏi Firebase Firestore
 */
export async function deleteTripFromFirebase(tripId: string): Promise<void> {
  try {
    await deleteDocument(COLLECTIONS.TRAVEL_TRIPS, tripId);
  } catch (error) {
    console.error('Lỗi khi xóa chuyến đi khỏi Firebase:', error);
    throw error;
  }
}

/**
 * 3. Lấy toàn bộ danh sách chuyến đi của người dùng từ Firebase Firestore
 */
export async function getTripsFromFirebase(userId: string): Promise<Trip[]> {
  try {
    const trips = await getDocumentsByField<TripFirebaseDoc>(
      COLLECTIONS.TRAVEL_TRIPS,
      'userId',
      userId
    );
    return trips;
  } catch (error) {
    console.error('Lỗi khi tải danh sách chuyến đi từ Firebase:', error);
    return [];
  }
}

/**
 * 4. Lấy thông tin chuyến đi công khai hoặc chia sẻ theo Trip ID và Token bảo mật
 * Cho phép khách / người nhà xem trực tiếp từ bất kỳ thiết bị nào mà không cần đăng nhập
 */
export async function getPublicSharedTrip(tripId: string, token?: string): Promise<Trip | null> {
  try {
    const docData = await getDocument<TripFirebaseDoc>(COLLECTIONS.TRAVEL_TRIPS, tripId);
    if (!docData) return null;

    const shareConfig = docData.shareConfig;
    // Kiểm tra cấu hình chia sẻ
    if (shareConfig) {
      if (!shareConfig.isPublicLinkEnabled) {
        console.warn('Liên kết chia sẻ chuyến đi này đã bị chủ sở hữu tắt.');
        return null;
      }

      // Nếu có token gửi kèm, kiểm tra token
      if (token && shareConfig.shareToken && shareConfig.shareToken !== token) {
        console.warn('Token bảo mật không khớp.');
        return null;
      }
    }

    return docData;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin chuyến đi chia sẻ từ Firebase:', error);
    return null;
  }
}
