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
import { Users, Plus, Pencil, Trash2, Loader2, Phone, MapPin, StickyNote, CreditCard } from "lucide-react";

const PAYMENT_TYPES = ["آجل", "كاش"];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

const emptyForm = {
  name: "",
  phone: "",
  address: "",
  payment_type: "آجل",
  payment_terms_days: "",
  notes: "",
};

export default function Suppliers() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => base44.entities.Supplier.list("name"),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => base44.entities.Supplier.create(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      logActivity({ action_type: "create", entity_type: "supplier", entity_id: data.id, entity_label: data.name });
      toast({ title: "تمت الإضافة", description: "تم إضافة المورد بنجاح" });
      setDialogOpen(false);
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر إضافة المورد", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => base44.entities.Supplier.update(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      logActivity({ action_type: "update", entity_type: "supplier", entity_id: data.id, entity_label: data.name });
      toast({ title: "تم التعديل", description: "تم تحديث بيانات المورد" });
      setDialogOpen(false);
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر تحديث المورد", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Supplier.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      logActivity({ action_type: "delete", entity_type: "supplier", entity_id: deleteId });
      toast({ title: "تم الحذف", description: "تم حذف المورد" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر حذف المورد", variant: "destructive" }),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name || "",
      phone: s.phone || "",
      address: s.address || "",
      payment_type: s.payment_type || "آجل",
      payment_terms_days: s.payment_terms_days?.toString() || "",
      notes: s.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      phone: form.phone,
      address: form.address,
      payment_type: form.payment_type,
      payment_terms_days: form.payment_terms_days ? parseInt(form.payment_terms_days) : null,
      notes: form.notes,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-800">الموردين</h1>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-2" onClick={openAdd}>
          <Plus className="w-4 h-4" /> إضافة مورد
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : suppliers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا يوجد موردون بعد</p>
          <p className="text-sm text-gray-400 mt-1">ابدأ بإضافة مورد جديد</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-right text-gray-600">
                  <th className="p-3 font-semibold">الاسم</th>
                  <th className="p-3 font-semibold">الهاتف</th>
                  <th className="p-3 font-semibold">العنوان</th>
                  <th className="p-3 font-semibold">نوع الدفع</th>
                  <th className="p-3 font-semibold">مدة السداد</th>
                  <th className="p-3 font-semibold">ملاحظات</th>
                  <th className="p-3 font-semibold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{s.name}</td>
                    <td className="p-3 text-gray-600" dir="ltr">{s.phone || "—"}</td>
                    <td className="p-3 text-gray-600">{s.address || "—"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${s.payment_type === "كاش" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>
                        {s.payment_type || "—"}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{s.payment_terms_days ? `${s.payment_terms_days} يوم` : "—"}</td>
                    <td className="p-3 text-gray-500 max-w-[200px] truncate">{s.notes || "—"}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(s)} className="h-8 w-8">
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(s.id)} className="h-8 w-8">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>{editing ? "تعديل مورد" : "إضافة مورد جديد"}</DialogTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDialogOpen(false)}>✕</Button>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>اسم المورد *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم المورد" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>رقم الهاتف</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01xxxxxxxxx" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label>نوع الدفع</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.payment_type}
                  onChange={(e) => setForm({ ...form, payment_type: e.target.value })}
                >
                  {PAYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>مدة السداد (أيام)</Label>
                <Input type="number" value={form.payment_terms_days} onChange={(e) => setForm({ ...form, payment_terms_days: e.target.value })} placeholder="30" />
              </div>
              <div className="space-y-1.5">
                <Label>العنوان</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="العنوان" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "حفظ التعديلات" : "إضافة"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogHeader>
          <DialogTitle>تأكيد الحذف</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm text-gray-600">هل أنت متأكد من حذف هذا المورد؟ لا يمكن التراجع عن هذا الإجراء.</p>
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
