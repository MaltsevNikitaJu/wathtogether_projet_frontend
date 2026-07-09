import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, Check, X, Users, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useGetFriendRequestsQuery, useRespondFriendRequestMutation } from '../api/apiSlice';

const FriendRequests: React.FC = () => {
    const navigate = useNavigate();
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const { data: requestsData, isLoading, isError } = useGetFriendRequestsQuery();
    const [respondFriendRequest] = useRespondFriendRequestMutation();

    const staticUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
    const pendingRequests = requestsData?.requests || [];
    const hasRequests = pendingRequests.length > 0;

    const getAvatarUrl = (avatarUrl: string | undefined) => {
        return avatarUrl ? `${staticUrl}${avatarUrl}` : null;
    };

    const handleResponse = async (requestId: number, action: 'accept' | 'reject') => {
        setMessage(null);

        try {
            await respondFriendRequest({ requestId, action }).unwrap();
            const messageText = action === 'accept' ? 'Заявка принята! Теперь вы друзья' : 'Заявка отклонена';
            setMessage({ type: 'success', text: messageText });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            setMessage({ type: 'error', text: errorData.data?.message || 'Ошибка при обработке заявки' });
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

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3 min-w-0">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/friends')} className="shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold truncate">Заявки в друзья</h1>
                            <p className="text-sm text-muted-foreground">
                                {hasRequests ? `${pendingRequests.length} ожидающих` : 'Нет новых заявок'}
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/friends')} className="shrink-0 ml-2">
                        <Users className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Друзья</span>
                    </Button>
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Загрузка заявок...</p>
                        </div>
                    </div>
                )}

                {isError && (
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <p className="text-destructive mb-2">Ошибка при загрузке заявок</p>
                            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                                Попробовать снова
                            </Button>
                        </div>
                    </div>
                )}

                {!isLoading && !isError && !hasRequests && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                            <UserPlus className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Нет новых заявок</h2>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                            Когда кто-то отправит вам заявку в друзья, она появится здесь
                        </p>
                        <Button onClick={() => navigate('/friends')}>
                            Найти друзей
                        </Button>
                    </div>
                )}
    
                {hasRequests && (
                    <ScrollArea className="h-[calc(100vh-200px)]">
                        <div className="space-y-3">
                            {pendingRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-14 w-14">
                                            {getAvatarUrl(request.requester.avatar_url) ? (
                                                <img
                                                    src={getAvatarUrl(request.requester.avatar_url)!}
                                                    alt={request.requester.username}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                                                    {(request.requester.username[0] || '?').toUpperCase()}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-base">
                                                {request.requester.username}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Отправлена {new Date(request.created_at).toLocaleDateString('ru-RU')}
                                            </p>
                                        </div>

                                        <div className="flex gap-2 shrink-0">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleResponse(request.id, 'reject')}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleResponse(request.id, 'accept')}
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                Принять
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
    );
};

export default FriendRequests;
