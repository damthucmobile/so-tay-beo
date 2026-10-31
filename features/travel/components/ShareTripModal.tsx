// features/travel/components/ShareTripModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Trip, ShareConfig } from '../types';
import { useTravelStore } from '../stores/useTravelStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  Users,
  Shield,
  Eye,
  Edit3,
  Trash2,
  Lock,
  Globe,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface ShareTripModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareTripModal: React.FC<ShareTripModalProps> = ({ trip, isOpen, onClose }) => {
  const { updateShareConfig, inviteMember, removeMember } = useTravelStore();

  const [activeTab, setActiveTab] = useState<'link' | 'members'>('link');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Base URL
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  if (!isOpen) return null;

  const shareConfig = trip.shareConfig || {
    isPublicLinkEnabled: true,
    shareToken: 'trip-share-' + trip.id,
    hideBudget: false,
    hideAlbum: false,
    hideChecklist: false,
  };

  const shareUrl = `${origin}?share=${trip.id}&token=${shareConfig.shareToken}`;

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleLink = (enabled: boolean) => {
    updateShareConfig(trip.id, { isPublicLinkEnabled: enabled });
  };

  const handleToggleOption = (key: keyof ShareConfig, value: boolean) => {
    updateShareConfig(trip.id, { [key]: value });
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    inviteMember(trip.id, inviteEmail.trim(), inviteRole, inviteName.trim() || undefined);
    setInviteEmail('');
    setInviteName('');
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 2500);
  };

  const handleRemoveMember = (memberId: string) => {
    removeMember(trip.id, memberId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Chia Sẻ Chuyến Đi & Album</h2>
              <p className="text-sm text-muted-foreground line-clamp-1">{trip.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border px-6 pt-2 bg-muted/20">
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'link'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="h-4 w-4" />
            Liên Kết Xem Nhanh
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'members'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            Mời Thành Viên Gia Đình ({trip.sharedMembers?.length || 0})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'link' ? (
            <div className="space-y-6">
              {/* Enable Link Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/50 hover:bg-muted/30 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">Chia sẻ bằng liên kết</span>
                    {shareConfig.isPublicLinkEnabled ? (
                      <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs">
                        Đang hoạt động
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Đang tắt</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bất kỳ ai có liên kết bảo mật này đều có thể xem lịch trình và ảnh chuyến đi
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={shareConfig.isPublicLinkEnabled}
                    onChange={(e) => handleToggleLink(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {shareConfig.isPublicLinkEnabled && (
                <>
                  {/* Share Link Input & Copy */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Đường dẫn chia sẻ an toàn
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={shareUrl}
                        className="font-mono text-xs bg-muted/40 text-foreground selection:bg-primary selection:text-white"
                      />
                      <Button
                        onClick={handleCopyLink}
                        variant={copied ? 'default' : 'outline'}
                        className="shrink-0 gap-1.5 transition-all"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 text-emerald-400" />
                            <span>Đã sao chép!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowQr(!showQr)}
                        title="Xem mã QR quét điện thoại"
                        className={showQr ? 'bg-primary/10 border-primary text-primary' : ''}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* QR Code Preview */}
                  {showQr && (
                    <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                      <div className="p-3 bg-white rounded-xl shadow-md border border-neutral-200">
                        {/* Decorative dynamic SVG QR simulation */}
                        <svg className="w-36 h-36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="100" height="100" fill="white" />
                          {/* Corner Squares */}
                          <rect x="10" y="10" width="24" height="24" rx="4" fill="black" />
                          <rect x="14" y="14" width="16" height="16" rx="2" fill="white" />
                          <rect x="18" y="18" width="8" height="8" rx="1" fill="black" />

                          <rect x="66" y="10" width="24" height="24" rx="4" fill="black" />
                          <rect x="70" y="14" width="16" height="16" rx="2" fill="white" />
                          <rect x="74" y="18" width="8" height="8" rx="1" fill="black" />

                          <rect x="10" y="66" width="24" height="24" rx="4" fill="black" />
                          <rect x="14" y="70" width="16" height="16" rx="2" fill="white" />
                          <rect x="18" y="74" width="8" height="8" rx="1" fill="black" />

                          {/* Pattern Blocks */}
                          <rect x="42" y="12" width="6" height="6" fill="black" />
                          <rect x="52" y="12" width="6" height="6" fill="black" />
                          <rect x="42" y="24" width="6" height="12" fill="black" />
                          <rect x="52" y="24" width="6" height="6" fill="black" />
                          <rect x="12" y="42" width="6" height="12" fill="black" />
                          <rect x="24" y="42" width="12" height="6" fill="black" />
                          <rect x="42" y="42" width="16" height="16" rx="2" fill="#3b82f6" />
                          <rect x="66" y="42" width="8" height="8" fill="black" />
                          <rect x="80" y="42" width="8" height="8" fill="black" />
                          <rect x="42" y="66" width="8" height="8" fill="black" />
                          <rect x="54" y="66" width="6" height="18" fill="black" />
                          <rect x="68" y="68" width="12" height="6" fill="black" />
                          <rect x="82" y="76" width="6" height="12" fill="black" />
                          <rect x="68" y="82" width="8" height="6" fill="black" />
                        </svg>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 font-medium">
                        Dùng camera điện thoại hoặc Zalo quét mã để mở ngay
                      </p>
                    </div>
                  )}

                  {/* Privacy & Scope Options */}
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      Quyền riêng tư & Bộ lọc hiển thị
                    </label>

                    <div className="space-y-2">
                      {/* Hide Budget */}
                      <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50 hover:bg-muted/20 cursor-pointer">
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium text-foreground">Ẩn chi phí & ngân sách</div>
                          <p className="text-xs text-muted-foreground">
                            Người xem sẽ không thấy số tiền đã tiêu hay ngân sách chi tiết (thích hợp chia sẻ với bố mẹ, người thân)
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={shareConfig.hideBudget || false}
                          onChange={(e) => handleToggleOption('hideBudget', e.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                      </label>

                      {/* Hide Album */}
                      <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50 hover:bg-muted/20 cursor-pointer">
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium text-foreground">Ẩn Album ảnh kỷ niệm</div>
                          <p className="text-xs text-muted-foreground">
                            Chỉ chia sẻ lịch trình di chuyển, ẩn toàn bộ hình ảnh kỷ niệm đã tải lên
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={shareConfig.hideAlbum || false}
                          onChange={(e) => handleToggleOption('hideAlbum', e.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                      </label>

                      {/* Hide Checklist */}
                      <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50 hover:bg-muted/20 cursor-pointer">
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium text-foreground">Ẩn danh sách hành lý cá nhân</div>
                          <p className="text-xs text-muted-foreground">
                            Không hiển thị danh sách đồ đạc chuẩn bị cá nhân cho người xem
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={shareConfig.hideChecklist || false}
                          onChange={(e) => handleToggleOption('hideChecklist', e.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Tab 2: Members */
            <div className="space-y-6">
              {/* Invite Form */}
              <form onSubmit={handleInvite} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Mời người thân cùng lên kế hoạch
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="Email người thân (vd: me@gmail.com)"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    type="email"
                    className="text-xs"
                  />
                  <Input
                    placeholder="Tên gọi (vd: Mẹ yêu, Anh Hai)"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Vai trò:</span>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'viewer' | 'editor')}
                      className="text-xs rounded-md border border-border bg-background px-2.5 py-1.5 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="viewer">👁️ Chỉ xem (Người thân theo dõi)</option>
                      <option value="editor">✏️ Được chỉnh sửa (Cùng thêm hoạt động, ảnh)</option>
                    </select>
                  </div>
                  <Button type="submit" size="sm" className="gap-1">
                    Gửi lời mời
                  </Button>
                </div>
                {inviteSuccess && (
                  <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Đã thêm người thân vào danh sách chia sẻ!
                  </p>
                )}
              </form>

              {/* Members List */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Thành viên đã được chia sẻ ({trip.sharedMembers?.length || 0})</span>
                  <span className="text-[11px] font-normal text-muted-foreground">Chủ sở hữu: Bạn</span>
                </label>

                {(!trip.sharedMembers || trip.sharedMembers.length === 0) ? (
                  <div className="text-center py-8 border border-dashed border-border rounded-xl text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">Chưa có thành viên nào được mời</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Nhập email phía trên để mời gia đình cùng xem chuyến đi</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card">
                    {trip.sharedMembers.map((member) => (
                      <div key={member.id} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center font-bold text-sm shadow-sm">
                            {(member.name || member.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground flex items-center gap-2">
                              {member.name || member.email.split('@')[0]}
                              {member.role === 'editor' ? (
                                <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-blue-500/15 text-blue-500 border-blue-500/30">
                                  <Edit3 className="h-2.5 w-2.5 mr-0.5 inline" />
                                  Được sửa
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  <Eye className="h-2.5 w-2.5 mr-0.5 inline" />
                                  Chỉ xem
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{member.email}</div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.id)}
                          title="Hủy quyền truy cập"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            <span>Mã hóa bảo mật token liên kết</span>
          </div>
          <Button onClick={onClose} variant="default" className="px-5">
            Hoàn tất
          </Button>
        </div>
      </div>
    </div>
  );
};
