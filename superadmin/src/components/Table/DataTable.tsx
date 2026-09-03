import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SortDir = 'asc' | 'desc'

export type ColumnHeader =
  | string
  | {
      label: string
      sortKey?: string
      align?: 'left' | 'center'
    }

type Props = {
  headers: ColumnHeader[]
  rows: ReactNode[][]
  isSN?: boolean
  page?: number
  limit?: number
  total?: number
  onPageChange?: (page: number) => void
  onLimitChange?: (limit: number) => void
  pageSizeOptions?: number[]
  sortBy?: string
  sortDir?: SortDir
  onSortChange?: (sortBy: string, sortDir: SortDir) => void
  emptyMessage?: string
}

function normalizeHeader(header: ColumnHeader) {
  if (typeof header === 'string') {
    return {
      label: header,
      sortKey: undefined as string | undefined,
      align: header.toLowerCase().includes('action')
        ? ('center' as const)
        : ('left' as const),
    }
  }
  return {
    label: header.label,
    sortKey: header.sortKey,
    align:
      header.align ??
      (header.label.toLowerCase().includes('action') ? 'center' : 'left'),
  }
}

export function DataTable({
  headers,
  rows,
  isSN = true,
  page = 1,
  limit = 10,
  total = rows.length,
  onPageChange,
  onLimitChange,
  pageSizeOptions = [10, 20, 50],
  sortBy,
  sortDir = 'desc',
  onSortChange,
  emptyMessage = 'No records found',
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const cols = headers.map(normalizeHeader)
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1
  const rangeEnd = Math.min(page * limit, total)

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-max min-w-full border-collapse text-[13px] text-slate-700">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90">
              {isSN && (
                <th className="w-12 px-3 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  S.N.
                </th>
              )}
              {cols.map((col) => {
                const sortable = Boolean(col.sortKey && onSortChange)
                const active = sortable && sortBy === col.sortKey

                return (
                  <th
                    key={col.label}
                    className={cn(
                      'whitespace-nowrap px-3 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:px-4',
                      col.align === 'center' ? 'text-center' : 'text-left',
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!col.sortKey || !onSortChange) return
                          if (active) {
                            onSortChange(
                              col.sortKey,
                              sortDir === 'asc' ? 'desc' : 'asc',
                            )
                          } else {
                            onSortChange(col.sortKey, 'asc')
                          }
                        }}
                        className={cn(
                          'inline-flex items-center gap-1 transition-colors',
                          active
                            ? 'text-primary'
                            : 'text-slate-500 hover:text-slate-800',
                        )}
                      >
                        {col.label}
                        {active ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : null}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={cols.length + (isSN ? 1 : 0)}
                  className="px-4 py-12 text-center text-sm text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-slate-100 transition-colors hover:bg-primary/[0.03]"
                >
                  {isSN && (
                    <td className="px-4 py-3.5 text-center text-slate-500">
                      {(page - 1) * limit + index + 1}
                    </td>
                  )}
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={cn(
                        'whitespace-nowrap px-3 py-3.5 align-middle md:px-4',
                        cols[cellIndex]?.align === 'center'
                          ? 'text-center'
                          : 'text-left',
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {onPageChange && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            Showing {rangeStart}–
            {onLimitChange ? (
              <>
                <label htmlFor="table-page-size" className="sr-only">
                  Rows per page
                </label>
                <select
                  id="table-page-size"
                  value={limit}
                  onChange={(e) => onLimitChange(Number(e.target.value))}
                  className="h-7 rounded-md border border-slate-200 bg-white px-1.5 text-xs text-slate-700 outline-none focus:border-primary"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              rangeEnd
            )}{' '}
            of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-md border border-slate-200 px-2.5 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="min-w-[2.5rem] text-center">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-md border border-slate-200 px-2.5 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
