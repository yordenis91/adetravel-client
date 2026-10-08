import * as React from "react"

import { cn } from "@/lib/utils"

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /**
   * En pantallas estrechas (< 768 px) cada fila se muestra como una tarjeta, con el nombre de la
   * columna delante de cada valor, en lugar de recortar las últimas columnas (estado, acciones).
   */
  stackOnMobile?: boolean
}

/** Copia el texto de cada cabecera en `data-label` de las celdas de su columna (lo usa el CSS). */
function useColumnLabels(tableRef: React.RefObject<HTMLTableElement>, enabled: boolean) {
  React.useLayoutEffect(() => {
    const table = tableRef.current
    if (!enabled || !table) return
    const apply = () => {
      const labels = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent?.trim() ?? "")
      table.querySelectorAll("tbody tr").forEach((row) => {
        Array.from(row.children).forEach((cell, index) => {
          const label = (cell as HTMLTableCellElement).colSpan > 1 ? "" : labels[index] ?? ""
          if (cell.getAttribute("data-label") !== label) cell.setAttribute("data-label", label)
        })
      })
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(table, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [tableRef, enabled])
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, stackOnMobile = false, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTableElement>(null)
    React.useImperativeHandle(ref, () => innerRef.current as HTMLTableElement)
    useColumnLabels(innerRef, stackOnMobile)
    return (
      <div className="relative w-full overflow-auto">
        <table
          ref={innerRef}
          className={cn("w-full caption-bottom text-sm", stackOnMobile && "table-stack", className)}
          {...props}
        />
      </div>
    )
  }
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
