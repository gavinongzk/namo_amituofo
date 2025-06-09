# Floating Navigation Components

This project includes two floating navigation components to improve user experience on list and table views:

## Components

### 1. FloatingNavigation
A simple, always-visible floating navigation component with pagination and scroll controls.

### 2. FloatingActionButtons
An advanced floating action button (FAB) with expandable menu that auto-hides/shows based on scroll position.

## Features

### ✅ Implemented Features

1. **Previous/Next Page Navigation**: Floating buttons for easy pagination
2. **Scroll to Top/Bottom**: Quick navigation buttons to jump to top or bottom of list
3. **Auto-hide on Scroll**: FAB component automatically shows when scrolling down (after 300px)
4. **Responsive Design**: Works well on both desktop and mobile
5. **Smooth Animations**: Includes CSS animations for better UX
6. **Customizable Position**: Can be positioned in any corner
7. **Backdrop Blur**: Modern glass-morphism effect
8. **Page Indicator**: Shows current page and total pages

### 🎨 Visual Design

- **Semi-transparent background** with backdrop blur
- **Smooth animations** for show/hide and expand/collapse
- **Consistent iconography** using Lucide React icons
- **Hover effects** for better interactivity
- **Responsive sizing** that adapts to screen size

## Usage Examples

### Basic FloatingNavigation (Simple)

```tsx
import FloatingNavigation from '@/components/shared/FloatingNavigation';

function MyComponent() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;

  return (
    <div>
      {/* Your list/table content */}
      
      <FloatingNavigation
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        position="top-right"
        showPagination={true}
        showScrollButtons={true}
      />
    </div>
  );
}
```

### Advanced FloatingActionButtons (Auto-hide)

```tsx
import FloatingActionButtons from '@/components/shared/FloatingActionButtons';

function MyAdvancedComponent() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 15;

  return (
    <div>
      {/* Your content */}
      
      <FloatingActionButtons
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        showPagination={true}
        showScrollButtons={true}
        autoHide={true}
        position="bottom-right"
        size="md"
      />
    </div>
  );
}
```

### Scroll-only Version

```tsx
<FloatingActionButtons
  showPagination={false}
  showScrollButtons={true}
  position="bottom-right"
  autoHide={true}
/>
```

## Props Reference

### FloatingNavigation Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPage` | `number` | Required | Current page number |
| `totalPages` | `number` | Required | Total number of pages |
| `onPageChange` | `(page: number) => void` | Required | Page change handler |
| `scrollTarget` | `string \| HTMLElement` | `undefined` | Custom scroll target |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | Position of the floating buttons |
| `showPagination` | `boolean` | `true` | Show pagination controls |
| `showScrollButtons` | `boolean` | `true` | Show scroll to top/bottom buttons |
| `className` | `string` | `''` | Additional CSS classes |

### FloatingActionButtons Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPage` | `number` | `1` | Current page number |
| `totalPages` | `number` | `1` | Total number of pages |
| `onPageChange` | `(page: number) => void` | `undefined` | Page change handler |
| `onScrollToTop` | `() => void` | `undefined` | Custom scroll to top function |
| `onScrollToBottom` | `() => void` | `undefined` | Custom scroll to bottom function |
| `onPreviousPage` | `() => void` | `undefined` | Custom previous page handler |
| `onNextPage` | `() => void` | `undefined` | Custom next page handler |
| `showPagination` | `boolean` | `true` | Show pagination controls |
| `showScrollButtons` | `boolean` | `true` | Show scroll buttons |
| `autoHide` | `boolean` | `true` | Auto-hide when at top of page |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'bottom-right'` | Position of the FAB |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the buttons |
| `className` | `string` | `''` | Additional CSS classes |

## Implementation Status

### ✅ Currently Implemented In:

1. **UserManagement.tsx**
   - FloatingNavigation for always-visible controls
   - Pagination above the table
   - Smooth scrolling integration

2. **AttendanceClient.tsx**
   - FloatingNavigation for attendance management
   - Enhanced pagination controls
   - Top and bottom scroll functionality

3. **AnalyticsDashboard.tsx**
   - FloatingActionButtons for scroll-only functionality
   - Auto-hide behavior for cleaner interface

### 🔄 Recommended for Future Implementation:

1. **Collection.tsx** - For event collections with pagination
2. **EventList.tsx** - For browsing event lists
3. **Any other paginated tables or lists**

## CSS Animations

The components include smooth CSS animations defined in `globals.css`:

```css
/* Floating Action Button animations */
.fab-enter {
  animation: fabSlideIn 0.3s ease-out;
}

.fab-exit {
  animation: fabSlideOut 0.3s ease-in;
}

/* Backdrop blur support */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

/* Smooth scrolling for all scroll actions */
html {
  scroll-behavior: smooth;
}
```

## Mobile Responsiveness

Both components are designed to be mobile-friendly:

- **Touch-friendly button sizes** (minimum 44px tap targets)
- **Responsive positioning** that works on small screens
- **Adaptive sizing** based on screen size
- **Gesture-friendly interactions**

## Accessibility

- **Keyboard navigation** support
- **Screen reader friendly** with proper ARIA labels
- **High contrast** button designs
- **Clear visual hierarchy**

## Best Practices

1. **Use FloatingNavigation** for simple, always-visible controls
2. **Use FloatingActionButtons** for advanced interfaces where auto-hide is beneficial
3. **Position consistently** across your application
4. **Test on mobile devices** to ensure usability
5. **Provide custom scroll targets** when working with specific containers
6. **Consider performance** - the scroll listeners are optimized but still monitor usage

## Preventing Overlaps 🚨

### Positioning Strategy
When using multiple floating components on the same page:

- **Primary action button**: `bottom-right` (higher z-index: 1001)
- **Secondary navigation**: `bottom-left` (lower z-index: 1000)
- **Alternative positions**: `top-left`, `top-right` for less critical actions

### Example: AttendanceClient Implementation

```tsx
// Primary FAB for quick actions
<FloatingActionButton
  // ... props
  // Positioned at bottom-right by default
/>

// Secondary navigation for pagination/scrolling
<FloatingNavigation
  position="bottom-left"  // ← Prevents overlap
  // ... other props
/>
```

### Z-Index Hierarchy
- **Critical action buttons**: z-index 1001
- **Navigation elements**: z-index 1000
- **Background overlays**: z-index 50

## Troubleshooting

### Common Issues:

1. **Buttons not showing**: Check if `totalPages > 1` for pagination buttons
2. **Auto-hide not working**: Ensure `autoHide={true}` and user scrolls past 300px
3. **Positioning issues**: Verify the `position` prop and check for CSS conflicts
4. **Scroll not smooth**: Ensure `scroll-behavior: smooth` is applied to `html`

### Performance Considerations:

- **Scroll listeners are throttled** to prevent performance issues
- **Components unmount cleanly** to prevent memory leaks
- **Animations are GPU-accelerated** for smooth performance 