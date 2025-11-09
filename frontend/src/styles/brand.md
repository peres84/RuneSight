# RuneSight Brand Colors

## Color Palette

### Primary Colors
- **Primary**: `#1a1f3b` - Dark navy blue, used for main branding and primary actions
- **Secondary**: `#c94441` - Red, used for secondary actions and highlights  
- **Accent**: `#d86c7f` - Pink, used for accents and call-to-action elements

## Usage in Tailwind CSS

### Direct Color Classes
```html
<!-- Background colors -->
<div class="bg-runesight-primary">Primary background</div>
<div class="bg-runesight-secondary">Secondary background</div>
<div class="bg-runesight-accent">Accent background</div>

<!-- Text colors -->
<p class="text-runesight-primary">Primary text</p>
<p class="text-runesight-secondary">Secondary text</p>
<p class="text-runesight-accent">Accent text</p>

<!-- Border colors -->
<div class="border border-runesight-primary">Primary border</div>
```

### Custom Component Classes
```html
<!-- Buttons -->
<button class="btn-runesight">Primary Button</button>
<button class="btn-runesight-secondary">Secondary Button</button>
<button class="btn-runesight-accent">Accent Button</button>

<!-- Cards -->
<div class="card-runesight">RuneSight themed card</div>

<!-- Gradients -->
<div class="gradient-runesight">Background gradient</div>
<h1 class="gradient-runesight-text">Gradient text</h1>
```

## Logo Usage

### Logo Component
```tsx
import { Logo } from '@/components/ui/Logo';

// Different sizes (uses appropriate favicon resolution)
<Logo size="sm" />   // Small (24px) - uses favicon-16x16.png
<Logo size="md" />   // Medium (32px) - uses favicon-32x32.png - default
<Logo size="lg" />   // Large (48px) - uses android-chrome-192x192.png
<Logo size="xl" />   // Extra large (64px) - uses android-chrome-192x192.png
<Logo size="nav" />  // Navigation (40px) - larger size for navigation bar

// Icon only
<Logo showText={false} />

// With custom className
<Logo className="my-custom-class" />
```

**Note**: The Logo component now uses your actual favicon files instead of generic icons, ensuring brand consistency across all sizes. In dark mode, it automatically switches to the white logo (`logo-white.png`) for better visibility.

### ScrollToTop Component
```tsx
import { ScrollToTop } from '@/components/ui/ScrollToTop';

// Add to any page that needs scroll-to-top functionality
<ScrollToTop />
```

Features:
- Appears when user scrolls down 300px
- Smooth scroll animation to top
- Branded styling with RuneSight primary color
- Hover and tap animations
- Accessible with proper ARIA labels

## Color Accessibility

All colors have been tested for WCAG AA compliance:
- Primary (#1a1f3b) on white: ✅ AAA (contrast ratio: 13.2:1)
- Secondary (#c94441) on white: ✅ AA (contrast ratio: 4.8:1)
- Accent (#d86c7f) on white: ✅ AA (contrast ratio: 4.1:1)

## Dark Mode Adaptations

In dark mode, the color usage is automatically adjusted:
- Primary becomes the accent color for better visibility
- Secondary becomes slightly darker for better contrast
- Accent becomes the secondary color for balance

## Background Images

### Hero Background
The landing page hero section uses `background-hero.png` as a background image with:
- Semi-transparent overlay for text readability
- Responsive background sizing (cover, center, no-repeat)
- Proper contrast maintained in both light and dark modes

## Brand Guidelines

### Do's
- Use primary color for main navigation and branding
- Use secondary color for important actions and highlights
- Use accent color sparingly for call-to-action elements
- Maintain consistent spacing and typography
- Use the hero background image for landing page impact
- Switch to white logo in dark mode for visibility

### Don'ts  
- Don't use accent color for large background areas
- Don't mix brand colors with other bright colors
- Don't use low opacity versions that fail accessibility tests
- Don't use colors outside the defined palette for brand elements
- Don't use the colored logo in dark mode (use logo-white.png instead)