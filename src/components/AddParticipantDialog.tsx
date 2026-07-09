import React, { useState, useMemo, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, Search, Users } from 'lucide-react';
import { useGetFriendsQuery } from '../api/apiSlice';

interface AddParticipantDialogProps {
    open: boolean;
    onClose: () => void;
    chatId: string | number;
    onAddParticipant: (userId: number, username: string) => Promise<void>;
    currentParticipants?: number[];
}

const AddParticipantDialog: React.FC<AddParticipantDialogProps> = ({
    open,
    onClose,
    onAddParticipant,
    currentParticipants = [],
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const { data: friendsData, isLoading: isFriendsLoading, refetch: refetchFriends } = useGetFriendsQuery();

    useEffect(() => {
        if (open) refetchFriends();
    }, [open, refetchFriends]);

    const friends = friendsData?.friends || [];
    const staticUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');

    const availableFriends = useMemo(() => {
        return friends.filter((friend: { id: number; username: string }) => {
            const notInChat = !currentParticipants.includes(friend.id);
            const matchesSearch = friend.username.toLowerCase().includes(searchQuery.toLowerCase());
            return notInChat && matchesSearch;
        });
    }, [friends, currentParticipants, searchQuery]);

    const handleAddUser = async (userId: number, username: string) => {
        setIsLoading(true);
        setMessage(null);

        try {
            await onAddParticipant(userId, username);
            setMessage({ type: 'success', text: `${username} успешно добавлен в чат!` });
            setSearchQuery('');

            setTimeout(() => {
                onClose();
                setMessage(null);
            }, 2000);
        } catch (error: any) {
            const errorMessage = error?.data?.message || 'Ошибка при добавлении участника';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen && !isLoading) {
                onClose();
                setMessage(null);
            }
        }}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Добавить участника
                    </DialogTitle>
                    <DialogDescription>
                        Вы можете добавлять в чат только своих друзей
                    </DialogDescription>
                </DialogHeader>

                {message && (
                    <div className={`p-3 rounded-lg mb-4 ${
                        message.type === 'success'
                            ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Поиск по друзьям..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <ScrollArea className="h-64 rounded-lg border">
                        {isFriendsLoading ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Загрузка друзей...
                            </div>
                        ) : friends.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Users className="h-12 w-12 text-muted-foreground mb-3" />
                                <p className="text-sm text-muted-foreground mb-2">У вас пока нет друзей</p>
                                <p className="text-xs text-muted-foreground mb-4">
                                    Добавьте друзей через поиск на странице "Друзья"
                                </p>
                            </div>
                        ) : availableFriends.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                {searchQuery ? 'Друзья не найдены' : 'Все друзья уже в чате'}
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {availableFriends.map((friend: { id: number; username: string; avatar_url?: string }) => (
                                    <div
                                        key={friend.id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <Avatar className="h-10 w-10">
                                            {friend.avatar_url ? (
                                                <img
                                                    src={`${staticUrl}${friend.avatar_url}`}
                                                    alt={friend.username}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                    {(friend.username?.[0] || '?').toUpperCase()}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{friend.username}</p>
                                            <p className="text-xs text-muted-foreground">Друг</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleAddUser(friend.id, friend.username)}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Добавление...' : 'Добавить'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">
                            💡 <strong>Защита от спама:</strong> Добавлять в чат можно только друзей. Сначала добавьте пользователя в друзья, затем пригласите его в чат.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Закрыть
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddParticipantDialog;
