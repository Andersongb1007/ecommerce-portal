'use client';

import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    const initialTheme = isDark ? 'dark' : 'light';
    const timer = setTimeout(() => {
      setTheme(initialTheme);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);

    // Deshabilitar transiciones temporalmente
    const css = document.createElement('style');
    css.type = 'text/css';
    css.appendChild(
      document.createTextNode(
        `* {
           -webkit-transition: none !important;
           -moz-transition: none !important;
           -o-transition: none !important;
           -ms-transition: none !important;
           transition: none !important;
        }`
      )
    );
    document.head.appendChild(css);

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }

    // Forzar reflow en el cuerpo del documento para aplicar los cambios de clase sin transición
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    document.body.offsetHeight;

    // Volver a habilitar las transiciones normales removiendo el estilo
    document.head.removeChild(css);

    document.cookie = `theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;
  };

  return { theme, toggleTheme, isDark: theme === 'dark' };
}
export default useTheme;
