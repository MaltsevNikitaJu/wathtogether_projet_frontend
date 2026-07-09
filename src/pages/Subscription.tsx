import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGetSubscriptionQuery, useCancelSubscriptionMutation, useGetPaymentStatusQuery } from '../api/apiSlice';
import { Button } from '@/components/ui/button';
import { Check, Crown, Sparkles, Users, Upload, Smile } from 'lucide-react';
import PaymentSimulationDialog from '../components/PaymentSimulationDialog';
import { useConfirm } from '../lib/confirm';

const Subscription: React.FC = () => {
    const navigate = useNavigate();
    const { data: subscriptionData, refetch: refetchSubscription } = useGetSubscriptionQuery();
    const [cancelSubscription] = useCancelSubscriptionMutation();
    const { confirm } = useConfirm();

    const [searchParams, setSearchParams] = useSearchParams();
    const isReturning = searchParams.get('payment') === 'return';
    const { data: paymentStatusData } = useGetPaymentStatusQuery(undefined, {
        pollingInterval: 2000,
        skip: !isReturning,
    });

    useEffect(() => {
        if (!isReturning || !paymentStatusData) return;
        if (paymentStatusData.status === 'succeeded') {
            setMessage({ type: 'success', text: 'Оплата прошла успешно! Подписка активирована.' });
            refetchSubscription();
            const next = new URLSearchParams(searchParams);
            next.delete('payment');
            setSearchParams(next, { replace: true });
        } else if (paymentStatusData.status === 'canceled') {
            setMessage({ type: 'error', text: 'Платёж отменён или не выполнен.' });
            const next = new URLSearchParams(searchParams);
            next.delete('payment');
            setSearchParams(next, { replace: true });
        }
    }, [paymentStatusData, isReturning, refetchSubscription, searchParams, setSearchParams]);

    useEffect(() => {
        if (!isReturning) return;
        const timer = setTimeout(() => {
            const next = new URLSearchParams(searchParams);
            if (next.get('payment')) {
                next.delete('payment');
                setSearchParams(next, { replace: true });
                setMessage({ type: 'error', text: 'Не удалось подтвердить платёж вовремя. Проверьте позже.' });
            }
        }, 90000);
        return () => clearTimeout(timer);
    }, [isReturning]);

    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<{ plan: string; name: string; price: string } | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const currentSubscription = subscriptionData?.subscription;

    const plans = [
        {
            name: 'Free',
            plan: 'free',
            price: '0 ₽',
            period: 'навсегда',
            description: 'Базовые функции для начала',
            features: [
                'Личные чаты 1-on-1',
                'Просмотр видео вдвоём',
                'Базовые эмодзи',
                'Индивидуальный выбор качества',
            ],
            cta: currentSubscription?.plan === 'free' ? 'Текущий план' : 'Переключиться',
            highlighted: false,
        },
        {
            name: 'Premium',
            plan: 'premium',
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
            cta: currentSubscription?.plan === 'premium' ? 'Текущий план' : 'Оформить подписку',
            highlighted: true,
        },
        {
            name: 'Premium+',
            plan: 'premium_plus',
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
            cta: currentSubscription?.plan === 'premium_plus' ? 'Текущий план' : 'Выбрать план',
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

    const handleSubscribe = (plan: string, planName: string, price: string) => {
        setSelectedPlan({ plan, name: planName, price });
        setShowPaymentDialog(true);
    };

    const handlePaymentSuccess = () => {
        setMessage({ type: 'success', text: 'Подписка успешно оформлена!' });
        refetchSubscription();

        setTimeout(() => setMessage(null), 5000);
    };

    const handleCancelSubscription = async () => {
        const ok = await confirm({
            title: 'Отменить подписку?',
            description: 'Доступ сохранится до конца оплаченного периода.',
            confirmText: 'Отменить подписку',
            variant: 'danger',
        });
        if (!ok) return;

        try {
            await cancelSubscription().unwrap();
            setMessage({ type: 'success', text: 'Подписка отменена. Доступ сохранится до конца периода.' });
            refetchSubscription();
        } catch (err: unknown) {
            const errorData = err as { data?: { message?: string } };
            setMessage({ type: 'error', text: errorData.data?.message || 'Ошибка при отмене подписки' });
        }

        setTimeout(() => setMessage(null), 5000);
    };

    return (
        <div className="flex h-screen overflow-hidden flex-col bg-gradient-to-br from-background via-background to-primary/5">
            <div className="border-b bg-background/50 backdrop-blur-sm shrink-0">
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

            <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center justify-center gap-2 ${
                        message.type === 'success'
                            ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                {isReturning && (!paymentStatusData || paymentStatusData.status === 'pending') && (
                    <div className="mb-6 p-4 rounded-lg flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 shrink-0"></div>
                        <p className="text-sm font-medium">Обрабатываем платёж, подождите...</p>
                    </div>
                )}

                <div className="text-center mb-8">
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

                {currentSubscription && currentSubscription.plan !== 'free' && currentSubscription.status !== 'expired' && (
                    <div className="mb-8 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between max-w-4xl mx-auto">
                        <div className="flex items-center gap-3">
                            <Crown className="h-5 w-5 text-amber-500" />
                            <div>
                                <p className="font-medium text-amber-600 dark:text-amber-400">
                                    {currentSubscription.status === 'cancelled'
                                        ? 'Подписка отменена — доступ сохранён до конца периода'
                                        : `У вас ${currentSubscription.plan === 'premium' ? 'Premium' : 'Premium+'} подписка`}
                                </p>
                                {currentSubscription.end_date && (
                                    <p className="text-sm text-muted-foreground">
                                        Действует до {new Date(currentSubscription.end_date).toLocaleDateString('ru-RU')}
                                    </p>
                                )}
                            </div>
                        </div>
                        {currentSubscription.status === 'active' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelSubscription}
                                className="text-destructive hover:text-destructive"
                            >
                                Отменить
                            </Button>
                        )}
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-4 sm:gap-6 mb-16 max-w-6xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative rounded-2xl border-2 p-4 sm:p-6 transition-all hover:shadow-lg ${
                                plan.highlighted
                                    ? 'border-primary bg-primary/5 shadow-xl'
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
                                onClick={() => {
                                    if (plan.plan === 'free') {
                                        setMessage({ type: 'error', text: 'У вас уже бесплатный план' });
                                        setTimeout(() => setMessage(null), 3000);
                                    } else if (plan.cta === 'Текущий план') {
                                        setMessage({ type: 'error', text: `У вас уже ${plan.name} план` });
                                        setTimeout(() => setMessage(null), 3000);
                                    } else {
                                        handleSubscribe(plan.plan, plan.name, plan.price);
                                    }
                                }}
                                disabled={plan.cta === 'Текущий план'}
                            >
                                {plan.cta}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="mb-16 max-w-6xl mx-auto">
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

                <div className="max-w-3xl mx-auto">
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

                {selectedPlan && (
                    <PaymentSimulationDialog
                        open={showPaymentDialog}
                        onClose={() => setShowPaymentDialog(false)}
                        plan={selectedPlan.plan}
                        planName={selectedPlan.name}
                        price={selectedPlan.price}
                        onSuccess={handlePaymentSuccess}
                    />
                )}
            </div>
            </div>
        </div>
    );
};

export default Subscription;
