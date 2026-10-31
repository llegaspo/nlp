import {useEffect, useState} from 'react';
import Icon from './Icons';

type Theme = 'dark' | 'light';
const storageKey = 'nlp-visual-lab.theme';

export default function ThemeToggle() {
  // index.html restores the saved theme before the page paints.
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content', theme === 'dark' ? '#141c18' : '#f7f8f2',
    );
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // Theme switching still works when browser storage is unavailable.
    }
  }, [theme]);

  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  return <button
    type="button"
    className="theme-toggle"
    aria-label={`Switch to ${nextTheme} mode`}
    title={`Switch to ${nextTheme} mode`}
    onClick={() => setTheme(nextTheme)}
  >
    <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18}/>
    <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
  </button>;
}
