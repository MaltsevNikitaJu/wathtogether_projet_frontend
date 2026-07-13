import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Play, CheckCircle2 } from 'lucide-react';
import { getSocket } from '../utils/socket';
import { useGetProfileQuery } from '../api/apiSlice';

interface WatchTogetherDialogProps {
    open: boolean;
    onClose: () => void;
    chatId: string | number;
}

const WatchTogetherDialog: React.FC<WatchTogetherDialogProps> = ({ open, onClose, chatId }) => {
    const navigate = useNavigate();
    const [videoUrl, setVideoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [invitationStatus, setInvitationStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const { data: profileData } = useGetProfileQuery();

    useEffect(() => {
        if (!open) {
            setInvitationStatus('idle');
            setVideoUrl('');
        }
    }, [open]);

    useEffect(() => {
        const socket = getSocket();

        const handleInvitationSent = () => {
            setInvitationStatus('sent');

            setTimeout(() => {
                navigate(`/watch?chatId=${chatId}&url=${encodeURIComponent(videoUrl)}`);
                onClose();
            }, 1500);
        };

        const handleSocketError = () => {
            setInvitationStatus('error');
            setIsLoading(false);
        };

        socket.on('invitation_sent', handleInvitationSent);
        socket.on('error', handleSocketError);

        return () => {
            socket.off('invitation_sent', handleInvitationSent);
            socket.off('error', handleSocketError);
        };
    }, [chatId, videoUrl, navigate, onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!videoUrl.trim()) return;

        setIsLoading(true);
        setInvitationStatus('sending');

        try {
            const socket = getSocket();
            const user = profileData?.user;

            socket.emit('send_watch_invitation', {
                chatId: String(chatId),
                videoUrl: videoUrl,
                username: user?.username || 'Пользователь',
            });

        } catch {
            setInvitationStatus('error');
            setIsLoading(false);
            setTimeout(() => {
                navigate(`/watch?chatId=${chatId}&url=${encodeURIComponent(videoUrl)}`);
                onClose();
            }, 1000);
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setVideoUrl(text);
            }
        } catch {
        }
    };

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const isFormValid = videoUrl.trim() !== '' && isValidUrl(videoUrl);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Play className="h-5 w-5" />
                        Смотреть вместе
                    </DialogTitle>
                    <DialogDescription>
                        Введите ссылку на видео для совместного просмотра с участниками чата
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="videoUrl">Ссылка на видео</Label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Input
                                    id="videoUrl"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://example.com/video.mp4"
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handlePaste}
                                    title="Вставить из буфера"
                                    className="shrink-0"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Поддерживаются прямые ссылки на видеофайлы (.mp4, .webm, .ogg)
                            </p>
                        </div>

                        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                            <p className="text-sm font-medium">💡 Как это работает:</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• Все участники видят одно и то же видео</li>
                                <li>• Пауза/пуск/перемотка синхронизируются для всех</li>
                                <li>• Можно общаться в чате во время просмотра</li>
                            </ul>

                            {invitationStatus === 'sent' && (
                                <div className="mt-3 pt-3 border-t border-border">
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <span className="text-green-600 font-medium">Приглашение отправлено!</span>
                                    </div>
                                </div>
                            )}

                            {invitationStatus === 'error' && (
                                <div className="mt-3 pt-3 border-t border-border">
                                    <p className="text-xs text-red-500">
                                        Ошибка отправки приглашения. Начинаем просмотр solo...
                                    </p>
                                </div>
                            )}

                            {invitationStatus === 'sending' && (
                                <div className="mt-3 pt-3 border-t border-border">
                                    <p className="text-xs text-muted-foreground">
                                        Отправка приглашения...
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Отмена
                        </Button>
                        <Button type="submit" disabled={!isFormValid || isLoading}>
                            {isLoading ? 'Загрузка...' : 'Начать просмотр'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default WatchTogetherDialog;
