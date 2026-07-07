import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { Button } from '@/components/ui/button';
import { Check, Crown, Sparkles, Users, Upload, Smile } from 'lucide-react';

const Subscription: React.FC = () => {
    const navigate = useNavigate();
    const { info } = useToast();

    const plans = [
        {
            name: 'Free',
            price: '0 ₽',
            period: 'навсегда',
            description: 'Базовые функции для начала',
            features: [
                'Личные чаты 1-on-1',
                'Просмотр видео вдвоём',
                'Базовые эмодзи',
                'Индивидуальный выбор качества',
            ],
            cta: 'Текущий план',
            highlighted: false,
        },
        {
            name: 'Premium',
            price: '299 ₽',
            period: '/месяц',
            description: 'Полный доступ к возможностям',
            features: [
                'Групповые чаты до 50 человек',
                'Загрузка собственных видео (50 ГБ)',
                'Расширенные эмодзи-реакции',
                'Синхронизация для групп',
                'Приоритетная поддержка',
                'Без рекламы',
            ],
            cta: 'Оформить подписку',
            highlighted: true,
        },
        {
            name: 'Premium+',
            price: '2499 ₽',
            period: '/год',
            description: 'Выгоднее на 30%',
            features: [
                'Всё из Premium',
                '2 месяца бесплатно',
                'Дополнительные 20 ГБ Storage',
                'Эксклюзивные стикерпаки',
                'Персональные настройки',
            ],
            cta: 'Выбрать план',
            highlighted: false,
            badge: 'Популярный',
        },
    ];

    const features = [
        {
            icon: <Users className="h-6 w-6" />,
            title: 'Групповой просмотр',
            description: 'Создавайте комнаты для 3-50 человек и смотрите видео вместе',
        },
        {
            icon: <Upload className="h-6 w-6" />,
            title: 'Загрузка видео',
            description: 'Загружайте свои фильмы на сервер (50 ГБ места)',
        },
        {
            icon: <Smile className="h-6 w-6" />,
            title: 'Реакции',
            description: 'Всплывающие эмодзи-реакции во время просмотра',
        },
        {
            icon: <Sparkles className="h-6 w-6" />,
            title: 'Без ограничений',
            description: 'Максимальное качество и без рекламы',
        },
    ];

    const handleSubscribe = (planName: string) => {
        info(`Оформление подписки: ${planName}\n\nВ разработке.`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-y-auto">
            <div className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <Crown className="h-6 w-6 text-amber-500" />
                            <h1 className="text-xl font-bold">WatchTogether Premium</h1>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/chats')}>
                            Вернуться в чаты
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                            Специальное предложение: первый месяц бесплатно!
                        </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                        Раскройте полный потенциал
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Получите доступ к групповым просмотрам, загрузке видео и эксклюзивным функциям
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 sm:gap-6 mb-16">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative rounded-2xl border-2 p-4 sm:p-6 transition-all hover:shadow-lg ${
                                plan.highlighted
                                    ? 'border-primary bg-primary/5 shadow-xl scale-105'
                                    : 'border-border bg-card'
                            }`}
                        >
                            {plan.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                                        {plan.badge}
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="text-muted-foreground">{plan.period}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                            </div>

                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className="w-full"
                                variant={plan.highlighted ? 'default' : 'outline'}
                                onClick={() => handleSubscribe(plan.name)}
                            >
                                {plan.cta}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-center mb-8">
                        Всё что нужно для совместного просмотра
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="p-4 sm:p-6 rounded-xl border bg-card text-center hover:shadow-md transition-shadow"
                            >
                                <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4 text-primary">
                                    {feature.icon}
                                </div>
                                <h4 className="font-semibold mb-2">{feature.title}</h4>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="max-w-2xl mx-auto">
                    <h3 className="text-2xl font-bold text-center mb-8">Частые вопросы</h3>
                    <div className="space-y-4">
                        {[
                            {
                                q: 'Как отменить подписку?',
                                a: 'Вы можете отменить подписку в любой момент. Доступ сохранится до конца оплаченного периода.',
                            },
                            {
                                q: 'Можно ли загрузить свои фильмы?',
                                a: 'Да, Premium пользователи могут загружать до 50 ГБ видео на наш сервер.',
                            },
                            {
                                q: 'Сколько человек может смотреть вместе?',
                                a: 'В Premium режиме можно создавать комнаты до 50 человек.',
                            },
                            {
                                q: 'Какие способы оплаты доступны?',
                                a: 'Мы принимаем банковские карты, Яндекс.Пэй и другие платежные системы.',
                            },
                        ].map((faq, index) => (
                            <div key={index} className="p-4 rounded-lg border bg-card">
                                <h4 className="font-semibold mb-2">{faq.q}</h4>
                                <p className="text-sm text-muted-foreground">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Subscription;
