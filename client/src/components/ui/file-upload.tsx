import React, { useCallback, useState } from "react";
import { FileUp } from "lucide-react";
import { useDropzone } from 'react-dropzone';
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  onFilesSelected: (files: File[]) => void;
  className?: string;
}

export function FileUpload({
  accept,
  maxFiles = 1,
  maxSize = 5242880, // 5MB by default
  onFilesSelected,
  className,
}: FileUploadProps) {
  const [fileRejections, setFileRejections] = useState<string[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Verify files are not empty
      const validFiles = acceptedFiles.filter(file => file.size > 0);
      
      if (validFiles.length === 0 && acceptedFiles.length > 0) {
        console.error("Dropped files have zero size", acceptedFiles);
        setFileRejections(["The dropped file appears to be empty. Please try selecting the file through the file browser instead."]);
        return;
      }
      
      if (validFiles.length > 0) {
        // Use the files directly - creating new File objects can cause issues with some browsers
        onFilesSelected(validFiles);
        setFileRejections([]);
      }

      const errorMessages = rejectedFiles.map((file) => {
        const { errors } = file;
        return errors.map((error: any) => `${file.file.name}: ${error.message}`).join(', ');
      });

      if (errorMessages.length > 0) {
        setFileRejections(errorMessages);
      }
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    useFsAccessApi: false, // Disable File System Access API for better compatibility 
    multiple: false, // Only allow single file uploads
    noClick: false, // Enable click to open file dialog
    noKeyboard: false, // Enable keyboard navigation
    preventDropOnDocument: true, // Prevent dropping on document (which can cause navigation)
    noDrag: false // Keep drag-and-drop functionality enabled
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center transition cursor-pointer",
          isDragActive ? "border-primary bg-primary/5" : "hover:border-primary",
          className
        )}
      >
        <input {...getInputProps()} />
        <FileUp className="h-10 w-10 mx-auto text-neutral-400 mb-3" />
        {isDragActive ? (
          <p className="text-neutral-600 mb-2">Drop the files here...</p>
        ) : (
          <>
            <p className="text-neutral-600 mb-2">
              Drag and drop your file here, or click to browse
            </p>
            <p className="text-xs text-neutral-500">
              Supports Excel (.xlsx, .xls) and CSV formats
            </p>
          </>
        )}
      </div>
      
      {fileRejections.length > 0 && (
        <div className="mt-3 text-sm text-destructive">
          {fileRejections.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </div>
      )}
    </div>
  );
}
