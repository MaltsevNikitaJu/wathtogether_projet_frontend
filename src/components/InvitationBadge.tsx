import React from 'react';
import { Badge } from '@/components/ui/badge';

interface InvitationBadgeProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
}

const InvitationBadge: React.FC<InvitationBadgeProps> = ({ count, size = 'sm' }) => {
  if (count === 0) return null;

  const sizeClasses = {
    sm: 'h-5 w-5 text-[10px]',
    md: 'h-6 w-6 text-xs',
    lg: 'h-7 w-7 text-sm',
  };

  return (
    <Badge className={`shrink-0 ${sizeClasses[size]} bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center p-0`}>
      {count > 9 ? '9+' : count}
    </Badge>
  );
};

export default InvitationBadge;
