# OmniTrack AI Logo

## Design Concept

The OmniTrack AI logo represents the core concepts of the platform:

### Visual Elements

1. **Supply Chain Network**
   - Interconnected nodes representing suppliers, manufacturers, warehouses, distributors, and retailers
   - Lines connecting nodes symbolize the flow of goods and information
   - Network structure emphasizes visibility and connectivity

2. **Color Gradient**
   - Blue to Purple gradient (#3B82F6 → #8B5CF6)
   - Blue represents trust, reliability, and technology
   - Purple represents innovation, intelligence, and AI
   - Gradient symbolizes the transformation from traditional to AI-powered supply chains

3. **Modern & Professional**
   - Clean, minimalist design
   - Scalable vector graphics (SVG)
   - Works well at any size
   - Suitable for both light and dark backgrounds

## Logo Variants

### 1. Full Logo (`omnitrack-logo.svg`)
- **Size:** 200x200px
- **Use Case:** App icons, social media profiles, large displays
- **Features:** Complete network visualization with AI elements

### 2. Icon (`omnitrack-icon.svg`)
- **Size:** 64x64px
- **Use Case:** Favicon, app icons, navigation bars, buttons
- **Features:** Simplified network in rounded square, optimized for small sizes

### 3. Horizontal Logo (`omnitrack-logo-horizontal.svg`)
- **Size:** 400x100px
- **Use Case:** Website headers, email signatures, presentations
- **Features:** Icon + "OmniTrack" text + tagline

## Usage Examples

### React Component

```tsx
import { Logo, LogoInline } from '@/components/common/logo';

// Icon variant
<Logo variant="icon" size={64} />

// Full logo
<Logo variant="full" size={200} />

// Horizontal with text
<Logo variant="horizontal" size={100} />

// Inline SVG (better performance)
<LogoInline size={48} className="hover:scale-110 transition-transform" />
```

### Next.js Favicon

Update `frontend/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OmniTrack AI',
  description: 'AI-Powered Supply Chain Intelligence',
  icons: {
    icon: '/omnitrack-icon.svg',
    apple: '/omnitrack-icon.svg',
  },
};
```

### Navigation Bar

```tsx
import Link from 'next/link';
import { LogoInline } from '@/components/common/logo';

export function Navbar() {
  return (
    <nav className="flex items-center gap-2">
      <Link href="/" className="flex items-center gap-2">
        <LogoInline size={40} />
        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          OmniTrack AI
        </span>
      </Link>
    </nav>
  );
}
```

### Loading Spinner

```tsx
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <LogoInline size={64} className="animate-pulse" />
    </div>
  );
}
```

## Color Palette

### Primary Colors
- **Blue 500:** `#3B82F6` - Primary brand color
- **Purple 500:** `#8B5CF6` - Secondary brand color
- **Blue 600:** `#2563EB` - Darker blue for text
- **Purple 600:** `#7C3AED` - Darker purple for text

### Neutral Colors
- **Gray 600:** `#4B5563` - Body text
- **Gray 400:** `#9CA3AF` - Secondary text
- **White:** `#FFFFFF` - Background, icons

### Gradient
```css
background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
```

## File Formats

### SVG (Recommended)
- Scalable to any size without quality loss
- Small file size
- Can be styled with CSS
- Supports animations

### Export to Other Formats

If you need PNG or other formats:

```bash
# Using Inkscape (install first)
inkscape omnitrack-logo.svg --export-type=png --export-width=512 --export-filename=omnitrack-logo-512.png

# Using ImageMagick
convert -background none omnitrack-logo.svg -resize 512x512 omnitrack-logo-512.png
```

## Brand Guidelines

### Do's ✅
- Use the logo on solid backgrounds (white, dark gray, or brand colors)
- Maintain aspect ratio when scaling
- Use sufficient padding around the logo (minimum 20% of logo height)
- Use the horizontal variant for wide spaces
- Use the icon variant for small spaces

### Don'ts ❌
- Don't distort or stretch the logo
- Don't change the colors (except for monochrome versions)
- Don't add effects (shadows, outlines, etc.)
- Don't place on busy backgrounds
- Don't rotate the logo

## Accessibility

- Logo has sufficient contrast ratio (4.5:1) on white backgrounds
- Alternative text provided: "OmniTrack AI Logo"
- Works well in both light and dark modes
- Recognizable at small sizes (16x16px minimum)

## License

This logo is proprietary to OmniTrack AI. All rights reserved.

## Design Tools

Created using:
- SVG (Scalable Vector Graphics)
- Designed for web and digital use
- Optimized for performance

## Updates

**Version 1.0** - November 28, 2025
- Initial logo design
- Three variants created
- React component implemented

---

For questions or custom variations, contact the design team.
