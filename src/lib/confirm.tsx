import React, { createContext, useCallback, useContext, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'default';
}

interface AlertOptions {
    title?: string;
    description?: string;
    buttonText?: string;
    variant?: 'danger' | 'default';
}

type State =
    | { kind: 'confirm'; opts: ConfirmOptions; resolve: (v: boolean) => void }
    | { kind: 'alert'; opts: AlertOptions; resolve: () => void };

interface ConfirmContextValue {
    confirm: (opts?: ConfirmOptions) => Promise<boolean>;
    alert: (opts: AlertOptions) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export const useConfirm = (): ConfirmContextValue => {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useConfirm должен использоваться внутри <ConfirmProvider>');
    return ctx;
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<State | null>(null);

    const confirm = useCallback((opts: ConfirmOptions = {}) => {
        return new Promise<boolean>((resolve) => {
            setState({ kind: 'confirm', opts, resolve });
        });
    }, []);

    const alert = useCallback((opts: AlertOptions) => {
        return new Promise<void>((resolve) => {
            setState({ kind: 'alert', opts, resolve });
        });
    }, []);

    const handleConfirm = () => {
        if (state?.kind === 'confirm') state.resolve(true);
        setState(null);
    };

    const handleAlertOk = () => {
        if (state?.kind === 'alert') state.resolve();
        setState(null);
    };

    const handleClose = () => {
        if (state?.kind === 'confirm') state.resolve(false);
        if (state?.kind === 'alert') state.resolve();
        setState(null);
    };

    return (
        <ConfirmContext.Provider value={{ confirm, alert }}>
            {children}
            {state?.kind === 'confirm' && (
                <ConfirmDialog
                    open
                    onClose={handleClose}
                    onConfirm={handleConfirm}
                    title={state.opts.title}
                    description={state.opts.description}
                    confirmText={state.opts.confirmText}
                    cancelText={state.opts.cancelText}
                    variant={state.opts.variant}
                />
            )}
            {state?.kind === 'alert' && (
                <Dialog open onOpenChange={handleClose}>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                {state.opts.variant === 'danger' && (
                                    <div className="p-2 rounded-full bg-destructive/10">
                                        <AlertTriangle className="h-5 w-5 text-destructive" />
                                    </div>
                                )}
                                <DialogTitle>{state.opts.title || 'Внимание'}</DialogTitle>
                            </div>
                            <DialogDescription className="pl-11">
                                {state.opts.description}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="pl-11">
                            <Button
                                variant={state.opts.variant === 'danger' ? 'destructive' : 'default'}
                                onClick={handleAlertOk}
                            >
                                {state.opts.buttonText || 'ОК'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </ConfirmContext.Provider>
    );
};
