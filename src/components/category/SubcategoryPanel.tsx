type SubcategoryItem = {
  id: string;
  name: string;
};

type SubcategoryPanelProps = {
  subcategories: SubcategoryItem[];
  onSelect: (id: string) => void;
};

export default function SubcategoryPanel({ subcategories, onSelect }: SubcategoryPanelProps) {
  if (subcategories.length === 0) {
    return null;
  }

  return (
    <div className="w-[310px] border-l border-gray-200 bg-white">
      <ul>
        {subcategories.map((subcategory) => (
          <li key={subcategory.id} className="border-b border-gray-200 last:border-b-0">
            <button
              type="button"
              onClick={() => onSelect(subcategory.id)}
              className="flex w-full items-center justify-between px-5 py-3 text-left text-[15px] font-medium text-gray-800 transition-colors hover:bg-[#12108b] hover:text-white"
            >
              <span className="truncate">{subcategory.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
