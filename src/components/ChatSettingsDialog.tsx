import React, { useState } from 'react';
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
    chatName,
    isCreator,
    participantsCount,
}) => {
    const [chatNameEdit, setChatNameEdit] = useState(chatName);
    const [notifyMessages, setNotifyMessages] = useState(true);
    const [notifyVideo, setNotifyVideo] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [hostOnlyControls, setHostOnlyControls] = useState(false);
    const [showParticipants, setShowParticipants] = useState(true);

    const handleSave = () => {
        onClose();
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
                                value={chatNameEdit}
                                onChange={(e) => setChatNameEdit(e.target.value)}
                                placeholder="Введите название чата"
                                disabled={!isCreator}
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
                                    Отображать список участников чата
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
                                    Получать уведомления о новых сообщениях
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
                                    Когда кто-то запускает/останавливает видео
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
                                    Звук при получении сообщений
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
                                    Только создатель чата может управлять воспроизведением
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
                                Настройку может изменить только создатель чата
                            </p>
                        )}

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
                    <Button type="button" variant="outline" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button type="button" onClick={handleSave}>
                        Сохранить
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ChatSettingsDialog;
