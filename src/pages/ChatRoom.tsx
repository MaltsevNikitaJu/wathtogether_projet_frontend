import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetMessagesQuery, useGetProfileQuery } from '../api/apiSlice';
import { getSocket } from '../utils/socket';
import { getToken } from '../utils/token';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { X, Info, Play, MoreVertical } from 'lucide-react';
import WatchTogetherDialog from '../components/WatchTogetherDialog';

interface Message {
    id: number;
    content: string;
    created_at: string;
    username: string;
    user_id: number;
    type?: 'text' | 'system' | 'watch_invitation';
    videoUrl?: string;
}

interface ChatRoomProps {
    chatId?: string | number;
    chatName?: string;
    onClose?: () => void;
    onToggleInfo?: () => void;
    onBackToList?: () => void;
}

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

    const { data: profileData } = useGetProfileQuery();
    const myUserId = profileData?.user?.id;
    const { data, isLoading } = useGetMessagesQuery(String(id || ''));

    useEffect(() => {
        if (data?.messages) {
            console.log('Messages loaded from API:', {
                count: data.messages.length,
                types: data.messages.map(m => ({ id: m.id, type: m.type, content: m.content.substring(0, 20) })),
                allMessages: data.messages
            });
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
            console.log('New message received:', payload);

            if (payload.type === 'watch_invitation' && payload.user_id !== myUserId) {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(`${payload.username} приглашает посмотреть видео!`, {
                        body: 'Нажмите, чтобы присоединиться к просмотру',
                        icon: '/video-icon.png',
                        tag: `watch-invitation-${payload.id}`,
                    });
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
            console.log('Chat info received:', info);
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

    if (isLoading) return <div className="flex h-full items-center justify-center p-4 text-sm">Загрузка...</div>;

    return (
        <div className="flex h-full flex-col bg-background overflow-hidden">
            <div className="h-14 flex items-center gap-2 border-b px-2 sm:px-4 shrink-0">
                <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 shrink-0 sm:hidden">
                    {onClose ? <X className="h-4 w-4" /> : <span>←</span>}
                </Button>
                <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-sm truncate">{chatName || `Чат #${id}`}</h2>
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
                            onClick={() => setShowWatchDialog(true)}
                        >
                            <Play className="h-4 w-4" />
                            <span className="hidden sm:inline">Смотреть вместе</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onToggleInfo} className="h-8 w-8 shrink-0" title="Информация о чате">
                            <Info className="h-4 w-4" />
                        </Button>
                    </>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </div>
            <ScrollArea className="flex-1 min-h-0 p-2 sm:p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            Нет сообщений. Начните общение!
                        </div>
                    )}
                    {messages.map((msg) => {
                        const isUrl = /^(https?:\/\/)|(www\.)/.test(msg.content);
                        const isMyMessage = msg.user_id === myUserId;
                        const isSystemMessage = msg.type === 'system';
                        const isWatchInvitation = msg.type === 'watch_invitation';

                        if (msg.type === 'watch_invitation') {
                            console.log('Rendering watch invitation:', msg);
                        }

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
                                                if (msg.videoUrl) {
                                                    navigate(`/watch?chatId=${id}&url=${encodeURIComponent(msg.videoUrl)}`);
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
                                        <AvatarFallback className="text-xs">{(msg.username?.[0] || '?').toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 sm:px-4 shadow-sm ${isMyMessage ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                                    {!isMyMessage && <div className="mb-1 text-xs font-medium text-muted-foreground">{msg.username}</div>}
                                    {isUrl ? (
                                        <div>
                                            <div className={`text-xs mb-2 break-all ${isMyMessage ? 'text-primary-foreground/70' : 'text-blue-500'}`}>{msg.content}</div>
                                            <Button size="sm" variant={isMyMessage ? 'secondary' : 'outline'} onClick={() => navigate(`/watch?chatId=${id}&url=${encodeURIComponent(msg.content)}`)}>
                                                ▶ Смотреть вместе
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-sm">{msg.content}</div>
                                    )}
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
