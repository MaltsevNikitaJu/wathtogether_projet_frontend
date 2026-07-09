import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { getSocket } from '../utils/socket';
import { useGetMessagesQuery, useGetProfileQuery, useGetChatQuery } from '../api/apiSlice';
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
    avatar_url?: string;
}

interface QualityLevelsLike {
    length: number;
    on(event: string, listener: () => void): void;
    [index: number]: { height: number; enabled: boolean };
}

const getQualityLevels = (player: ReturnType<typeof videojs>): QualityLevelsLike => {
    return (player as unknown as { qualityLevels: () => QualityLevelsLike }).qualityLevels();
};

const applyQualityToPlayer = (player: ReturnType<typeof videojs>, value: string) => {
    try {
        const levels = getQualityLevels(player);
        if (value === 'auto') {
            for (let i = 0; i < levels.length; i++) levels[i].enabled = true;
        } else {
            const target = parseInt(value, 10);
            for (let i = 0; i < levels.length; i++) {
                levels[i].enabled = levels[i].height === target;
            }
        }
    } catch {
    }
};

const REACTIONS = ['👍', '❤️', '🔥', '😂', '😮', '🎉', '👏'];

const WatchRoom: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const videoUrl = searchParams.get('url');
    const chatId = searchParams.get('chatId');

    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
    const lastRemoteApply = useRef(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showSettings, setShowSettings] = useState(false);

    const staticUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
    const [currentQuality, setCurrentQuality] = useState(() => localStorage.getItem('video-quality') || 'auto');
    const [currentSpeed, setCurrentSpeed] = useState(() => parseFloat(localStorage.getItem('video-speed') || '1'));
    const [qualityOptions, setQualityOptions] = useState<string[]>(['auto']);
    const [hostOnlyControls, setHostOnlyControls] = useState(false);

    const hostOnlyControlsRef = useRef(false);
    const isCreatorRef = useRef(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [hasStarted, setHasStarted] = useState(false);
    const [floaters, setFloaters] = useState<{ id: number; emoji: string; x: number }[]>([]);
    const floaterIdRef = useRef(0);

    const addFloater = (emoji: string) => {
        const id = ++floaterIdRef.current;
        const x = 8 + Math.round(Math.random() * 84);
        setFloaters((prev) => [...prev, { id, emoji, x }]);
        setTimeout(() => setFloaters((prev) => prev.filter((f) => f.id !== id)), 2500);
    };

    const handleReaction = (emoji: string) => {
        if (!chatId) return;
        addFloater(emoji);
        const socket = getSocket();
        socket.emit('send_reaction', { chatId, emoji });
    };

    const { data: messagesData } = useGetMessagesQuery(chatId || '');
    const { data: profileData } = useGetProfileQuery();
    const { data: chatData } = useGetChatQuery(chatId || '', { skip: !chatId });
    const myUserId = profileData?.user?.id;
    const isCreator = myUserId !== undefined && chatData?.chat?.created_by === myUserId;
    const controlsDisabled = hostOnlyControls && !isCreator;

    useEffect(() => {
        if (messagesData?.messages) setMessages(messagesData.messages);
    }, [messagesData, myUserId]);

    useEffect(() => {
        if (chatData?.chat) {
            setHostOnlyControls(!!chatData.chat.host_only_controls);
        }
    }, [chatData]);

    useEffect(() => {
        hostOnlyControlsRef.current = hostOnlyControls;
        isCreatorRef.current = isCreator;
        if (playerRef.current) {
            playerRef.current.controls(!controlsDisabled);
        }
    }, [hostOnlyControls, isCreator, controlsDisabled]);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 1800);
        return () => clearTimeout(t);
    }, [notice]);

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

        const levels = getQualityLevels(player);
        const updateQualityOptions = () => {
            const heights = new Set<number>();
            for (let i = 0; i < levels.length; i++) {
                if (levels[i].height) heights.add(levels[i].height);
            }
            const opts = ['auto', ...Array.from(heights).sort((a, b) => b - a).map(h => `${h}p`)];
            setQualityOptions(opts);
        };
        levels.on('addqualitylevel', updateQualityOptions);
        player.on('loadedmetadata', () => {
            updateQualityOptions();
            applyQualityToPlayer(player, localStorage.getItem('video-quality') || 'auto');
        });

        const sendSyncEvent = (action: string) => {
            if (Date.now() - lastRemoteApply.current < 500) return;
            if (hostOnlyControlsRef.current && !isCreatorRef.current) return;
            if (action === 'play') setHasStarted(true);
            socket.emit('video_action', {
                chatId,
                action,
                time: player.currentTime(),
            });
        };

        player.on('play', () => sendSyncEvent('play'));
        player.on('pause', () => sendSyncEvent('pause'));
        player.on('seeked', () => sendSyncEvent('seek'));

        const handleVideoSync = (data: { action: string; time: number }) => {
            lastRemoteApply.current = Date.now();

            if (data.action === 'play') {
                setHasStarted(true);
                player.currentTime(data.time);
                player.play()?.catch(() => {});
            } else if (data.action === 'pause') {
                player.currentTime(data.time);
                player.pause();
            } else if (data.action === 'seek') {
                player.currentTime(data.time);
            }
        };

        const handleInitialState = (state: { action: string; time: number }) => {
            lastRemoteApply.current = Date.now();
            setHasStarted(true);
            player.currentTime(state.time);

            if (state.action === 'pause') {
                player.pause();
            } else if (state.action === 'play') {
                player.play()?.catch(() => {});
            }
        };

        const handleSettingsUpdated = (data: { host_only_controls: boolean }) => {
            setHostOnlyControls(!!data.host_only_controls);
        };

        const handleSocketError = (data: { message?: string }) => {
            if (data?.message) setNotice(data.message);
        };

        const handleReactionEvent = (data: { emoji: string }) => {
            addFloater(data.emoji);
        };

        socket.on('initial_video_state', handleInitialState);
        socket.on('sync_video', handleVideoSync);
        socket.on('chat_settings_updated', handleSettingsUpdated);
        socket.on('error', handleSocketError);
        socket.on('reaction', handleReactionEvent);

        return () => {
            socket.off('initial_video_state', handleInitialState);
            socket.off('sync_video', handleVideoSync);
            socket.off('chat_settings_updated', handleSettingsUpdated);
            socket.off('error', handleSocketError);
            socket.off('reaction', handleReactionEvent);
            socket.off('receive_message', handleNewMessage);
            socket.emit('leave_chat', chatId);

            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [videoUrl, chatId]);

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
        if (playerRef.current) {
            applyQualityToPlayer(playerRef.current, quality);
        }
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
                    {controlsDisabled && (
                        <span className="text-xs text-amber-400 hidden sm:inline">
                            🔒 Режим «только ведущий» — управляет создатель
                        </span>
                    )}
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

                    {notice && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-zinc-900/90 text-white text-sm px-4 py-2 rounded-lg shadow-lg border border-zinc-700">
                            {notice}
                        </div>
                    )}

                    {!hasStarted && (
                        <div className="absolute inset-2 sm:inset-4 z-10 flex flex-col items-center justify-center bg-black/60 rounded-lg text-center pointer-events-none">
                            <p className="text-white text-lg font-medium">Ожидание участников…</p>
                            <p className="text-zinc-300 text-sm mt-1">Нажмите Play, чтобы начать просмотр</p>
                        </div>
                    )}

                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
                        {floaters.map((f) => (
                            <div
                                key={f.id}
                                className="absolute bottom-4 text-4xl reaction-float drop-shadow-lg"
                                style={{ left: `${f.x}%` }}
                            >
                                {f.emoji}
                            </div>
                        ))}
                    </div>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[6] flex gap-1 bg-zinc-900/85 border border-zinc-700 rounded-full px-2 py-1 shadow-lg backdrop-blur">
                        {REACTIONS.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => handleReaction(emoji)}
                                className="text-xl hover:scale-125 transition-transform px-1"
                            >
                                {emoji}
                            </button>
                        ))}
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
                                            value={qualityOptions.includes(currentQuality) ? currentQuality : 'auto'}
                                            onChange={(e) => handleQualityChange(e.target.value)}
                                            className="mt-1 w-full bg-zinc-800 text-white rounded px-3 py-2 text-sm border border-zinc-700"
                                        >
                                            {qualityOptions.map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt === 'auto' ? 'Авто' : opt}
                                                </option>
                                            ))}
                                        </select>
                                        {qualityOptions.length <= 1 && (
                                            <p className="text-xs text-zinc-500 mt-1">
                                                Множественные качества недоступны для этого источника
                                            </p>
                                        )}
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
                    <span className="ml-auto text-xs text-zinc-500 truncate max-w-[50%]">{chatData?.chat?.name || 'Чат'}</span>
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
                                                    {msg.avatar_url ? (
                                                        <img src={`${staticUrl}${msg.avatar_url}`} alt={msg.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <AvatarFallback className="text-[10px] bg-zinc-700">
                                                            {(msg.username?.[0] || '?').toUpperCase()}
                                                        </AvatarFallback>
                                                    )}
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
