import { createContext, useContext, useCallback, useState } from 'react';

const ViewModeContext = createContext(undefined);
const STORAGE_KEY = 'kovera_view_mode';

export function ViewModeProvider({ children }) {
    const [mode, setModeState] = useState(
        () => localStorage.getItem(STORAGE_KEY) === 'network' ? 'network' : 'analytics'
    );

    const setMode = useCallback((next) => {
        localStorage.setItem(STORAGE_KEY, next);
        setModeState(next);
    }, []);

    return (
        <ViewModeContext.Provider value={{ mode, setMode }}>
            {children}
        </ViewModeContext.Provider>
    );
}

export function useViewMode() {
    const ctx = useContext(ViewModeContext);
    if (!ctx) throw new Error('useViewMode must be used within ViewModeProvider');
    return ctx;
}
