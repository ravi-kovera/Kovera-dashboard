import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useEffect, useCallback } from 'react';

/**
 * Modal — reusable overlay modal with backdrop blur, close on escape/backdrop.
 *
 * @param {boolean}  open       - Whether the modal is visible
 * @param {function} onClose    - Called when modal should close
 * @param {string}   size       - "sm" | "md" | "lg" | "xl" | "full"
 * @param {string}   title      - Optional modal title
 * @param {string}   subtitle   - Optional subtitle below title
 * @param {ReactNode} children  - Modal body content
 * @param {ReactNode} footer    - Optional footer content (action buttons)
 * @param {boolean}  showClose  - Show the X close button (default true)
 */
function Modal({
    open,
    onClose,
    size = 'md',
    title,
    subtitle,
    children,
    footer,
    showClose = true,
    className,
}) {
    // Close on Escape key
    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === 'Escape') onClose?.();
        },
        [onClose],
    );

    useEffect(() => {
        if (open) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, handleKeyDown]);

    if (!open) return null;

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[90vw]',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
                className={cn(
                    'relative w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-navy-900 border border-border shadow-elevated animate-scale-in',
                    sizes[size],
                    className,
                )}
            >
                {/* Header */}
                {(title || showClose) && (
                    <div className="flex items-start justify-between p-5 border-b border-border">
                        {title && (
                            <div>
                                <h2
                                    id="modal-title"
                                    className="text-lg font-semibold text-white"
                                >
                                    {title}
                                </h2>
                                {subtitle && (
                                    <p className="text-sm text-muted mt-0.5">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        )}
                        {showClose && (
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl text-muted hover:text-white hover:bg-surface-hover transition-colors cursor-pointer ml-auto"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="p-5">{children}</div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

export { Modal };
