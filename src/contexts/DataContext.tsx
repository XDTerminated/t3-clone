"use client";

import React, { createContext, useContext, useState } from "react";

export interface Dataset {
  name: string;
  data: Record<string, string>[];
}

interface DataContextType {
  datasets: Dataset[];
  selectedIndex: number | null;
  addDataset: (name: string, data: Record<string, string>[]) => void;
  selectDataset: (index: number) => void;
  clearSelection: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const addDataset = (name: string, data: Record<string, string>[]) => {
    setDatasets((prev) => [...prev, { name, data }]);
  };

  const selectDataset = (index: number) => {
    setSelectedIndex(index);
  };

  const clearSelection = () => {
    setSelectedIndex(null);
  };

  return (
    <DataContext.Provider
      value={{
        datasets,
        selectedIndex,
        addDataset,
        selectDataset,
        clearSelection,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
