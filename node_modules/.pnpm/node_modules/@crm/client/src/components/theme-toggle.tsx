import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '@/lib/theme';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const label =
    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={label}
      title={label}
      onClick={toggle}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  );
}
