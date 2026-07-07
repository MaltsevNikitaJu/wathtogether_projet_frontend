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
import { Info, Users, Video } from 'lucide-react';

interface CreateChatDialogProps {
    open: boolean;
    onClose: () => void;
    onCreateChat: (data: { name: string; type: string; allowVideo: boolean }) => void;
    isCreating: boolean;
    isPremium?: boolean;
}

const CreateChatDialog: React.FC<CreateChatDialogProps> = ({
    open,
    onClose,
    onCreateChat,
    isCreating,
    isPremium = false,
}) => {
    const [chatName, setChatName] = useState('');
    const [chatType, setChatType] = useState<'private' | 'group'>('private');
    const [allowVideo, setAllowVideo] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatName.trim()) return;

        onCreateChat({
            name: chatName,
            type: chatType,
            allowVideo,
        });

        setChatName('');
        setChatType('private');
        setAllowVideo(false);
    };

    const canEnableVideo = isPremium || chatType === 'private';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Создать новый чат</DialogTitle>
                    <DialogDescription>
                        Создайте чат для общения или совместного просмотра видео
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <Tabs defaultValue="info" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="info" className="text-xs sm:text-sm">
                                <Info className="h-4 w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Инфо</span>
                            </TabsTrigger>
                            <TabsTrigger value="participants" className="text-xs sm:text-sm">
                                <Users className="h-4 w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Участники</span>
                            </TabsTrigger>
                            <TabsTrigger value="video" className="text-xs sm:text-sm">
                                <Video className="h-4 w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Видео</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="chatName">Название чата *</Label>
                                <Input
                                    id="chatName"
                                    value={chatName}
                                    onChange={(e) => setChatName(e.target.value)}
                                    placeholder="Введите название чата"
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Тип чата</Label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Button
                                        type="button"
                                        variant={chatType === 'private' ? 'default' : 'outline'}
                                        onClick={() => setChatType('private')}
                                        className="flex-1"
                                    >
                                        Личный
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={chatType === 'group' ? 'default' : 'outline'}
                                        onClick={() => setChatType('group')}
                                        className="flex-1"
                                    >
                                        Группа
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {chatType === 'private'
                                        ? 'Личный чат для общения 1 на 1'
                                        : 'Групповой чат для нескольких человек'}
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="participants" className="space-y-4 py-4">
                            <div className="text-sm text-muted-foreground space-y-2">
                                <p>После создания чата вы сможете:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Добавлять друзей по ID или никнейму</li>
                                    <li>Создавать ссылки-приглашения</li>
                                    <li>Управлять правами участников</li>
                                </ul>
                                {chatType === 'group' && !isPremium && (
                                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                        <p className="text-amber-600 text-xs">
                                            ⚠️ В бесплатном режиме групповые чаты ограничены 3 участниками.
                                            Для группового просмотра видео требуется Premium.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="video" className="space-y-4 py-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="allowVideo">Разрешить видео в чате</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Участники смогут запускать совместный просмотр
                                        </p>
                                    </div>
                                    <Switch
                                        id="allowVideo"
                                        checked={allowVideo}
                                        onCheckedChange={setAllowVideo}
                                        disabled={!canEnableVideo}
                                    />
                                </div>

                                {!canEnableVideo && (
                                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                        <p className="text-amber-600 text-xs">
                                            ⚠️ Запуск видео в групповых чатах доступен только с Premium подпиской.
                                            Личные чаты поддерживают видео бесплатно.
                                        </p>
                                    </div>
                                )}

                                {allowVideo && (
                                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <p className="text-blue-600 text-xs">
                                            💡 При включении видео участники смогут синхронизированно смотреть
                                            контент и общаться в чате.
                                        </p>
                                        {chatType === 'group' && isPremium && (
                                            <p className="text-blue-600 text-xs mt-1">
                                                Максимум участников: 50 человек
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
                            Отмена
                        </Button>
                        <Button type="submit" disabled={!chatName.trim() || isCreating}>
                            {isCreating ? 'Создание...' : 'Создать чат'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateChatDialog;
