import { io, Socket } from 'socket.io-client';
import { getToken } from './token';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (socket && socket.connected) {
        return socket;
    }

    const token = getToken();
    if (!token) {
        throw new Error('Невозможно подключиться к веб-сокету: нет токена');
    }

    socket = io('http://localhost:3001', {
        auth: { token },
        transports: ['websocket'],
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
