import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const Card = forwardRef(({ className, glow, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'rounded-2xl bg-surface border border-border p-6 shadow-card transition-all duration-300 hover:border-border-light hover:shadow-card-hover',
            glow && 'hover:card-glow',
            className,
        )}
        {...props}
    />
));
Card.displayName = 'Card';

const CardHeader = forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 pb-4', className)}
        {...props}
    />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            'text-lg font-semibold leading-none tracking-tight text-white',
            className,
        )}
        {...props}
    />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn('text-sm text-muted leading-relaxed', className)}
        {...props}
    />
));
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'flex items-center pt-4 border-t border-border mt-4',
            className,
        )}
        {...props}
    />
));
CardFooter.displayName = 'CardFooter';

export {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardContent,
};
