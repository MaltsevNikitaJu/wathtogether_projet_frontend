import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearchUsersQuery, useGetFriendsQuery, useSendFriendRequestMutation } from '../api/apiSlice';
import { useToast } from '../hooks/useToast';
import { UserPlus, Users } from 'lucide-react';

interface User {
    id: number;
    username: string;
    avatar_url?: string;
}

const Friends: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchPerformed, setSearchPerformed] = useState(false);

    const { data: searchResults, isLoading: isSearching } = useSearchUsersQuery(searchQuery, {
        skip: searchQuery.length < 2,
    });

    const { data: friendsData, isLoading: isLoadingFriends } = useGetFriendsQuery();
    const [sendFriendRequest] = useSendFriendRequestMutation();
    const { success, error } = useToast();

    const friends = friendsData?.friends || [];

    const handleSearch = () => {
        if (searchQuery.length >= 2) {
            setSearchPerformed(true);
        }
    };

    const handleSendRequest = async (userId: number) => {
        try {
            await sendFriendRequest({ addresseeId: userId }).unwrap();
            success('Заявка отправлена!');
        } catch (err: unknown) {
            const errorData = err as { data?: { message?: string } };
            error(errorData.data?.message || 'Ошибка при отправке заявки');
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 overflow-y-auto">
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
                                            <AvatarFallback>
                                                {(user.username[0] || '?').toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium truncate">{user.username}</span>
                                    </div>
                                    <Button size="sm" onClick={() => handleSendRequest(user.id)} className="shrink-0">
                                        Добавить
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
                                        <AvatarFallback>
                                            {(friend.username[0] || '?').toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium truncate">{friend.username}</span>
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
