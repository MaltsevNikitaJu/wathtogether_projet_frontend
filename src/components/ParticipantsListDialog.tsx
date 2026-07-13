import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';

interface Participant {
    id: number;
    username: string;
    avatar_url?: string;
    is_creator?: boolean;
}

interface ParticipantsListDialogProps {
    open: boolean;
    onClose: () => void;
    participants: Participant[];
    currentUserId?: number;
    chatName: string;
}

const ParticipantsListDialog: React.FC<ParticipantsListDialogProps> = ({
    open,
    onClose,
    participants,
    currentUserId,
    chatName,
}) => {
    const staticUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Участники чата "{chatName}"
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] mt-4">
                    <div className="space-y-2 pr-4">
                        {participants.length > 0 ? (
                            participants.map((participant) => (
                                <div
                                    key={participant.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg ${
                                        participant.id === currentUserId
                                            ? 'bg-primary/10 border border-primary/20'
                                            : 'bg-muted/30'
                                    }`}
                                >
                                    <Avatar className="h-10 w-10 shrink-0">
                                        {participant.avatar_url ? (
                                            <img
                                                src={`${staticUrl}${participant.avatar_url}`}
                                                alt={participant.username}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                                                {(participant.username?.[0] || '?').toUpperCase()}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {participant.username}
                                            {participant.id === currentUserId && (
                                                <span className="ml-2 text-xs text-primary">(Вы)</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {participant.id === currentUserId ? 'Вы' : participant.is_creator ? 'Создатель' : 'Участник'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Нет участников
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default ParticipantsListDialog;
