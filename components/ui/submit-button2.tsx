'use client';
import { Button, ButtonProps } from './button';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function SubmitButton2({ ...props }: ButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      disabled={pending || props.disabled}
      {...props}
      className={cn(props.className, pending && 'bg-muted-foreground')}
    >
      {pending ? <Loader2 className="animate-spin" /> : props.children}
    </Button>
  );
}
