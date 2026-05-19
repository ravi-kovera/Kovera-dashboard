import { cn } from '@/lib/utils';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomSelect — fully styled dropdown replacing native <select>.
 * Supports keyboard nav, click-outside close, and smooth animations.
 *
 * @param {string}   value       - Current selected value
 * @param {function} onChange    - Callback (value) => void
 * @param {Array}    options     - [{ value, label, icon? }] or ["string"]
 * @param {string}   placeholder - Placeholder text
 * @param {string}   label       - Optional label above select
 * @param {string}   error       - Optional error message
 * @param {string}   size        - "sm" | "md" | "lg"
 */
function Select({
    value,
    onChange,
    options = [],
    placeholder = 'Select...',
    label,
    error,
    className,
    size = 'md',
    disabled = false,
    children,
    ...props
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Normalize options — support both [{value, label}] and raw <option> children
    const normalizedOptions =
        options.length > 0
            ? options.map((opt) =>
                  typeof opt === 'string' ? { value: opt, label: opt } : opt,
              )
            : [];

    // If children (native <option> elements) are provided, extract them
    const childOptions = [];
    if (children && normalizedOptions.length === 0) {
        const childArray = Array.isArray(children) ? children : [children];
        childArray.forEach((child) => {
            if (child?.props) {
                childOptions.push({
                    value: child.props.value ?? child.props.children,
                    label: child.props.children,
                    disabled: child.props.disabled,
                });
            }
        });
    }

    const allOptions =
        normalizedOptions.length > 0 ? normalizedOptions : childOptions;
    const selectedOption = allOptions.find(
        (opt) => String(opt.value) === String(value),
    );

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open]);

    const handleSelect = useCallback(
        (optValue) => {
            onChange?.(optValue);
            // Also fire a synthetic event for forms using e.target.value pattern
            const syntheticEvent = { target: { value: optValue } };
            if (typeof onChange === 'function') onChange(syntheticEvent);
            setOpen(false);
        },
        [onChange],
    );

    const sizes = {
        sm: 'h-8 text-xs px-3',
        md: 'h-10 text-sm px-4',
        lg: 'h-12 text-base px-4',
    };

    return (
        <div className={cn('w-full', className)} ref={ref}>
            {label && (
                <label className="block text-sm font-medium text-muted mb-1.5">
                    {label}
                </label>
            )}

            {/* Trigger */}
            <button
                type="button"
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                className={cn(
                    'relative flex items-center justify-between w-full rounded-xl border border-border bg-navy-900 text-left transition-all duration-200 cursor-pointer',
                    sizes[size],
                    'hover:border-border-light',
                    'focus:outline-none focus:input-ring',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    open && 'border-primary/50 input-ring',
                    error && 'border-danger/50',
                )}
            >
                <span
                    className={cn(
                        'truncate pr-6',
                        selectedOption ? 'text-white' : 'text-muted-foreground',
                    )}
                >
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown
                    className={cn(
                        'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform duration-200',
                        open && 'rotate-180',
                    )}
                />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1.5 w-full min-w-[160px] max-h-56 overflow-y-auto rounded-xl border border-border bg-navy-900 shadow-elevated animate-slide-down">
                    <div className="p-1">
                        {allOptions.map((opt) => {
                            const isSelected =
                                String(opt.value) === String(value);
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() =>
                                        !opt.disabled && handleSelect(opt.value)
                                    }
                                    disabled={opt.disabled}
                                    className={cn(
                                        'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-all duration-150 cursor-pointer',
                                        isSelected
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'text-muted hover:bg-surface-hover hover:text-white',
                                        opt.disabled &&
                                            'opacity-40 cursor-not-allowed',
                                    )}
                                >
                                    <span className="flex items-center gap-2 truncate">
                                        {opt.icon && (
                                            <opt.icon className="w-4 h-4 shrink-0" />
                                        )}
                                        {opt.label}
                                    </span>
                                    {isSelected && (
                                        <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                                    )}
                                </button>
                            );
                        })}
                        {allOptions.length === 0 && (
                            <p className="px-3 py-2 text-sm text-muted-foreground">
                                No options
                            </p>
                        )}
                    </div>
                </div>
            )}

            {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
        </div>
    );
}

Select.displayName = 'Select';
export { Select };
