import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Tables } from '@/integrations/supabase/types';

type Offer = Tables<'offers'>;

interface OffersStripProps {
  offers: Offer[];
  onOfferClick: (offer: Offer) => void;
}

/**
 * شريط العروض المميز - يظهر فوق قائمة الأقسام بتصميم جذاب.
 * مخفي تماماً لو مفيش عروض.
 */
export default function OffersStrip({ offers, onOfferClick }: OffersStripProps) {
  if (offers.length === 0) return null;

  return (
    <section className="bg-gradient-to-l from-orange-50 via-amber-50 to-rose-50 border-y border-amber-200/60">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-bold text-gray-800">العروض المميزة</h2>
          <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full font-bold">
            {offers.length}
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent scroll-smooth">
          {offers.map(offer => {
            const hasDiscount = offer.original_price && offer.original_price > offer.price;
            const discountPercent = hasDiscount
              ? Math.round(((offer.original_price! - offer.price) / offer.original_price!) * 100)
              : 0;

            return (
              <article
                key={offer.id}
                onClick={() => onOfferClick(offer)}
                className="group relative flex-shrink-0 w-56 sm:w-64 bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-amber-100 hover:-translate-y-1"
              >
                {hasDiscount && (
                  <div className="absolute top-2 right-2 z-10 bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg">
                    خصم {discountPercent}%
                  </div>
                )}

                <div className="aspect-[4/3] bg-gradient-to-br from-orange-100 to-amber-100 overflow-hidden">
                  {offer.image_url ? (
                    <img
                      src={offer.image_url}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-orange-300" />
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  <h3 className="font-bold text-gray-800 truncate">{offer.title}</h3>
                  {offer.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">{offer.description}</p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-primary">{offer.price}</span>
                      <span className="text-xs text-gray-500">جنيه</span>
                      {hasDiscount && (
                        <span className="text-xs text-gray-400 line-through">{offer.original_price}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onOfferClick(offer); }}
                      className="h-7 px-3 text-xs bg-gradient-to-l from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white border-0"
                    >
                      اطلب الآن
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
