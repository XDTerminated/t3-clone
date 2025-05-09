"use client"; // Required for useState and event handlers

import {
  ArrowUp,
  UploadCloud,
  BarChart3,
  FileText,
  LineChart,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";

export default function HomePage() {
  const [isPopupOpen, setIsPopupOpen] = useState(true); // Open by default
  const [datasetUploaded, setDatasetUploaded] = useState(false); // New state

  return (
    <div className="relative flex h-screen bg-[#171719] font-sans text-gray-300">
      {/* Show button only if popup is not open */}
      {!isPopupOpen && (
        <button
          onClick={() => setIsPopupOpen(true)}
          className="absolute top-4 left-4 z-20 rounded-lg bg-[#252528] p-2.5 text-gray-300 shadow-md transition-colors duration-150 hover:bg-[#303033] hover:text-gray-100"
          aria-label="Add Dataset"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}
      <div className="flex w-full flex-1 flex-col items-center justify-between p-4 md:p-8">
        <div className="mt-8 w-full max-w-lg text-center">
          <h2 className="mb-8 text-3xl font-semibold text-gray-100">
            Analyze Your Data & Create Visualizations
          </h2>
          <div className="mb-10 grid grid-cols-2 gap-3">
            {[
              { icon: UploadCloud, label: "Import Data" },
              { icon: BarChart3, label: "Visualize Data" },
              { icon: FileText, label: "Generate Report" },
              { icon: LineChart, label: "Analyze Trends" },
            ].map((item) => (
              <button
                key={item.label}
                className="flex items-center justify-start space-x-3 rounded-lg bg-[#252528] p-3.5 px-4 text-sm text-gray-300 transition-colors duration-150 hover:bg-[#303033] hover:text-gray-100"
              >
                <item.icon className="h-5 w-5 text-gray-400" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <div className="space-y-3 text-sm">
            <p className="cursor-pointer text-gray-400 hover:text-gray-200">
              Plot sales data for the last quarter
            </p>
            <p className="cursor-pointer text-gray-400 hover:text-gray-200">
              Show correlation between marketing spend and revenue
            </p>
            <p className="cursor-pointer text-gray-400 hover:text-gray-200">
              Generate a pie chart of customer demographics
            </p>
            <p className="cursor-pointer text-gray-400 hover:text-gray-200">
              Forecast product demand for next 6 months
            </p>
          </div>
        </div>
        <div className="mb-3 w-full max-w-lg">
          <div className="flex items-center rounded-xl border border-gray-700/40 bg-[#252528] p-2 shadow-sm transition-all duration-150 focus-within:border-[#7E22CE]/70">
            <input
              type="text"
              placeholder="Type your message here..."
              className="flex-grow bg-transparent px-2.5 py-1 text-sm text-gray-200 placeholder-gray-500 focus:outline-none" // Adjusted padding
            />
            <button className="ml-1.5 rounded-lg bg-[#7E22CE] p-1.5 text-gray-100 transition-colors hover:bg-[#8F33D6]">
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-1.5 flex items-center justify-between px-2 text-[0.6875rem] text-gray-500"></div>
        </div>
      </div>
      {/* Popup/Modal for Adding Dataset */}
      {isPopupOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-gray-700/50 bg-[#1C1C1E] p-6 shadow-2xl">
            <button
              onClick={() => {
                if (datasetUploaded) {
                  setIsPopupOpen(false);
                }
              }}
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
            {/* Dataset Search Bar in Popup */}
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
            <button className="flex w-full items-center justify-center space-x-2.5 rounded-lg border border-gray-600/80 bg-[#252528] p-3 text-sm text-gray-300 transition-colors duration-150 hover:bg-[#303033] hover:text-gray-100">
              <Upload className="h-4 w-4 text-gray-400" />
              <span>Upload Your Own Dataset</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
