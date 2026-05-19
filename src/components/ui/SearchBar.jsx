import { cn } from '@/lib/utils';
import { forwardRef, useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';

/**
 * SearchBar — reusable search input with debounce and clear button.
 *
 * @param {string}   value          - Current search value (controlled)
 * @param {function} onChange        - Raw onChange handler (fires on every keystroke)
 * @param {function} onSearch        - Debounced search callback (fires after delay)
 * @param {number}   debounce        - Debounce delay in ms (default 300)
 * @param {string}   placeholder     - Input placeholder text
 * @param {boolean}  autoFocus       - Auto-focus on mount
 * @param {string}   size            - "sm" | "md" | "lg"
 * @param {string}   className       - Additional classes for the wrapper
 */
const SearchBar = forwardRef(
    (
        {
            value: controlledValue,
            onChange,
            onSearch,
            debounce = 300,
            placeholder = 'Search...',
            autoFocus = false,
            size = 'md',
            className,
            ...props
        },
        ref,
    ) => {
        // Support both controlled and uncontrolled modes
        const [internalValue, setInternalValue] = useState(
            controlledValue ?? '',
        );
        const value =
            controlledValue !== undefined ? controlledValue : internalValue;

        // Debounced search
        useEffect(() => {
            if (!onSearch) return;
            const timer = setTimeout(() => onSearch(value), debounce);
            return () => clearTimeout(timer);
        }, [value, debounce, onSearch]);

        const handleChange = useCallback(
            (e) => {
                const val = e.target.value;
                setInternalValue(val);
                onChange?.(val);
            },
            [onChange],
        );

        const handleClear = useCallback(() => {
            setInternalValue('');
            onChange?.('');
            onSearch?.('');
        }, [onChange, onSearch]);

        const sizes = {
            sm: 'h-9 text-xs pl-9 pr-8',
            md: 'h-10 text-sm pl-10 pr-10',
            lg: 'h-12 text-base pl-12 pr-12',
        };

        const iconSizes = {
            sm: 'w-3.5 h-3.5 left-3',
            md: 'w-4 h-4 left-3',
            lg: 'w-5 h-5 left-4',
        };

        return (
            <div className={cn('relative w-full', className)}>
                <Search
                    className={cn(
                        'absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none',
                        iconSizes[size],
                    )}
                />
                <input
                    ref={ref}
                    type="text"
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className={cn(
                        'w-full rounded-xl border border-border bg-navy-900 text-white placeholder:text-muted-foreground focus:outline-none focus:input-ring hover:border-border-light transition-all',
                        sizes[size],
                    )}
                    {...props}
                />
                {value && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-white transition-colors cursor-pointer"
                        aria-label="Clear search"
                    >
                        <X
                            className={
                                size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'
                            }
                        />
                    </button>
                )}
            </div>
        );
    },
);

SearchBar.displayName = 'SearchBar';
export { SearchBar };
