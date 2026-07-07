import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegisterMutation } from '../api/apiSlice';
import { useToast } from '../hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const Register: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string; general?: string }>({});

    const [register, { isLoading }] = useRegisterMutation();
    const navigate = useNavigate();
    const { success, info } = useToast();

    const validateForm = () => {
        const newErrors: { username?: string; email?: string; password?: string; general?: string } = {};

        if (!username) {
            newErrors.username = 'Имя пользователя обязательно';
        } else if (username.length < 3 || username.length > 30) {
            newErrors.username = 'Имя пользователя должно быть от 3 до 30 символов';
        } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            newErrors.username = 'Только буквы, цифры, дефис и подчеркивание';
        }

        if (!email) {
            newErrors.email = 'Email обязателен';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Некорректный формат email';
        }

        if (!password) {
            newErrors.password = 'Пароль обязателен';
        } else if (password.length < 8 || password.length > 100) {
            newErrors.password = 'Пароль должен быть от 8 до 100 символов';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await register({ username, email, password }).unwrap();
            success('Регистрация успешна! Теперь войдите.');
            navigate('/login');
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            const errorMessage = errorData.data?.message || 'Ошибка при регистрации';
            setErrors({ general: errorMessage });
        }
    };

    const handleOAuthLogin = (provider: 'vk' | 'yandex') => {
        info(`Регистрация через ${provider === 'vk' ? 'ВКонтакте' : 'Яндекс'} будет добавлена позже.`);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4 overflow-y-auto">
            <div className="w-full max-w-sm rounded-lg border bg-card p-4 sm:p-6 shadow-sm my-auto">
                <div className="mb-4 sm:mb-6 text-center">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        Создать аккаунт
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Заполните данные для регистрации
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 mb-4">
                    {errors.general && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                            <p className="text-sm text-destructive text-center">{errors.general}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="username">Имя пользователя</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="IvanIvanov"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                if (errors.username) {
                                    setErrors({ ...errors, username: undefined });
                                }
                            }}
                            required
                            className={errors.username ? 'border-destructive' : ''}
                        />
                        {errors.username && (
                            <p className="text-sm text-destructive">{errors.username}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="test@example.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) {
                                    setErrors({ ...errors, email: undefined });
                                }
                            }}
                            required
                            className={errors.email ? 'border-destructive' : ''}
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Пароль</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errors.password) {
                                    setErrors({ ...errors, password: undefined });
                                }
                            }}
                            required
                            className={errors.password ? 'border-destructive' : ''}
                        />
                        {errors.password && (
                            <p className="text-sm text-destructive">{errors.password}</p>
                        )}
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </Button>
                </form>

                <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                        <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">или</span>
                    </div>
                </div>
                        
                <div className="space-y-2 mb-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleOAuthLogin('vk')}
                    >
                        Войти через ВКонтакте
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleOAuthLogin('yandex')}
                    >
                        Войти через Яндекс
                    </Button>
                </div>

                <div className="mt-4 text-center text-sm text-muted-foreground">
                    Уже есть аккаунт?{' '}
                    <Link to="/login" className="underline underline-offset-4 hover:text-primary">
                        Войти
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;