import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatCard({
    title,
    value,
    change,
    icon: Icon,
    trend = 'up',
    accentColor,
}) {
    // Configurable icon bg tints
    const colorMap = {
        green: {
            bg: 'bg-primary/10',
            text: 'text-primary',
            hoverBg: 'group-hover:bg-primary/20',
        },
        blue: {
            bg: 'bg-info/10',
            text: 'text-info',
            hoverBg: 'group-hover:bg-info/20',
        },
        amber: {
            bg: 'bg-warning/10',
            text: 'text-warning',
            hoverBg: 'group-hover:bg-warning/20',
        },
        red: {
            bg: 'bg-danger/10',
            text: 'text-danger',
            hoverBg: 'group-hover:bg-danger/20',
        },
        purple: {
            bg: 'bg-purple-500/10',
            text: 'text-purple-400',
            hoverBg: 'group-hover:bg-purple-500/20',
        },
        cyan: {
            bg: 'bg-cyan-500/10',
            text: 'text-cyan-400',
            hoverBg: 'group-hover:bg-cyan-500/20',
        },
    };

    const accent = colorMap[accentColor] || colorMap.green;

    return (
        <div className="rounded-2xl bg-surface border border-border p-5 transition-all duration-300 hover:border-border-light hover:shadow-card-hover hover:-translate-y-0.5 group cursor-default">
            {/* Icon + Title row */}
            <div className="flex items-start justify-between mb-4">
                <div
                    className={cn(
                        'p-2.5 rounded-xl transition-all duration-300',
                        accent.bg,
                        accent.text,
                        accent.hoverBg,
                    )}
                >
                    {Icon && <Icon className="w-5 h-5" />}
                </div>

                {/* Trend badge */}
                {change && (
                    <div
                        className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
                            trend === 'up'
                                ? 'bg-primary/10 text-green-400'
                                : 'bg-danger/10 text-red-400',
                        )}
                    >
                        {trend === 'up' ? (
                            <TrendingUp className="w-3 h-3" />
                        ) : (
                            <TrendingDown className="w-3 h-3" />
                        )}
                        {change}
                    </div>
                )}
            </div>

            {/* Value */}
            <p className="text-[28px] font-bold text-white leading-tight tracking-tight">
                {value}
            </p>

            {/* Title */}
            <p className="text-sm text-muted mt-1">{title}</p>
        </div>
    );
}
