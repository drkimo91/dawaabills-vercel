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
import { UserCheck, Plus, Pencil, Trash2, Loader2, Phone, Building2, Briefcase } from "lucide-react";

const BRANCHES = ["فرع زكريا", "فرع بسيسة", "فرع المنشية"];
const ROLES = ["صيدلي", "مدير فرع", "موظف مبيعات", "محاسب", "عامل مخزن", "أخرى"];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

const emptyForm = { name: "", branches: [], role: "صيدلي", phone: "" };

export default function TeamMembers() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => base44.entities.TeamMember.list("name"),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => base44.entities.TeamMember.create(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      logActivity({ action_type: "create", entity_type: "team_member", entity_id: data.id, entity_label: data.name });
      toast({ title: "تمت الإضافة", description: "تم إضافة عضو الفريق" });
      setDialogOpen(false);
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر إضافة العضو", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => base44.entities.TeamMember.update(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      logActivity({ action_type: "update", entity_type: "team_member", entity_id: data.id, entity_label: data.name });
      toast({ title: "تم التعديل", description: "تم تحديث بيانات العضو" });
      setDialogOpen(false);
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر تحديث العضو", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamMember.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      logActivity({ action_type: "delete", entity_type: "team_member", entity_id: deleteId });
      toast({ title: "تم الحذف", description: "تم حذف العضو" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر حذف العضو", variant: "destructive" }),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name || "",
      branches: m.branches || [],
      role: m.role || "صيدلي",
      phone: m.phone || "",
    });
    setDialogOpen(true);
  };

  const toggleBranch = (branch) => {
    setForm((f) => ({
      ...f,
      branches: f.branches.includes(branch)
        ? f.branches.filter((b) => b !== branch)
        : [...f.branches, branch],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { name: form.name, branches: form.branches, role: form.role, phone: form.phone };
    if (editing) updateMutation.mutate({ id: editing.id, payload });
    else createMutation.mutate(payload);
  };

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-800">فريق العمل</h1>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-2" onClick={openAdd}>
          <Plus className="w-4 h-4" /> إضافة عضو
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : members.length === 0 ? (
        <Card className="p-12 text-center">
          <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا يوجد أعضاء فريق بعد</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <Card key={m.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <span className="text-teal-700 font-bold text-sm">{(m.name || "؟").charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{m.name || "—"}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> {m.role || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(m)}>
                    <Pencil className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteId(m.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              {m.phone && (
                <div className="flex items-center gap-1 text-sm text-gray-600" dir="ltr">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {m.phone}
                </div>
              )}

              {(m.branches || []).length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 border-t">
                  {m.branches.map((b) => (
                    <span key={b} className="text-xs bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Building2 className="w-2.5 h-2.5" />
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>{editing ? "تعديل عضو" : "إضافة عضو جديد"}</DialogTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDialogOpen(false)}>✕</Button>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>الاسم *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم العضو" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>الدور</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>رقم الهاتف</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01xxxxxxxxx" dir="ltr" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>الفروع</Label>
              <div className="flex flex-wrap gap-2">
                {BRANCHES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBranch(b)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      form.branches.includes(b)
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
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
          <p className="text-sm text-gray-600">هل أنت متأكد من حذف هذا العضو؟</p>
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
