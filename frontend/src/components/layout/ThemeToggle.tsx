
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  forceWhite?: boolean;
}

export function ThemeToggle({ forceWhite = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' }
  ] as const;


  const currentTheme = themes[0];

  return (
    <div className="relative group">
      <button
        className={`p-2 rounded-md transition-colors ${
          forceWhite 
            ? 'text-white hover:bg-white/10' 
            : 'hover:bg-muted'
        }`}
        title={`Current theme: ${currentTheme.label}`}
      >
        <currentTheme.icon className="w-5 h-5" />
      </button>

      {/* Dropdown menu */}
      <div className="absolute right-0 top-full mt-2 bg-background border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-1 min-w-[120px]">
          {themes.map((themeOption) => (
            <button
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-2 ${theme === themeOption.value ? 'text-primary' : 'text-foreground'
                }`}
            >
              <themeOption.icon className="w-4 h-4" />
              <span>{themeOption.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}