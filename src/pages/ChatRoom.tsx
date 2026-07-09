import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetMessagesQuery, useGetProfileQuery, useGetChatQuery, useGetChatSettingsQuery, useJoinChatMutation } from '../api/apiSlice';
import { getSocket } from '../utils/socket';
import { getToken } from '../utils/token';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { X, Play, MoreVertical, Share2, Check } from 'lucide-react';
import WatchTogetherDialog from '../components/WatchTogetherDialog';
import { useConfirm } from '../lib/confirm';

interface Message {
    id: number;
    content: string;
    created_at: string;
    username: string;
    user_id: number;
    type?: 'text' | 'system' | 'watch_invitation';
    video_url?: string;
    avatar_url?: string;
}

interface ChatRoomProps {
    chatId?: string | number;
    chatName?: string;
    onClose?: () => void;
    onToggleInfo?: () => void;
    onBackToList?: () => void;
}

let audioCtx: AudioContext | null = null;
const playNotificationSound = () => {
    try {
        if (!audioCtx) {
            const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!Ctx) return;
            audioCtx = new Ctx();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
    } catch {
    }
};

const ChatRoom: React.FC<ChatRoomProps> = ({ chatId: propChatId, chatName, onClose, onToggleInfo, onBackToList }) => {
    const { id: routeId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const id = propChatId || routeId;

    const getPeopleWord = (count: number): string => {
        const lastTwo = count % 100;
        const lastOne = count % 10;

        if (lastTwo >= 11 && lastTwo <= 19) {
            return 'человек';
        }

        if (lastOne === 1) {
            return 'человек';
        }
        if (lastOne >= 2 && lastOne <= 4) {
            return 'человека';
        }
        return 'человек';
    };

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showWatchDialog, setShowWatchDialog] = useState(false);
    const [onlineInfo, setOnlineInfo] = useState<{ onlineCount: number; totalParticipants: number } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);

    const staticUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');

    const handleShare = async () => {
        if (!id) return;
        const url = `${window.location.origin}/chats/${id}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {}
    };

    const { data: profileData } = useGetProfileQuery();
    const myUserId = profileData?.user?.id;
    const { data, isLoading, refetch: refetchMessages } = useGetMessagesQuery(String(id || ''));
    const { data: chatData, error: chatError } = useGetChatQuery(String(id || ''), { skip: !id });
    const { data: settingsData } = useGetChatSettingsQuery(String(id || ''), { skip: !id });
    const [joinChat, { isLoading: isJoining }] = useJoinChatMutation();
    const { alert } = useConfirm();
    const allowVideo = chatData?.chat?.allow_video !== false;
    const settings = settingsData?.settings;
    const isForbidden = (chatError as { status?: number } | undefined)?.status === 403;
    const settingsRef = useRef(settings);
    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    useEffect(() => {
        if (data?.messages) {
            setMessages(data.messages);
        }
    }, [data, myUserId]);

    useEffect(() => {
        if (!id) return;
        if (!getToken()) {
            navigate('/login');
            return;
        }

        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const socket = getSocket();
        socket.emit('join_chat', id);

        const handleNewMessage = (payload: Message) => {
            const isMine = payload.user_id === myUserId;
            const s = settingsRef.current;

            if (payload.type === 'watch_invitation' && !isMine) {
                if (s?.notify_video !== false && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification(`${payload.username} приглашает посмотреть видео!`, {
                        body: 'Нажмите, чтобы присоединиться к просмотру',
                        tag: `watch-invitation-${payload.id}`,
                    });
                }
            }

            if (!isMine && s?.sound_enabled !== false) {
                const shouldSound = payload.type === 'text'
                    ? s?.notify_messages !== false
                    : s?.notify_video !== false;
                if (shouldSound && payload.type !== 'system') {
                    playNotificationSound();
                }
            }

            setMessages((prev) => {
                const exists = prev.some(msg => msg.id === payload.id);
                if (exists) {
                    return prev.map(msg =>
                        msg.id === payload.id ? payload : msg
                    );
                }
                return [...prev, payload];
            });
        };

        const handleChatInfo = (info: { onlineCount: number; totalParticipants: number }) => {
            setOnlineInfo(info);
        };

        socket.on('receive_message', handleNewMessage);
        socket.on('chat_info', handleChatInfo);
        return () => {
            socket.off('receive_message', handleNewMessage);
            socket.off('chat_info', handleChatInfo);
            socket.emit('leave_chat', id);
        };
    }, [id, navigate, myUserId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !id) return;
        const socket = getSocket();
        socket.emit('send_message', { chatId: id, content: newMessage });
        setNewMessage('');
    };

    const handleBack = () => {
        if (onBackToList) onBackToList();
        else if (onClose) onClose();
        else navigate('/chats');
    };

    const handleJoin = async () => {
        if (!id) return;
        try {
            await joinChat(id).unwrap();
            refetchMessages();
            try { getSocket().emit('join_chat', id); } catch {}
        } catch (err: unknown) {
            const errorData = err as { data?: { message?: string } };
            await alert({ title: 'Не удалось вступить', description: errorData.data?.message || 'Ошибка', variant: 'danger' });
        }
    };

    if (isForbidden) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-background p-6 text-center gap-5">
                <div className="max-w-sm space-y-2">
                    <h2 className="text-lg font-semibold">У вас нет доступа к этому чату</h2>
                    <p className="text-sm text-muted-foreground">
                        Этот чат открыт по ссылке. Вступите, чтобы участвовать в общении и совместном просмотре.
                    </p>
                </div>
                <Button onClick={handleJoin} disabled={isJoining}>
                    {isJoining ? 'Вступление...' : 'Вступить в чат'}
                </Button>
                <Button onClick={handleBack} variant="ghost" size="sm">← Назад к чатам</Button>
            </div>
        );
    }

    if (isLoading) return <div className="flex h-full items-center justify-center p-4 text-sm">Загрузка...</div>;

    return (
        <div className="flex h-full flex-col bg-background overflow-hidden">
            <div className="h-14 flex items-center gap-2 border-b px-2 sm:px-4 shrink-0">
                <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 shrink-0 sm:hidden">
                    {onClose ? <X className="h-4 w-4" /> : <span>←</span>}
                </Button>
                <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-sm truncate">{chatName || chatData?.chat?.name || 'Чат'}</h2>
                    {onlineInfo && (
                        <p className="text-xs text-muted-foreground">
                            {onlineInfo.onlineCount > 0
                                ? `${onlineInfo.onlineCount} ${getPeopleWord(onlineInfo.onlineCount)} онлайн`
                                : 'Никого нет в сети'
                            }
                        </p>
                    )}
                </div>
                {onToggleInfo && (
                    <>
                        <Button
                            variant="default"
                            size="sm"
                            className="h-8 gap-1 sm:gap-2 shrink-0"
                            disabled={!allowVideo}
                            title={!allowVideo ? 'Совместный просмотр отключён создателем чата' : undefined}
                            onClick={() => setShowWatchDialog(true)}
                        >
                            <Play className="h-4 w-4" />
                            <span className="hidden sm:inline">Смотреть вместе</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleShare} className="h-8 w-8 shrink-0" title="Поделиться ссылкой на чат">
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onToggleInfo} className="h-8 w-8 shrink-0" title="Информация о чате">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </>
                )}
            </div>
            <ScrollArea className="flex-1 min-h-0 p-2 sm:p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            Нет сообщений. Начните общение!
                        </div>
                    )}
                    {messages.map((msg) => {
                        const isMyMessage = msg.user_id === myUserId;
                        const isSystemMessage = msg.type === 'system';
                        const isWatchInvitation = msg.type === 'watch_invitation';

                        if (isSystemMessage) {
                            return (
                                <div key={msg.id} className="flex justify-center py-1">
                                    <span className="text-xs text-muted-foreground italic bg-muted/50 px-3 py-1 rounded-full">
                                        {msg.content}
                                    </span>
                                </div>
                            );
                        }

                        if (isWatchInvitation) {
                            return (
                                <div key={msg.id} className="flex justify-center py-2">
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-4 shadow-lg max-w-[80%] sm:max-w-[70%]">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="bg-white/20 rounded-full p-2">
                                                <Play className="h-4 w-4" fill="currentColor" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Приглашение на просмотр</p>
                                                <p className="text-xs opacity-90">{msg.username}</p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="w-full bg-white text-blue-600 hover:bg-white/90"
                                            onClick={() => {
                                                if (msg.video_url) {
                                                    navigate(`/watch?chatId=${id}&url=${encodeURIComponent(msg.video_url)}`);
                                                }
                                            }}
                                        >
                                            <Play className="h-3 w-3 mr-2 fill-current" />
                                            Присоединиться
                                        </Button>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={msg.id} className={`flex items-end gap-2 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                                {!isMyMessage && (
                                    <Avatar className="h-8 w-8 shrink-0">
                                        {msg.avatar_url ? (
                                            <img src={`${staticUrl}${msg.avatar_url}`} alt={msg.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <AvatarFallback className="text-xs">{(msg.username?.[0] || '?').toUpperCase()}</AvatarFallback>
                                        )}
                                    </Avatar>
                                )}
                                <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 sm:px-4 shadow-sm ${isMyMessage ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                                    {!isMyMessage && <div className="mb-1 text-xs font-medium text-muted-foreground">{msg.username}</div>}
                                    <div className="text-sm break-all">{msg.content}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div ref={messagesEndRef} />
            </ScrollArea>
            <div className="flex items-center gap-2 border-t p-2 sm:p-3 shrink-0">
                <form onSubmit={handleSend} className="flex w-full gap-2">
                    <Input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Введите сообщение..." className="flex-1 h-9 text-sm" autoFocus />
                    <Button type="submit" disabled={!newMessage.trim()} size="sm" className="shrink-0">Отправить</Button>
                </form>
            </div>

            <WatchTogetherDialog
                open={showWatchDialog}
                onClose={() => setShowWatchDialog(false)}
                chatId={id || ''}
            />
        </div>
    );
};

export default ChatRoom;
