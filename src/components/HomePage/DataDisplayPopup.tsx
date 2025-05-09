"use client";

import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

interface ParsedDataRow {
  [key: string]: any;
}

interface DataDisplayPopupProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  data: ParsedDataRow[];
}

const ROWS_PER_PAGE = 20; // Number of rows to display per page

export default function DataDisplayPopup({
  isOpen,
  onClose,
  fileName,
  data,
}: DataDisplayPopupProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ROWS_PER_PAGE;
    return data.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, data]);

  const headers = useMemo(() => {
    const firstItem = data[0];
    if (firstItem) {
      return Object.keys(firstItem);
    }
    return [];
  }, [data]);

  if (!isOpen) {
    return null;
  }

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-gray-700/50 bg-[#1C1C1E] p-6 shadow-2xl">
        <button
          onClick={() => {
            onClose();
            setCurrentPage(1); // Reset to first page on close
          }}
          className="absolute top-3.5 right-3.5 text-gray-500 transition-colors hover:text-gray-200"
          aria-label="Close data view"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="mb-1 text-xl font-semibold text-gray-100">
          Dataset:{" "}
          <span className="font-normal text-[#7E22CE]">{fileName}</span>
        </h3>
        <p className="mb-4 text-xs text-gray-400">
          Displaying {currentTableData.length} of {data.length} rows.
        </p>

        {data.length === 0 ? (
          <p className="text-gray-400">
            No data to display or dataset is empty.
          </p>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full divide-y divide-gray-700/50 text-sm">
              <thead className="bg-[#252528]">
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-4 py-2.5 text-left font-medium text-gray-300"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/70 bg-[#1C1C1E]">
                {currentTableData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-[#222224]">
                    {headers.map((header, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-4 py-2 whitespace-nowrap text-gray-400"
                      >
                        {String(row[header])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.length > ROWS_PER_PAGE && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-700/50 pt-3">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="flex items-center rounded-md bg-[#252528] px-3 py-1.5 text-xs text-gray-300 hover:bg-[#303033] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </button>
            <span className="text-xs text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center rounded-md bg-[#252528] px-3 py-1.5 text-xs text-gray-300 hover:bg-[#303033] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
