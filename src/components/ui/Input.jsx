import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const Input = forwardRef(
    ({ className, type, label, error, icon: Icon, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-muted mb-1.5">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {Icon && (
                        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    )}
                    <input
                        type={type}
                        className={cn(
                            'flex h-10 w-full rounded-xl border border-border bg-navy-900 text-sm text-white placeholder:text-muted-foreground',
                            'transition-all duration-200',
                            'focus:outline-none focus:input-ring',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            'hover:border-border-light',
                            Icon ? 'pl-10 pr-4 py-2' : 'px-4 py-2',
                            error &&
                                'border-danger/50 focus:border-danger/50 focus:ring-danger/15',
                            className,
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
                {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
            </div>
        );
    },
);
Input.displayName = 'Input';

export { Input };
