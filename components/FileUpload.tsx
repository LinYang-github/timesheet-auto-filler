import React, { useRef } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';

interface FileUploadProps {
  label: string;
  accept?: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  description?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  accept = ".xlsx, .xls", 
  file, 
  onFileSelect,
  onClear,
  description
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {!file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors bg-white h-40"
        >
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-900">点击或拖拽上传</p>
          <p className="text-xs text-gray-500 mt-1">{description || "支持 Excel 文件 (.xlsx)"}</p>
          <input
            type="file"
            ref={inputRef}
            className="hidden"
            accept={accept}
            onChange={handleChange}
          />
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-white shadow-sm h-40">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="bg-green-100 p-2 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button
            onClick={onClear}
            className="p-1 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
