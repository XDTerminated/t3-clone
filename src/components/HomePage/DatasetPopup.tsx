"use client";

import { Search, Upload, X } from "lucide-react";
import { useRef } from "react";

interface DatasetPopupProps {
  isOpen: boolean;
  onClose: () => void;
  datasetUploaded: boolean;
  onDatasetSelect: (file: File) => void; // New prop
}

export default function DatasetPopup({
  isOpen,
  onClose,
  datasetUploaded,
  onDatasetSelect,
}: DatasetPopupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

  if (!isOpen) {
    return null;
  }

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click(); // Trigger file input click
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onDatasetSelect(file);
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-gray-700/50 bg-[#1C1C1E] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className={`absolute top-3.5 right-3.5 text-gray-500 transition-colors ${
            datasetUploaded
              ? "hover:text-gray-200"
              : "cursor-not-allowed opacity-50"
          }`}
          aria-label="Close popup"
          disabled={!datasetUploaded}
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="mb-6 text-center text-xl font-semibold text-gray-100">
          Add Dataset
        </h3>
        <div className="relative mb-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search for datasets..."
            className="block w-full rounded-lg border border-gray-700/50 bg-[#252528] p-2.5 pl-10 text-sm text-gray-300 placeholder-gray-500 shadow-sm transition-colors duration-150 focus:border-[#7E22CE] focus:ring-[#7E22CE]"
          />
        </div>
        <div className="my-5 flex items-center">
          <hr className="flex-grow border-gray-600/70" />
          <span className="px-3 text-xs text-gray-500 uppercase">Or</span>
          <hr className="flex-grow border-gray-600/70" />
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden" // Hide the default file input
          accept=".csv,.json,.xls,.xlsx" // Optional: specify acceptable file types
        />
        <button
          onClick={handleUploadButtonClick} // Call handler on button click
          className="flex w-full items-center justify-center space-x-2.5 rounded-lg border border-gray-600/80 bg-[#252528] p-3 text-sm text-gray-300 transition-colors duration-150 hover:bg-[#303033] hover:text-gray-100"
        >
          <Upload className="h-4 w-4 text-gray-400" />
          <span>Upload Your Own Dataset</span>
        </button>
      </div>
    </div>
  );
}
