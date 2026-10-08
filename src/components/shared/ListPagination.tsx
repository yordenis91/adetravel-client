import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListPaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
}

/** Pie de las listas paginadas en el servidor: rango visible, total y página anterior/siguiente. */
export function ListPagination({ page, limit, total, onPageChange, isFetching }: ListPaginationProps) {
  if (total <= limit && page === 1) {
    return total > 0 ? <p className="text-xs text-muted-foreground">{total} {total === 1 ? "registro" : "registros"}</p> : null;
  }
  const pages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
      <p aria-live="polite">
        {from}–{to} de {total}
        {isFetching ? " · cargando…" : ""}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-8" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Página anterior">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span>
          Página {page} de {pages}
        </span>
        <Button variant="outline" size="sm" className="h-8" onClick={() => onPageChange(page + 1)} disabled={page >= pages} aria-label="Página siguiente">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </nav>
  );
}
