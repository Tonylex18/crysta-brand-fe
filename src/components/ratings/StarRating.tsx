import { Star } from 'lucide-react';

type StarRatingProps = {
  rating?: number;
  count?: number;
  size?: number;
  showCount?: boolean;
  emptyLabel?: string;
  className?: string;
};

export default function StarRating({
  rating = 0,
  count = 0,
  size = 14,
  showCount = true,
  emptyLabel = 'No ratings yet',
  className = '',
}: StarRatingProps) {
  const safeRating = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;
  const fullStars = Math.floor(safeRating);
  const hasRatings = count > 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((index) => (
          <Star
            key={index}
            className={`shrink-0 ${index < fullStars ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
            size={size}
          />
        ))}
      </div>
      {showCount ? (
        hasRatings ? (
          <span className="text-xs text-gray-500">
            {safeRating.toFixed(1)} ({count})
          </span>
        ) : (
          <span className="text-xs text-gray-400">{emptyLabel}</span>
        )
      ) : null}
    </div>
  );
}
