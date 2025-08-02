"use server"

import { CreateCategoryParams } from "@/types"
import { handleError } from "../utils"
import { connectToDatabase } from "../database"
import Category from "../database/models/category.model"
import Event from "../database/models/event.model"
import { unstable_cache } from "next/cache"
import { assignCategoryColor } from "../utils/colorUtils"

export const createCategory = async ({ categoryName }: CreateCategoryParams) => {
  try {
    await connectToDatabase();

    // Automatically assign a color to the new category
    const assignedColor = assignCategoryColor(categoryName);

    const newCategory = await Category.create({ 
      name: categoryName,
      isHidden: false,
      color: assignedColor
    });

    return JSON.parse(JSON.stringify(newCategory));
  } catch (error) {
    handleError(error)
  }
}

export const getAllCategories = async (includeHidden: boolean = false) => {
  const cacheKey = `categories-${includeHidden}`;
  
  return unstable_cache(
    async () => {
      try {
        await connectToDatabase();

        const query = includeHidden 
          ? {} 
          : { 
              $or: [
                { isHidden: false },
                { isHidden: { $exists: false } },
                { isHidden: null }
              ] 
            };

        // Use lean() for better performance and only select needed fields
        const categories = await Category.find(query)
          .select('_id name isHidden color')
          .lean()
          .exec();

        return JSON.parse(JSON.stringify(categories));
      } catch (error) {
        handleError(error);
        return [];
      }
    },
    ['categories'],
    {
      revalidate: 60, // Cache for 1 minute
      tags: ['categories']
    }
  )();
}

export const getCategoriesWithNonExpiredEvents = async (includeHidden: boolean = false) => {
  const cacheKey = `categories-non-expired-${includeHidden}`;
  
  return unstable_cache(
    async () => {
      try {
        await connectToDatabase();

        const now = new Date();
        
        // First, get all categories
        const query = includeHidden 
          ? {} 
          : { 
              $or: [
                { isHidden: false },
                { isHidden: { $exists: false } },
                { isHidden: null }
              ] 
            };

        const categories = await Category.find(query)
          .select('_id name isHidden color')
          .lean()
          .exec();

        // Then, get categories that have non-expired events
        const categoriesWithNonExpiredEvents = await Category.aggregate([
          { $match: query },
          {
            $lookup: {
              from: 'events',
              localField: '_id',
              foreignField: 'category',
              as: 'events'
            }
          },
          {
            $match: {
              'events': {
                $elemMatch: {
                  endDateTime: { $gt: now },
                  isDeleted: { $ne: true }
                }
              }
            }
          },
          {
            $project: {
              _id: 1,
              name: 1,
              isHidden: 1,
              color: 1
            }
          }
        ]);

        return JSON.parse(JSON.stringify(categoriesWithNonExpiredEvents));
      } catch (error) {
        handleError(error);
        return [];
      }
    },
    ['categories-non-expired'],
    {
      revalidate: 60, // Cache for 1 minute
      tags: ['categories-non-expired']
    }
  )();
}

export const deleteCategory = async (categoryId: string) => {
  try {
    await connectToDatabase();

    const deletedCategory = await Category.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      throw new Error('Category not found');
    }

    return JSON.parse(JSON.stringify(deletedCategory));
  } catch (error) {
    handleError(error)
  }
}

export const categoryHasEvents = async (categoryId: string): Promise<boolean> => {
  try {
    await connectToDatabase();
    const events = await Event.find({ category: categoryId });
    return events.length > 0;
  } catch (error) {
    throw error;
  }
}

export const toggleCategoryVisibility = async (categoryId: string) => {
  try {
    await connectToDatabase();

    const category = await Category.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    category.isHidden = !category.isHidden;
    await category.save();

    return JSON.parse(JSON.stringify(category));
  } catch (error) {
    handleError(error)
  }
}