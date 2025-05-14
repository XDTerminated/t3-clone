import { useState } from "react";
import ChartDisplay from "../ChartDisplay";
import ChartJSLine from "../ChartJSLine";

// Type for a row of parsed data
export type ParsedDataRow = Record<string, string>;
export type ChartData = {
  labels: string[];
  values: number[];
  datasetLabel?: string;
};

interface DataChatbotProps {
  parsedData: ParsedDataRow[];
}

// Accepts parsedData as a prop from MainContent
export default function DataChatbot({ parsedData }: DataChatbotProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [error, setError] = useState("");

  // Convert parsedData (array of objects) to CSV string for backend
  function toCSV(data: ParsedDataRow[]): string {
    if (!data || data.length === 0) return "";
    const firstRow = data[0] ?? {};
    const keys = Object.keys(firstRow);
    const csvRows = [keys.join(",")];
    for (const row of data) {
      csvRows.push(keys.map((k) => JSON.stringify(row[k] ?? "")).join(","));
    }
    return csvRows.join("\n");
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setImageData(null);
    setChartData(null);
    try {
      const userData = toCSV(parsedData);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, userData }),
      });
      const data = (await res.json()) as unknown;
      const imageData =
        typeof data === "object" && data && "imageData" in data
          ? (data as { imageData?: string }).imageData
          : null;
      const chartData =
        typeof data === "object" && data && "chartData" in data
          ? ((data as { chartData?: ChartData }).chartData ?? null)
          : null;
      setImageData(imageData ?? null);
      setChartData(chartData);
    } catch {
      setError("Failed to analyze data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mb-3 w-full max-w-lg">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/60">
          <svg
            className="h-8 w-8 animate-spin text-violet-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        </div>
      )}
      <div className="flex items-center rounded-xl border border-gray-700/40 bg-[#252528] p-2 shadow-sm transition-all duration-150 focus-within:border-[#7E22CE]/70">
        <form onSubmit={handleSubmit} className="flex w-full">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your message here..."
            className="flex-grow bg-transparent px-2.5 py-1 text-sm text-gray-200 placeholder-gray-500 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            className="ml-1.5 rounded-lg bg-[#7E22CE] p-1.5 text-gray-100 transition-colors hover:bg-[#8F33D6]"
            disabled={loading || !prompt.trim()}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </button>
        </form>
      </div>
      <div className="mt-1.5 flex items-center justify-between px-2 text-[0.6875rem] text-gray-500">
        {error && <span className="text-red-400">{error}</span>}
      </div>
      {imageData && <ChartDisplay imageData={imageData} />}
      {chartData && <ChartJSLine chartData={chartData} />}
    </div>
  );
}
