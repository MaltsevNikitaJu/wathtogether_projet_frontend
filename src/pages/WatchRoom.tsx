import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { getSocket } from '../utils/socket';
import { useGetMessagesQuery, useGetProfileQuery } from '../api/apiSlice';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { X, Settings, Users } from 'lucide-react';

interface Message {
    id: number;
    content: string;
    created_at: string;
    username: string;
    user_id: number;
    type?: 'text' | 'system';
}

const WatchRoom: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const videoUrl = searchParams.get('url');
    const chatId = searchParams.get('chatId');

    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
    const isApplyingRemoteAction = useRef(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [currentQuality, setCurrentQuality] = useState(() => localStorage.getItem('video-quality') || 'auto');
    const [currentSpeed, setCurrentSpeed] = useState(() => parseFloat(localStorage.getItem('video-speed') || '1'));

    const { data: messagesData } = useGetMessagesQuery(chatId || '');
    const { data: profileData } = useGetProfileQuery();
    const myUserId = profileData?.user?.id;

    useEffect(() => {
        if (messagesData?.messages) setMessages(messagesData.messages);
    }, [messagesData, myUserId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !videoUrl || !chatId) return;

        const socket = getSocket();
        socket.emit('join_chat', chatId);

        const handleNewMessage = (payload: Message) => {
            setMessages((prev) => [...prev, payload]);
        };

        socket.on('receive_message', handleNewMessage);

        container.innerHTML = '';
        const videoElement = document.createElement('video');
        videoElement.className = 'video-js vjs-big-play-centered vjs-theme-fantasy';
        container.appendChild(videoElement);

        const player = videojs(videoElement, {
            controls: true,
            autoplay: false,
            preload: 'auto',
            responsive: true,
            fluid: true,
            sources: [{ src: videoUrl, type: 'video/mp4' }],
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        });

        playerRef.current = player;

        player.ready(() => {
            const savedSpeed = parseFloat(localStorage.getItem('video-speed') || '1');
            if (savedSpeed !== 1) {
                player.playbackRate(savedSpeed);
                setCurrentSpeed(savedSpeed);
            }
        });

        const sendSyncEvent = (action: string) => {
            if (!isApplyingRemoteAction.current) {
                socket.emit('video_action', {
                    chatId,
                    action,
                    time: player.currentTime(),
                });
            }
        };

        player.on('play', () => sendSyncEvent('play'));
        player.on('pause', () => sendSyncEvent('pause'));
        player.on('seeked', () => sendSyncEvent('seek'));

        const handleVideoSync = (data: { action: string; time: number }) => {
            isApplyingRemoteAction.current = true;

            if (data.action === 'play') {
                player.currentTime(data.time);
                player.play()?.catch(() => {});
            } else if (data.action === 'pause') {
                player.currentTime(data.time);
                player.pause();
            } else if (data.action === 'seek') {
                player.currentTime(data.time);
            }

            setTimeout(() => {
                isApplyingRemoteAction.current = false;
            }, 100);
        };

        const handleInitialState = (state: { action: string; time: number }) => {
            isApplyingRemoteAction.current = true;
            player.currentTime(state.time);

            if (state.action === 'pause') {
                player.pause();
            } else if (state.action === 'play') {
                player.play()?.catch(() => {});
            }

            setTimeout(() => {
                isApplyingRemoteAction.current = false;
            }, 200);
        };

        socket.on('initial_video_state', handleInitialState);
        socket.on('sync_video', handleVideoSync);

        return () => {
            socket.off('initial_video_state', handleInitialState);
            socket.off('sync_video', handleVideoSync);
            socket.off('receive_message', handleNewMessage);
            socket.emit('leave_chat', chatId);

            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [videoUrl, chatId, messagesData]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatId) return;
        const socket = getSocket();
        socket.emit('send_message', { chatId, content: newMessage });
        setNewMessage('');
    };

    const handleQualityChange = (quality: string) => {
        setCurrentQuality(quality);
        localStorage.setItem('video-quality', quality);
    };

    const handleSpeedChange = (speed: number) => {
        setCurrentSpeed(speed);
        localStorage.setItem('video-speed', speed.toString());
        if (playerRef.current) {
            playerRef.current.playbackRate(speed);
        }
    };

    if (!videoUrl || !chatId) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center">
                    <p className="text-lg text-muted-foreground">Ошибка: Не передана ссылка на видео или ID чата</p>
                    <Button onClick={() => navigate('/chats')} className="mt-4">
                        Вернуться к чатам
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background flex-col sm:flex-row">
            <div className="flex-1 flex flex-col bg-black min-h-0 sm:min-h-full">
                <div className="flex items-center justify-between px-4 py-2 bg-black/50 backdrop-blur shrink-0 h-14">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(-1)}
                        className="text-white hover:text-white/80"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Закрыть
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSettings(!showSettings)}
                            className="text-white hover:text-white/80"
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-2 sm:p-4 relative">
                    <div className="w-full max-w-6xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                        <div ref={containerRef} className="w-full h-full" />
                    </div>

                    {showSettings && (
                        <div className="absolute inset-2 sm:inset-4 bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 sm:p-6 w-full max-w-sm shadow-2xl mx-2">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-white font-medium">Настройки видео</h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowSettings(false)}
                                        className="text-zinc-400 hover:text-white"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-zinc-400 text-sm">Качество</label>
                                        <select
                                            value={currentQuality}
                                            onChange={(e) => handleQualityChange(e.target.value)}
                                            className="mt-1 w-full bg-zinc-800 text-white rounded px-3 py-2 text-sm border border-zinc-700"
                                        >
                                            <option value="auto">Авто</option>
                                            <option value="1080p">1080p HD</option>
                                            <option value="720p">720p</option>
                                            <option value="480p">480p</option>
                                            <option value="360p">360p</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-zinc-400 text-sm">Скорость воспроизведения</label>
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {['0.5x', '0.75x', '1x', '1.25x', '1.5x', '2x'].map((speed) => {
                                                const speedValue = parseFloat(speed.replace('x', ''));
                                                const isActive = currentSpeed === speedValue;
                                                return (
                                                    <Button
                                                        key={speed}
                                                        variant={isActive ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => handleSpeedChange(speedValue)}
                                                        className={isActive
                                                            ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                                                            : 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700'
                                                        }
                                                    >
                                                        {speed}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full sm:w-96 flex flex-col bg-zinc-900 border-l border-zinc-800 sm:min-h-0 h-64 sm:h-auto">
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-zinc-800 bg-zinc-900/50">
                    <Users className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium text-white">Чат комнаты</span>
                    <span className="ml-auto text-xs text-zinc-500">ID: {chatId ? chatId.slice(-6) : 'N/A'}</span>
                </div>

                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-3 py-2 sm:px-4 sm:py-3">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-sm text-zinc-500">Нет сообщений. Начните общение!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {messages.map((msg) => {
                                const isMyMessage = msg.user_id === myUserId;
                                const isSystemMessage = msg.type === 'system';

                                if (isSystemMessage) {
                                    return (
                                        <div key={msg.id} className="flex justify-center">
                                            <span className="text-xs text-zinc-500 italic bg-zinc-800/50 px-3 py-1 rounded-full">
                                                {msg.content}
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
                                    >
                                        {!isMyMessage && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarFallback className="text-[10px] bg-zinc-700">
                                                        {(msg.username?.[0] || '?').toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-[11px] text-zinc-500">{msg.username}</span>
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                                                isMyMessage
                                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                                    : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
                                            }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
                    
                <form onSubmit={handleSend} className="p-2 sm:p-3 border-t border-zinc-800 bg-zinc-900/50">
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Введите сообщение..."
                            className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:bg-zinc-800"
                        />
                        <Button
                            type="submit"
                            disabled={!newMessage.trim()}
                            size="icon"
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WatchRoom;
