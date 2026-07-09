import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetChatsQuery, useCreateChatMutation, useGetProfileQuery, useAddChatParticipantMutation, useGetChatParticipantsQuery, useLeaveChatMutation, useGetSubscriptionQuery, useGetChatSettingsQuery } from '../api/apiSlice';
import { removeToken, getToken } from '../utils/token';
import { disconnectSocket } from '../utils/socket';
import { useConfirm } from '../lib/confirm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ChatRoom from './ChatRoom';
import CreateChatDialog from '../components/CreateChatDialog';
import AddParticipantDialog from '../components/AddParticipantDialog';
import ChatSettingsDialog from '../components/ChatSettingsDialog';
import ParticipantsListDialog from '../components/ParticipantsListDialog';
import InvitationBadge from '../components/InvitationBadge';
import {
    Plus,
    Search,
    Menu,
    X,
    User,
    LogOut,
    Settings,
    Users,
    Info,
    Crown,
    Film,
    Library,
} from 'lucide-react';

const ChatList: React.FC = () => {
    const navigate = useNavigate();
    const { confirm, alert } = useConfirm();
    const { data, isLoading } = useGetChatsQuery();
    const { data: profileData } = useGetProfileQuery();
    const { data: subscriptionData } = useGetSubscriptionQuery();
    const [createChat] = useCreateChatMutation();
    const [addParticipant] = useAddChatParticipantMutation();
    const [leaveChat] = useLeaveChatMutation();

    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const { id: routeChatId } = useParams<{ id: string }>();

    useEffect(() => {
        if (routeChatId) {
            setActiveChatId(Number(routeChatId));
        }
    }, [routeChatId]);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showAddParticipantDialog, setShowAddParticipantDialog] = useState(false);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [showRightPanel, setShowRightPanel] = useState(false);
    const [showParticipantsDialog, setShowParticipantsDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [chatInvitations, setChatInvitations] = useState<Record<number, number>>({});

    const { data: participantsData } = useGetChatParticipantsQuery(activeChatId || '', {
        skip: !activeChatId,
    });
    const { data: settingsData } = useGetChatSettingsQuery(activeChatId || '', {
        skip: !activeChatId,
    });
    const showParticipants = settingsData?.settings?.show_participants !== false;
    const currentParticipantIds = participantsData?.participants?.map((p: { id: number }) => p.id) || [];

    const user = profileData?.user;
    const subscription = subscriptionData?.subscription;
    const isPremium = user?.role === 'premium' || user?.role === 'premium_plus';

    const filteredChats = data?.chats?.filter((chat: { id: number; name: string; type: string; created_by?: number }) =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    useEffect(() => {
        if (!data?.chats || !profileData?.user?.id) return;

        const loadInvitations = async () => {
            const invitationCounts: Record<number, number> = {};

            for (const chat of data.chats) {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/chats/${chat.id}/messages`, {
                        headers: {
                            'Authorization': `Bearer ${getToken()}`,
                        },
                    });

                    if (response.ok) {
                        const messagesData = await response.json();
                        const invitations = messagesData.messages?.filter((msg: any) =>
                            msg.type === 'watch_invitation' &&
                            msg.user_id !== profileData.user.id
                        ) || [];
                        invitationCounts[chat.id] = invitations.length;
                    }
                } catch {
                    invitationCounts[chat.id] = 0;
                }
            }

            setChatInvitations(invitationCounts);
        };

        loadInvitations();
    }, [data, profileData]);

    const handleLogout = () => {
        removeToken();
        disconnectSocket();
        window.location.href = '/login';
    };

    const handleCreateChat = async (data: { name: string; type: string; allowVideo: boolean }) => {
        return createChat({
            name: data.name,
            type: data.type,
            allow_video: data.allowVideo,
        }).unwrap();
    };

    const handleAddParticipant = async (userId: number) => {
        if (!activeChatId) {
            throw new Error('Чат не выбран');
        }

        await addParticipant({
            chatId: activeChatId,
            userId,
        }).unwrap();
    };

    const handleLeaveChat = async () => {
        if (!activeChatId) return;
        const ok = await confirm({ title: 'Выйти из чата?', confirmText: 'Выйти', variant: 'danger' });
        if (!ok) return;
        try {
            await leaveChat({ chatId: activeChatId }).unwrap();
            setActiveChatId(null);
            setShowRightPanel(false);
        } catch (err: unknown) {
            const errorData = err as { data?: { message?: string } };
            await alert({ title: 'Не удалось выйти', description: errorData.data?.message || 'Ошибка при выходе из чата', variant: 'danger' });
        }
    };

    const activeChat: { id: number; name: string; type: string; created_by?: number } | undefined = filteredChats.find((c) => c.id === activeChatId);
    const isCreator = user?.id === activeChat?.created_by;
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <div className={`flex flex-col bg-muted/30 border-r transition-all duration-300 ${
                isSidebarCollapsed ? 'w-16' : 'w-80'
            } ${isMobile && activeChatId ? 'hidden' : 'flex'} shrink-0`}>
                <div className="h-14 flex items-center justify-between px-3 border-b shrink-0">
                    {!isSidebarCollapsed && (
                        <h1 className="font-semibold truncate">Сообщения</h1>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="h-8 w-8 shrink-0"
                    >
                        {isSidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Button>
                </div>

                {!isSidebarCollapsed && (
                    <>
                        <div className="p-3 space-y-2 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
                                <Input
                                    placeholder="Поиск чатов..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9 text-sm pr-3"
                                />
                            </div>
                            <Button
                                onClick={() => setShowCreateDialog(true)}
                                className="w-full h-9"
                                size="sm"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Создать чат
                            </Button>
                        </div>
                        <Separator />
                    </>
                )}

                <ScrollArea className="flex-1 min-h-0">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">Загрузка...</div>
                    ) : filteredChats.length > 0 ? (
                        <div className="space-y-1 p-2">
                            {filteredChats.map((chat: { id: number; name: string; type: string; created_by?: number }) => (
                                <div
                                    key={chat.id}
                                    onClick={() => setActiveChatId(chat.id)}
                                    className={`flex items-center gap-3 rounded-lg cursor-pointer transition-colors ${
                                        isSidebarCollapsed ? 'p-2 justify-center' : 'p-3'
                                    } ${
                                        activeChatId === chat.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                                    }`}
                                >
                                    <Avatar className={`shrink-0 ${isSidebarCollapsed ? 'h-10 w-10' : 'h-12 w-12'}`}>
                                        <AvatarFallback className={`bg-primary text-primary-foreground ${isSidebarCollapsed ? 'text-xs' : 'text-sm'}`}>
                                            {(chat.name?.[0] || '?').toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {!isSidebarCollapsed && (
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="font-medium text-sm truncate flex-1">{chat.name}</div>
                                                {chatInvitations[chat.id] > 0 && (
                                                    <InvitationBadge count={chatInvitations[chat.id]} size="sm" />
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {chat.type === 'group' ? '👥 Группа' : '👤 Личный'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            {searchQuery ? 'Чаты не найдены' : 'Нет чатов'}
                        </div>
                    )}
                </ScrollArea>

                {!isSidebarCollapsed && (
                    <>
                        <Separator />
                        <div className="p-3 shrink-0 space-y-1">
                            <Button
                                variant="ghost"
                                className="w-full justify-start h-9"
                                onClick={() => navigate('/friends')}
                            >
                                <Users className="h-4 w-4 mr-2" />
                                Друзья
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start h-9"
                                onClick={() => navigate('/profile')}
                            >
                                <User className="h-4 w-4 mr-2" />
                                Профиль
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start h-9"
                                onClick={() => navigate('/videos')}
                            >
                                <Film className="h-4 w-4 mr-2" />
                                Мои видео
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start h-9"
                                onClick={() => navigate('/catalog')}
                            >
                                <Library className="h-4 w-4 mr-2" />
                                Каталог
                            </Button>
                            {isPremium ? (
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start h-9 text-amber-600"
                                    onClick={() => navigate('/subscription')}
                                >
                                    <Crown className="h-4 w-4 mr-2" />
                                    Premium {subscription?.plan === 'premium_plus' ? '+' : ''}
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start h-9 text-amber-600 hover:text-amber-700"
                                    onClick={() => navigate('/subscription')}
                                >
                                    <Crown className="h-4 w-4 mr-2" />
                                    Получить Premium
                                </Button>
                            )}
                            <Separator className="my-2" />
                            <Button
                                variant="ghost"
                                className="w-full justify-start h-9 text-destructive hover:text-destructive"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Выйти
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {activeChatId ? (
                <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
                    <ChatRoom
                        chatId={activeChatId}
                        chatName={activeChat?.name}
                        onClose={() => {
                            setActiveChatId(null);
                            setShowRightPanel(false);
                        }}
                        onToggleInfo={() => setShowRightPanel(prev => !prev)}
                        onBackToList={() => setActiveChatId(null)}
                    />
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-background p-4 overflow-hidden">
                    <div className="text-center text-muted-foreground max-w-md w-full">
                        <div className="text-6xl sm:text-8xl mb-6">💬</div>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-3">WatchTogether</h2>
                        <p className="text-lg mb-6">Смотрите видео вместе с друзьями</p>
                        <div className="space-y-2 text-xs sm:text-sm text-left max-w-sm mx-auto mb-6">
                            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                                <span className="text-xl sm:text-2xl shrink-0">🎬</span>
                                <div className="min-w-0">
                                    <p className="font-medium text-sm sm:text-base">Совместный просмотр</p>
                                    <p className="text-muted-foreground text-xs">Синхронизированное видео с чатом</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                                <span className="text-xl sm:text-2xl shrink-0">💬</span>
                                <div className="min-w-0">
                                    <p className="font-medium text-sm sm:text-base">Общение в реальном времени</p>
                                    <p className="text-muted-foreground text-xs">Мгновенные сообщения и реакции</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                                <span className="text-xl sm:text-2xl shrink-0">👥</span>
                                <div className="min-w-0">
                                    <p className="font-medium text-sm sm:text-base">Личные и групповые чаты</p>
                                    <p className="text-muted-foreground text-xs">Общайтесь 1-on-1 или в группах</p>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowCreateDialog(true)}
                            size="lg"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Создать первый чат
                        </Button>
                    </div>
                </div>
            )}

            {activeChatId && activeChat && showRightPanel && (
                <div className="w-80 border-l bg-card flex-col shrink-0 overflow-hidden hidden md:flex">
                    <div className="h-14 flex items-center justify-between px-4 border-b shrink-0 relative">
                        <h3 className="font-semibold truncate pr-8">Информация о чате</h3>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowRightPanel(false)}
                            className="h-8 w-8 shrink-0 absolute right-2 top-1/2 -translate-y-1/2 z-10"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-6">
                            <div className="text-center">
                                <Avatar className="h-24 w-24 mx-auto mb-3">
                                    <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                                        {(activeChat.name?.[0] || '?').toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <h4 className="text-lg font-semibold">{activeChat.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {activeChat.type === 'group' ? 'Групповой чат' : 'Личный чат'}
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <h5 className="font-medium flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    О чате
                                </h5>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <div className="flex justify-between">
                                        <span>Тип:</span>
                                        <span className="text-foreground">
                                            {activeChat.type === 'private' ? 'Личный' : 'Групповой'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Создатель:</span>
                                        <span className="text-foreground">
                                            {isCreator ? 'Вы' : (participantsData?.participants?.find((p) => p.is_creator)?.username || 'Создатель')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <h5 className="font-medium flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Участники ({participantsData?.participants?.length || 0})
                                </h5>
                                {showParticipants && (
                                <div className="space-y-2 pr-1">
                                    {participantsData?.participants && participantsData.participants.length > 0 ? (
                                        <>
                                            {participantsData.participants.slice(0, 3).map((participant: { id: number; username: string; avatar_url?: string; is_creator?: boolean }) => (
                                                <div
                                                    key={participant.id}
                                                    className={`flex items-center gap-3 p-2 rounded-lg ${
                                                        participant.id === user?.id ? 'bg-primary/10' : 'bg-muted/30'
                                                    }`}
                                                >
                                                    <Avatar className="h-8 w-8 shrink-0">
                                                        {participant.avatar_url ? (
                                                            <img src={`${
                                                                (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '')
                                                            }${participant.avatar_url}`} alt={participant.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                                                {(participant.username?.[0] || '?').toUpperCase()}
                                                            </AvatarFallback>
                                                        )}
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{participant.username}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {participant.id === user?.id ? 'Вы' : participant.is_creator ? 'Создатель' : 'Участник'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            {participantsData.participants.length > 3 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => setShowParticipantsDialog(true)}
                                                >
                                                    <Users className="h-4 w-4 mr-2" />
                                                    Показать всех ({participantsData.participants.length - 3} ещё)
                                                </Button>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-2">Нет участников</p>
                                    )}
                                </div>
                                )}
                                {activeChat?.type === 'group' || (participantsData?.participants?.length ?? 0) < 2 ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => setShowAddParticipantDialog(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Добавить участника
                                    </Button>
                                ) : (
                                    <p className="text-xs text-muted-foreground text-center">
                                        Личный чат — только два участника
                                    </p>
                                )}
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => setShowSettingsDialog(true)}
                                >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Настройки чата
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-destructive hover:text-destructive"
                                    onClick={handleLeaveChat}
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Выйти из чата
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <CreateChatDialog
                open={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                onCreateChat={handleCreateChat}
                isCreating={false}
                isPremium={isPremium}
            />

            <AddParticipantDialog
                open={showAddParticipantDialog}
                onClose={() => setShowAddParticipantDialog(false)}
                chatId={activeChatId || ''}
                onAddParticipant={handleAddParticipant}
                currentParticipants={currentParticipantIds}
            />

            <ChatSettingsDialog
                open={showSettingsDialog}
                onClose={() => setShowSettingsDialog(false)}
                chatId={activeChatId || ''}
                chatName={activeChat?.name || ''}
                isCreator={isCreator}
                participantsCount={participantsData?.participants?.length || 0}
            />

            <ParticipantsListDialog
                open={showParticipantsDialog}
                onClose={() => setShowParticipantsDialog(false)}
                participants={participantsData?.participants || []}
                currentUserId={user?.id}
                chatName={activeChat?.name || ''}
            />
        </div>
    );
};

export default ChatList;
