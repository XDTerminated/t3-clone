"use client";
import React, { useEffect, useState, useRef } from "react";
import { useData } from "~/contexts/DataContext";
import { Button } from "~/components/ui/button";
import { XIcon, ChevronLeft, ChevronRight } from "lucide-react";

export default function DataViewModal() {
  const { datasets, selectedIndex: index, clearSelection } = useData();
  // pagination
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [index]);
  // scroll visibility hooks
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollActive, setScrollActive] = useState(false);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const showScroll = () => {
    setScrollActive(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    // Hide scrollbar after 1s of inactivity
    hideTimer.current = setTimeout(() => setScrollActive(false), 1000);
  };
  // early exit if no valid selection
  if (index === null || index < 0 || index >= datasets.length) return null;
  const selected = datasets[index];
  if (!selected) return null;
  const { name, data } = selected;
  const rows: Record<string, string>[] = Array.isArray(data) ? data : [];
  const pageSize = 20;
  const pageCount = Math.ceil(rows.length / pageSize) || 1;
  const currentRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const columns = currentRows.length > 0 ? Object.keys(currentRows[0]!) : [];

  return (
    <div className="fixed inset-0 z-[998] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-popover text-popover-foreground border-border max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-lg border p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-lg font-semibold">{name}</h2>
          <Button variant="ghost" size="icon" onClick={() => clearSelection()}>
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-center">
            No data to display.
          </p>
        ) : (
          <div
            ref={scrollRef}
            onScroll={showScroll}
            onMouseEnter={showScroll}
            className={`data-scrollbar bg-background border-border max-h-[60vh] overflow-x-auto overflow-y-auto rounded-md border px-2 shadow-inner ${scrollActive ? "scroll-active" : ""}`}
          >
            <table className="divide-border min-w-max divide-y whitespace-nowrap">
              <thead className="bg-popover sticky top-0">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="text-popover-foreground px-4 py-2 text-left text-sm font-medium whitespace-nowrap first:rounded-tl-md last:rounded-tr-md"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {currentRows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="odd:bg-background even:bg-muted hover:bg-accent/10"
                  >
                    {columns.map((column) => (
                      <td
                        key={column}
                        className="text-foreground px-4 py-2 text-sm whitespace-nowrap"
                      >
                        {row[column]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* pagination controls */}
        <div className="mt-4 flex items-center justify-between space-x-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <div className="flex items-center space-x-2">
            <span className="text-sm">Page</span>
            <input
              type="number"
              min={1}
              max={pageCount}
              value={page}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= pageCount) setPage(val);
              }}
              className="no-spinner border-border bg-popover text-popover-foreground w-12 rounded border px-1 py-0.5 text-center text-xs"
            />
            <span className="text-sm">of {pageCount}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page === pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
