import { useParams, useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminRestaurant, useAdminCategories, useAdminMenuItems, useAdminSizes, useAdminExtras } from "@/hooks/useAdminData";
import {
  useSaveCategory, useDeleteCategory, useSaveMenuItem, useDeleteMenuItem,
  useSaveSize, useDeleteSize, useSaveExtra, useDeleteExtra,
  useReorderCategories, useReorderMenuItems, useReorderExtras,
} from "@/hooks/admin-mutations/useMenuMutations";
import { useLimitsCheck } from "@/hooks/useLimitsCheck";
import { useRestaurantLimits } from "@/hooks/useSubscription";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import CategorySection from "@/components/menu-management/CategorySection";
import MenuItemsSection from "@/components/menu-management/MenuItemsSection";
import ExtrasSection from "@/components/menu-management/ExtrasSection";
import SizesDialog from "@/components/menu-management/SizesDialog";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

export default function MenuManagement() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: restaurant, isLoading: restaurantLoading } = useAdminRestaurant(username);
  const restaurantId = restaurant?.id;

  const { data: categories = [], isLoading: categoriesLoading } = useAdminCategories(restaurantId);
  const { data: menuItems = [], isLoading: itemsLoading } = useAdminMenuItems(restaurantId);
  const { data: sizes = [], isLoading: sizesLoading } = useAdminSizes(restaurantId);
  const { data: extras = [], isLoading: extrasLoading } = useAdminExtras(restaurantId);

  const catLimits = useLimitsCheck(restaurantId, "categories", categories.length);
  const itemLimits = useLimitsCheck(restaurantId, "menu_items", menuItems.length);
  const extraLimits = useLimitsCheck(restaurantId, "extras", extras.length);
  const { data: limits } = useRestaurantLimits(restaurantId);

  const frozenCategoryIds = new Set(limits?.max_categories != null ? categories.slice(limits.max_categories).map(c => c.id) : []);
  const frozenItemIds = new Set(limits?.max_items != null ? menuItems.slice(limits.max_items).map(i => i.id) : []);
  const frozenExtraIds = new Set(limits?.max_extras != null ? extras.slice(limits.max_extras).map(e => e.id) : []);

  const dataLoading = categoriesLoading || itemsLoading || sizesLoading || extrasLoading;

  const saveCategoryMut = useSaveCategory(restaurantId);
  const deleteCategoryMut = useDeleteCategory(restaurantId);
  const saveItemMut = useSaveMenuItem(restaurantId);
  const deleteItemMut = useDeleteMenuItem(restaurantId);
  const saveSizeMut = useSaveSize(restaurantId);
  const deleteSizeMut = useDeleteSize(restaurantId);
  const saveExtraMut = useSaveExtra(restaurantId);
  const deleteExtraMut = useDeleteExtra(restaurantId);
  const reorderCategoriesMut = useReorderCategories(restaurantId);
  const reorderItemsMut = useReorderMenuItems(restaurantId);
  const reorderExtrasMut = useReorderExtras(restaurantId);

  const saving = saveCategoryMut.isPending || saveItemMut.isPending || saveSizeMut.isPending || saveExtraMut.isPending;
  const isDeleting = deleteCategoryMut.isPending || deleteItemMut.isPending || deleteSizeMut.isPending || deleteExtraMut.isPending;

  const [showSizesDialog, setShowSizesDialog] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: "category" | "item" | "size" | "extra"; id: string; name: string }>({ open: false, type: "category", id: "", name: "" });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  // DnD handlers
  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex(c => c.id === active.id);
    const newIndex = categories.findIndex(c => c.id === over.id);
    const newCategories = arrayMove(categories, oldIndex, newIndex);
    queryClient.setQueryData(["admin_categories", restaurantId], newCategories);
    reorderCategoriesMut.mutate(newCategories.map((cat, index) => ({ id: cat.id, display_order: index })), {
      onSuccess: () => toast({ title: "تم الترتيب", description: "تم تحديث ترتيب الفئات" }),
      onError: () => toast({ title: "خطأ", description: "حدث خطأ أثناء تحديث الترتيب", variant: "destructive" }),
    });
  };

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = menuItems.findIndex(i => i.id === active.id);
    const newIndex = menuItems.findIndex(i => i.id === over.id);
    const newItems = arrayMove(menuItems, oldIndex, newIndex);
    queryClient.setQueryData(["admin_menu_items", restaurantId], newItems);
    reorderItemsMut.mutate(newItems.map((item, index) => ({ id: item.id, display_order: index })), {
      onSuccess: () => toast({ title: "تم الترتيب", description: "تم تحديث ترتيب الأصناف" }),
      onError: () => toast({ title: "خطأ", description: "حدث خطأ أثناء تحديث الترتيب", variant: "destructive" }),
    });
  };

  const handleExtraDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = extras.findIndex(e => e.id === active.id);
    const newIndex = extras.findIndex(e => e.id === over.id);
    const newExtras = arrayMove(extras, oldIndex, newIndex);
    queryClient.setQueryData(["admin_extras", restaurantId], newExtras);
    reorderExtrasMut.mutate(newExtras.map((extra, index) => ({ id: extra.id, display_order: index })), {
      onSuccess: () => toast({ title: "تم الترتيب", description: "تم تحديث ترتيب الإضافات" }),
      onError: () => toast({ title: "خطأ", description: "حدث خطأ أثناء تحديث الترتيب", variant: "destructive" }),
    });
  };

  if (restaurantLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-600">المطعم غير موجود أو ليس لديك صلاحية للوصول إليه</p>
          <Button onClick={() => navigate("/")} className="mt-4">العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate(`/${restaurant.username}/dashboard`)}>
                <ArrowRight className="w-4 h-4" />
                العودة
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">إدارة القائمة</h1>
                <p className="text-gray-600 text-sm">إدارة فئات وأصناف {restaurant.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <CategorySection
            categories={categories}
            frozenCategoryIds={frozenCategoryIds}
            catLimits={catLimits}
            sensors={sensors}
            saving={saving}
            onSave={(data) => saveCategoryMut.mutate(data)}
            onDelete={(id, name) => setDeleteDialog({ open: true, type: "category", id, name })}
            onDragEnd={handleCategoryDragEnd}
          />

          <MenuItemsSection
            menuItems={menuItems}
            categories={categories}
            frozenItemIds={frozenItemIds}
            itemLimits={itemLimits}
            sensors={sensors}
            saving={saving}
            restaurantUsername={restaurant.username}
            onSave={(data) => saveItemMut.mutate({ ...data, restaurant_id: restaurant.id })}
            onDelete={(id, name) => setDeleteDialog({ open: true, type: "item", id, name })}
            onOpenSizes={(itemId) => { setSelectedItemId(itemId); setShowSizesDialog(true); }}
            onDragEnd={handleItemDragEnd}
          />

          <ExtrasSection
            extras={extras}
            frozenExtraIds={frozenExtraIds}
            extraLimits={extraLimits}
            sensors={sensors}
            saving={saving}
            onSave={(data) => saveExtraMut.mutate({ ...data, restaurant_id: restaurant.id, is_available: true })}
            onDelete={(id, name) => setDeleteDialog({ open: true, type: "extra", id, name })}
            onDragEnd={handleExtraDragEnd}
          />
        </div>
      </div>

      <SizesDialog
        open={showSizesDialog}
        onOpenChange={setShowSizesDialog}
        selectedItemId={selectedItemId}
        sizes={sizes}
        saving={saving}
        onSave={(data) => saveSizeMut.mutate(data)}
        onDelete={(id, name) => setDeleteDialog({ open: true, type: "size", id, name })}
      />

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        onConfirm={() => {
          switch (deleteDialog.type) {
            case "category": deleteCategoryMut.mutate(deleteDialog.id, { onSuccess: () => setDeleteDialog(p => ({ ...p, open: false })) }); break;
            case "item": {
              const item = menuItems.find(i => i.id === deleteDialog.id);
              deleteItemMut.mutate({ itemId: deleteDialog.id, imagePublicId: item?.image_public_id }, { onSuccess: () => setDeleteDialog(p => ({ ...p, open: false })) });
              break;
            }
            case "size": deleteSizeMut.mutate(deleteDialog.id, { onSuccess: () => setDeleteDialog(p => ({ ...p, open: false })) }); break;
            case "extra": deleteExtraMut.mutate(deleteDialog.id, { onSuccess: () => setDeleteDialog(p => ({ ...p, open: false })) }); break;
          }
        }}
        title={deleteDialog.type === "category" ? "حذف القسم" : deleteDialog.type === "item" ? "حذف الصنف" : deleteDialog.type === "size" ? "حذف الحجم" : "حذف الإضافة"}
        description={`هل أنت متأكد من حذف "${deleteDialog.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        isLoading={isDeleting}
      />
    </PageTransition>
  );
}
