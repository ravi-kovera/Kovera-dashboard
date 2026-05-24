import { cn } from '@/lib/utils';
import { createContext, forwardRef, useContext, useState } from 'react';

/* ── Context ── */
const TabsContext = createContext({ value: '', onValueChange: () => {} });

/* ── Root ── */
function Tabs({ value, onValueChange, defaultValue, children, className }) {
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const isControlled = value !== undefined;

    const currentValue = isControlled ? value : internalValue;
    const handleChange = (v) => {
        if (!isControlled) setInternalValue(v);
        onValueChange?.(v);
    };

    return (
        <TabsContext.Provider
            value={{ value: currentValue, onValueChange: handleChange }}
        >
            <div className={cn('w-full', className)}>{children}</div>
        </TabsContext.Provider>
    );
}

/* ── TabsList ── */
const TabsList = forwardRef(({ className, wrapperClassName, ...props }, ref) => (
    <div className={cn('w-full overflow-x-auto pb-0.5', wrapperClassName)}>
        <div
            ref={ref}
            role="tablist"
            className={cn(
                'inline-flex items-center gap-1 p-1 rounded-xl bg-navy-900 border border-border',
                className,
            )}
            {...props}
        />
    </div>
));
TabsList.displayName = 'TabsList';

/* ── TabsTrigger ── */
const TabsTrigger = forwardRef(
    ({ className, value, children, ...props }, ref) => {
        const ctx = useContext(TabsContext);
        const isActive = ctx.value === value;

        return (
            <button
                ref={ref}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => ctx.onValueChange(value)}
                className={cn(
                    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer select-none',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                    isActive
                        ? 'bg-surface text-white shadow-sm border border-border-light'
                        : 'text-muted hover:text-white hover:bg-surface/50',
                    className,
                )}
                {...props}
            >
                {children}
            </button>
        );
    },
);
TabsTrigger.displayName = 'TabsTrigger';

/* ── TabsContent ── */
const TabsContent = forwardRef(
    ({ className, value, children, ...props }, ref) => {
        const ctx = useContext(TabsContext);
        if (ctx.value !== value) return null;

        return (
            <div
                ref={ref}
                role="tabpanel"
                className={cn('mt-4 animate-fade-in', className)}
                {...props}
            >
                {children}
            </div>
        );
    },
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
