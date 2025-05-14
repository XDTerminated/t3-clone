"use client";

import { UploadCloud, BarChart3, FileText, LineChart } from "lucide-react";
import DataChatbot from "./DataChatbot";
import type { ParsedDataRow } from "./DataChatbot";

export default function MainContent({
  parsedData,
}: {
  parsedData: ParsedDataRow[];
}) {
  return (
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
      <DataChatbot parsedData={parsedData} />
      {/* Loading overlay */}
      {/* The DataChatbot already manages loading state, so we can show a spinner overlay here if needed. */}
    </div>
  );
}
