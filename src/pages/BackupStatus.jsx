import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DatabaseBackup, CheckCircle2, XCircle, Clock, Loader2, Info } from "lucide-react";

const STATUS_LABELS = {
  "نجاح": { label: "نجاح", color: "text-green-600 bg-green-50 border-green-200", icon: CheckCircle2 },
  "failed": { label: "فشل", color: "text-red-600 bg-red-50 border-red-200", icon: XCircle },
  "running": { label: "قيد التنفيذ", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Clock },
};

const TYPE_LABELS = {
  "full": "نسخة كاملة",
  "incremental": "نسخة جزئية",
  "manual": "نسخة يدوية",
};

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

export default function BackupStatus() {
  const { data: backups = [], isLoading } = useQuery({
    queryKey: ["backup-logs"],
    queryFn: () => base44.entities.BackupLog.list("-started_at", 200),
  });

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <DatabaseBackup className="w-6 h-6 text-teal-600" />
        <h1 className="text-2xl font-bold text-gray-800">حالة النسخ الاحتياطي</h1>
      </div>

      <Card className="p-4 bg-teal-50/50 border-teal-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-teal-800">البيانات مخزّنة على Supabase</p>
            <p className="text-xs text-teal-700">
              جميع بيانات النظام محفوظة بشكل آمن على قاعدة بيانات Supabase السحابية مع النسخ الاحتياطي التلقائي.
              سجلات النسخ الاحتياطي أدناه توضح عمليات المزامنة والنسخ التي تمت على النظام.
            </p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : backups.length === 0 ? (
        <Card className="p-12 text-center">
          <DatabaseBackup className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد سجلات نسخ احتياطي حتى الآن</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-right text-gray-600">
                  <th className="p-3 font-semibold">نوع النسخة</th>
                  <th className="p-3 font-semibold">الحالة</th>
                  <th className="p-3 font-semibold">وقت البدء</th>
                  <th className="p-3 font-semibold">وقت الانتهاء</th>
                  <th className="p-3 font-semibold">عدد السجلات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {backups.map((b) => {
                  const st = STATUS_LABELS[b.status] || { label: b.status, color: "text-gray-600 bg-gray-50 border-gray-200", icon: Clock };
                  const Icon = st.icon;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="p-3">{TYPE_LABELS[b.backup_type] || b.backup_type || "—"}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${st.color}`}>
                          <Icon className="w-3 h-3" />
                          {st.label}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{b.started_at ? new Date(b.started_at).toLocaleString("ar-EG") : "—"}</td>
                      <td className="p-3 text-gray-600">{b.completed_at ? new Date(b.completed_at).toLocaleString("ar-EG") : "—"}</td>
                      <td className="p-3 font-semibold">{(b.total_records_synced ?? 0).toLocaleString("ar-EG")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
