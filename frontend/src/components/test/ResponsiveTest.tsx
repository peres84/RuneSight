import { VideoBackground } from '../ui/VideoBackground';

/**
 * Test component to validate responsive design and light/dark mode
 * This component helps verify:
 * 1. Video background loads correctly
 * 2. Content is properly centered
 * 3. Light/dark mode transitions work
 * 4. Responsive breakpoints function correctly
 */
export function ResponsiveTest() {
  return (
    <div className="min-h-screen">
      {/* Test Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background Test */}
        <VideoBackground 
          videoId="https://www.youtube.com/watch?v=5fZiMNo5-uo" 
          className="absolute inset-0 w-full h-full"
        />
        
        {/* Overlay Test - Light/Dark Mode */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 dark:from-black/60 dark:via-black/40 dark:to-black/80" />
        
        {/* Centered Content Test */}
        <div className="container mx-auto px-4 text-center relative z-10 flex items-center justify-center min-h-screen">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Responsive Title Test */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white via-runesight-accent to-runesight-secondary drop-shadow-2xl tracking-tight">
              RESPONSIVE TEST
            </h1>
            
            {/* Responsive Subtitle Test */}
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-4 font-medium tracking-wide uppercase">
              Testing Responsive Design
            </p>
            
            <p className="text-base sm:text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed px-4">
              This component validates that the video background loads correctly, 
              content is centered, and responsive breakpoints work across all devices.
            </p>
            
            {/* Responsive Button Test */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button className="min-w-[200px] px-8 py-4 bg-gradient-to-r from-runesight-accent via-runesight-secondary to-runesight-accent text-white font-bold rounded-lg">
                Test Button
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Breakpoint Indicators */}
      <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-sm z-50">
        <div className="block sm:hidden">XS: &lt;640px</div>
        <div className="hidden sm:block md:hidden">SM: 640px+</div>
        <div className="hidden md:block lg:hidden">MD: 768px+</div>
        <div className="hidden lg:block xl:hidden">LG: 1024px+</div>
        <div className="hidden xl:block 2xl:hidden">XL: 1280px+</div>
        <div className="hidden 2xl:block">2XL: 1536px+</div>
      </div>
      
      {/* Theme Test */}
      <div className="fixed bottom-4 left-4 bg-background border border-border p-4 rounded-lg shadow-lg z-50">
        <h3 className="font-bold mb-2 text-foreground">Theme Test</h3>
        <div className="space-y-2 text-sm">
          <div className="text-runesight-primary">Primary Color</div>
          <div className="text-runesight-secondary">Secondary Color</div>
          <div className="text-runesight-accent">Accent Color</div>
          <div className="text-muted-foreground">Muted Text</div>
        </div>
      </div>
    </div>
  );
}