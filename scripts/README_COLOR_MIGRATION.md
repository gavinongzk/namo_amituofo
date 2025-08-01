# Category Color Migration

This script adds automatic color assignment to existing categories in the database.

## How to Run

1. Make sure you have your MongoDB URI environment variable set:
   ```bash
   export MONGODB_URI="your_mongodb_connection_string"
   ```

2. Run the migration script:
   ```bash
   npx tsx scripts/addColorsToCategories.ts
   ```

## What it does

- Finds all categories that don't have a color assigned
- Automatically assigns a color based on the category name using a hash function
- Ensures consistent color assignment (same category name = same color)
- Updates the database with the new color values

## Color Palette

The system uses a predefined palette of 20 colors:
- Blue, Orange, Green, Purple, Pink, Indigo, Teal, Red, Yellow, Cyan
- Lime, Emerald, Violet, Rose, Amber, Sky, Fuchsia, Slate, Gray, Zinc

Each color is assigned using a hash function based on the category name, ensuring:
- Consistent assignment (same name = same color)
- Even distribution across the color palette
- No conflicts between categories

## After Migration

Once the migration is complete, new categories will automatically get colors assigned when they're created. The system will:

1. Use stored colors for existing categories
2. Automatically assign colors for new categories
3. Fall back to legacy hardcoded colors if needed
4. Generate new colors for categories without stored colors 