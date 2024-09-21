"use server"

import { CreateCategoryParams } from "@/types"
import { handleError } from "../utils"
import { connectToDatabase } from "../database"
import Category from "../database/models/category.model"
import Event from "../database/models/event.model"

export const createCategory = async ({ categoryName }: CreateCategoryParams) => {
  try {
    await connectToDatabase();

    const newCategory = await Category.create({ name: categoryName });

    return JSON.parse(JSON.stringify(newCategory));
  } catch (error) {
    handleError(error)
  }
}

export const getAllCategories = async () => {
  try {
    await connectToDatabase();

    const categories = await Category.find();

    return JSON.parse(JSON.stringify(categories));
  } catch (error) {
    handleError(error)
  }
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
    console.error('Error checking if category has events:', error);
    throw error;
  }
}