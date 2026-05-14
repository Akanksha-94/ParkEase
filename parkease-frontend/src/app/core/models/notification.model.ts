export interface Notification {
  notificationId: number;
  recipientId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt?: string;
}
