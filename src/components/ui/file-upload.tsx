// src/components/ui/file-upload.tsx
"use client";

import {
  FileIcon,
  FileTextIcon,
  ImageIcon,
  MusicIcon,
  Upload,
  VideoIcon,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  fileType: "image" | "video" | "audio" | "document" | "sticker";
  onUploadComplete: (fileInfo: {
    url: string;
    fileName: string;
    originalName: string;
    size: number;
    contentType: string;
  }) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  currentFile?: string;
  onRemove?: () => void;
}

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case "image":
    case "sticker":
      return <ImageIcon className="h-4 w-4" />;
    case "video":
      return <VideoIcon className="h-4 w-4" />;
    case "audio":
      return <MusicIcon className="h-4 w-4" />;
    case "document":
      return <FileTextIcon className="h-4 w-4" />;
    default:
      return <FileIcon className="h-4 w-4" />;
  }
};

const getAcceptTypes = (fileType: string) => {
  switch (fileType) {
    case "image":
      return "image/jpeg,image/png,image/gif,image/webp";
    case "video":
      return "video/mp4,video/avi,video/mov,video/wmv";
    case "audio":
      return "audio/mp3,audio/wav,audio/ogg,audio/m4a";
    case "document":
      return "application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt";
    case "sticker":
      return "image/webp,image/png";
    default:
      return "*/*";
  }
};

export function FileUpload({
  fileType,
  onUploadComplete,
  accept,
  maxSize = 50,
  disabled = false,
  currentFile,
  onRemove,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptTypes = accept || getAcceptTypes(fileType);

  const handleFile = async (file: File) => {
    if (disabled) return;

    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Tamanho máximo: ${maxSize}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", fileType);

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro no upload");
      }

      const result = await response.json();

      onUploadComplete({
        url: result.url,
        fileName: result.fileName,
        originalName: result.originalName,
        size: result.size,
        contentType: result.contentType,
      });

      toast.success("Arquivo enviado com sucesso!");
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error(error instanceof Error ? error.message : "Erro no upload");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (currentFile) {
    return (
      <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
          {getFileIcon(fileType)}
          <span className="flex-1 truncate text-sm">Arquivo carregado</span>
        </div>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={`relative rounded-lg border-2 border-dashed p-6 transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"} ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-primary/50 cursor-pointer"} `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center text-center">
          {isUploading ? (
            <div className="w-full space-y-2">
              <Upload className="text-primary mx-auto h-8 w-8 animate-pulse" />
              <div className="text-muted-foreground text-sm">
                Enviando arquivo...
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          ) : (
            <>
              {getFileIcon(fileType)}
              <div className="text-muted-foreground mt-2 text-sm">
                <span className="text-primary font-medium">
                  Clique para enviar
                </span>
                {" ou "}
                <br />
                <span>arraste e solte aqui</span>
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                Tamanho máximo: {maxSize}MB
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
