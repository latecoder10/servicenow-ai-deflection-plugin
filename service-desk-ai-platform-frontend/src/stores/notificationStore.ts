import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationState {
  notifications: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    {
      id: '1',
      title: 'ServiceNow Sync Completed',
      message: 'Incremental sync job #job-1092 finished with 142 records created/updated.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      read: false,
      type: 'success',
    },
    {
      id: '2',
      title: 'Pinecone Vector Index Active',
      message: 'Pinecone index "servicedesk-kb" is healthy with 12,450 vectors.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      read: false,
      type: 'info',
    },
    {
      id: '3',
      title: 'High Incident Deflection',
      message: 'AI Deflection engine reached 78.4% success rate in the last 24 hours.',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      read: false,
      type: 'info',
    },
  ],
  addNotification: (item) =>
    set((state) => ({
      notifications: [
        {
          ...item,
          id: String(Date.now()),
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...state.notifications,
      ],
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  clearAll: () => set({ notifications: [] }),
}));
