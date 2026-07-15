import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { logActivity } from "@/lib/activityLogger";
import { ClipboardList, CheckCircle, XCircle, Loader2, Calendar, Building2, User } from "lucide-react";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

export default function PendingInvoices() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["pending-invoices-review"],
    queryFn: () => base44.entities.PurchaseInvoice.filter({ status: "انتظار المراجعة" }, "-invoice_date"),
  });

  const approveMutation = useMutation({
    mutationFn: (inv) => base44.entities.PurchaseInvoice.update(inv.id, { status: "تم المراجعة" }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["pending-invoices-review"] });
      qc.invalidateQueries({ queryKey: ["pending-invoices-count"] });
      qc.invalidateQueries({ queryKey: ["purchase-invoices"] });
      logActivity({ action_type: "approve", entity_type: "purchase_invoice", entity_id: data.id, entity_label: data.system_invoice_number });
      toast({ title: "تمت المراجعة", description: "تم اعتماد الفاتورة بنجاح" });
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر اعتماد الفاتورة", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (inv) => base44.entities.PurchaseInvoice.update(inv.id, { status: "مرفوضة" }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["pending-invoices-review"] });
      qc.invalidateQueries({ queryKey: ["pending-invoices-count"] });
      qc.invalidateQueries({ queryKey: ["purchase-invoices"] });
      logActivity({ action_type: "reject", entity_type: "purchase_invoice", entity_id: data.id, entity_label: data.system_invoice_number });
      toast({ title: "تم الرفض", description: "تم رفض الفاتورة" });
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر رفض الفاتورة", variant: "destructive" }),
  });

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-6 h-6 text-teal-600" />
        <h1 className="text-2xl font-bold text-gray-800">فواتير في انتظار المراجعة</h1>
      </div>

      {isLoading ? (
        <Spinner />
      ) : invoices.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد فواتير في انتظار المراجعة</p>
          <p className="text-sm text-gray-400 mt-1">تمت مراجعة جميع الفواتير</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.map((inv) => (
            <Card key={inv.id} className="p-4 space-y-3 border-yellow-200 bg-yellow-50/30">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-800">{inv.system_invoice_number || "—"}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <User className="w-3 h-3" />
                    {inv.supplier_name || "—"}
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 border border-yellow-200">
                  انتظار المراجعة
                </span>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-gray-500"><Building2 className="w-3.5 h-3.5" /> الفرع</span>
                  <span className="font-medium">{inv.branch || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-gray-500"><Calendar className="w-3.5 h-3.5" /> التاريخ</span>
                  <span className="font-medium">{inv.invoice_date || "—"}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-1.5">
                  <span className="text-gray-500">إجمالي القيمة</span>
                  <span className="font-bold text-teal-700 text-base">{(inv.total_value || 0).toLocaleString("ar-EG")} ج</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  className="bg-teal-600 hover:bg-teal-700 flex-1 gap-1"
                  size="sm"
                  onClick={() => approveMutation.mutate(inv)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4" /> اعتماد
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => rejectMutation.mutate(inv)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <XCircle className="w-4 h-4" /> رفض
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
