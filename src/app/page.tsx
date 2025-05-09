"use client"; // Required for useState and event handlers

import { Plus } from "lucide-react";
import { useState } from "react";
import DatasetPopup from "~/components/HomePage/DatasetPopup";
import MainContent from "~/components/HomePage/MainContent";

export default function HomePage() {
  const [isPopupOpen, setIsPopupOpen] = useState(true);
  const [datasetUploaded, setDatasetUploaded] = useState(false);

  const handleClosePopup = () => {
    if (datasetUploaded) {
      setIsPopupOpen(false);
    }
  };

  return (
    <div className="relative flex h-screen bg-[#171719] font-sans text-gray-300">
      {!isPopupOpen && (
        <button
          onClick={() => setIsPopupOpen(true)}
          className="absolute top-4 left-4 z-20 rounded-lg bg-[#252528] p-2.5 text-gray-300 shadow-md transition-colors duration-150 hover:bg-[#303033] hover:text-gray-100"
          aria-label="Add Dataset"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}
      <MainContent />
      <DatasetPopup
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        datasetUploaded={datasetUploaded}
      />
    </div>
  );
}
