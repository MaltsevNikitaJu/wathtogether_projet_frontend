import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearchUsersQuery, useGetFriendsQuery, useSendFriendRequestMutation, useRemoveFriendMutation } from '../api/apiSlice';
import { UserPlus, Users, CheckCircle, XCircle, UserMinus } from 'lucide-react';
import { useConfirm } from '../lib/confirm';

interface User {
    id: number;
    username: string;
    avatar_url?: string;
}

const Friends: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [sentRequests, setSentRequests] = useState<Set<number>>(new Set());

    const staticUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');

    const { data: searchResults, isLoading: isSearching } = useSearchUsersQuery(searchQuery, {
        skip: searchQuery.length < 2,
    });

    const { data: friendsData, isLoading: isLoadingFriends } = useGetFriendsQuery();
    const [sendFriendRequest] = useSendFriendRequestMutation();
    const [removeFriend] = useRemoveFriendMutation();
    const { confirm } = useConfirm();

    const friends = friendsData?.friends || [];

    const handleSearch = () => {
        if (searchQuery.length >= 2) {
            setSearchPerformed(true);
        }
    };

    const handleSendRequest = async (userId: number) => {
        setMessage(null);

        try {
            await sendFriendRequest({ addresseeId: userId }).unwrap();
            setSentRequests((prev) => new Set(prev).add(userId));
            setMessage({ type: 'success', text: 'Заявка отправлена!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: unknown) {
            const errorData = err as { data?: { message?: string } };
            setMessage({ type: 'error', text: errorData.data?.message || 'Ошибка при отправке заявки' });
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const handleRemoveFriend = async (friendId: number, username: string) => {
        const ok = await confirm({
            title: 'Удалить из друзей?',
            description: `Удалить ${username} из друзей?`,
            confirmText: 'Удалить',
            variant: 'danger',
        });
        if (!ok) return;
        setMessage(null);
        try {
            await removeFriend(friendId).unwrap();
            setMessage({ type: 'success', text: `${username} удалён из друзей` });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: unknown) {
            const errorData = err as { data?: { message?: string } };
            setMessage({ type: 'error', text: errorData.data?.message || 'Ошибка при удалении' });
            setTimeout(() => setMessage(null), 5000);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 overflow-y-auto">
                {message && (
                    <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                        message.type === 'success'
                            ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                        {message.type === 'success' ? (
                            <CheckCircle className="h-4 w-4 shrink-0" />
                        ) : (
                            <XCircle className="h-4 w-4 shrink-0" />
                        )}
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold">Друзья</h1>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/friends/requests')}
                            className="relative"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Заявки</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate('/chats')}>
                            <Users className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-card rounded-lg border">
                    <h2 className="text-base sm:text-lg font-semibold mb-3">Поиск друзей</h2>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                            placeholder="Введите имя или email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1"
                        />
                        <Button onClick={handleSearch} disabled={searchQuery.length < 2 || isSearching} className="w-full sm:w-auto">
                            {isSearching ? 'Поиск...' : 'Найти'}
                        </Button>
                    </div>

                    {searchPerformed && searchResults && searchResults.users.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {searchResults.users.map((user: User) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between gap-3 p-3 bg-muted rounded-lg"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar className="shrink-0">
                                            {user.avatar_url ? (
                                                <img src={`${staticUrl}${user.avatar_url}`} alt={user.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <AvatarFallback>
                                                    {(user.username[0] || '?').toUpperCase()}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <span className="font-medium truncate">{user.username}</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleSendRequest(user.id)}
                                        disabled={sentRequests.has(user.id)}
                                        className="shrink-0"
                                    >
                                        {sentRequests.has(user.id) ? 'Отправлено' : 'Добавить'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                    {searchPerformed && searchResults && searchResults.users.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">Пользователи не найдены</p>
                    )}
                </div>
                    
                <div className="p-4 bg-card rounded-lg border">
                    <h2 className="text-lg font-semibold mb-3">
                        Мои друзья {friends.length > 0 && `(${friends.length})`}
                    </h2>
                    {isLoadingFriends ? (
                        <p className="text-muted-foreground text-center py-8">Загрузка...</p>
                    ) : friends.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            У вас пока нет друзей. Используйте поиск, чтобы найти друзей!
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {friends.map((friend: User) => (
                                <div
                                    key={friend.id}
                                    className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                                >
                                    <Avatar className="shrink-0">
                                        {friend.avatar_url ? (
                                            <img src={`${staticUrl}${friend.avatar_url}`} alt={friend.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <AvatarFallback>
                                                {(friend.username[0] || '?').toUpperCase()}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <span className="font-medium truncate flex-1">{friend.username}</span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="shrink-0 text-destructive hover:text-destructive"
                                        onClick={() => handleRemoveFriend(friend.id, friend.username)}
                                    >
                                        <UserMinus className="h-4 w-4" />
                                        <span className="hidden sm:inline">Удалить</span>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Friends;
