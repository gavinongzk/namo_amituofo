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
import { Loader2 } from "lucide-react";

const CategoryFilter = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Define category colors
  const categoryColors: { [key: string]: string } = {
    'All': 'bg-gray-200',
    '念佛共修': 'bg-orange-200',
    '念佛｜闻法｜祈福｜超荐': 'bg-blue-200',
    '外出结缘法会': 'bg-green-200',
  };

  useEffect(() => {
    const getCategories = async () => {
      try {
        setIsLoading(true);
        const categoryList = await getAllCategories();
        categoryList && setCategories(categoryList as ICategory[]);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    }

    getCategories();
  }, [])

  const onSelectCategory = (category: string) => {
    setIsFiltering(true);
    let newUrl = '';

    if(category && category !== 'All') {
      newUrl = formUrlQuery({
        params: searchParams.toString(),
        key: 'category',
        value: category
      })
    } else {
      newUrl = removeKeysFromQuery({
        params: searchParams.toString(),
        keysToRemove: ['category']
      })
    }

    router.push(newUrl, { scroll: false });
    
    // Reset filtering state after a short delay to show loading state
    setTimeout(() => setIsFiltering(false), 300);
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-md">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-gray-500">加载中... Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <Select 
        onValueChange={(value: string) => onSelectCategory(value)}
        disabled={isFiltering}
      >
        <SelectTrigger className={`select-field ${isFiltering ? 'opacity-50' : ''} min-w-[180px]`}>
          <SelectValue placeholder="类别 / Category" />
          {isFiltering && (
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem 
            value="All" 
            className="select-item p-regular-14 flex items-start gap-2 hover:bg-gray-50"
          >
            <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${categoryColors['All']}`} />
            全部 / All
          </SelectItem>

          {categories.map((category) => (
            <SelectItem 
              value={category.name} 
              key={category._id} 
              className="select-item p-regular-14 flex items-start gap-2 hover:bg-gray-50"
            >
              <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${categoryColors[category.name] || 'bg-gray-200'}`} />
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default CategoryFilter