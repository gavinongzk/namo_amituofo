import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ICategory } from "@/lib/database/models/category.model"
import { startTransition, useEffect, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "../ui/input"
import { createCategory, getAllCategories, deleteCategory, categoryHasEvents, toggleCategoryVisibility } from "@/lib/actions/category.actions"
import { Button } from "@/components/ui/button"
import { EyeIcon, EyeOffIcon } from 'lucide-react'

type DropdownProps = {
  value?: string
  onChangeHandler?: () => void
  isSuperAdmin?: boolean
  showHidden?: boolean
}

const Dropdown = ({ value, onChangeHandler, isSuperAdmin = false, showHidden = false }: DropdownProps) => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getCategories = async () => {
      const categoryList = await getAllCategories(showHidden);
      categoryList && setCategories(categoryList as ICategory[]);
    }

    getCategories();
  }, [showHidden])

  const handleAddCategory = () => {
    createCategory({ categoryName: newCategory.trim() })
      .then((category) => {
        setCategories((prevState) => [...prevState, category])
      })
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const hasEvents = await categoryHasEvents(categoryId);
    if (hasEvents) {
      alert('Cannot delete category with existing events.');
      return;
    }
    
    await deleteCategory(categoryId);
    setCategories(prevCategories => prevCategories.filter(cat => cat._id !== categoryId));
  }

  const handleToggleVisibility = async (categoryId: string) => {
    setIsLoading(true);
    try {
      const updatedCategory = await toggleCategoryVisibility(categoryId);
      if (updatedCategory) {
        setCategories(prevCategories => 
          prevCategories.map(cat => 
            cat._id === categoryId ? updatedCategory : cat
          )
        );
      }
    } catch (error) {
      console.error('Error toggling category visibility:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative">
      <Select onValueChange={onChangeHandler} defaultValue={value}>
        <SelectTrigger className="select-field">
          <SelectValue placeholder="类别 / Category" />
        </SelectTrigger>
        <SelectContent>
          {categories.length > 0 && categories.map((category) => (
            <div key={category._id} className="flex justify-between items-center p-2 hover:bg-gray-100">
              <SelectItem value={category._id} className="select-item p-regular-14">
                <span className={category.isHidden ? 'text-gray-400' : ''}>
                  {category.name}
                </span>
              </SelectItem>
              {isSuperAdmin && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleVisibility(category._id);
                    }}
                    disabled={isLoading}
                  >
                    {category.isHidden ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteCategory(category._id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
          {isSuperAdmin && (
            <AlertDialog>
              <AlertDialogTrigger className="flex w-full rounded-sm py-3 pl-8 text-primary-500 hover:bg-primary-50">
                Add new category
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>New Category</AlertDialogTitle>
                  <AlertDialogDescription>
                    Add a new category for events
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <Input 
                  type="text"
                  placeholder="Category name"
                  className="input-field mt-3"
                  onChange={(e) => setNewCategory(e.target.value)}
                />

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => startTransition(handleAddCategory)}>
                    Add
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

export default Dropdown