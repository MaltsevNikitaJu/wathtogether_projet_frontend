import React, { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Shield, Bell, EyeOff, Volume2, Video } from 'lucide-react';
import { useGetChatQuery, useGetChatSettingsQuery, useUpdateChatMutation, useUpdateChatSettingsMutation } from '../api/apiSlice';
import { getSocket } from '../utils/socket';

interface ChatSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    chatId: string | number;
    chatName: string;
    isCreator: boolean;
    participantsCount: number;
}

const ChatSettingsDialog: React.FC<ChatSettingsDialogProps> = ({
    open,
    onClose,
    chatId,
    chatName,
    isCreator,
    participantsCount,
}) => {
    const { data: chatData } = useGetChatQuery(chatId, { skip: !open || !chatId });
    const { data: settingsData } = useGetChatSettingsQuery(chatId, { skip: !open || !chatId });
    const [updateChat] = useUpdateChatMutation();
    const [updateChatSettings] = useUpdateChatSettingsMutation();

    const [name, setName] = useState(chatName);
    const [hostOnlyControls, setHostOnlyControls] = useState(false);
    const [allowVideo, setAllowVideo] = useState(true);
    const [notifyMessages, setNotifyMessages] = useState(true);
    const [notifyVideo, setNotifyVideo] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showParticipants, setShowParticipants] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const originalHostOnly = !!chatData?.chat?.host_only_controls;

    useEffect(() => {
        if (chatData?.chat) {
            setName(chatData.chat.name);
            setHostOnlyControls(!!chatData.chat.host_only_controls);
            setAllowVideo(chatData.chat.allow_video !== false);
        }
    }, [chatData]);

    useEffect(() => {
        if (settingsData?.settings) {
            const s = settingsData.settings;
            setNotifyMessages(s.notify_messages !== false);
            setNotifyVideo(s.notify_video !== false);
            setSoundEnabled(s.sound_enabled !== false);
            setShowParticipants(s.show_participants !== false);
        }
    }, [settingsData]);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);

        try {
            await updateChatSettings({
                chatId,
                notify_messages: notifyMessages,
                notify_video: notifyVideo,
                sound_enabled: soundEnabled,
                show_participants: showParticipants,
            }).unwrap();

            if (isCreator) {
                await updateChat({
                    chatId,
                    name,
                    host_only_controls: hostOnlyControls,
                    allow_video: allowVideo,
                }).unwrap();

                if (hostOnlyControls !== originalHostOnly) {
                    try {
                        const socket = getSocket();
                        socket.emit('chat_settings_changed', {
                            chatId: String(chatId),
                            host_only_controls: hostOnlyControls,
                        });
                    } catch {
                    }
                }
            }

            setMessage({ type: 'success', text: 'Настройки сохранены' });
            setTimeout(() => {
                setMessage(null);
                onClose();
            }, 1000);
        } catch (err: unknown) {
            const errorData = err as { data?: { message?: string } };
            setMessage({ type: 'error', text: errorData.data?.message || 'Ошибка при сохранении настроек' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Настройки чата
                    </DialogTitle>
                    <DialogDescription>
                        Управление параметрами чата и уведомлений
                    </DialogDescription>
                </DialogHeader>

                {message && (
                    <div className={`p-3 rounded-lg ${
                        message.type === 'success'
                            ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="general" className="text-xs">
                            Основные
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="text-xs">
                            <Bell className="h-3 w-3 mr-1" />
                            Уведомления
                        </TabsTrigger>
                        <TabsTrigger value="video" className="text-xs">
                            <Video className="h-3 w-3 mr-1" />
                            Видео
                        </TabsTrigger>
                        <TabsTrigger value="privacy" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Приватность
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="chatNameEdit">Название чата</Label>
                            <Input
                                id="chatNameEdit"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Введите название чата"
                                disabled={!isCreator}
                                maxLength={100}
                            />
                            {!isCreator && (
                                <p className="text-xs text-muted-foreground">
                                    Только создатель может изменять название
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Показывать участников</Label>
                                <p className="text-xs text-muted-foreground">
                                    Отображать список участников в панели чата
                                </p>
                            </div>
                            <Switch
                                checked={showParticipants}
                                onCheckedChange={setShowParticipants}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Уведомления о сообщениях</Label>
                                <p className="text-xs text-muted-foreground">
                                    Звук при получении новых текстовых сообщений
                                </p>
                            </div>
                            <Switch
                                checked={notifyMessages}
                                onCheckedChange={setNotifyMessages}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Уведомления о видео</Label>
                                <p className="text-xs text-muted-foreground">
                                    Браузерные уведомления о приглашениях на просмотр
                                </p>
                            </div>
                            <Switch
                                checked={notifyVideo}
                                onCheckedChange={setNotifyVideo}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Звуковые уведомления</Label>
                                <p className="text-xs text-muted-foreground">
                                    <Volume2 className="h-3 w-3 inline mr-1" />
                                    Общий звуковой сигнал при новых сообщениях
                                </p>
                            </div>
                            <Switch
                                checked={soundEnabled}
                                onCheckedChange={setSoundEnabled}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="video" className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="hostOnly">Только ведущий управляет</Label>
                                <p className="text-xs text-muted-foreground">
                                    Только создатель чата может управлять воспроизведением (пауза/перемотка)
                                </p>
                            </div>
                            <Switch
                                id="hostOnly"
                                checked={hostOnlyControls}
                                onCheckedChange={setHostOnlyControls}
                                disabled={!isCreator}
                            />
                        </div>
                        {!isCreator && (
                            <p className="text-xs text-muted-foreground">
                                Настройку может изменить только создатель
                            </p>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="allowVideo">Разрешить совместный просмотр</Label>
                                <p className="text-xs text-muted-foreground">
                                    Участники смогут запускать видео в этом чате
                                </p>
                            </div>
                            <Switch
                                id="allowVideo"
                                checked={allowVideo}
                                onCheckedChange={setAllowVideo}
                                disabled={!isCreator}
                            />
                        </div>

                        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                            <p className="text-sm font-medium flex items-center gap-2">
                                <EyeOff className="h-4 w-4" />
                                Индивидуальные настройки
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Каждый участник может выбрать своё качество видео и скорость воспроизведения.
                                Эти настройки не влияют на других участников.
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="privacy" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Участников в чате</span>
                                <span className="font-medium">{participantsCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span>Ваш статус</span>
                                <span className="font-medium">
                                    {isCreator ? 'Создатель' : 'Участник'}
                                </span>
                            </div>
                        </div>

                        {isCreator && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <p className="text-xs text-amber-600">
                                    💡 Вы создатель этого чата. У вас есть дополнительные права
                                    на управление настройками.
                                </p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                        Отмена
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ChatSettingsDialog;
