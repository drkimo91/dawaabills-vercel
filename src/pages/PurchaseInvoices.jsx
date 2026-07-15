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
import { FileText, Plus, Pencil, Trash2, Loader2, Filter, Eye } from "lucide-react";

const BRANCHES = ["فرع زكريا", "فرع بسيسة", "فرع المنشية"];
const INVOICE_STATUSES = ["انتظار المراجعة", "تم المراجعة", "مرفوضة"];
const PAYMENT_TYPES = ["آجل", "كاش"];

const STATUS_COLORS = {
  "انتظار المراجعة": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "تم المراجعة": "bg-green-50 text-green-700 border-green-200",
  "مرفوضة": "bg-red-50 text-red-700 border-red-200",
};

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

const today = new Date().toISOString().split("T")[0];

const emptyForm = {
  system_invoice_number: "",
  supplier_name: "",
  branch: BRANCHES[0],
  invoice_date: today,
  total_value: "",
  status: "انتظار المراجعة",
  payment_type: "آجل",
  notes: "",
};

export default function PurchaseInvoices() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => base44.entities.Supplier.list("name"),
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["purchase-invoices", branchFilter, statusFilter],
    queryFn: () => {
      const filter = {};
      if (branchFilter) filter.branch = branchFilter;
      if (statusFilter) filter.status = statusFilter;
      if (Object.keys(filter).length > 0) return base44.entities.PurchaseInvoice.filter(filter, "-invoice_date", 2000);
      return base44.entities.PurchaseInvoice.list("-invoice_date", 2000);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => base44.entities.PurchaseInvoice.create({
      ...payload,
      total_value: payload.total_value ? parseFloat(payload.total_value) : 0,
    }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["purchase-invoices"] });
      qc.invalidateQueries({ queryKey: ["pending-invoices-count"] });
      logActivity({ action_type: "create", entity_type: "purchase_invoice", entity_id: data.id, entity_label: data.system_invoice_number });
      toast({ title: "تمت الإضافة", description: "تم إضافة الفاتورة بنجاح" });
      setDialogOpen(false);
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر إضافة الفاتورة", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => base44.entities.PurchaseInvoice.update(id, {
      ...payload,
      total_value: payload.total_value ? parseFloat(payload.total_value) : 0,
    }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["purchase-invoices"] });
      qc.invalidateQueries({ queryKey: ["pending-invoices-count"] });
      logActivity({ action_type: "update", entity_type: "purchase_invoice", entity_id: data.id, entity_label: data.system_invoice_number });
      toast({ title: "تم التعديل", description: "تم تحديث الفاتورة" });
      setDialogOpen(false);
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر تحديث الفاتورة", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PurchaseInvoice.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-invoices"] });
      qc.invalidateQueries({ queryKey: ["pending-invoices-count"] });
      logActivity({ action_type: "delete", entity_type: "purchase_invoice", entity_id: deleteId });
      toast({ title: "تم الحذف", description: "تم حذف الفاتورة" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر حذف الفاتورة", variant: "destructive" }),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (inv) => {
    setEditing(inv);
    setForm({
      system_invoice_number: inv.system_invoice_number || "",
      supplier_name: inv.supplier_name || "",
      branch: inv.branch || BRANCHES[0],
      invoice_date: inv.invoice_date || today,
      total_value: inv.total_value?.toString() || "",
      status: inv.status || "انتظار المراجعة",
      payment_type: inv.payment_type || "آجل",
      notes: inv.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, payload: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-800">فواتير الشراء</h1>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-2" onClick={openAdd}>
          <Plus className="w-4 h-4" /> إضافة فاتورة
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="">كل الفروع</option>
            {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <select
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">كل الحالات</option>
          {INVOICE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : invoices.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد فواتير</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-right text-gray-600">
                  <th className="p-3 font-semibold">رقم الفاتورة</th>
                  <th className="p-3 font-semibold">المورد</th>
                  <th className="p-3 font-semibold">الفرع</th>
                  <th className="p-3 font-semibold">التاريخ</th>
                  <th className="p-3 font-semibold">القيمة</th>
                  <th className="p-3 font-semibold">نوع الدفع</th>
                  <th className="p-3 font-semibold">الحالة</th>
                  <th className="p-3 font-semibold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{inv.system_invoice_number || "—"}</td>
                    <td className="p-3 text-gray-600">{inv.supplier_name || "—"}</td>
                    <td className="p-3 text-gray-600">{inv.branch || "—"}</td>
                    <td className="p-3 text-gray-500">{inv.invoice_date || "—"}</td>
                    <td className="p-3 font-semibold text-teal-700">{(inv.total_value || 0).toLocaleString("ar-EG")} ج</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${inv.payment_type === "كاش" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>
                        {inv.payment_type || "—"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[inv.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                        {inv.status || "—"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewItem(inv)}>
                          <Eye className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(inv)}>
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteId(inv.id)}>
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
          <DialogTitle>{editing ? "تعديل فاتورة" : "إضافة فاتورة جديدة"}</DialogTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDialogOpen(false)}>✕</Button>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>رقم الفاتورة *</Label>
                <Input value={form.system_invoice_number} onChange={(e) => setForm({ ...form, system_invoice_number: e.target.value })} placeholder="رقم الفاتورة" required />
              </div>
              <div className="space-y-1.5">
                <Label>المورد</Label>
                <Input
                  list="supplier-list"
                  value={form.supplier_name}
                  onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                  placeholder="اسم المورد"
                />
                <datalist id="supplier-list">
                  {suppliers.map((s) => <option key={s.id} value={s.name} />)}
                </datalist>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <Label>تاريخ الفاتورة</Label>
                <Input type="date" value={form.invoice_date} onChange={(e) => setForm({ ...form, invoice_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>إجمالي القيمة (ج) *</Label>
                <Input type="number" step="0.01" value={form.total_value} onChange={(e) => setForm({ ...form, total_value: e.target.value })} placeholder="0" required />
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
              <div className="space-y-1.5">
                <Label>الحالة</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {INVOICE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[70px]"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
              />
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

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(v) => !v && setViewItem(null)}>
        <DialogHeader>
          <DialogTitle>تفاصيل الفاتورة</DialogTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(null)}>✕</Button>
        </DialogHeader>
        <DialogContent className="space-y-3">
          {viewItem && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">رقم الفاتورة:</span> <span className="font-medium">{viewItem.system_invoice_number || "—"}</span></div>
              <div><span className="text-gray-500">المورد:</span> <span className="font-medium">{viewItem.supplier_name || "—"}</span></div>
              <div><span className="text-gray-500">الفرع:</span> <span className="font-medium">{viewItem.branch || "—"}</span></div>
              <div><span className="text-gray-500">التاريخ:</span> <span className="font-medium">{viewItem.invoice_date || "—"}</span></div>
              <div><span className="text-gray-500">القيمة:</span> <span className="font-bold text-teal-700">{(viewItem.total_value || 0).toLocaleString("ar-EG")} ج</span></div>
              <div><span className="text-gray-500">نوع الدفع:</span> <span className="font-medium">{viewItem.payment_type || "—"}</span></div>
              <div><span className="text-gray-500">الحالة:</span> <span className="font-medium">{viewItem.status || "—"}</span></div>
              {viewItem.notes && <div className="col-span-2"><span className="text-gray-500">ملاحظات:</span> <span>{viewItem.notes}</span></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle></DialogHeader>
        <DialogContent>
          <p className="text-sm text-gray-600">هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.</p>
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
