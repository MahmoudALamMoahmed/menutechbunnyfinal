import { useState, useMemo } from "react";
import PageTransition from "@/components/PageTransition";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminRestaurant, useAdminBranches, useAdminDeliveryAreas, useBranchStaffList } from "@/hooks/useAdminData";
import {
  useSaveBranch, useDeleteBranch, useToggleBranchActive,
  useSaveDeliveryArea, useDeleteDeliveryArea, useReorderBranches, useReorderDeliveryAreas,
} from "@/hooks/admin-mutations/useBranchMutations";
import { useLimitsCheck } from "@/hooks/useLimitsCheck";
import { useRestaurantLimits } from "@/hooks/useSubscription";
import type { Tables } from "@/integrations/supabase/types";
import {
  ArrowRight, Plus, Trash2, Edit2, MapPin, Phone, Building2, Navigation, GripVertical, Search, Filter, UserPlus, User, UserX,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import BranchFormDialog from "@/components/branches/BranchFormDialog";
import DeliveryAreasDialog from "@/components/branches/DeliveryAreasDialog";
import StaffAccountDialogs from "@/components/branches/StaffAccountDialogs";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";

type Branch = Tables<"branches">;

// مكون كارت الفرع القابل للسحب
function SortableBranchCard({
  branch, onToggleActive, onEdit, onDelete, onOpenAreas, onManageAccount,
  areasCount, staffEmail, isFrozen = false, canManageStaff = true,
}: {
  branch: Branch; onToggleActive: (b: Branch) => void; onEdit: (b: Branch) => void;
  onDelete: (id: string) => void; onOpenAreas: (b: Branch) => void; onManageAccount: (b: Branch) => void;
  areasCount: number; staffEmail: string | null; isFrozen?: boolean; canManageStaff?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: branch.id, disabled: isFrozen });
  const style = { transform: CSS.Transform.toString(transform), transition: transition || "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)" };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "z-50 opacity-50" : ""}>
      <Card className={`${!branch.is_active || isFrozen ? "opacity-60" : ""} transition-shadow duration-200 ${isDragging ? "shadow-2xl ring-2 ring-primary" : ""} ${isFrozen ? "bg-muted/50" : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isFrozen && (
                <button className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none" {...attributes} {...listeners}>
                  <GripVertical className="w-5 h-5" />
                </button>
              )}
              <CardTitle className="text-lg">{branch.name}</CardTitle>
              {isFrozen && <Badge variant="secondary" className="text-xs">🔒 مجمّد</Badge>}
            </div>
            <Switch checked={branch.is_active} onCheckedChange={() => onToggleActive(branch)} disabled={isFrozen} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {branch.address && <div className="flex items-start gap-2 text-sm"><MapPin className="w-4 h-4 text-muted-foreground mt-0.5" /><span className="text-muted-foreground">{branch.address}</span></div>}
          {branch.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">{branch.phone}</span></div>}
          {branch.delivery_phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-primary" /><span className="text-muted-foreground">دليفري: {branch.delivery_phone}</span></div>}
          <div className="flex items-center gap-2 text-sm"><Navigation className="w-4 h-4 text-green-500" /><span className="text-muted-foreground">{areasCount} مناطق توصيل</span></div>
          {canManageStaff && (
            <div className="pt-2 border-t">
              {staffEmail ? (
                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                  <div className="flex items-center gap-2 min-w-0"><User className="w-4 h-4 text-primary shrink-0" /><span className="text-xs text-muted-foreground truncate">{staffEmail}</span></div>
                  <Badge variant="secondary" className="text-xs shrink-0 mr-2">حساب موظف</Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><UserPlus className="w-4 h-4" /><span>لا يوجد حساب للفرع</span></div>
              )}
            </div>
          )}
          <div className="flex gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenAreas(branch)} disabled={isFrozen}><Navigation className="w-4 h-4 ml-1" />المناطق</Button>
            {canManageStaff && <Button variant="outline" size="sm" onClick={() => onManageAccount(branch)} disabled={isFrozen}>{staffEmail ? <UserX className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}</Button>}
            <Button variant="outline" size="sm" onClick={() => onEdit(branch)} disabled={isFrozen}><Edit2 className="w-4 h-4" /></Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(branch.id)} disabled={isFrozen}><Trash2 className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BranchesManagement() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: restaurant, isLoading: restaurantLoading } = useAdminRestaurant(username);
  const restaurantId = restaurant?.id;

  const { data: branches = [], isLoading: branchesLoading } = useAdminBranches(restaurantId);
  const branchIds = branches.length > 0 ? branches.map(b => b.id) : undefined;
  const { data: deliveryAreas = [], isLoading: areasLoading } = useAdminDeliveryAreas(branchIds);
  const { data: staffList = [], refetch: refetchStaff } = useBranchStaffList(restaurantId);

  const branchLimits = useLimitsCheck(restaurantId, "branches", branches.length);
  const { data: limits } = useRestaurantLimits(restaurantId);
  const features = (limits?.features || {}) as { analytics?: boolean; branch_staff?: boolean; dashboard_orders?: boolean };
  const frozenBranchIds = new Set(limits?.max_branches != null ? branches.slice(limits.max_branches).map(b => b.id) : []);
  const dataLoading = branchesLoading || areasLoading;

  const saveBranchMut = useSaveBranch(restaurantId);
  const deleteBranchMut = useDeleteBranch(restaurantId);
  const toggleActiveMut = useToggleBranchActive(restaurantId);
  const saveAreaMut = useSaveDeliveryArea(restaurantId);
  const deleteAreaMut = useDeleteDeliveryArea(restaurantId);
  const reorderBranchesMut = useReorderBranches(restaurantId);
  const reorderAreasMut = useReorderDeliveryAreas(restaurantId);

  // UI State
  const [showDialog, setShowDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({ name: "", address: "", phone: "", whatsapp_phone: "", delivery_phone: "", working_hours: "", is_active: true, order_mode: "whatsapp" });
  const [branchPaymentMethods, setBranchPaymentMethods] = useState<{ id?: string; name: string; account_number: string; is_active: boolean }[]>([]);
  const [showAreasDialog, setShowAreasDialog] = useState(false);
  const [selectedBranchForAreas, setSelectedBranchForAreas] = useState<Branch | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<string | null>(null);
  const [deleteAreaDialogOpen, setDeleteAreaDialogOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [activeDragBranch, setActiveDragBranch] = useState<Branch | null>(null);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [selectedBranchForAccount, setSelectedBranchForAccount] = useState<Branch | null>(null);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<{ userId: string; branchName: string } | null>(null);

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = branch.name.toLowerCase().includes(searchQuery.toLowerCase()) || (branch.address && branch.address.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" && branch.is_active) || (statusFilter === "inactive" && !branch.is_active);
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({ name: "", address: "", phone: "", whatsapp_phone: "", delivery_phone: "", working_hours: "", is_active: true, order_mode: "whatsapp" });
    setBranchPaymentMethods([]);
    setEditingBranch(null);
  };

  const openEditDialog = async (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({ name: branch.name, address: branch.address || "", phone: branch.phone || "", whatsapp_phone: branch.whatsapp_phone || "", delivery_phone: branch.delivery_phone || "", working_hours: branch.working_hours || "", is_active: branch.is_active, order_mode: (branch as any).order_mode || "whatsapp" });
    setShowDialog(true);
    const { data } = await supabase.from("branch_payment_methods").select("*").eq("branch_id", branch.id).order("display_order");
    setBranchPaymentMethods(data?.map(d => ({ id: d.id, name: d.name, account_number: d.account_number, is_active: d.is_active !== false })) || []);
  };

  const handleSave = async () => {
    if (!restaurant || !formData.name.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال اسم الفرع", variant: "destructive" });
      return;
    }
    saveBranchMut.mutate({ id: editingBranch?.id, ...formData, restaurant_id: restaurant.id, display_order: editingBranch ? undefined : branches.length }, {
      onSuccess: async (_, vars) => {
        const branchId = vars.id || editingBranch?.id;
        if (branchId) {
          const currentIds = branchPaymentMethods.filter(pm => pm.id).map(pm => pm.id!);
          const { data: existing } = await supabase.from("branch_payment_methods").select("id").eq("branch_id", branchId);
          const toDelete = (existing || []).filter(e => !currentIds.includes(e.id)).map(e => e.id);
          if (toDelete.length > 0) await supabase.from("branch_payment_methods").delete().in("id", toDelete);
          for (let i = 0; i < branchPaymentMethods.length; i++) {
            const pm = branchPaymentMethods[i];
            if (pm.id) await supabase.from("branch_payment_methods").update({ name: pm.name, account_number: pm.account_number, display_order: i, is_active: pm.is_active }).eq("id", pm.id);
            else await supabase.from("branch_payment_methods").insert({ branch_id: branchId, name: pm.name, account_number: pm.account_number, display_order: i, is_active: pm.is_active });
          }
        }
        setShowDialog(false);
        resetForm();
      },
    });
  };

  const getBranchAreas = (branchId: string) => deliveryAreas.filter(a => a.branch_id === branchId);
  const getBranchStaffEmail = (branchId: string): string | null => staffList.find(s => s.branch_id === branchId)?.email ?? null;

  const openManageAccountDialog = (branch: Branch) => {
    setSelectedBranchForAccount(branch);
    const staffEmail = getBranchStaffEmail(branch.id);
    if (staffEmail) {
      const staff = staffList.find(s => s.branch_id === branch.id);
      if (staff) { setStaffToDelete({ userId: staff.user_id, branchName: branch.name }); setDeleteAccountDialogOpen(true); }
    } else {
      setShowAccountDialog(true);
    }
  };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleBranchDragStart = (event: DragStartEvent) => {
    const branch = branches.find(b => b.id === event.active.id);
    if (branch) setActiveDragBranch(branch);
  };

  const handleBranchDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragBranch(null);
    if (!over || active.id === over.id) return;
    const oldIndex = branches.findIndex(b => b.id === active.id);
    const newIndex = branches.findIndex(b => b.id === over.id);
    const newBranches = arrayMove(branches, oldIndex, newIndex);
    queryClient.setQueryData(["admin_branches", restaurantId], newBranches);
    reorderBranchesMut.mutate(newBranches.map((b, i) => ({ id: b.id, display_order: i })), {
      onSuccess: () => toast({ title: "تم الترتيب", description: "تم تحديث ترتيب الفروع" }),
      onError: () => toast({ title: "خطأ", description: "حدث خطأ أثناء تحديث الترتيب", variant: "destructive" }),
    });
  };

  const handleAreaDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedBranchForAreas) return;
    const branchAreas = getBranchAreas(selectedBranchForAreas.id);
    const oldIndex = branchAreas.findIndex(a => a.id === active.id);
    const newIndex = branchAreas.findIndex(a => a.id === over.id);
    const newAreas = arrayMove(branchAreas, oldIndex, newIndex);
    const updatedAreas = deliveryAreas.filter(a => a.branch_id !== selectedBranchForAreas.id);
    const reorderedAreas = newAreas.map((area, index) => ({ ...area, display_order: index }));
    queryClient.setQueryData(["admin_delivery_areas", branchIds], [...updatedAreas, ...reorderedAreas]);
    reorderAreasMut.mutate(newAreas.map((a, i) => ({ id: a.id, display_order: i })), {
      onSuccess: () => toast({ title: "تم الترتيب", description: "تم تحديث ترتيب المناطق" }),
      onError: () => toast({ title: "خطأ", description: "حدث خطأ أثناء تحديث الترتيب", variant: "destructive" }),
    });
  };

  if (restaurantLoading || dataLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div><p className="text-gray-600">جاري التحميل...</p></div></div>;
  }

  if (!restaurant) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl"><div className="text-center"><p className="text-gray-600">المطعم غير موجود</p></div></div>;
  }

  return (
    <PageTransition className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate(`/${restaurant.username}/dashboard`)}><ArrowRight className="w-4 h-4" />العودة</Button>
              <div><h1 className="text-2xl font-bold text-gray-800">إدارة الفروع</h1><p className="text-gray-600 text-sm">إدارة فروع {restaurant.name}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{branchLimits.usageText} فرع</span>
              <Button onClick={() => { resetForm(); setShowDialog(true); }} disabled={!branchLimits.canAdd} title={!branchLimits.canAdd ? "وصلت للحد الأقصى - قم بترقية باقتك" : ""}>
                <Plus className="w-4 h-4 ml-2" />{branchLimits.canAdd ? "إضافة فرع" : "الحد الأقصى"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="ابحث عن فرع..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9" />
          </div>
          <Select value={statusFilter} onValueChange={(v: "all" | "active" | "inactive") => setStatusFilter(v)}>
            <SelectTrigger className="w-full sm:w-[180px]"><Filter className="w-4 h-4 ml-2" /><SelectValue placeholder="جميع الفروع" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفروع</SelectItem>
              <SelectItem value="active">الفروع النشطة</SelectItem>
              <SelectItem value="inactive">الفروع غير النشطة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Branches Grid with DnD */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleBranchDragStart} onDragEnd={handleBranchDragEnd}>
          <SortableContext items={filteredBranches.map(b => b.id)} strategy={rectSortingStrategy}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBranches.map(branch => (
                <SortableBranchCard key={branch.id} branch={branch} onToggleActive={b => toggleActiveMut.mutate({ branchId: b.id, isActive: !b.is_active })}
                  onEdit={openEditDialog} onDelete={id => { setBranchToDelete(id); setDeleteDialogOpen(true); }}
                  onOpenAreas={b => { setSelectedBranchForAreas(b); setShowAreasDialog(true); }}
                  onManageAccount={openManageAccountDialog} areasCount={getBranchAreas(branch.id).length}
                  staffEmail={getBranchStaffEmail(branch.id)} isFrozen={frozenBranchIds.has(branch.id)} canManageStaff={!!features.branch_staff}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeDragBranch ? (
              <Card className="shadow-2xl ring-2 ring-primary opacity-90">
                <CardHeader className="pb-2"><CardTitle className="text-lg">{activeDragBranch.name}</CardTitle></CardHeader>
                <CardContent>{activeDragBranch.address && <div className="flex items-start gap-2 text-sm"><MapPin className="w-4 h-4 text-gray-400 mt-0.5" /><span className="text-gray-600">{activeDragBranch.address}</span></div>}</CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>

        {filteredBranches.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">{searchQuery || statusFilter !== "all" ? "لا توجد فروع مطابقة للبحث" : "لم يتم إضافة فروع بعد"}</p>
            {!searchQuery && statusFilter === "all" && (
              <Button className="mt-4" onClick={() => { resetForm(); setShowDialog(true); }}><Plus className="w-4 h-4 ml-2" />إضافة فرع جديد</Button>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <BranchFormDialog
        open={showDialog} onOpenChange={setShowDialog} editingBranch={editingBranch}
        formData={formData} setFormData={setFormData} branchPaymentMethods={branchPaymentMethods}
        setBranchPaymentMethods={setBranchPaymentMethods} onSave={handleSave} onReset={resetForm}
        saving={saveBranchMut.isPending} features={features} sensors={sensors}
      />

      <DeliveryAreasDialog
        open={showAreasDialog} onOpenChange={o => { setShowAreasDialog(o); if (!o) setSelectedBranchForAreas(null); }}
        selectedBranch={selectedBranchForAreas} areas={deliveryAreas} sensors={sensors}
        saving={saveAreaMut.isPending}
        onSave={data => saveAreaMut.mutate(data)}
        onDelete={id => { setAreaToDelete(id); setDeleteAreaDialogOpen(true); }}
        onDragEnd={handleAreaDragEnd}
      />

      <StaffAccountDialogs
        restaurantId={restaurantId || ""}
        showCreateDialog={showAccountDialog} setShowCreateDialog={setShowAccountDialog} selectedBranch={selectedBranchForAccount}
        showDeleteDialog={deleteAccountDialogOpen} setShowDeleteDialog={setDeleteAccountDialogOpen}
        staffToDelete={staffToDelete} setStaffToDelete={setStaffToDelete} onSuccess={refetchStaff}
      />

      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}
        onConfirm={() => { if (branchToDelete) deleteBranchMut.mutate(branchToDelete, { onSuccess: () => { setDeleteDialogOpen(false); setBranchToDelete(null); } }); }}
        title="حذف الفرع" description="هل أنت متأكد من حذف هذا الفرع؟ سيتم حذف جميع مناطق التوصيل المرتبطة به." isLoading={deleteBranchMut.isPending}
      />

      <DeleteConfirmDialog open={deleteAreaDialogOpen} onOpenChange={setDeleteAreaDialogOpen}
        onConfirm={() => { if (areaToDelete) deleteAreaMut.mutate(areaToDelete, { onSuccess: () => { setDeleteAreaDialogOpen(false); setAreaToDelete(null); } }); }}
        title="حذف منطقة التوصيل" description="هل أنت متأكد من حذف هذه المنطقة؟" isLoading={deleteAreaMut.isPending}
      />
    </PageTransition>
  );
}
