import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';

/**
 * Badge variants (CVA):
 *   default  — green (primary / active)
 *   success  — green (active, confirmed)
 *   warning  — amber/yellow (pending)
 *   danger   — red (error, blocked)
 *   info     — blue (informational)
 *   outline  — bordered, muted
 *   secondary — subtle gray
 */
const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-full text-xs font-medium transition-colors',
    {
        variants: {
            variant: {
                default: 'bg-primary/15 text-primary',
                success: 'bg-green-500/15 text-green-400',
                warning: 'bg-amber-500/15 text-amber-400',
                danger: 'bg-red-500/15 text-red-400',
                info: 'bg-blue-500/15 text-blue-400',
                outline: 'border border-border-light text-muted',
                secondary: 'bg-navy-700/50 text-muted',
            },
            size: {
                sm: 'px-1.5 py-0.5 text-[10px]',
                md: 'px-2.5 py-0.5 text-xs',
                lg: 'px-3 py-1 text-sm',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    },
);

/**
 * Badge — status/label pill.
 *
 * @param {string}  variant  — "default" | "success" | "warning" | "danger" | "info" | "outline" | "secondary"
 * @param {string}  size     — "sm" | "md" | "lg"
 * @param {boolean} dot      — Show a colored dot indicator before the text
 */
function Badge({ className, variant, size, dot, children, ...props }) {
    const dotColors = {
        default: 'bg-primary',
        success: 'bg-green-400',
        warning: 'bg-amber-400',
        danger: 'bg-red-400',
        info: 'bg-blue-400',
        outline: 'bg-muted-foreground',
        secondary: 'bg-muted-foreground',
    };

    return (
        <span
            className={cn(badgeVariants({ variant, size }), className)}
            {...props}
        >
            {dot && (
                <span
                    className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        dotColors[variant || 'default'],
                    )}
                />
            )}
            {children}
        </span>
    );
}

export { Badge, badgeVariants };
