import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const Textarea = forwardRef(({ className, label, error, ...props }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-muted mb-1.5">
                    {label}
                </label>
            )}
            <textarea
                className={cn(
                    'flex min-h-[100px] w-full rounded-xl border border-border bg-navy-900 px-4 py-3 text-sm text-white placeholder:text-muted-foreground resize-y',
                    'transition-all duration-200',
                    'focus:outline-none focus:input-ring',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'hover:border-border-light',
                    error && 'border-danger/50 focus:border-danger/50',
                    className,
                )}
                ref={ref}
                {...props}
            />
            {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
        </div>
    );
});
Textarea.displayName = 'Textarea';

export { Textarea };
