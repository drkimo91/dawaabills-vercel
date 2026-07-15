import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { PackageSearch, Loader2, Calendar, Building2, User, CheckSquare, Target } from "lucide-react";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

const STATUS_COLORS = {
  "مكتمل": "bg-green-50 text-green-700 border-green-200",
  "قيد التنفيذ": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "جديد": "bg-blue-50 text-blue-700 border-blue-200",
};

export default function InventoryCount() {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["inventory-count-tasks"],
    queryFn: () => base44.entities.InventoryCountTask.list("-task_date", 1000),
  });

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <PackageSearch className="w-6 h-6 text-teal-600" />
        <h1 className="text-2xl font-bold text-gray-800">الجرد الدوري</h1>
      </div>

      {isLoading ? (
        <Spinner />
      ) : tasks.length === 0 ? (
        <Card className="p-12 text-center">
          <PackageSearch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد مهام جرد</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => {
            const itemsCount = task.items_count || 0;
            const completedCount = task.completed_count || 0;
            const accuracy = task.accuracy_rate != null ? Math.round(task.accuracy_rate) : (itemsCount > 0 ? Math.round((completedCount / itemsCount) * 100) : 0);
            return (
              <Card key={task.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-800 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {task.task_date ? new Date(task.task_date).toLocaleDateString("ar-EG") : "—"}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Building2 className="w-3 h-3" />
                      {task.branch || "—"}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs border ${STATUS_COLORS[task.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                    {task.status || "—"}
                  </span>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-gray-500"><User className="w-3.5 h-3.5" /> الموظف</span>
                    <span className="font-medium">{task.assigned_employee || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-gray-500"><CheckSquare className="w-3.5 h-3.5" /> التقدم</span>
                    <span className="font-medium">{completedCount} / {itemsCount}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 flex items-center gap-1"><Target className="w-3 h-3" /> نسبة الإنجاز</span>
                    <span className={`font-bold ${accuracy >= 100 ? "text-green-600" : accuracy >= 50 ? "text-yellow-600" : "text-red-600"}`}>{accuracy}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${accuracy >= 100 ? "bg-green-500" : accuracy >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                      style={{ width: `${Math.min(accuracy, 100)}%` }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
