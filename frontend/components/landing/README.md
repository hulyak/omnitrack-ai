# Landing Page Components

Compelling landing page for OmniTrack AI showcasing the platform's capabilities for hackathons and demos.

## Components

### HeroSection
Main hero section with animated background, live stats, and primary CTA.

**Features**:
- Animated grid background with floating particles
- Live stats badge showing device count, anomalies, and uptime
- Primary CTA buttons for demo and login
- Feature highlights with key metrics
- Scroll indicator

### FeatureCards
Displays the 4 main features of OmniTrack AI with hover effects.

**Features**:
- Digital Twin with IoT integration
- Risk Simulation with AI-powered scenarios
- Strategy Generation with multi-agent negotiation
- Sustainability Tracking with carbon footprint

### DemoSection
Interactive demo showcase with live examples of platform capabilities.

**Features**:
- Three demo scenarios: Disruption Detection, Scenario Simulation, Strategy Generation
- Interactive selector to switch between demos
- Real-time data visualization
- Dark theme with gradient backgrounds

### TechStack
Showcases the AWS and AI technologies powering OmniTrack.

**Features**:
- Four technology categories: AI & ML, Compute & Storage, Real-time & IoT, Frontend
- Key metrics: Uptime SLA, Response Time, Scalability, Security
- Hover effects on technology items

### CTASection
Final call-to-action section with trust indicators.

**Features**:
- Primary and secondary CTA buttons
- Trust indicators (no credit card, free trial, cancel anytime)
- Gradient background with pattern overlay
- Email contact for demo scheduling

## Usage

```tsx
import { 
  HeroSection, 
  FeatureCards, 
  DemoSection, 
  TechStack, 
  CTASection 
} from '@/components/landing';

export default function LandingPage() {
  return (
    <main>
      <HeroSection onTryDemo={() => router.push('/dashboard')} />
      <FeatureCards />
      <DemoSection />
      <TechStack />
      <CTASection onGetStarted={() => router.push('/login')} />
    </main>
  );
}
```

## Design System

### Colors
- Primary: Blue gradient (from-blue-500 to-cyan-500)
- Secondary: Slate backgrounds (slate-900, slate-800)
- Accents: Feature-specific gradients (purple, orange, green)

### Typography
- Headings: Bold, large sizes (4xl to 7xl)
- Body: Regular weight, readable sizes (lg to xl)
- Labels: Small, uppercase for emphasis

### Animations
- Float: Floating particles in hero section
- Pulse: Live status indicators
- Hover: Scale and shadow transitions
- Bounce: Scroll indicator

## Responsive Design

All components are fully responsive with breakpoints:
- Mobile: Single column, stacked layout
- Tablet (sm): 2 columns for grids
- Desktop (lg): Full multi-column layouts

## Accessibility

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
- Focus states on interactive elements

## Performance

- Client-side rendering with 'use client'
- Optimized animations with CSS
- Minimal JavaScript for interactivity
- Lazy loading for heavy components (if needed)

## Future Enhancements

- Video background option for hero
- Customer testimonials section
- Pricing comparison table
- Integration showcase
- Case studies section
