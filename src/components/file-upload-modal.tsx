"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { UploadIcon } from "lucide-react";
import { parse } from "papaparse";
import { useData } from "~/contexts/DataContext";

export default function FileUploadModal() {
  const [exiting, setExiting] = useState(false);
  const { addDataset, uploadOpen, closeUpload } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvText = event.target?.result as string;
        parse<Record<string, string>>(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            addDataset(file.name, results.data);
            // animate exit then close modal
            setExiting(true);
            setTimeout(() => closeUpload(), 300);
          },
        });
      };
      reader.readAsText(file);
    }
  };

  if (!uploadOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center bg-black/30 backdrop-blur-md transition-opacity duration-300 ${exiting ? "opacity-0" : "opacity-100"}`}
    >
      <div
        className={`bg-background border-sidebar-border w-full max-w-md transform rounded-lg border p-6 shadow-lg transition-all duration-300 ${exiting ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}
      >
        <h2 className="text-foreground mb-4 text-center text-lg font-semibold">
          Add Dataset
        </h2>
        <Input
          type="text"
          placeholder="Search for datasets..."
          className="mb-4"
        />
        <div className="my-4 flex items-center">
          <div className="border-sidebar-border flex-grow border-t" />
          <span className="text-muted-foreground px-2 text-sm">OR</span>
          <div className="border-sidebar-border flex-grow border-t" />
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleUploadClick}
        >
          <UploadIcon />
          Upload Your Own Dataset
        </Button>
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
