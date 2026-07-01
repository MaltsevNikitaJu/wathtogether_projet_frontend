import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { getSocket } from '../utils/socket';

const WatchRoom: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const videoUrl = searchParams.get('url');
    const chatId = searchParams.get('chatId');

    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
    const isApplyingRemoteAction = useRef(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !videoUrl || !chatId) return;

        const socket = getSocket();
        socket.emit('join_chat', chatId);

        container.innerHTML = '';
        const videoElement = document.createElement('video');
        videoElement.className = 'video-js vjs-big-play-centered';
        container.appendChild(videoElement);

        const player = videojs(videoElement, {
            controls: true,
            autoplay: false,
            preload: 'auto',
            responsive: true,
            sources: [{ src: videoUrl, type: 'video/mp4' }],
        });

        playerRef.current = player;

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
                player.play().catch(() => {});
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
                player.play().catch(() => {});
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
            socket.emit('leave_chat', chatId);

            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [videoUrl, chatId]);

    if (!videoUrl || !chatId) {
        return <div style={{ padding: '20px', color: 'white' }}>Ошибка: Не передана ссылка на видео или ID чата.</div>;
    }

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#000' }}>
            <div style={{ flex: 2, padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ marginBottom: '15px', color: 'white', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                >
                    ← Назад в чат
                </button>
                <div style={{
                    width: '100%',
                    aspectRatio: '16 / 9',
                    maxHeight: '80vh',
                    backgroundColor: '#000',
                    borderRadius: '8px',
                    overflow: 'hidden',
                }}>
                    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
                </div>
            </div>
            <div style={{
                flex: 1,
                background: '#1e1e1e',
                borderLeft: '1px solid #333',
                display: 'flex',
                flexDirection: 'column',
                color: 'white',
            }}>
                <div style={{ padding: '15px', borderBottom: '1px solid #333' }}>
                    <strong>Чат комнаты</strong>
                </div>
                <div style={{ flex: 1, padding: '15px', overflowY: 'auto' }}>
                    <p style={{ color: 'gray' }}>Сюда перенесем сообщения из чата...</p>
                </div>
            </div>
        </div>
    );
};

export default WatchRoom;
