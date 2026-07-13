import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { saveToken } from '../utils/token';
import { getSocket } from '../utils/socket';

const OAuthSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            const messages: Record<string, string> = {
                state: 'Ошибка проверки безопасности. Попробуйте снова',
                no_code: 'Яндекс не вернул код авторизации',
                token: 'Не удалось получить токен от Яндекса',
                userinfo: 'Не удалось получить данные пользователя',
                config: 'OAuth не настроен на сервере (проверьте .env)',
                server: 'Внутренняя ошибка сервера при авторизации',
            };
            navigate(`/login?oauth_error=${encodeURIComponent(messages[error] || 'Ошибка авторизации')}`, { replace: true });
            return;
        }

        if (token) {
            saveToken(token);
            getSocket();
            navigate('/chats', { replace: true });
        } else {
            navigate('/login', { replace: true });
        }
    }, [searchParams, navigate]);

    return (
        <div className="flex h-screen items-center justify-center bg-muted/40">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Вход через Яндекс...</p>
            </div>
        </div>
    );
};

export default OAuthSuccess;
