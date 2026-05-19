import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const Toggle = forwardRef(
    (
        {
            className,
            checked,
            onCheckedChange,
            disabled,
            size = 'default',
            label,
            ...props
        },
        ref,
    ) => {
        const sizes = {
            sm: {
                track: 'w-8 h-[18px]',
                thumb: 'w-3.5 h-3.5',
                translate: 'translate-x-3.5',
            },
            default: {
                track: 'w-11 h-6',
                thumb: 'w-5 h-5',
                translate: 'translate-x-5',
            },
            lg: {
                track: 'w-14 h-7',
                thumb: 'w-6 h-6',
                translate: 'translate-x-7',
            },
        };

        const s = sizes[size] || sizes.default;

        return (
            <label
                className={cn(
                    'inline-flex items-center gap-3 cursor-pointer select-none',
                    disabled && 'opacity-50 cursor-not-allowed',
                    className,
                )}
            >
                <button
                    ref={ref}
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    disabled={disabled}
                    onClick={() => !disabled && onCheckedChange?.(!checked)}
                    className={cn(
                        'relative inline-flex shrink-0 items-center rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950',
                        s.track,
                        checked
                            ? 'bg-primary shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                            : 'bg-navy-600 hover:bg-navy-500',
                    )}
                    {...props}
                >
                    <span
                        className={cn(
                            'pointer-events-none inline-block rounded-full bg-white shadow-lg transition-all duration-300 ease-out',
                            s.thumb,
                            checked ? s.translate : 'translate-x-0.5',
                        )}
                    />
                </button>
                {label && <span className="text-sm text-white">{label}</span>}
            </label>
        );
    },
);
Toggle.displayName = 'Toggle';

export { Toggle };
