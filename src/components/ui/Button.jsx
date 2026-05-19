import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
    {
        variants: {
            variant: {
                default:
                    'gradient-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98]',
                secondary:
                    'bg-surface text-white border border-border hover:bg-surface-hover hover:border-border-light',
                outline:
                    'border border-border-light text-white bg-transparent hover:bg-surface hover:border-primary/40',
                ghost: 'text-muted hover:text-white hover:bg-surface',
                danger: 'bg-danger/90 text-white hover:bg-danger shadow-lg shadow-danger/20',
                success:
                    'bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25 hover:border-primary/40',
                link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
            },
            size: {
                default: 'h-10 px-5 py-2',
                sm: 'h-8 px-3 text-xs rounded-lg',
                lg: 'h-12 px-8 text-base rounded-2xl',
                xl: 'h-14 px-10 text-base rounded-2xl',
                icon: 'h-10 w-10 rounded-xl',
                'icon-sm': 'h-8 w-8 rounded-lg',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

const Button = forwardRef(
    (
        { className, variant, size, loading, children, disabled, ...props },
        ref,
    ) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || loading}
                {...props}
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {children}
            </button>
        );
    },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
