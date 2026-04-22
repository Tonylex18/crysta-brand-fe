import { ChevronRight } from "lucide-react";

type CategoryItem = {
  id: string;
  name: string;
  imageUrl?: string | null;
};

type CategoryListProps = {
  categories: CategoryItem[];
  activeCategoryId: string | null;
  onHover: (id: string) => void;
  onSelect: (id: string) => void;
};

export default function CategoryList({
  categories,
  activeCategoryId,
  onHover,
  onSelect,
}: CategoryListProps) {
  return (
    <ul className="w-[270px] bg-white">
      {categories.map((category) => {
        const isActive = activeCategoryId === category.id;

        return (
          <li key={category.id} className="border-b border-gray-200 last:border-b-0">
            <button
              type="button"
              onMouseEnter={() => onHover(category.id)}
              onFocus={() => onHover(category.id)}
              onClick={() => onSelect(category.id)}
              className={`group flex w-full items-center gap-4 px-5 py-3 text-left transition-all duration-150 ${
                isActive
                  ? "bg-[#12108b] text-white"
                  : "bg-white text-gray-800 hover:bg-gradient-to-r hover:from-[#2e1bb8] hover:via-[#5126d8] hover:to-[#c02e8f] hover:text-white"
              }`}
            >
              <div className="h-5 w-5 shrink-0 overflow-hidden rounded-sm bg-gray-100 ring-1 ring-gray-200/80">
                {category.imageUrl ? (
                  <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#f4b4d9] to-[#8c7bff]" />
                )}
              </div>
              <span className="flex-1 truncate text-[15px] font-medium">{category.name}</span>
              <ChevronRight className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
