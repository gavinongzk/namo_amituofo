import { connectToDatabase } from '../lib/database';
import Category from '../lib/database/models/category.model';
import { assignCategoryColor } from '../lib/utils/colorUtils';

async function addColorsToCategories() {
  try {
    await connectToDatabase();
    
    console.log('Starting category color migration...');
    
    // Find all categories that don't have a color assigned
    const categoriesWithoutColor = await Category.find({ 
      $or: [
        { color: { $exists: false } },
        { color: null },
        { color: '' }
      ]
    });
    
    console.log(`Found ${categoriesWithoutColor.length} categories without colors`);
    
    if (categoriesWithoutColor.length === 0) {
      console.log('All categories already have colors assigned.');
      return;
    }
    
    // Update each category with a color
    for (const category of categoriesWithoutColor) {
      const assignedColor = assignCategoryColor(category.name);
      category.color = assignedColor;
      await category.save();
      console.log(`Assigned color ${assignedColor} to category: ${category.name}`);
    }
    
    console.log('Category color migration completed successfully!');
    
  } catch (error) {
    console.error('Error during category color migration:', error);
  } finally {
    process.exit(0);
  }
}

// Run the migration
addColorsToCategories(); 