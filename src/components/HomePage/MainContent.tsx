"use client";

import {
  ArrowUp,
  UploadCloud,
  BarChart3,
  FileText,
  LineChart,
} from "lucide-react";

export default function MainContent() {
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
      <div className="mb-3 w-full max-w-lg">
        <div className="flex items-center rounded-xl border border-gray-700/40 bg-[#252528] p-2 shadow-sm transition-all duration-150 focus-within:border-[#7E22CE]/70">
          <input
            type="text"
            placeholder="Type your message here..."
            className="flex-grow bg-transparent px-2.5 py-1 text-sm text-gray-200 placeholder-gray-500 focus:outline-none"
          />
          <button className="ml-1.5 rounded-lg bg-[#7E22CE] p-1.5 text-gray-100 transition-colors hover:bg-[#8F33D6]">
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between px-2 text-[0.6875rem] text-gray-500"></div>
      </div>
    </div>
  );
}
