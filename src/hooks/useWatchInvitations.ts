import { useState, useEffect } from 'react';
import { useGetMessagesQuery } from '../api/apiSlice';

interface WatchInvitation {
  id: number;
  content: string;
  created_at: string;
  username: string;
  user_id: number;
  type: string;
  videoUrl?: string;
  isRead: boolean;
}

export const useWatchInvitations = (chatId: string | number, currentUserId: number | undefined) => {
  const [unreadInvitations, setUnreadInvitations] = useState<WatchInvitation[]>([]);

  const { data: messagesData } = useGetMessagesQuery(String(chatId || ''));

  useEffect(() => {
    if (!messagesData?.messages || !currentUserId) {
      setUnreadInvitations([]);
      return;
    }

    const invitations = messagesData.messages
      .filter((msg: any) =>
        msg.type === 'watch_invitation' &&
        msg.user_id !== currentUserId
      )
      .map((msg: any) => ({
        ...msg,
        isRead: false,
      }));

    setUnreadInvitations(invitations);
  }, [messagesData, currentUserId]);

  return {
    unreadCount: unreadInvitations.length,
    invitations: unreadInvitations,
  };
};
