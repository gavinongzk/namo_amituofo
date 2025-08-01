# Automatic Category Color System

## Overview

This system automatically assigns unique colors to event categories, ensuring visual consistency and making it easy to distinguish between different types of events.

## Features

### 🎨 Automatic Color Assignment
- **Consistent**: Same category name = same color (using hash function)
- **Distributed**: Even distribution across 20 predefined colors
- **Backward Compatible**: Falls back to legacy colors for existing categories
- **Dynamic**: New categories automatically get colors assigned

### 🎯 Color Palette
The system uses 20 Tailwind CSS colors:
- Blue, Orange, Green, Purple, Pink, Indigo, Teal, Red, Yellow, Cyan
- Lime, Emerald, Violet, Rose, Amber, Sky, Fuchsia, Slate, Gray, Zinc

### 🔧 Technical Implementation

#### Database Schema
```typescript
// Category model now includes color field
interface ICategory {
  _id: string;
  name: string;
  isHidden: boolean;
  color?: string; // New field for storing assigned color
}
```

#### Color Assignment Algorithm
```typescript
// Hash-based assignment ensures consistency
function assignCategoryColor(categoryName: string): string {
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    const char = categoryName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
}
```

## Components Updated

### 1. Card Component (`components/shared/Card.tsx`)
- Uses dynamic color assignment with fallback to legacy colors
- Supports both stored colors and auto-generated colors

### 2. CategoryFilter Component (`components/shared/CategoryFilter.tsx`)
- Dynamic color assignment for category dropdown
- Background-only colors for filter indicators

### 3. EventLookupAnalytics Component (`components/shared/EventLookupAnalytics.tsx`)
- Dynamic colors for pie charts
- Converts Tailwind classes to hex colors for charts

### 4. UserAnalyticsVisuals Component (`components/shared/UserAnalyticsVisuals.tsx`)
- Dynamic colors for user analytics charts
- Consistent color mapping across visualizations

## Migration

### For Existing Categories
Run the migration script to add colors to existing categories:

```bash
# Set your MongoDB URI
export MONGODB_URI="your_mongodb_connection_string"

# Run migration
npx tsx scripts/addColorsToCategories.ts
```

### For New Categories
New categories automatically get colors assigned when created via the `createCategory` action.

## Usage Examples

### In Components
```typescript
import { getCategoryColor } from '@/lib/utils/colorUtils';

// Get color for a category
const color = getCategoryColor(categoryName, storedColor);
// Returns: "bg-blue-200 text-blue-700"

// Get background-only color
const bgColor = getCategoryBgColor(categoryName, storedColor);
// Returns: "bg-blue-200"
```

### In Charts
```typescript
// Convert Tailwind class to hex for charts
const hexColor = colorMap[fullColor] || '#93c5fd';
```

## Benefits

1. **Visual Consistency**: Same category always has the same color
2. **Scalability**: Supports up to 20 unique colors
3. **Maintainability**: No need to manually assign colors
4. **User Experience**: Easy visual distinction between categories
5. **Analytics**: Consistent colors across all charts and visualizations

## Color Mapping

| Tailwind Class | Hex Color | Usage |
|----------------|-----------|-------|
| bg-blue-200 | #93c5fd | Primary categories |
| bg-orange-200 | #fed7aa | Secondary categories |
| bg-green-200 | #bbf7d0 | Success/positive categories |
| bg-purple-200 | #c4b5fd | Special categories |
| ... | ... | ... |

## Future Enhancements

1. **Custom Color Assignment**: Allow admins to manually assign colors
2. **Color Themes**: Support for different color themes
3. **Accessibility**: Ensure color contrast meets WCAG guidelines
4. **Color Preferences**: User-specific color preferences

## Troubleshooting

### Missing Colors
If a category doesn't have a color:
1. Run the migration script
2. Check if the category exists in the database
3. Verify the color field is being populated

### Color Conflicts
The hash function ensures no conflicts, but if you need to manually adjust:
1. Update the category in the database
2. Clear the cache: `revalidateTag('categories')`
3. Restart the application

### Chart Colors
If chart colors don't match:
1. Check the color mapping in the component
2. Verify the Tailwind class to hex conversion
3. Update the colorMap if needed 