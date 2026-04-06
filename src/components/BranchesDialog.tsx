import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Phone, MapPin, Clock, Truck, MessageCircle } from 'lucide-react';
import { useBranches } from '@/hooks/useRestaurantData';

interface BranchesDialogProps {
  restaurantId: string;
  trigger: React.ReactNode;
}

export default function BranchesDialog({ restaurantId, trigger }: BranchesDialogProps) {
  // UI State - حالة فتح/إغلاق الحوار
  const [open, setOpen] = useState(false);
  // React Query - جلب الفروع النشطة (يتم الجلب فقط عند فتح الحوار)
  const { data: branches = [], isLoading: loading } = useBranches(open ? restaurantId : undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">فروعنا وأرقام التواصل</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد فروع حالياً
          </div>
        ) : (
          <div className="space-y-4">
            {branches.map((branch) => (
              <div 
                key={branch.id} 
                className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200"
              >
                <h3 className="font-bold text-lg text-primary">{branch.name}</h3>
                
                {branch.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{branch.address}</span>
                  </div>
                )}
                
                {branch.working_hours && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{branch.working_hours}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3 space-y-2">
                  {branch.delivery_phone && (
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-xs text-gray-500">الدليفري</div>
                        <a 
                          href={`tel:${branch.delivery_phone}`}
                          className="text-gray-700 hover:text-primary transition-colors font-medium"
                        >
                          {branch.delivery_phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {branch.whatsapp_phone && (
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="text-xs text-gray-500">واتساب</div>
                        <a 
                          href={`https://wa.me/${branch.whatsapp_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-700 hover:text-green-600 transition-colors font-medium"
                        >
                          {branch.whatsapp_phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {branch.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-accent" />
                      <div>
                        <div className="text-xs text-gray-500">الهاتف</div>
                        <a 
                          href={`tel:${branch.phone}`}
                          className="text-gray-700 hover:text-accent transition-colors font-medium"
                        >
                          {branch.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
