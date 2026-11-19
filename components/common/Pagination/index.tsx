import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/utils/format";

/**
 * Page numbers to show, at most 6: all of them up to 6 pages, otherwise the first 3 and the last 3 with "…" in
 * between. When the current page is hidden in that gap it is shown between two "…" (1 2 … 7 … 11 12).
 */
export function pageItems(current: number, total: number): (number | "…")[] {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3 || current >= total - 2) return [1, 2, 3, "…", total - 2, total - 1, total];
  return [1, 2, "…", current, "…", total - 1, total];
}

/** Table footer: total count on the left, « ‹ pages › » on the right. */
export function Pagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const go = (next: number) => onPage(Math.min(pages, Math.max(1, next)));
  return (
    <div className="pagination">
      <span className="pagination__total">
        Tổng số bản ghi: <strong>{total}</strong>
      </span>
      <nav className="pagination__pages" aria-label="Phân trang">
        <button type="button" aria-label="Trang đầu" disabled={page <= 1} onClick={() => go(1)}>
          <ChevronsLeft size={16} />
        </button>
        <button
          type="button"
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        {pageItems(page, pages).map((item, index) =>
          item === "…" ? (
            <span key={`gap-${index}`} className="pagination__gap" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={cn("pagination__page", item === page && "is-current")}
              aria-current={item === page ? "page" : undefined}
              aria-label={`Trang ${item}`}
              onClick={() => go(item)}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="Trang sau"
          disabled={page >= pages}
          onClick={() => go(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
        <button
          type="button"
          aria-label="Trang cuối"
          disabled={page >= pages}
          onClick={() => go(pages)}
        >
          <ChevronsRight size={16} />
        </button>
      </nav>
    </div>
  );
}
