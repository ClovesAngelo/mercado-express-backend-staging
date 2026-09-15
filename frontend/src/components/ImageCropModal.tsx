import { useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { X, Minus, Plus, Loader2, Crop } from 'lucide-react';
import { cropImageToBlob, type CroppedImage } from '../utils/imageCrop';

interface ImageCropModalProps {
  /** Controla a visibilidade do modal. */
  open: boolean;
  /** URL do objeto (blob local) da imagem original a ser cortada. */
  imageSrc: string;
  /** Proporção recomendada do recorte (ex.: 1 => quadrado, 3 => banner 3:1). */
  aspect?: number;
  /** MIME do arquivo original (usado para escolher o formato de saída). */
  preferredMime?: string;
  title?: string;
  description?: string;
  onCancel: () => void;
  onConfirm: (cropped: CroppedImage) => Promise<void> | void;
}

function formatAspect(aspect: number): string {
  const known: Array<[string, number]> = [
    ['1:1', 1],
    ['4:3', 4 / 3],
    ['3:2', 3 / 2],
    ['16:9', 16 / 9],
    ['3:1', 3],
    ['2:1', 2],
  ];
  for (const [label, value] of known) {
    if (Math.abs(aspect - value) < 0.01) return label;
  }
  const inverse = Math.round(1 / aspect);
  if (Math.abs(1 / aspect - inverse) < 0.02) return `1:${inverse}`;
  if (Number.isInteger(aspect)) return `${aspect}:1`;
  return `${aspect.toFixed(2).padEnd(4, '0')}:1`;
}

export default function ImageCropModal({
  open,
  imageSrc,
  aspect = 4 / 3,
  preferredMime,
  title = 'Ajustar o corte da imagem',
  description = 'Arraste para posicionar e use o zoom para refinar o enquadramento.',
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  // Reseta o estado sempre que o modal é reaberto.
  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setProcessing(false);
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!croppedAreaPixels || processing) return;

    setProcessing(true);
    try {
      const cropped = await cropImageToBlob(imageSrc, croppedAreaPixels, {
        preferredMime,
      });
      await onConfirm(cropped);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <Crop size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <p className="mt-0.5 text-sm text-gray-500">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-40"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Área de corte */}
        <div className="relative h-72 w-full bg-gray-900 sm:h-96">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, croppedAreaPixels) =>
              setCroppedAreaPixels(croppedAreaPixels)
            }
          />
        </div>

        {/* Controles de zoom */}
        <div className="p-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Minus size={16} className="shrink-0 text-gray-400" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-emerald-600 disabled:opacity-50"
              disabled={processing}
            />
            <Plus size={16} className="shrink-0 text-gray-400" />
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">
            Corte {formatAspect(aspect)} . Use o zoom para deixar o enquadramento mais preciso
          </p>
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-3 border-t border-gray-100 p-4 sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!croppedAreaPixels || processing}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Aplicando...
              </>
            ) : (
              'Aplicar corte'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}