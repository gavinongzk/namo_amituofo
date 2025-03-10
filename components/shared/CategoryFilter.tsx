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
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";

const CategoryFilter = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const isSuperAdmin = user?.publicMetadata?.role === 'superadmin';

  // Define category colors using useMemo to prevent recreation on each render
  const categoryColors: Record<string, string> = useMemo(() => ({
    'All': 'bg-gray-200',
    '念佛超荐法会': 'bg-blue-200',
    '念佛共修': 'bg-orange-200',
    '外出结缘法会': 'bg-green-200',
  }), []);

  // Define the desired category order using useMemo
  const categoryOrder = useMemo(() => ['念佛超荐法会', '念佛共修', '外出结缘法会'], []);

  // Memoize the getCategories function
  const getCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const categoryList = await getAllCategories(isSuperAdmin);

      if (categoryList && categoryList.length > 0) {
        // Sort categories according to the defined order
        const sortedCategories = [...categoryList].sort((a, b) => {
          const indexA = categoryOrder.indexOf(a.name);
          const indexB = categoryOrder.indexOf(b.name);
          // If category is not in order list, put it at the end
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
        setCategories(sortedCategories as ICategory[]);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin, categoryOrder]);

  useEffect(() => {
    getCategories();
  }, [getCategories]);

  // Memoize the onSelectCategory function
  const onSelectCategory = useCallback((category: string) => {
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
  }, [searchParams, router]);

  // Memoize the current category value
  const currentCategory = useMemo(() => {
    const category = searchParams.get('category');
    return category || 'All';
  }, [searchParams]);

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
        onValueChange={onSelectCategory}
        disabled={isFiltering}
        value={currentCategory}
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
            className="select-item p-regular-14 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2 w-full">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${categoryColors['All']}`} />
              <span>全部 / All</span>
            </div>
          </SelectItem>
          {categories.map((category) => (
            <SelectItem 
              key={category._id} 
              value={category.name}
              className="select-item p-regular-14 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2 w-full">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${categoryColors[category.name] || 'bg-gray-200'}`} />
                <span>{category.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default CategoryFilter;