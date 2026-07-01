import React, { useState } from 'react';
import { useGetChatsQuery, useCreateChatMutation } from '../api/apiSlice';
import { removeToken } from '../utils/token';
import { disconnectSocket } from '../utils/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ChatRoom from './ChatRoom';

const ChatList: React.FC = () => {
    const { data, isLoading } = useGetChatsQuery();
    const [createChat] = useCreateChatMutation();
    const [newChatName, setNewChatName] = useState('');
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

    const handleLogout = () => {
        removeToken();
        disconnectSocket();
        window.location.href = '/login';
    };

    const handleCreateChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChatName.trim()) return;
        try {
            await createChat({ name: newChatName, type: 'private' }).unwrap();
            setNewChatName('');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
            <div className={`border-r flex flex-col bg-muted/30 transition-all duration-300 shrink-0 ${activeChatId ? 'w-80' : 'w-96'}`}>
                <div className="h-14 flex items-center justify-between px-4 shrink-0">
                    <h1 className="font-semibold truncate">Сообщения</h1>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs">
                        Выйти
                    </Button>
                </div>
                <Separator />
                <form onSubmit={handleCreateChat} className="p-3 flex gap-2 shrink-0">
                    <Input placeholder="Новый чат..." value={newChatName} onChange={(e) => setNewChatName(e.target.value)} className="flex-1 h-9 text-sm" />
                    <Button type="submit" size="icon" className="h-9 w-9 shrink-0">+</Button>
                </form>
                <ScrollArea className="flex-1 min-h-0 px-2">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">Загрузка...</div>
                    ) : data?.chats && data.chats.length > 0 ? (
                        <div className="space-y-1 pb-4">
                            {data.chats.map((chat: { id: string; name: string; type: string }) => (
                                <div
                                    key={chat.id}
                                    onClick={() => setActiveChatId(chat.id)}
                                    className={`flex items-center gap-3 rounded-lg p-2.5 cursor-pointer transition-colors ${
                                        activeChatId === chat.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                                    }`}
                                >
                                    <Avatar className="h-10 w-10 shrink-0">
                                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                            {chat.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="font-medium text-sm truncate">{chat.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {chat.type === 'video_room' ? '🎥 Видео' : '💬 Чат'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">Нет чатов.</div>
                    )}
                </ScrollArea>
            </div>
            {activeChatId ? (
                <div className="flex-1 flex flex-col border-l min-h-0">
                    <ChatRoom chatId={activeChatId} onClose={() => setActiveChatId(null)} />
                </div>
            ) : (
                <div className="hidden md:flex flex-1 items-center justify-center bg-background">
                    <div className="text-center text-muted-foreground">
                        <div className="text-6xl mb-4">💬</div>
                        <h2 className="text-2xl font-semibold mb-2">Выберите чат</h2>
                        <p className="text-sm">Выберите чат слева, чтобы начать общение</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatList;
