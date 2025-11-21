'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Paperclip, X, FileText, Image as ImageIcon, File, Download, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FileAttachmentProps {
  value?: {
    url: string;
    name: string;
    type: string;
  } | null;
  onChange: (file: { url: string; name: string; type: string } | null) => void;
  label?: string;
  accept?: string;
  maxSize?: number; // en MB
  isFrench?: boolean;
  disabled?: boolean;
}

export function FileAttachment({
  value,
  onChange,
  label,
  accept = '*/*',
  maxSize = 5,
  isFrench = false,
  disabled = false,
}: FileAttachmentProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const translations = {
    label: label || (isFrench ? 'Pièce jointe (optionnel)' : 'Attachment (optional)'),
    choose: isFrench ? 'Choisir un fichier' : 'Choose file',
    remove: isFrench ? 'Retirer' : 'Remove',
    download: isFrench ? 'Télécharger' : 'Download',
    uploading: isFrench ? 'Téléchargement...' : 'Uploading...',
    errorSize: isFrench ? `Le fichier ne doit pas dépasser ${maxSize} MB` : `File must not exceed ${maxSize} MB`,
    errorType: isFrench ? 'Type de fichier non accepté' : 'File type not accepted',
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Validation de la taille
    if (file.size > maxSize * 1024 * 1024) {
      setError(translations.errorSize);
      return;
    }

    setIsUploading(true);

    try {
      // Convertir le fichier en base64 pour le stockage local/Firestore
      // En production, vous utiliseriez Firebase Storage
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        
        onChange({
          url: base64,
          name: file.name,
          type: file.type,
        });
        
        setIsUploading(false);
      };

      reader.onerror = () => {
        setError(isFrench ? 'Erreur lors de la lecture du fichier' : 'Error reading file');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError(isFrench ? 'Erreur lors du téléchargement' : 'Upload error');
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (!value) return;
    
    const link = document.createElement('a');
    link.href = value.url;
    link.download = value.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-2">
      <Label>{translations.label}</Label>
      
      {!value ? (
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            className="hidden"
            id="file-input"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="w-full"
          >
            <Paperclip className="mr-2 h-4 w-4" />
            {isUploading ? translations.uploading : translations.choose}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getFileIcon(value.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{value.name}</p>
              <p className="text-xs text-muted-foreground">
                {value.type.split('/')[1]?.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              disabled={disabled}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">
        {isFrench 
          ? `Types acceptés: Images, PDF, documents. Maximum ${maxSize} MB.`
          : `Accepted types: Images, PDF, documents. Maximum ${maxSize} MB.`
        }
      </p>
    </div>
  );
}
