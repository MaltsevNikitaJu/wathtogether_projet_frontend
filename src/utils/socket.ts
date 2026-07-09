import { io, Socket } from 'socket.io-client';
import { getToken } from './token';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

let socket: Socket | null = null;
let currentToken: string | null = null;

export const getSocket = (): Socket => {
    const token = getToken();
    if (!token) {
        throw new Error('Невозможно подключиться к веб-сокету: нет токена');
    }

    if (token !== currentToken) {
        disconnectSocket();
        currentToken = token;
    }

    if (socket && socket.connected) {
        return socket;
    }

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        currentToken = null;
    }
};
