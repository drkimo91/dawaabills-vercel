import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { ClipboardList, Loader2, User, FileText, Pencil, Trash2, Plus, CheckCircle } from "lucide-react";

const ACTION_ICONS = {
  create: { icon: Plus, color: "text-green-600 bg-green-50" },
  update: { icon: Pencil, color: "text-blue-600 bg-blue-50" },
  delete: { icon: Trash2, color: "text-red-600 bg-red-50" },
  approve: { icon: CheckCircle, color: "text-teal-600 bg-teal-50" },
  reject: { icon: FileText, color: "text-orange-600 bg-orange-50" },
};

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

export default function ActivityLog() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: () => base44.entities.ActivityLog.list("-created_date", 500),
  });

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-6 h-6 text-teal-600" />
        <h1 className="text-2xl font-bold text-gray-800">سجل العمليات</h1>
      </div>

      {isLoading ? (
        <Spinner />
      ) : logs.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد عمليات مسجلة</p>
        </Card>
      ) : (
        <Card className="divide-y">
          {logs.map((log) => {
            const meta = ACTION_ICONS[log.action_type] || { icon: FileText, color: "text-gray-600 bg-gray-50" };
            const Icon = meta.icon;
            return (
              <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-gray-50">
                <div className={`p-2 rounded-lg shrink-0 ${meta.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-800">{log.action_type}</span>
                    {log.entity_type && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{log.entity_type}</span>
                    )}
                  </div>
                  {log.entity_label && (
                    <p className="text-sm text-gray-600 mt-0.5">{log.entity_label}</p>
                  )}
                  {log.details && (
                    <p className="text-xs text-gray-400 mt-0.5">{log.details}</p>
                  )}
                </div>
                <div className="text-left shrink-0 space-y-0.5">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>{log.user_email || log.user_name || "—"}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {log.created_date ? new Date(log.created_date).toLocaleString("ar-EG") : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
