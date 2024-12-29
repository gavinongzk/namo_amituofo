"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAllCategories } from "@/lib/actions/category.actions";
import { ICategory } from "@/lib/database/models/category.model";
import { formUrlQuery, removeKeysFromQuery } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react"

const CategoryFilter = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const getCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const categoryList = await getAllCategories();

        if (!categoryList) {
          throw new Error('Failed to fetch categories');
        }

        setCategories(categoryList as ICategory[]);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
        // Set default categories if available
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    getCategories();
  }, []);

  const onSelectCategory = (category: string) => {
    try {
      let newUrl = '';

      if(category && category !== 'All') {
        newUrl = formUrlQuery({
          params: searchParams.toString(),
          key: 'category',
          value: category
        });
      } else {
        newUrl = removeKeysFromQuery({
          params: searchParams.toString(),
          keysToRemove: ['category']
        });
      }

      // Validate URL before navigation
      new URL(newUrl, window.location.origin);
      router.push(newUrl, { scroll: false });
    } catch (err) {
      console.error('Error updating category URL:', err);
      // Silently fail and keep the current URL
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[42px] w-full max-w-[200px] rounded-full bg-grey-50 px-4 py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[200px]">
      <Select onValueChange={(value: string) => onSelectCategory(value)}>
        <SelectTrigger className={`select-field ${error ? 'border-red-500' : ''}`}>
          <SelectValue placeholder={error ? 'Error loading categories' : '类别 / Category'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All" className="select-item p-regular-14">
            全部 / All
          </SelectItem>

          {categories.map((category) => (
            <SelectItem 
              value={category.name} 
              key={category._id} 
              className="select-item p-regular-14"
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-red-500 text-sm mt-1">Unable to load categories</p>
      )}
    </div>
  );
};

export default CategoryFilter;