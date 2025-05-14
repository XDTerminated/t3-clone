"use client";

import { Database } from "lucide-react";

type ParsedDataRow = Record<string, string>;

interface DatasetItem {
  id: string;
  fileName: string;
  parsedData: ParsedDataRow[];
}

interface SidebarProps {
  datasets: DatasetItem[];
  onSelectDataset: (datasetId: string) => void; // Modified: no longer optional
}

export default function Sidebar({ datasets, onSelectDataset }: SidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col space-y-4 border-r border-gray-700/50 bg-[#1C1C1E] p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-100">
        Imported Datasets
      </h2>
      {datasets.length === 0 && (
        <p className="text-sm text-gray-500">No datasets imported yet.</p>
      )}
      <ul className="flex-1 space-y-2 overflow-y-auto">
        {datasets.map((dataset) => (
          <li key={dataset.id}>
            <button
              onClick={() => onSelectDataset(dataset.id)} // Call onSelectDataset with dataset.id
              className="flex w-full items-center space-x-2 rounded-md p-2 text-sm text-gray-300 transition-colors duration-150 hover:bg-[#252528] hover:text-gray-100 focus:bg-[#303033] focus:outline-none"
            >
              <Database className="h-4 w-4 text-gray-400" />
              <span className="truncate">{dataset.fileName}</span>
            </button>
          </li>
        ))}
      </ul>
      {/* You can add a button here to trigger the dataset import popup if needed */}
      {/* For example:
      <button 
        className="mt-auto w-full bg-[#7E22CE] hover:bg-[#8F33D6] text-white p-2 rounded-md text-sm"
      >
        Add New Dataset
      </button> 
      */}
    </div>
  );
}
