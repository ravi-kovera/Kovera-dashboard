import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
} from 'react';

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const [isOpen, setIsOpen] = useState(false); // mobile overlay state

    const toggle = useCallback(() => {
        // On desktop: collapse/expand
        // On mobile: toggle overlay
        if (window.innerWidth >= 1024) {
            setCollapsed((prev) => !prev);
        } else {
            setIsOpen((prev) => !prev);
        }
    }, []);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);

    // Close mobile sidebar on route change or resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <SidebarContext.Provider
            value={{ collapsed, setCollapsed, toggle, isOpen, open, close }}
        >
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
