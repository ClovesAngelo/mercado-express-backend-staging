import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadService } from '../services/upload.service';
import ImageCropModal from './ImageCropModal';
import { blobToFile, type CroppedImage } from '../utils/imageCrop';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  /** Proporção recomendada do corte (padrão 4/3). Use 1 para logo/quadrado e 3 para banner. */
  aspect?: number;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ImageUpload({
  value,
  onChange,
  disabled,
  aspect = 4 / 3,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Tamanho máximo: 5MB.');
      return;
    }

    setSelectedFile(file);
    setCropImageSrc(URL.createObjectURL(file));
    setCropModalOpen(true);
  };

  const clearCropSource = () => {
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setCropImageSrc(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    clearCropSource();
  };

  const handleCropConfirm = async (cropped: CroppedImage) => {
    setCropModalOpen(false);

    const file = selectedFile;
    const croppedFile = blobToFile(
      cropped.blob,
      file?.name || 'imagem',
      cropped.mime,
    );
    clearCropSource();

    // Preview local com a imagem já cortada
    let localPreview: string | null = null;
    setUploading(true);
    try {
      localPreview = URL.createObjectURL(cropped.blob);
      setPreview(localPreview);

      // Fazer upload via backend
      const imageUrl = await uploadService.uploadProductImage(croppedFile);

      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
      setPreview(imageUrl);
      onChange(imageUrl);
    } catch (error) {
      console.warn('[ImageUpload] Upload failed, continuing without image:', error);
      // Não impede o fluxo - cria mercado mesmo sem imagem
      setPreview(value || null);
      onChange(''); // Limpa a URL da imagem
      alert('Upload da imagem falhou. O mercado será criado sem imagem.');
    } finally {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (value) {
      try {
        await uploadService.deleteProductImage(value);
      } catch (error) {
        console.error('Erro ao deletar imagem:', error);
      }
    }
    setPreview(null);
    onChange('');
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {preview ? (
        <div className="relative w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
              disabled={uploading}
            >
              <X size={16} />
            </button>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Loader2 className="animate-spin text-white" size={32} />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || uploading}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <span className="text-sm text-gray-600">Fazendo upload...</span>
            </>
          ) : (
            <>
              <Upload size={32} className="text-gray-400" />
              <span className="text-sm text-gray-600">Clique para enviar imagem</span>
              <span className="text-xs text-gray-400">JPG, PNG ou WEBP (máx. 5MB)</span>
            </>
          )}
        </button>
      )}

      <ImageCropModal
        open={cropModalOpen}
        imageSrc={cropImageSrc || ''}
        aspect={aspect}
        preferredMime={selectedFile?.type}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
        title="Ajustar o corte da imagem"
        description="Escolha a área que deve ser exibida. Ela será o recorte final enviado."
      />
    </div>
  );
}