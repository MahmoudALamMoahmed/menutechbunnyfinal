import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Trash2, Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { uploadToBunny, deleteFromBunny, getOptimizedUrl, UploadProgress, ImageType } from '@/lib/bunny';
import { cn } from '@/lib/utils';
import ImageCropper from './ImageCropper';

interface ImageUploaderProps {
  currentImageUrl?: string;
  currentPublicId?: string;
  publicId: string;
  onUploadComplete: (url: string, publicId: string) => void;
  onDelete: () => void;
  aspectRatio?: 'square' | 'cover' | 'logo';
  imageType?: ImageType;
  label?: string;
  className?: string;
  enableCrop?: boolean;
}

export default function ImageUploader({
  currentImageUrl,
  currentPublicId,
  publicId,
  onUploadComplete,
  onDelete,
  aspectRatio = 'square',
  imageType = 'product',
  label = 'رفع صورة',
  className,
  enableCrop = true,
}: ImageUploaderProps) {
  // UI State - حالات الرفع والمعاينة والسحب والقص
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // DOM Ref - مرجع لعنصر input الملف
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: 'aspect-square',
    cover: 'aspect-[16/9]',
    logo: 'aspect-square max-w-[150px]',
  };

  const aspectRatioValues = {
    square: 1,
    cover: 16 / 7,
    logo: 1,
  };

  const targetWidthValues: Record<ImageType, number> = {
    cover: 2400,
    product: 1920,
    logo: 800,
  };

  // Performance - تحسين أداء لمنع إعادة الإنشاء
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار صورة فقط');
      return;
    }

    // Read file and show cropper if enabled
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      if (enableCrop) {
        setSelectedImage(imageData);
        setCropperOpen(true);
      } else {
        // Direct upload without cropping
        handleUpload(file);
      }
    };
    reader.readAsDataURL(file);
  }, [enableCrop]);

  const handleUpload = useCallback(async (fileOrBlob: File | Blob) => {
    // Convert Blob to File if needed
    const file = fileOrBlob instanceof File 
      ? fileOrBlob 
      : new File([fileOrBlob], 'cropped-image.jpg', { type: 'image/jpeg' });

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setUploadProgress({ stage: 'compressing', progress: 0, message: 'جاري ضغط الصورة...' });
    
    try {
      // Delete old image if exists
      if (currentPublicId) {
        await deleteFromBunny(currentPublicId);
      }

      // Upload new image with progress tracking
      const result = await uploadToBunny(file, publicId, imageType, (progress) => {
        setUploadProgress(progress);
      });
      
      onUploadComplete(result.secure_url, result.public_id);
      setPreview(null);
      
      // Show success briefly
      setTimeout(() => {
        setUploadProgress(null);
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      alert('حدث خطأ أثناء رفع الصورة');
      setPreview(null);
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  }, [currentPublicId, publicId, onUploadComplete]);

  const handleCropComplete = useCallback((croppedImage: Blob) => {
    setSelectedImage(null);
    handleUpload(croppedImage);
  }, [handleUpload]);

  const handleCropClose = useCallback(() => {
    setCropperOpen(false);
    setSelectedImage(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDelete = async () => {
    if (!currentPublicId) {
      onDelete();
      return;
    }

    setDeleting(true);
    try {
      await deleteFromBunny(currentPublicId);
      onDelete();
    } catch (error) {
      console.error('Delete error:', error);
      alert('حدث خطأ أثناء حذف الصورة');
    } finally {
      setDeleting(false);
    }
  };

  const displayImage = preview || (currentImageUrl ? getOptimizedUrl(currentImageUrl, { width: 400 }) : null);

  return (
    <div className={cn('space-y-2', className)}>
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
      
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg overflow-hidden transition-colors',
          aspectClasses[aspectRatio],
          dragActive ? 'border-primary bg-primary/5' : 'border-gray-300',
          !displayImage && 'bg-gray-50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {displayImage ? (
          <>
            <img
              src={displayImage}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {(uploading || deleting) && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 p-4">
                {uploadProgress ? (
                  <>
                    {uploadProgress.stage === 'done' ? (
                      <CheckCircle2 className="w-10 h-10 text-green-400" />
                    ) : (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    )}
                    <div className="w-full max-w-[200px] space-y-2">
                      <Progress 
                        value={uploadProgress.progress} 
                        className="h-2 bg-white/20"
                      />
                      <p className="text-white text-sm text-center font-medium">
                        {uploadProgress.message}
                      </p>
                      <p className="text-white/70 text-xs text-center">
                        {uploadProgress.stage === 'compressing' ? 'مرحلة 1/2' : 
                         uploadProgress.stage === 'uploading' ? 'مرحلة 2/2' : ''}
                      </p>
                    </div>
                  </>
                ) : (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                )}
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <ImageIcon className="w-12 h-12 mb-2" />
            <p className="text-sm">اسحب الصورة هنا</p>
            <p className="text-xs">أو انقر للاختيار</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={uploading || deleting}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || deleting}
          className="flex-1"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري الرفع...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 ml-2" />
              {currentImageUrl ? 'تغيير الصورة' : 'رفع صورة'}
            </>
          )}
        </Button>
        
        {currentImageUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={uploading || deleting}
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Image Cropper Dialog */}
      {selectedImage && (
        <ImageCropper
          image={selectedImage}
          open={cropperOpen}
          onClose={handleCropClose}
          onCropComplete={handleCropComplete}
          aspectRatio={aspectRatioValues[aspectRatio]}
          targetWidth={targetWidthValues[imageType]}
        />
      )}
    </div>
  );
}
