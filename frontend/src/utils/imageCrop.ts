/**
 * Utilitários para gerar imagens recortadas (crop) antes do upload.
 *
 * O usuário escolhe a área exata de corte no frontend (ImageCropModal / react-easy-crop)
 * e o arquivo enviado ao servidor já sai com o recorte aplicado, evitando que a imagem
 * apareça "cortada" nas listagens e banners das páginas públicas.
 */

export interface PixelCropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CroppedImage {
  blob: Blob;
  mime: string;
}

const DEFAULT_MAX_DIMENSION = 1400;

/** Carrega a imagem em memória para ser desenhada no canvas. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível carregar a imagem para o corte.'));
    image.src = src;
  });
}

/** Momento de exportação: preserva PNG (transparência p/ logos) ou envia WebP otimizado ou JPEG. */
function pickOutputMime(preferredMime?: string): string {
  switch (preferredMime) {
    case 'image/png':
    case 'image/gif':
      return 'image/png';
    case 'image/webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(resolve, mime, quality);
    } catch {
      resolve(null);
    }
  });
}

/* Gera o Blob preferido e, caso o canvas não suporte o MIME, faz fallback para JPEG. */
async function canvasToBlobWithFallback(
  canvas: HTMLCanvasElement,
  mime: string,
): Promise<CroppedImage> {
  const candidates = Array.from(new Set([mime, 'image/webp', 'image/jpeg', 'image/png']));
  for (const mime of candidates) {
    const blob = await canvasToBlob(canvas, mime, mime === 'image/png' ? undefined : 0.92);
    if (blob) {
      return { blob, mime };
    }
  }
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error('Falha ao processar a imagem cortada.');
  }
  return { blob: await response.blob(), mime: 'image/jpeg' };
}

/**
 * Recorta a imagem a partir da área de pixel fornecida pelo react-easy-crop e
 * devolve um Blob pronto para upload, com o lado maior limitado para não inflar
 * o arquivo (o limite do backend é 5MB).
 */
export async function cropImageToBlob(
  imageSrc: string,
  pixelCrop: PixelCropArea,
  options: { preferredMime?: string; maxDimension?: number } = {},
): Promise<CroppedImage> {
  // Import estático é suficiente aqui; `document`/`Image` só executam no browser.
  const image = await loadImage(imageSrc);

  const srcWidth = image.naturalWidth;
  const srcHeight = image.naturalHeight;

  // Garantir que o retângulo de corte esteja dentro dos limites da imagem.
  const cropX = Math.min(Math.max(0, Math.floor(pixelCrop.x)), srcWidth - 1);
  const cropY = Math.min(Math.max(0, Math.floor(pixelCrop.y)), srcHeight - 1);
  const cropWidth = Math.min(Math.max(1, Math.floor(pixelCrop.width)), srcWidth - cropX);
  const cropHeight = Math.min(Math.max(1, Math.floor(pixelCrop.height)), srcHeight - cropY);

  const maxSide = Math.max(cropWidth, cropHeight);
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const scale = Math.min(1, maxDimension / maxSide);

  const outWidth = Math.max(1, Math.round(cropWidth * scale));
  const outHeight = Math.max(1, Math.round(cropHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outWidth;
  canvas.height = outHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas não suportado neste navegador.');
  }

  // Fundo branco para JPEG: evita que áreas transparentes virem preto.
  const outputMime = pickOutputMime(options.preferredMime);
  if (outputMime === 'image/jpeg' || outputMime === 'image/webp') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outWidth, outHeight);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    outWidth,
    outHeight,
  );

  return canvasToBlobWithFallback(canvas, outputMime);
}

/** Converte o Blob recortado em um File com extensão coerente ao MIME de saída. */
export function blobToFile(blob: Blob, originalName: string, mime: string): File {
  const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const baseName = originalName.replace(/\.[^/.]+$/, '') || originalName || 'imagem';
  const fileName = `${baseName}-crop.${extension}`;
  return new File([blob], fileName, { type: mime });
}