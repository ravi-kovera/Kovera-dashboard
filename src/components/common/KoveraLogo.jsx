import { cn } from '@/lib/utils';

/**
 * KoveraLogo — renders the official Kovera brand logo from SVG file.
 * Supports both icon-only and full wordmark modes.
 */
export function KoveraLogo({
    className,
    size = 24,
    showText = false,
    ...props
}) {
    if (showText) {
        // Full wordmark version
        return (
            <img
                src="/kovera-logo.svg"
                alt="Kovera"
                className={cn('object-contain', className)}
                style={{ height: size }}
                {...props}
            />
        );
    }

    // Icon-only version — the hexagonal emblem
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="72 22 24 24"
            width={size}
            height={size}
            className={cn(className)}
            {...props}
        >
            {/* Hexagonal shape from the original SVG */}
            <path
                d="M0 0 C4.55555556 0.55555556 4.55555556 0.55555556 6 2 C6.1875 5.4375 6.1875 5.4375 6 9 C5.34 9.66 4.68 10.32 4 11 C-0.55555556 10.44444444 -0.55555556 10.44444444 -2 9 C-2.1875 5.5625 -2.1875 5.5625 -2 2 C-1.34 1.34 -0.68 0.68 0 0 Z"
                fill="#302D2F"
                transform="translate(82,29)"
            />
            <path
                d="M0 0 C3.7742893 1.16659851 5.30801297 1.74050024 7.4375 5.0625 C8.23740863 9.07853612 8.05590725 12.03182124 5.9375 15.5625 C2.40161027 17.68403384 -0.54151723 17.853513 -4.5625 17.0625 C-7.0625 15.5625 -7.0625 15.5625 -8.5625 13.0625 C-9.27623503 8.06635481 -9.32870649 6.20020054 -6.5 2 C-3.5625 0.0625 -3.5625 0.0625 0 0 Z"
                fill="currentColor"
                transform="translate(84.5625,25.9375)"
            />
        </svg>
    );
}
