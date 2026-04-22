import { useMemo } from "react";
import CategoryList from "./CategoryList";
import SubcategoryPanel from "./SubcategoryPanel";

type CategoryItem = {
  id: string;
  name: string;
  imageUrl?: string | null;
};

type SubcategoryItem = {
  id: string;
  name: string;
  parentId: string;
};

type CategoryDropdownProps = {
  isOpen: boolean;
  categories: CategoryItem[];
  subcategories: SubcategoryItem[];
  activeCategoryId: string | null;
  onHoverCategory: (id: string) => void;
  onSelectCategory: (id: string) => void;
  onSelectSubcategory: (id: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

export default function CategoryDropdown({
  isOpen,
  categories,
  subcategories,
  activeCategoryId,
  onHoverCategory,
  onSelectCategory,
  onSelectSubcategory,
  onMouseEnter,
  onMouseLeave,
}: CategoryDropdownProps) {
  const activeSubcategories = useMemo(() => {
    if (!activeCategoryId) return [];
    return subcategories.filter((subcategory) => subcategory.parentId === activeCategoryId);
  }, [activeCategoryId, subcategories]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="absolute left-0 top-full mt-2 flex overflow-hidden rounded-none bg-white shadow-[0_22px_45px_rgba(15,23,42,0.18)] ring-1 ring-black/5 z-50"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <CategoryList
        categories={categories}
        activeCategoryId={activeCategoryId}
        onHover={onHoverCategory}
        onSelect={onSelectCategory}
      />
      <SubcategoryPanel subcategories={activeSubcategories} onSelect={onSelectSubcategory} />
    </div>
  );
}
