import { useState, useEffect } from 'react';

export default function useTheme() {
    const getSystemPreference = () =>
        window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return getSystemPreference();
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => {
            if (!localStorage.getItem('theme')) {
                setIsDarkMode(e.matches);
            }
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const toggleTheme = () => setIsDarkMode(prev => !prev);

    return { isDarkMode, toggleTheme };
}
