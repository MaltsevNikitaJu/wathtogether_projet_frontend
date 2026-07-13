import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetCatalogQuery, useGetChatsQuery, useGetProfileQuery } from '../api/apiSlice';
import { getSocket } from '../utils/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Play, Film, Users2, Search } from 'lucide-react';

interface CatalogVideo {
    id: number;
    title: string;
    description?: string;
    video_url: string;
    poster_url?: string;
}

interface Chat {
    id: number;
    name: string;
    type: string;
}

const Catalog: React.FC = () => {
    const navigate = useNavigate();
    const { data: catalogData } = useGetCatalogQuery();
    const { data: chatsData } = useGetChatsQuery();
    const { data: profileData } = useGetProfileQuery();

    const videos: CatalogVideo[] = catalogData?.videos || [];
    const chats: Chat[] = chatsData?.chats || [];
    const [watchPickerFor, setWatchPickerFor] = useState<CatalogVideo | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = videos.filter((v) =>
        v.title.toLowerCase().includes(searchQuery.trim().toLowerCase()),
    );

    const handleWatchTogether = (video: CatalogVideo, chat: Chat) => {
        const socket = getSocket();
        socket.emit('send_watch_invitation', {
            chatId: String(chat.id),
            videoUrl: video.video_url,
            username: profileData?.user?.username || 'Пользователь',
        });
        setWatchPickerFor(null);
        navigate(`/watch?chatId=${chat.id}&url=${encodeURIComponent(video.video_url)}`);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 overflow-y-auto">
                <div className="flex items-center gap-3 mb-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/chats')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-xl sm:text-2xl font-bold">Каталог видео</h1>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                    Общедоступные видео для совместного просмотра. Выберите чат — участникам придёт приглашение.
                </p>

                <div className="relative mb-6 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                        placeholder="Поиск по названию..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    {videos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Каталог пуст</p>
                    ) : filtered.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Ничего не найдено</p>
                    ) : (
                        filtered.map((video) => (
                            <div key={video.id} className="p-4 bg-card rounded-lg border flex flex-col">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Film className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{video.title}</p>
                                        {video.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">{video.description}</p>
                                        )}
                                    </div>
                                </div>
                                <Button className="mt-auto" onClick={() => setWatchPickerFor(video)}>
                                    <Users2 className="h-4 w-4 mr-2" />
                                    Смотреть вместе
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Dialog open={!!watchPickerFor} onOpenChange={(o) => !o && setWatchPickerFor(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Смотреть вместе</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Выберите чат для просмотра «{watchPickerFor?.title}».
                    </p>
                    <ScrollArea className="max-h-64 mt-2">
                        <div className="space-y-1 pr-2">
                            {chats.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">У вас нет чатов</p>
                            ) : (
                                chats.map((chat) => (
                                    <button
                                        key={chat.id}
                                        onClick={() => watchPickerFor && handleWatchTogether(watchPickerFor, chat)}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                                    >
                                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-sm font-medium">
                                            {(chat.name?.[0] || '?').toUpperCase()}
                                        </div>
                                        <span className="font-medium truncate flex-1">{chat.name}</span>
                                        <Play className="h-4 w-4 text-muted-foreground shrink-0" />
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Catalog;
