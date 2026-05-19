import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

function Spinner({ className, size = 20 }) {
    return (
        <Loader2
            className={cn('animate-spin text-primary', className)}
            size={size}
        />
    );
}

function PageLoader({ message = 'Loading...' }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
            <Spinner size={32} />
            <p className="text-muted text-sm">{message}</p>
        </div>
    );
}

export { Spinner, PageLoader };
