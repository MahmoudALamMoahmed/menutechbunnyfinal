import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getMenuItemUrl } from '@/lib/bunny';
import type { Tables } from '@/integrations/supabase/types';

type MenuItem = Tables<'menu_items'>;

interface MenuGridProps {
  items: MenuItem[];
  viewType: 'grid' | 'list';
  onItemClick: (item: MenuItem) => void;
}

// مكون عرض أصناف القائمة بنمط شبكة أو قائمة
export default function MenuGrid({ items, viewType, onItemClick }: MenuGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">لا توجد عناصر في القائمة حالياً</p>
      </div>
    );
  }

  if (viewType === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <Card key={item.id} className="overflow-hidden h-full flex flex-col cursor-pointer" onClick={() => onItemClick(item)}>
            <CardContent className="p-2 flex-1 flex flex-col">
              {item.image_url && (
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                  <img src={getMenuItemUrl(item.image_url, 'medium')} alt={item.name} className="w-full h-full object-contain" loading="lazy" />
                </div>
              )}
              <div className="p-2 flex-1">
                <h3 className="font-semibold text-sm sm:text-lg text-gray-800 mb-2">{item.name}</h3>
                {item.description && <p className="hidden sm:block text-gray-600 text-sm mb-2">{item.description}</p>}
                <div className="flex items-center justify-between gap-2 mt-auto">
                  <span className="text-sm sm:text-lg font-bold text-primary">{item.price} جنيه</span>
                  <Button size="sm" onClick={e => { e.stopPropagation(); onItemClick(item); }} className="px-2 py-1 text-xs h-7 rounded-sm sm:px-4 sm:py-2 sm:text-sm sm:h-9 sm:rounded-md">
                    <Plus className="w-4 h-4 ml-1" />
                    إضافة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // List view
  return (
    <div className="grid gap-4">
      {items.map(item => (
        <Card key={item.id} className="overflow-hidden cursor-pointer" onClick={() => onItemClick(item)}>
          <CardContent className="p-2">
            <div className="flex flex-row-reverse items-center gap-4">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={e => { e.stopPropagation(); onItemClick(item); }} className="px-2 py-1 text-xs h-7 rounded-sm sm:px-4 sm:py-2 sm:text-sm sm:h-9 sm:rounded-md">
                  <Plus className="w-4 h-4 ml-1" />
                  إضافة
                </Button>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm sm:text-lg text-gray-800 mb-1">{item.name}</h3>
                {item.description && <p className="hidden sm:block text-gray-600 text-sm mb-2">{item.description}</p>}
                <span className="text-sm font-bold text-primary block mb-2 sm:text-lg">{item.price} جنيه</span>
              </div>
              {item.image_url && (
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <img src={getMenuItemUrl(item.image_url, 'medium')} alt={item.name} className="w-full h-full object-contain" loading="lazy" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
