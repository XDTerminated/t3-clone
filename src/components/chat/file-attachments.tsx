"use client";

import { useState } from "react";
import {
  Image as ImageIcon,
  FileText,
  Paperclip,
  Eye,
  Download,
} from "lucide-react";
import NextImage from "next/image";
import type { UploadFileResponse } from "~/lib/types";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";

interface FileAttachmentsProps {
  files: UploadFileResponse[];
}

/**
 * Component to display file attachments with preview and download capabilities
 */
export function FileAttachments({ files }: FileAttachmentsProps) {
  const [selectedFile, setSelectedFile] = useState<UploadFileResponse | null>(
    null,
  );

  const downloadFile = (file: UploadFileResponse) => {
    // Open in a new tab, letting the browser handle download/display
    window.open(file.url, "_blank", "noopener,noreferrer");
  };

  const viewFile = (file: UploadFileResponse) => {
    const fileType = (file.serverData as { type: string })?.type ?? "";
    if (fileType.startsWith("image/")) {
      setSelectedFile(file);
    } else {
      // For PDFs and other types, open in a new tab
      window.open(file.url, "_blank", "noopener,noreferrer");
    }
  };

  // Check if this is a generated image (base64 data URL or has "generated" in name)
  const isGeneratedImage = (file: UploadFileResponse) => {
    const fileType = (file.serverData as { type: string })?.type ?? "";
    return (
      fileType.startsWith("image/") &&
      (file.url.startsWith("data:image/") ||
        file.name.toLowerCase().includes("generated"))
    );
  };

  // Separate generated images from other files
  const generatedImages = files.filter(isGeneratedImage);
  const otherFiles = files.filter((file) => !isGeneratedImage(file));

  return (
    <>
      {/* Display generated images directly */}
      {generatedImages.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {generatedImages.map((file, index) => (
            <div key={`generated-${index}`} className="group relative">
              <NextImage
                src={file.url}
                alt={file.name}
                width={512}
                height={512}
                className="h-auto max-w-full cursor-pointer rounded-lg border object-contain transition-opacity hover:opacity-90"
                loading="lazy"
                onClick={() => setSelectedFile(file)}
              />
              {/* Overlay buttons on hover */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => viewFile(file)}
                  className="rounded bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                  title="View full size"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => downloadFile(file)}
                  className="rounded bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                  title="Download image"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Display other files as before */}
      {otherFiles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {otherFiles.map((file, index) => {
            const fileType =
              (file.serverData as { type: string })?.type ??
              "application/octet-stream";
            const isImage = fileType.startsWith("image/");
            const isPDF = fileType === "application/pdf";

            return (
              <div
                key={index}
                className="bg-secondary/10 hover:bg-secondary/20 border-secondary/20 group flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                onClick={() => viewFile(file)}
              >
                <div className="flex items-center gap-2">
                  {isImage ? (
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                  ) : isPDF ? (
                    <FileText className="h-4 w-4 text-red-500" />
                  ) : (
                    <Paperclip className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="max-w-[150px] truncate font-medium">
                    {file.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      viewFile(file);
                    }}
                    className="hover:bg-secondary/40 rounded p-1 transition-colors"
                    title="View file"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(file);
                    }}
                    className="hover:bg-secondary/40 rounded p-1 transition-colors"
                    title="Download file"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}{" "}
      {/* Image preview dialog */}
      <Dialog
        open={
          selectedFile !== null &&
          (
            (selectedFile.serverData as { type: string })?.type ?? ""
          ).startsWith("image/")
        }
        onOpenChange={(open) => {
          if (!open) setSelectedFile(null);
        }}
      >
        {" "}
        <DialogContent className="max-h-[95vh] max-w-[95vw] border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <div className="fixed inset-0 flex items-center justify-center">
            {selectedFile && (
              <NextImage
                src={selectedFile.url}
                alt=""
                width={1200}
                height={800}
                className="max-h-[90vh] max-w-[90vw] object-contain"
                loading="lazy"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
