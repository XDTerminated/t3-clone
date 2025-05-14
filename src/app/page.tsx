"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import Papa from "papaparse";
import DatasetPopup from "~/components/HomePage/DatasetPopup";
import MainContent from "~/components/HomePage/MainContent";
import Sidebar from "~/components/HomePage/Sidebar";
import DataDisplayPopup from "~/components/HomePage/DataDisplayPopup"; // Import DataDisplayPopup

// Define a generic type for parsed data rows
type ParsedDataRow = Record<string, string>;

// Define the structure for an imported dataset item
interface DatasetItem {
  id: string;
  fileName: string;
  parsedData: ParsedDataRow[];
}

export default function HomePage() {
  const [isDatasetImportPopupOpen, setIsDatasetImportPopupOpen] =
    useState(true); // Renamed for clarity
  const [importedDatasets, setImportedDatasets] = useState<DatasetItem[]>([]);

  // State for Data Display Popup
  const [isDataDisplayPopupOpen, setIsDataDisplayPopupOpen] = useState(false);
  const [selectedDatasetForDisplay, setSelectedDatasetForDisplay] =
    useState<DatasetItem | null>(null);

  const handleCloseDatasetImportPopup = () => {
    if (importedDatasets.length > 0) {
      setIsDatasetImportPopupOpen(false);
    }
  };

  const handleDatasetSelectAndParse = (file: File) => {
    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log("Parsed CSV data:", results.data);
          const newDataset: DatasetItem = {
            id: Date.now().toString(), // Simple unique ID
            fileName: file.name,
            parsedData: results.data as ParsedDataRow[],
          };
          setImportedDatasets((prevDatasets) => [...prevDatasets, newDataset]);
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
        },
      });
    } else {
      console.warn("Selected file is not a CSV. Please upload a CSV file.");
    }
  };

  // Handler for selecting a dataset from the sidebar
  const handleSelectDatasetForDisplay = (datasetId: string) => {
    const datasetToShow = importedDatasets.find((d) => d.id === datasetId);
    if (datasetToShow) {
      setSelectedDatasetForDisplay(datasetToShow);
      setIsDataDisplayPopupOpen(true);
    }
  };

  const handleCloseDataDisplayPopup = () => {
    setIsDataDisplayPopupOpen(false);
    setSelectedDatasetForDisplay(null);
  };

  // Compose a single dataset for the chatbot (e.g., the first imported dataset)
  const parsedData: ParsedDataRow[] =
    importedDatasets.length > 0 && importedDatasets[0]?.parsedData
      ? importedDatasets[0].parsedData
      : [];

  return (
    <div className="flex h-screen bg-[#171719] font-sans text-gray-300">
      <Sidebar
        datasets={importedDatasets}
        onSelectDataset={handleSelectDatasetForDisplay}
      />
      <div className="relative flex flex-1 flex-col">
        {!isDatasetImportPopupOpen && (
          <button
            onClick={() => setIsDatasetImportPopupOpen(true)}
            className="absolute top-4 right-4 z-20 rounded-lg bg-[#252528] p-2.5 text-gray-300 shadow-md transition-colors duration-150 hover:bg-[#303033] hover:text-gray-100"
            aria-label="Add Dataset"
            title="Add new dataset"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
        <MainContent parsedData={parsedData} />
      </div>

      {isDatasetImportPopupOpen && (
        <DatasetPopup
          isOpen={isDatasetImportPopupOpen}
          onClose={handleCloseDatasetImportPopup}
          datasetUploaded={importedDatasets.length > 0}
          onDatasetSelect={handleDatasetSelectAndParse}
        />
      )}

      {selectedDatasetForDisplay && (
        <DataDisplayPopup
          isOpen={isDataDisplayPopupOpen}
          onClose={handleCloseDataDisplayPopup}
          fileName={selectedDatasetForDisplay.fileName}
          data={selectedDatasetForDisplay.parsedData}
        />
      )}
    </div>
  );
}
