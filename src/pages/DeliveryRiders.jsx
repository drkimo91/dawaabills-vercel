import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { logActivity } from "@/lib/activityLogger";
import { Bike, Plus, Pencil, Trash2, Loader2, Phone, Building2, Circle, CircleDot } from "lucide-react";

const BRANCHES = ["فرع زكريا", "فرع بسيسة", "فرع المنشية"];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

const emptyForm = { name: "", branch: BRANCHES[0], phone: "", is_active: true };

export default function DeliveryRiders() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);

  const { data: riders = [], isLoading } = useQuery({
    queryKey: ["riders"],
    queryFn: () => base44.entities.Rider.list("name"),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => base44.entities.Rider.create(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["riders"] });
      logActivity({ action_type: "create", entity_type: "rider", entity_id: data.id, entity_label: data.name });
      toast({ title: "تمت الإضافة", description: "تم إضافة المندوب بنجاح" });
      setDialogOpen(false);
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر إضافة المندوب", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => base44.entities.Rider.update(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["riders"] });
      logActivity({ action_type: "update", entity_type: "rider", entity_id: data.id, entity_label: data.name });
      toast({ title: "تم التعديل", description: "تم تحديث بيانات المندوب" });
      setDialogOpen(false);
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر تحديث المندوب", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Rider.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["riders"] });
      logActivity({ action_type: "delete", entity_type: "rider", entity_id: deleteId });
      toast({ title: "تم الحذف", description: "تم حذف المندوب" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر حذف المندوب", variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.Rider.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["riders"] }),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({ name: r.name || "", branch: r.branch || BRANCHES[0], phone: r.phone || "", is_active: r.is_active !== false });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { name: form.name, branch: form.branch, phone: form.phone, is_active: form.is_active };
    if (editing) updateMutation.mutate({ id: editing.id, payload });
    else createMutation.mutate(payload);
  };

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Bike className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-800">مناديب التوصيل</h1>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-2" onClick={openAdd}>
          <Plus className="w-4 h-4" /> إضافة مندوب
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : riders.length === 0 ? (
        <Card className="p-12 text-center">
          <Bike className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا يوجد مناديب بعد</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {riders.map((r) => (
            <Card key={r.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${r.is_active !== false ? "bg-teal-100" : "bg-gray-100"}`}>
                    <Bike className={`w-5 h-5 ${r.is_active !== false ? "text-teal-600" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{r.name || "—"}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {r.branch || "—"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleActiveMutation.mutate({ id: r.id, is_active: !(r.is_active !== false) })}
                  className="text-xs flex items-center gap-1"
                >
                  {r.is_active !== false ? (
                    <span className="flex items-center gap-1 text-green-600"><CircleDot className="w-3.5 h-3.5" /> نشط</span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400"><Circle className="w-3.5 h-3.5" /> غير نشط</span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1 text-sm text-gray-600" dir="ltr">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {r.phone || "—"}
              </div>

              <div className="flex gap-2 pt-1 border-t">
                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => openEdit(r)}>
                  <Pencil className="w-3.5 h-3.5" /> تعديل
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleteId(r.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>{editing ? "تعديل مندوب" : "إضافة مندوب جديد"}</DialogTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDialogOpen(false)}>✕</Button>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>اسم المندوب *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم المندوب" required />
            </div>
            <div className="space-y-1.5">
              <Label>الفرع</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
              >
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>رقم الهاتف</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01xxxxxxxxx" dir="ltr" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rider-active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 accent-teal-600"
              />
              <Label htmlFor="rider-active">مندوب نشط</Label>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "حفظ" : "إضافة"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle></DialogHeader>
        <DialogContent>
          <p className="text-sm text-gray-600">هل أنت متأكد من حذف هذا المندوب؟</p>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
          <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "حذف"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
