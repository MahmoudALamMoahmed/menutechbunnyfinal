import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Mail, 
  Clock,
  Facebook,
  Instagram,
  Truck,
  Building2
} from "lucide-react";
import type { Tables } from '@/integrations/supabase/types';

type Restaurant = Tables<'public_restaurants'>;
type Branch = Tables<'branches'>;

interface RestaurantFooterProps {
  restaurant: Restaurant;
  branches: Branch[];
}

export default function RestaurantFooter({ restaurant, branches }: RestaurantFooterProps) {

  return (
    <footer className="bg-gray-900 text-white mt-12" dir="rtl">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Restaurant Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-xl text-primary">{restaurant.name}</h3>
            {restaurant.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                <span className="text-gray-300">{restaurant.address}</span>
              </div>
            )}
            {restaurant.working_hours && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                <span className="text-gray-300">{restaurant.working_hours}</span>
              </div>
            )}
            
            {/* Social Links */}
            <div className="flex gap-4 mt-4">
              {restaurant.facebook_url && (
                <a 
                  href={restaurant.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              
              {restaurant.instagram_url && (
                <a 
                  href={restaurant.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-pink-600 transition-colors duration-200"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Branches Section */}
          {branches.length > 0 && (
            <div className="lg:col-span-2 space-y-4">
              <h4 className="font-bold text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                فروعنا
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
                {branches.map((branch) => (
                  <div key={branch.id} className="bg-gray-800 rounded-lg p-4 space-y-2">
                    <h5 className="font-bold text-primary">{branch.name}</h5>
                    
                    {branch.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{branch.address}</span>
                      </div>
                    )}
                    
                    {branch.working_hours && (
                      <div className="flex items-start gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{branch.working_hours}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-2">
                      {branch.delivery_phone && (
                        <a 
                          href={`tel:${branch.delivery_phone}`}
                          className="flex items-center gap-1 text-sm text-gray-300 hover:text-primary transition-colors"
                        >
                          <Truck className="w-4 h-4" />
                          {branch.delivery_phone}
                        </a>
                      )}
                      
                      {branch.whatsapp_phone && (
                        <a 
                          href={`https://wa.me/${branch.whatsapp_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-gray-300 hover:text-green-500 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          واتساب
                        </a>
                      )}

                      {branch.phone && (
                        <a 
                          href={`tel:${branch.phone}`}
                          className="flex items-center gap-1 text-sm text-gray-300 hover:text-accent transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          {branch.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Additional Info */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg">معلومات إضافية</h4>
            <div className="text-gray-300 text-sm space-y-2">
              <p>نسعى لتقديم أفضل خدمة لعملائنا الكرام</p>
              <p>جميع أطباقنا طازجة ومحضرة يومياً</p>
              <p>نلتزم بأعلى معايير النظافة والجودة</p>
            </div>
            
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-400 text-sm">
            <p>
              جميع الحقوق محفوظة لـ{" "}
              <a 
                href="https://menutech.sa" 
                className="text-primary hover:text-primary-light transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                منيو تك
              </a>
              {" "}© 2024
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}