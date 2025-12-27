import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
    isMobileMenuOpen: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;
    openSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleSidebar = () => {
        setIsMobileMenuOpen(prev => !prev);
    };

    const closeSidebar = () => {
        setIsMobileMenuOpen(false);
    };

    const openSidebar = () => {
        setIsMobileMenuOpen(true);
    };

    return (
        <SidebarContext.Provider
            value={{
                isMobileMenuOpen,
                toggleSidebar,
                closeSidebar,
                openSidebar,
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
