import { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, MessageCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareDialogProps {
  restaurantName: string;
  username: string;
}

export default function ShareDialog({ restaurantName, username }: ShareDialogProps) {
  // UI State - حالات النسخ وفتح/إغلاق الحوار
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  // DOM Ref - مرجع لعنصر QR Code للتحميل
  const qrRef = useRef<HTMLCanvasElement>(null);

  // Ensure URL has proper format with https:// protocol
  const baseUrl = window.location.origin.startsWith('http') 
    ? window.location.origin 
    : `https://${window.location.host}`;
  const restaurantUrl = `${baseUrl}/${username}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(restaurantUrl);
      setCopied(true);
      toast({
        title: 'تم النسخ',
        description: 'تم نسخ الرابط بنجاح',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في نسخ الرابط',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: restaurantName,
      text: `تفضل بزيارة مطعم ${restaurantName}`,
      url: restaurantUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: open WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareData.text}\n${shareData.url}`)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const shareToWhatsApp = () => {
    const text = `تفضل بزيارة مطعم ${restaurantName}\n${restaurantUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareToMessenger = () => {
    const messengerUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(restaurantUrl)}`;
    window.open(messengerUrl, '_blank');
  };

  const handleDownloadQR = () => {
    const canvas = qrRef.current;
    if (!canvas) return;

    // Get actual QR canvas dimensions
    const qrWidth = canvas.width;
    const qrHeight = canvas.height;
    const padding = 20;

    // Create a new canvas with white background
    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = qrWidth + (padding * 2);
    downloadCanvas.height = qrHeight + (padding * 2);
    const ctx = downloadCanvas.getContext('2d');
    if (!ctx) return;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

    // Draw QR code centered with full dimensions
    ctx.drawImage(canvas, 0, 0, qrWidth, qrHeight, padding, padding, qrWidth, qrHeight);

    // Download
    const link = document.createElement('a');
    link.download = `${username}-qr-code.png`;
    link.href = downloadCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4" />
         {/*  مشاركة */}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center">مشاركة {restaurantName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-4">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl shadow-inner border">
            <QRCodeCanvas 
              ref={qrRef}
              value={restaurantUrl} 
              size={200}
              level="M"
              includeMargin={true}
              imageSettings={{
                src: '',
                height: 0,
                width: 0,
                excavate: false,
              }}
            />
          </div>

          {/* Download QR Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDownloadQR}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            تحميل QR Code
          </Button>

          {/* Restaurant Link */}
          <div className="w-full flex gap-2">
            <Input 
              value={restaurantUrl} 
              readOnly 
              className="text-left text-sm"
              dir="ltr"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>


          {/* Share Buttons */}
          <div className="w-full space-y-3">
            <Button 
              onClick={handleShare}
              className="w-full"
            >
              <Share2 className="w-4 h-4 ml-2" />
              مشاركة
            </Button>

            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={shareToWhatsApp}
                className="flex-1 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
              >
                <MessageCircle className="w-4 h-4 ml-2" />
                واتساب
              </Button>
              <Button 
                variant="outline"
                onClick={shareToMessenger}
                className="flex-1 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
              >
                <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.13.26.35.27.57l.05 1.78c.04.57.61.94 1.13.71l1.98-.87c.17-.08.36-.1.55-.06.91.25 1.87.38 2.88.38 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm5.89 7.73l-2.88 4.57c-.45.72-1.45.87-2.08.31l-2.29-1.72a.6.6 0 0 0-.72 0l-3.09 2.35c-.41.31-.95-.17-.68-.6l2.88-4.57c.45-.72 1.45-.87 2.08-.31l2.29 1.72a.6.6 0 0 0 .72 0l3.09-2.35c.41-.31.95.17.68.6z"/>
                </svg>
                ماسنجر
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
