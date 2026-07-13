import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useGetVideoQuotaQuery,
    useGetVideosQuery,
    useGetProfileQuery,
    useGetChatsQuery,
    useInitVideoUploadMutation,
    useCompleteVideoUploadMutation,
    useDeleteVideoMutation,
    useLazyGetVideoPlayUrlQuery,
} from '../api/apiSlice';
import { getSocket } from '../utils/socket';
import { useConfirm } from '../lib/confirm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Upload, Trash2, Play, Film, Crown, Loader2, Users2 } from 'lucide-react';

interface Video {
    id: number;
    title: string;
    size: number;
    content_type: string;
    status: string;
    created_at: string;
}

interface Chat {
    id: number;
    name: string;
    type: string;
}

const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 Б';
    const units = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const uploadWithProgress = (
    url: string,
    file: File,
    contentType: string,
    onProgress: (pct: number) => void,
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url, true);
        xhr.setRequestHeader('Content-Type', contentType);
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`HTTP ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Ошибка сети'));
        xhr.send(file);
    });
};

const MyVideos: React.FC = () => {
    const navigate = useNavigate();
    const { data: quotaData } = useGetVideoQuotaQuery();
    const { data: videosData } = useGetVideosQuery();
    const { data: profileData } = useGetProfileQuery();
    const { data: chatsData } = useGetChatsQuery();
    const [initUpload] = useInitVideoUploadMutation();
    const [completeUpload] = useCompleteVideoUploadMutation();
    const [deleteVideo] = useDeleteVideoMutation();
    const [getPlayUrl] = useLazyGetVideoPlayUrlQuery();
    const { confirm } = useConfirm();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState<{ name: string; pct: number } | null>(null);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadTitle, setUploadTitle] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState('');
    const [watchPickerFor, setWatchPickerFor] = useState<Video | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);

    const isPremium = !!quotaData?.is_premium;
    const videos: Video[] = videosData?.videos || [];
    const chats: Chat[] = chatsData?.chats || [];
    const usedPct = quotaData ? Math.min(100, (quotaData.used / quotaData.limit) * 100) : 0;

    const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setSelectedFile(file);
        setUploadTitle(file.name.replace(/\.[^.]+$/, ''));
    };

    const handleUpload = async () => {
        const file = selectedFile;
        if (!file) return;
        if (!isPremium) {
            setMessage({ type: 'error', text: 'Загрузка видео доступна только с Premium' });
            return;
        }

        const contentType = file.type || 'video/mp4';
        const title = uploadTitle.trim() || file.name;
        setUploading({ name: file.name, pct: 0 });
        setMessage(null);

        try {
            const init = await initUpload({
                filename: file.name,
                contentType,
                size: file.size,
                title,
            }).unwrap();

            await uploadWithProgress(init.uploadUrl, file, contentType, (pct) => {
                setUploading({ name: file.name, pct });
            });

            await completeUpload(init.videoId).unwrap();
            setMessage({ type: 'success', text: `«${title}» загружено` });
            setShowUploadDialog(false);
            setSelectedFile(null);
            setUploadTitle('');
        } catch (err: unknown) {
            const errorData = err as { data?: { message?: string } };
            setMessage({ type: 'error', text: errorData.data?.message || 'Ошибка загрузки' });
        } finally {
            setUploading(null);
        }
    };

    const handlePreview = async (video: Video) => {
        try {
            setBusyId(video.id);
            const res = await getPlayUrl(video.id).unwrap();
            setPreviewTitle(video.title);
            setPreviewUrl(res.url);
        } catch {
            setMessage({ type: 'error', text: 'Не удалось получить ссылку на видео' });
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (video: Video) => {
        const ok = await confirm({
            title: 'Удалить видео?',
            description: `Удалить видео «${video.title}»? Место в хранилище освободится.`,
            confirmText: 'Удалить',
            variant: 'danger',
        });
        if (!ok) return;
        try {
            setBusyId(video.id);
            await deleteVideo(video.id).unwrap();
            setMessage({ type: 'success', text: 'Видео удалено' });
        } catch {
            setMessage({ type: 'error', text: 'Не удалось удалить' });
        } finally {
            setBusyId(null);
        }
    };

    const handleWatchTogether = async (video: Video, chat: Chat) => {
        try {
            setBusyId(video.id);
            const res = await getPlayUrl(video.id).unwrap();
            const socket = getSocket();
            socket.emit('send_watch_invitation', {
                chatId: String(chat.id),
                videoUrl: res.url,
                username: profileData?.user?.username || 'Пользователь',
            });
            setWatchPickerFor(null);
            navigate(`/watch?chatId=${chat.id}&url=${encodeURIComponent(res.url)}`);
        } catch {
            setMessage({ type: 'error', text: 'Не удалось начать просмотр' });
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 min-w-0">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/chats')} className="shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-xl sm:text-2xl font-bold truncate">Мои видео</h1>
                    </div>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-lg ${
                        message.type === 'success'
                            ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                {!isPremium && (
                    <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-start gap-3">
                            <Crown className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-amber-600 dark:text-amber-400">Нужен Premium</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Загрузка собственных видео доступна только подписчикам Premium.
                                </p>
                                <Button size="sm" className="mt-3" onClick={() => navigate('/subscription')}>
                                    Оформить Premium
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {isPremium && (
                    <div className="mb-6 p-4 bg-card rounded-lg border">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-medium">Хранилище</span>
                            <span className="text-muted-foreground">
                                {formatBytes(quotaData?.used || 0)} из {formatBytes(quotaData?.limit || 0)}
                            </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${usedPct > 90 ? 'bg-destructive' : 'bg-primary'}`}
                                style={{ width: `${usedPct}%` }}
                            />
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleFilePicked}
                            className="hidden"
                        />
                        <Button
                            className="mt-4 w-full"
                            onClick={() => setShowUploadDialog(true)}
                            disabled={!!uploading}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? 'Загрузка...' : 'Загрузить видео'}
                        </Button>

                        {uploading && (
                            <div className="mt-3">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                    <span className="truncate">{uploading.name}</span>
                                    <span>{uploading.pct}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all"
                                        style={{ width: `${uploading.pct}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-3">
                    {videos.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Film className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Здесь появятся ваши загруженные видео</p>
                        </div>
                    ) : (
                        videos.map((video) => (
                            <div key={video.id} className="p-4 bg-card rounded-lg border flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Film className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{video.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {video.status === 'ready'
                                            ? `${formatBytes(video.size)} · ${new Date(video.created_at).toLocaleDateString('ru-RU')}`
                                            : video.status === 'uploading'
                                            ? 'Загружается...'
                                            : 'Ошибка загрузки'}
                                    </p>
                                </div>
                                {busyId === video.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                                ) : (
                                    <div className="flex items-center gap-1 shrink-0">
                                        {video.status === 'ready' && (
                                            <>
                                                <Button variant="ghost" size="icon" title="Превью" onClick={() => handlePreview(video)}>
                                                    <Play className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Смотреть вместе" onClick={() => setWatchPickerFor(video)}>
                                                    <Users2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                        <Button variant="ghost" size="icon" title="Удалить" className="text-destructive" onClick={() => handleDelete(video)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Dialog open={!!previewUrl} onOpenChange={(o) => !o && setPreviewUrl(null)}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="truncate">{previewTitle}</DialogTitle>
                    </DialogHeader>
                    {previewUrl && (
                        <video src={previewUrl} controls autoPlay className="w-full rounded-lg max-h-[70vh]" />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!watchPickerFor} onOpenChange={(o) => !o && setWatchPickerFor(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Смотреть вместе</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Выберите чат — участникам придёт приглашение на просмотр видео «{watchPickerFor?.title}».
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
                            
            <Dialog open={showUploadDialog} onOpenChange={(o) => { if (!uploading) setShowUploadDialog(o); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Загрузка видео</DialogTitle>
                        <DialogDescription>Выберите файл и укажите название</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Файл</Label>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start text-left font-normal truncate"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={!!uploading}
                            >
                                <Upload className="h-4 w-4 mr-2 shrink-0" />
                                <span className="truncate">{selectedFile ? selectedFile.name : 'Выбрать файл'}</span>
                            </Button>
                            {selectedFile && (
                                <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="uploadTitle">Название</Label>
                            <Input
                                id="uploadTitle"
                                value={uploadTitle}
                                onChange={(e) => setUploadTitle(e.target.value)}
                                placeholder="Как назовём видео?"
                                maxLength={255}
                                disabled={!!uploading}
                            />
                        </div>
                        {uploading && (
                            <div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                    <span className="truncate">{uploading.name}</span>
                                    <span>{uploading.pct}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full bg-primary transition-all" style={{ width: `${uploading.pct}%` }} />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => { setShowUploadDialog(false); setSelectedFile(null); setUploadTitle(''); }}
                            disabled={!!uploading}
                        >
                            Отмена
                        </Button>
                        <Button onClick={handleUpload} disabled={!selectedFile || !!uploading}>
                            {uploading ? 'Загрузка...' : 'Загрузить'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MyVideos;
