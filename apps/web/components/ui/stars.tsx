import { Star } from "lucide-react";

type StarsProps = { rating: number; size?: number; count?: number };

export function Stars({ rating, size = 13, count }: StarsProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={
              i <= rating
                ? "fill-accent stroke-accent"
                : "fill-transparent stroke-muted"
            }
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-secondary">({count})</span>
      )}
    </div>
  );
}
