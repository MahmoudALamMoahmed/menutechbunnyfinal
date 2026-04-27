import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Home, Settings, LayoutGrid, List, Facebook, Instagram, Building2 } from 'lucide-react';
import RestaurantFooter from '@/components/RestaurantFooter';
import ProductDetailsDialog from '@/components/ProductDetailsDialog';
import BranchesDialog from '@/components/BranchesDialog';
import ShareDialog from '@/components/ShareDialog';
import PageTransition from '@/components/PageTransition';
import RestaurantSkeleton from '@/components/restaurant/RestaurantSkeleton';
import CartDialog from '@/components/restaurant/CartDialog';
import MenuGrid from '@/components/restaurant/MenuGrid';
import { getLogoUrl, getCoverImageUrl } from '@/lib/bunny';
import { usePublicRestaurantData } from '@/hooks/useRestaurantData';
import { useRestaurantLimits } from '@/hooks/useSubscription';
import { useCart } from '@/hooks/useCart';
import type { Tables } from '@/integrations/supabase/types';

type MenuItem = Tables<'menu_items'>;

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

      {/* Cover Image */}
      <div className="relative w-full h-56 sm:h-64 md:h-80 lg:h-96 overflow-hidden">
        {restaurant.cover_image_url && (
          <div className="relative w-full h-full flex items-center justify-center p-2">
            <img src={getCoverImageUrl(restaurant.cover_image_url)} alt={restaurant.name} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/20" loading="eager" // @ts-ignore
              fetchpriority="high" decoding="sync" />
          </div>
        )}
      </div>

      {/* Restaurant Info */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
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
          </div>
        </div>
      </div>

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
      <div className="container mx-auto px-4 pb-32">
        <MenuGrid items={filteredMenuItems} viewType={viewType} onItemClick={openProductDialog} />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-10">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex flex-col items-center gap-0.5 text-xs transition text-red-600 font-bold hover:text-red-500">
              <Home className="w-6 h-6" />
              <span>الرئيسية</span>
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
