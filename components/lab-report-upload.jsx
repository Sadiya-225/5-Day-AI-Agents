"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileText, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

export function LabReportUpload({ onLabValuesExtracted, disabled = false }) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedValues, setExtractedValues] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please Select a PDF File");
        return;
      }
      setSelectedFile(file);
      setExtractedValues(null);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setExtractedValues(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadAndExtract = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/lab-report/extract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to Extract Lab Values");
      }

      if (data.success && data.labValues) {
        const valueCount = Object.keys(data.labValues).length;

        if (valueCount === 0) {
          toast.warning("No Lab Values Found in the Report");
          return;
        }

        setExtractedValues(data.labValues);
        onLabValuesExtracted(data.labValues);
        toast.success(`Successfully Extracted ${valueCount} Lab Values`);
      }
    } catch (err) {
      console.error("Lab Report Upload Error:", err);
      toast.error(err.message || "Failed to Process Lab Report");
    } finally {
      setUploading(false);
    }
  };

  const getExtractedValuesList = () => {
    if (!extractedValues) return [];

    const labels = {
      hemoglobin: "Hemoglobin",
      hba1c: "HbA1c",
      cholesterolTotal: "Total Cholesterol",
      ldl: "LDL",
      hdl: "HDL",
      triglycerides: "Triglycerides",
      creatinine: "Creatinine",
      egfr: "eGFR",
      alt: "ALT",
      ast: "AST",
      wbcCount: "WBC Count",
      sugar_fasting: "Fasting Sugar",
      sugar_pp: "Post-Meal Sugar",
    };

    return Object.entries(extractedValues).map(([key, value]) => ({
      label: labels[key] || key,
      value,
    }));
  };

  return (
    <div className="p-4 border-2 border-dashed border-emerald-500/30 rounded-lg bg-emerald-500/5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-emerald-500">
          <Upload className="h-5 w-5" />
          <span className="font-medium">Upload Lab Report (PDF)</span>
        </div>

        <p className="text-sm text-muted-foreground">
          Upload Your Lab Report PDF to Automatically Extract Lab Values
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />

        {!selectedFile ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
          >
            <FileText className="mr-2 h-4 w-4" />
            Select PDF File
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-background rounded-lg p-3 border border-emerald-500/30">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-5 w-5 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {!uploading && !extractedValues && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={uploadAndExtract}
                    disabled={disabled}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Extract Values
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={removeSelectedFile}
                  disabled={uploading}
                  className="text-muted-foreground hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-emerald-500 p-3 bg-emerald-500/10 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing Lab Report...</span>
              </div>
            )}

            {extractedValues && (
              <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                <div className="flex items-center gap-2 text-emerald-500">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Values Extracted Successfully</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
