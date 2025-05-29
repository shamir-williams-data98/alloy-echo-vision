
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, File, Image, X } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface UploadedFile {
  id: string;
  file: File;
  type: 'image' | 'pdf' | 'other';
  url?: string;
  content?: string;
}

interface FileUploadProps {
  onFileUploaded: (file: UploadedFile) => void;
  uploadedFiles: UploadedFile[];
  onRemoveFile: (id: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded, uploadedFiles, onRemoveFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      const fileType = getFileType(file);
      const uploadedFile: UploadedFile = {
        id: Date.now().toString(),
        file,
        type: fileType
      };

      if (fileType === 'image') {
        uploadedFile.url = URL.createObjectURL(file);
      } else if (fileType === 'pdf') {
        // For PDF, we'll just store the file for now
        // In a real app, you'd extract text content here
        uploadedFile.content = `PDF file: ${file.name}`;
      }

      onFileUploaded(uploadedFile);
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFileType = (file: File): 'image' | 'pdf' | 'other' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
    return 'other';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'pdf':
        return <File className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          onClick={() => fileInputRef.current?.click()}
          size="sm"
          variant="outline"
          disabled={isProcessing}
          className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs md:text-sm"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isProcessing ? 'Processing...' : 'Upload File'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {uploadedFiles.map((uploadedFile) => (
            <Card key={uploadedFile.id} className="p-2 bg-gray-800/50 border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getFileIcon(uploadedFile.type)}
                  <span className="text-xs text-gray-300 truncate">
                    {uploadedFile.file.name}
                  </span>
                  <span className="text-xs text-cyan-400 px-1 bg-cyan-400/20 rounded">
                    {uploadedFile.type.toUpperCase()}
                  </span>
                </div>
                <Button
                  onClick={() => onRemoveFile(uploadedFile.id)}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
