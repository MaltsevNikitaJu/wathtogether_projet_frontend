import React, { useState } from 'react';
import { useCreatePaymentMutation } from '../api/apiSlice';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditCard, CheckCircle, Loader2 } from 'lucide-react';

interface PaymentSimulationDialogProps {
    open: boolean;
    onClose: () => void;
    plan: string;
    planName: string;
    price: string;
    onSuccess?: () => void;
}

const PaymentSimulationDialog: React.FC<PaymentSimulationDialogProps> = ({
    open,
    onClose,
    plan,
    planName,
    price,
}) => {
    const [step, setStep] = useState<'confirm' | 'processing'>('confirm');
    const [error, setError] = useState<string | null>(null);
    const [createPayment, { isLoading }] = useCreatePaymentMutation();

    const handlePayment = async () => {
        setError(null);
        setStep('processing');
        try {
            const res = await createPayment({ plan }).unwrap();
            if (res.confirmation_url) {
                window.location.href = res.confirmation_url;
            } else {
                setError('Не получен URL для оплаты');
                setStep('confirm');
            }
        } catch (err: unknown) {
            const errorData = err as { data?: { message?: string } };
            setError(errorData.data?.message || 'Не удалось создать платёж');
            setStep('confirm');
        }
    };

    const handleClose = () => {
        if (step === 'processing') return;
        onClose();
        setTimeout(() => {
            setStep('confirm');
            setError(null);
        }, 300);
    };

    const planFeatures = {
        'premium': [
            'Групповые чаты до 50 человек',
            'Загрузка собственных видео (50 ГБ)',
            'Расширенные эмодзи-реакции',
            'Приоритетная поддержка',
        ],
        'premium_plus': [
            'Все возможности Premium',
            '2 месяца бесплатно',
            'Безлимит групповых чатов',
            'Дополнительные 20 ГБ Storage',
            'Эксклюзивные стикерпаки',
        ],
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => e.preventDefault()}>
                {step === 'confirm' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Оплата через ЮKassa
                            </DialogTitle>
                            <DialogDescription>
                                Вы оформляете {planName} за {price}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                    <p className="text-sm text-destructive">{error}</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <h4 className="font-medium">Что вы получите:</h4>
                                <ul className="space-y-2">
                                    {planFeatures[plan as keyof typeof planFeatures]?.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm">
                                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
                                Оплата пройдёт на защищённой странице ЮKassa.
                                После успешной оплаты подписка активируется автоматически.
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                                Отмена
                            </Button>
                            <Button onClick={handlePayment} disabled={isLoading}>
                                {isLoading ? 'Создание платежа...' : `Оплатить ${price}`}
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {step === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <div className="text-center space-y-2">
                            <h3 className="font-semibold">Перенаправляем на оплату...</h3>
                            <p className="text-sm text-muted-foreground">
                                Не закрывайте окно. Сейчас откроется страница ЮKassa.
                            </p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PaymentSimulationDialog;
