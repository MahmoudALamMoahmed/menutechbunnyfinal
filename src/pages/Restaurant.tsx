import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { UtensilsCrossed, Settings, LayoutGrid, List, Facebook, Instagram, Building2, Sparkles } from 'lucide-react';
import RestaurantFooter from '@/components/RestaurantFooter';
import ProductDetailsDialog from '@/components/ProductDetailsDialog';
import BranchesDialog from '@/components/BranchesDialog';
import ShareDialog from '@/components/ShareDialog';
import PageTransition from '@/components/PageTransition';
import RestaurantSkeleton from '@/components/restaurant/RestaurantSkeleton';
import CartDialog from '@/components/restaurant/CartDialog';
import MenuGrid from '@/components/restaurant/MenuGrid';
import OffersStrip from '@/components/restaurant/OffersStrip';
import { getLogoUrl, getCoverImageUrl } from '@/lib/bunny';
import { usePublicRestaurantData } from '@/hooks/useRestaurantData';
import { useRestaurantLimits } from '@/hooks/useSubscription';
import { useCart } from '@/hooks/useCart';
import type { Tables } from '@/integrations/supabase/types';

type MenuItem = Tables<'menu_items'>;
type Offer = Tables<'offers'>;

// تحويل عرض إلى شكل MenuItem ليتعامل معه نفس Dialog/Cart
// نستخدم prefix `offer:` على الـ id لتجنب التعارض مع أصناف موجودة
function offerToMenuItem(offer: Offer): MenuItem {
  return {
    id: `offer:${offer.id}`,
    restaurant_id: offer.restaurant_id,
    name: offer.title,
    description: offer.description,
    price: offer.price,
    image_url: offer.image_url,
    image_public_id: offer.image_public_id,
    category_id: null,
    is_available: true,
    display_order: offer.display_order,
    created_at: offer.created_at,
    updated_at: offer.updated_at,
  };
}

export default function Restaurant() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // RPC واحدة بدل 7 طلبات منفصلة
  const { data: publicData, isLoading: loadingPublicData } = usePublicRestaurantData(username);
  const restaurant = publicData?.restaurant ?? null;
  const restaurantId = restaurant?.id;
  const allCategories = publicData?.categories ?? [];
  const allMenuItems = publicData?.menu_items ?? [];
  const sizes = publicData?.sizes ?? [];
  const allExtras = publicData?.extras ?? [];
  const allBranches = publicData?.branches ?? [];
  const deliveryAreas = publicData?.delivery_areas ?? [];
  const offers: Offer[] = publicData?.offers ?? [];

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { data: limits } = useRestaurantLimits(restaurantId);

  // تقييد البيانات بحدود الباقة
  const categories = useMemo(() => limits?.max_categories != null ? allCategories.slice(0, limits.max_categories) : allCategories, [allCategories, limits?.max_categories]);
  const filteredMenuItems = useMemo(() => {
    let items = allMenuItems;
    if (limits?.max_items != null) items = items.slice(0, limits.max_items);
    if (activeCategory && activeCategory !== 'all') items = items.filter(item => item.category_id === activeCategory);
    return items;
  }, [allMenuItems, limits?.max_items, activeCategory]);
  const extras = useMemo(() => limits?.max_extras != null ? allExtras.slice(0, limits.max_extras) : allExtras, [allExtras, limits?.max_extras]);
  const branches = useMemo(() => limits?.max_branches != null ? allBranches.slice(0, limits.max_branches) : allBranches, [allBranches, limits?.max_branches]);

  // Cart hook
  const { cart, addToCart, removeFromCart, getTotalPrice, clearCart } = useCart();

  // UI State (only view-related, no customer data)
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);

  const isOwner = user && restaurant && username === restaurant.username;

  const openProductDialog = (item: MenuItem) => {
    setSelectedProduct(item);
    setShowProductDialog(true);
  };

  // فتح عرض - يحوّله إلى MenuItem ويستخدم نفس Dialog
  const openOfferDialog = useCallback((offer: Offer) => {
    // عرض مرتبط بصنف موجود → استخدم الصنف الأصلي (للأحجام/الإضافات) لكن بسعر العرض واسم وصورة العرض
    if (offer.menu_item_id) {
      const linked = allMenuItems.find(m => m.id === offer.menu_item_id);
      if (linked) {
        setSelectedProduct({
          ...linked,
          name: offer.title,
          description: offer.description ?? linked.description,
          image_url: offer.image_url ?? linked.image_url,
          price: offer.price,
        });
        setShowProductDialog(true);
        return;
      }
    }
    // عرض مستقل → بدون أحجام/إضافات
    setSelectedProduct(offerToMenuItem(offer));
    setShowProductDialog(true);
  }, [allMenuItems]);

  const scrollToOffers = useCallback(() => {
    document.getElementById('offers-strip')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Scroll spy: تفعيل زر المنيو فقط عند رؤية قسم المنيو
  const [menuActive, setMenuActive] = useState(false);
  const menuSectionRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = menuSectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => setMenuActive(e.isIntersecting)),
      { rootMargin: '-20% 0px -40% 0px', threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [restaurant?.id]);

  const scrollToMenu = useCallback(() => {
    document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if (loadingPublicData) return <RestaurantSkeleton />;

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">المطعم غير موجود</h1>
          <Button onClick={() => navigate('/')}>العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {restaurant.logo_url && (
              <img src={getLogoUrl(restaurant.logo_url)} alt={`${restaurant.name} logo`} className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" loading="lazy" />
            )}
            <h1 className="text-xl font-bold text-gray-800">{restaurant.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ShareDialog restaurantName={restaurant.name} username={username!} />
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/${username}/dashboard`)}>
                <Settings className="w-4 h-4 ml-1" />
                إدارة المطعم
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cover Image - يحافظ على نسبة 16:9 الكاملة بدون قص على كل الشاشات */}
      <div className="w-full bg-gray-50">
        <div className="container mx-auto px-4 py-3">
          <div className="relative w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto aspect-[16/9] max-h-[380px] overflow-hidden rounded-2xl shadow-lg bg-muted">
            {restaurant.cover_image_url && (
              <img
                src={getCoverImageUrl(restaurant.cover_image_url)}
                alt={restaurant.name}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="sync"
                {...({ fetchpriority: 'high' } as { fetchpriority: 'high' })}
              />
            )}
          </div>
        </div>
      </div>

      {/* Restaurant Info - أيقونات سوشيال + زر العروض */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
            {/* يمين: أيقونات الفروع والسوشيال */}
            <div className="flex items-center gap-3">
              <BranchesDialog branches={branches} trigger={
                <button className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 text-white rounded-xl flex items-center justify-center hover:scale-110 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300">
                  <Building2 className="w-5 h-5" />
                </button>
              } />
              {restaurant.facebook_url && (
                <a href={restaurant.facebook_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-[#1877F2] text-white rounded-xl flex items-center justify-center hover:scale-110 hover:shadow-lg hover:shadow-[#1877F2]/40 transition-all duration-300">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {restaurant.instagram_url && (
                <a href={restaurant.instagram_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white rounded-xl flex items-center justify-center hover:scale-110 hover:shadow-lg hover:shadow-[#FD1D1D]/40 transition-all duration-300">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
            </div>

            {/* شمال: زر العروض المميز - يظهر فقط لو في عروض */}
            {offers.length > 0 && (
              <button
                onClick={scrollToOffers}
                className="group relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-l from-orange-500 via-rose-500 to-red-500 text-white font-bold text-sm shadow-lg shadow-rose-500/40 hover:shadow-xl hover:shadow-rose-500/50 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
                aria-label={`عرض ${offers.length} عروض مميزة`}
              >
                <span className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>العروض</span>
                <span className="bg-white text-rose-600 text-xs px-1.5 py-0.5 rounded-full min-w-5 text-center">
                  {offers.length}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Offers Strip - شريط العروض المميز */}
      <div id="offers-strip">
        <OffersStrip offers={offers} onOfferClick={openOfferDialog} />
      </div>

      {/* Menu Section (categories + toggle + items) */}
      <div id="menu-section" ref={menuSectionRef} className="scroll-mt-4">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="bg-white border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 scroll-smooth">
                  <Button variant={activeCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory('all')}>الكل</Button>
                  {categories.map(cat => (
                    <Button key={cat.id} variant={activeCategory === cat.id ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(cat.id)}>{cat.name}</Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="container px-4 flex justify-end gap-2 py-4">
          <button onClick={() => setViewType('list')} className={`p-3 border rounded-md transition ${viewType === 'list' ? 'bg-primary text-white border-black' : 'bg-white text-black border-black'}`}>
            <List className="w-5 h-5 stroke-[1.5]" />
          </button>
          <button onClick={() => setViewType('grid')} className={`p-3 border rounded-md transition ${viewType === 'grid' ? 'bg-primary text-white border-black' : 'bg-white text-black border-black'}`}>
            <LayoutGrid className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Menu Items */}
        <div id="menu-grid" className="container mx-auto px-4 pb-32">
          <MenuGrid items={filteredMenuItems} viewType={viewType} onItemClick={openProductDialog} />
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-10">
            <button onClick={scrollToMenu} className={`flex flex-col items-center gap-0.5 text-xs transition hover:text-red-500 ${menuActive ? 'text-red-600' : 'text-gray-600'}`}>
              <UtensilsCrossed className="w-6 h-6" />
              <span>المنيو</span>
            </button>
            <BranchesDialog branches={branches} trigger={
              <button className="flex flex-col items-center gap-0.5 text-xs transition text-gray-600 hover:text-red-500">
                <Building2 className="w-6 h-6" />
                <span>الفروع والتواصل</span>
              </button>
            } />
            <CartDialog
              cart={cart} branches={branches} deliveryAreas={deliveryAreas}
              getTotalPrice={getTotalPrice} addToCart={addToCart} removeFromCart={removeFromCart}
              clearCart={clearCart} restaurant={restaurant} limits={limits}
            />
          </div>
        </div>
      </div>

      {/* Product Details Dialog */}
      <ProductDetailsDialog open={showProductDialog} onOpenChange={setShowProductDialog} item={selectedProduct}
        sizes={sizes.filter(s => s.menu_item_id === selectedProduct?.id)} extras={extras} onAddToCart={addToCart} />

      {/* Restaurant Footer */}
      <RestaurantFooter restaurant={restaurant} branches={branches} />
    </PageTransition>
  );
}
