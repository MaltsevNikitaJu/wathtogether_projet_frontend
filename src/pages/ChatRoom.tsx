import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetMessagesQuery, useGetMeQuery } from '../api/apiSlice';
import { getSocket } from '../utils/socket';
import { getToken } from '../utils/token';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { X } from 'lucide-react';

interface Message {
    id: number;
    content: string;
    created_at: string;
    username: string;
    userId: number;
}

interface ChatRoomProps {
    chatId?: string;
    onClose?: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ chatId: propChatId, onClose }) => {
    const { id: routeId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const id = propChatId || routeId;

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data: meData } = useGetMeQuery();
    const myUserId = meData?.user?.id;
    const { data, isLoading } = useGetMessagesQuery(id || '');

    useEffect(() => {
        if (data?.messages) setMessages(data.messages);
    }, [data]);

    useEffect(() => {
        if (!id) return;
        if (!getToken()) {
            navigate('/login');
            return;
        }

        const socket = getSocket();
        socket.emit('join_chat', id);

        const handleNewMessage = (payload: Message) => {
            setMessages((prev) => [...prev, payload]);
        };

        socket.on('receive_message', handleNewMessage);
        return () => {
            socket.off('receive_message', handleNewMessage);
            socket.emit('leave_chat', id);
        };
    }, [id, navigate]);

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
        if (onClose) onClose();
        else navigate('/chats');
    };

    if (isLoading) return <div className="flex h-full items-center justify-center p-4">Загрузка...</div>;

    return (
        <div className="flex h-full flex-col bg-background">
            <div className="h-14 flex items-center gap-4 border-b px-4 shrink-0">
                <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 shrink-0">
                    {onClose ? <X className="h-4 w-4" /> : <span>←</span>}
                </Button>
                <div className="flex-1 overflow-hidden">
                    <h2 className="font-semibold text-sm truncate">Комната: {id}</h2>
                </div>
            </div>
            <ScrollArea className="flex-1 min-h-0 p-4">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            Нет сообщений. Начните общение!
                        </div>
                    )}
                    {messages.map((msg) => {
                        const isUrl = /^(https?:\/\/)|(www\.)/.test(msg.content);
                        const isMyMessage = msg.userId === myUserId;

                        return (
                            <div key={msg.id} className={`flex items-end gap-2 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                                {!isMyMessage && (
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarFallback className="text-xs">{msg.username.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${isMyMessage ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
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
            <div className="flex items-center gap-2 border-t p-3 shrink-0">
                <form onSubmit={handleSend} className="flex w-full gap-2">
                    <Input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Введите сообщение..." className="flex-1 h-9 text-sm" autoFocus />
                    <Button type="submit" disabled={!newMessage.trim()} size="sm">Отправить</Button>
                </form>
            </div>
        </div>
    );
};

export default ChatRoom;
