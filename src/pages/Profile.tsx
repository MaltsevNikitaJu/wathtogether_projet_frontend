import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useGetProfileQuery, useUpdateProfileMutation, useUploadAvatarMutation, useGetWatchHistoryQuery } from '../api/apiSlice';
import { useToast } from '../hooks/useToast';
import { apiSlice } from '../api/apiSlice';

const WatchHistorySection: React.FC = () => {
    const navigate = useNavigate();
    const { data: historyData, isLoading } = useGetWatchHistoryQuery();

    return (
        <div className="p-4 sm:p-6 bg-card rounded-lg border">
            <h3 className="text-base sm:text-lg font-semibold mb-4">История просмотров</h3>

            {isLoading ? (
                <p className="text-sm text-muted-foreground">Загрузка...</p>
            ) : !historyData?.history || historyData.history.length === 0 ? (
                <p className="text-sm text-muted-foreground">История пуста</p>
            ) : (
                <div className="space-y-2">
                    {historyData.history.map((item: { chat_id: string; chat_name: string; last_watched: string }) => (
                        <div
                            key={item.chat_id}
                            className="flex items-center justify-between gap-3 p-3 bg-muted rounded-lg hover:bg-accent/50 cursor-pointer"
                            onClick={() => navigate(`/chats/${item.chat_id}`)}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    🎬
                                </div>
                                <div className="min-w-0">
                                    <div className="font-medium truncate">{item.chat_name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        Последний просмотр: {new Date(item.last_watched).toLocaleString('ru-RU')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { data: profileData, isLoading } = useGetProfileQuery();
    const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
    const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();
    const { success, error, warning } = useToast();

    const [username, setUsername] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (profileData?.user) {
            setUsername(profileData.user.username || '');
        }
    }, [profileData]);

    const handleSave = async () => {
        try {
            if (username !== profileData?.user?.username) {
                await updateProfile({ username }).unwrap();
                success('Профиль обновлен!');
                dispatch(apiSlice.util.invalidateTags(['User']));
            } else {
                warning('Нет изменений для сохранения');
            }
        } catch (err: unknown) {
            const errorData = err as { data?: { message?: string } };
            error(errorData.data?.message || 'Ошибка при обновлении профиля');
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            error('Только изображения (JPEG, PNG, GIF, WebP) разрешены');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            error('Файл слишком большой. Максимум 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await uploadAvatar(formData).unwrap();
            success('Аватар обновлен!');
            dispatch(apiSlice.util.invalidateTags(['User']));
        } catch (err: unknown) {
            const errorData = err as { data?: { message?: string } };
            error(errorData.data?.message || 'Ошибка при загрузке аватара');
        }
    };

    const handleRemoveAvatar = async () => {
        try {
            await updateProfile({ avatar_url: undefined }).unwrap();
            success('Аватар удален');
            dispatch(apiSlice.util.invalidateTags(['User']));
        } catch (err: unknown) {
            const errorData = err as { data?: { message?: string } };
            error(errorData.data?.message || 'Ошибка при удалении аватара');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Загрузка...</p>
                </div>
            </div>
        );
    }

    const user = profileData?.user;
    const staticUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
    const avatarUrl = user?.avatar_url ? `${staticUrl}${user.avatar_url}` : null;

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold truncate">Настройка профиля</h1>
                    <Button variant="outline" size="sm" onClick={() => navigate('/chats')} className="shrink-0 ml-2">
                        ← Назад
                    </Button>
                </div>

                <div className="space-y-4 sm:space-y-6">
                    <div className="p-4 sm:p-6 bg-card rounded-lg border">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 shrink-0">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <AvatarFallback className="text-2xl sm:text-3xl bg-primary text-primary-foreground">
                                        {(user?.username?.[0] || '?').toUpperCase()}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-semibold truncate">{user?.username}</h2>
                                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                                <div className="mt-3 space-y-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            size="sm"
                                            variant="outline"
                                        >
                                            {isUploading ? 'Загрузка...' : 'Изменить фото'}
                                        </Button>
                                        {avatarUrl && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRemoveAvatar}
                                                disabled={isUploading}
                                            >
                                                Удалить
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        JPEG, PNG, GIF или WebP. Максимум 5MB
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 bg-card rounded-lg border">
                        <h3 className="text-base sm:text-lg font-semibold mb-4">Изменить имя пользователя</h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Имя пользователя</Label>
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Введите новое имя"
                                    className="w-full max-w-md"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Имя должно быть уникальным.
                                </p>
                            </div>

                            <Button onClick={handleSave} disabled={isUpdating || !username || username === user?.username} className="sm:w-auto w-full">
                                {isUpdating ? 'Сохранение...' : 'Сохранить имя'}
                            </Button>
                        </div>
                    </div>

                    <WatchHistorySection />
                </div>
            </div>
        </div>
    );
};

export default Profile;
