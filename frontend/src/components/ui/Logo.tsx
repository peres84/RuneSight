interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'nav';
  showText?: boolean;
  className?: string;
  forceWhite?: boolean;
}

const sizeClasses = {
  sm: {
    icon: 'w-6 h-6',
    text: 'text-lg',
    logoSrc: '/favicon-16x16.png',
    logoSrcDark: '/logo-white.png'
  },
  md: {
    icon: 'w-8 h-8',
    text: 'text-2xl',
    logoSrc: '/favicon-32x32.png',
    logoSrcDark: '/logo-white.png'
  },
  lg: {
    icon: 'w-12 h-12',
    text: 'text-3xl',
    logoSrc: '/android-chrome-192x192.png',
    logoSrcDark: '/logo-white.png'
  },
  xl: {
    icon: 'w-16 h-16',
    text: 'text-4xl',
    logoSrc: '/android-chrome-192x192.png',
    logoSrcDark: '/logo-white.png'
  },
  nav: {
    icon: 'w-10 h-10',
    text: 'text-2xl',
    logoSrc: '/favicon-32x32.png',
    logoSrcDark: '/logo-white.png'
  }
};

export function Logo({ size = 'md', showText = true, className = '', forceWhite = false }: LogoProps) {
  const { icon, text, logoSrc, logoSrcDark } = sizeClasses[size];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {forceWhite ? (
        /* Force white logo for landing page */
        <img
          src={logoSrcDark}
          alt="RuneSight Logo"
          className={`${icon} object-contain`}
        />
      ) : (
        <>
          {/* Light mode logo */}
          <img
            src={logoSrc}
            alt="RuneSight Logo"
            className={`${icon} object-contain dark:hidden`}
          />

          {/* Dark mode logo */}
          <img
            src={logoSrcDark}
            alt="RuneSight Logo"
            className={`${icon} object-contain hidden dark:block`}
          />
        </>
      )}

      {showText && (
        <h1 className={`${text} font-bold ${forceWhite
          ? 'text-white'
          : 'text-runesight-primary dark:text-white'
          }`}>
          RuneSight
        </h1>
      )}
    </div>
  );
}