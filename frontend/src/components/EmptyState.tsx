import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
  buttonHref?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  buttonText,
  onButtonClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      {icon && (
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold font-heading mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-xs mb-6">{description}</p>
      {buttonText && onButtonClick && (
        <Button onClick={onButtonClick} className="min-h-[44px] px-6">
          {buttonText}
        </Button>
      )}
    </div>
  );
}
