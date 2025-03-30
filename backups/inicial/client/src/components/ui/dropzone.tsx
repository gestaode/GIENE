import React, { useCallback } from 'react';
import { UploadCloud } from 'lucide-react';
import { useDropzone, Accept, FileRejection } from 'react-dropzone';
import { cn } from '@/lib/utils';

interface DropzoneProps {
  onDrop: (acceptedFiles: File[], fileRejections: FileRejection[]) => void;
  accept?: Accept;
  maxSize?: number;
  disabled?: boolean;
  maxFiles?: number;
  className?: string;
}

export function Dropzone({ 
  onDrop, 
  accept, 
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
  maxFiles = 1,
  className
}: DropzoneProps) {
  const handleDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      onDrop(acceptedFiles, fileRejections);
    },
    [onDrop]
  );

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop: handleDrop,
    accept,
    maxSize,
    disabled,
    maxFiles,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-md p-6 cursor-pointer transition-colors text-center',
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
        isDragAccept && 'border-green-500 bg-green-50',
        isDragReject && 'border-red-500 bg-red-50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-4">
        <UploadCloud className={cn(
          'h-12 w-12',
          isDragAccept ? 'text-green-500' : 'text-gray-400',
          isDragReject && 'text-red-500'
        )} />
        <div className="space-y-1 text-center">
          <p className="text-sm text-gray-500">
            Arraste e solte arquivos aqui, ou clique para selecionar
          </p>
          <p className="text-xs text-gray-400">
            {maxFiles > 1 
              ? `Máximo de ${maxFiles} arquivos` 
              : 'Apenas um arquivo permitido'} 
            (máx. {(maxSize / (1024 * 1024)).toFixed(0)}MB)
          </p>
        </div>
      </div>
    </div>
  );
}