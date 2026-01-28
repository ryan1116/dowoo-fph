"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UploadResult } from "@/app/data/_actions/upload";

interface CsvUploadProps {
  title: string;
  description: string;
  expectedColumns: string;
  onUpload: (formData: FormData) => Promise<UploadResult>;
  onComplete: (result: UploadResult) => void;
}

export function CsvUpload({ title, description, expectedColumns, onUpload, onComplete }: CsvUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(f: File | null) {
    if (f && !f.name.endsWith(".csv")) {
      alert("Please upload a .csv file.");
      return;
    }
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile ?? null);
  }

  function handleSubmit() {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await onUpload(formData);
      onComplete(result);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
        >
          {file ? (
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">{file.name}</p>
                <p className="text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop a CSV file, or{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline underline-offset-4"
                  onClick={() => inputRef.current?.click()}
                >
                  browse
                </button>
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Expected columns: <code className="rounded bg-muted px-1 py-0.5">{expectedColumns}</code>
        </p>

        <Button onClick={handleSubmit} disabled={!file || isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Import
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
