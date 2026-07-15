import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { CheckSquare, Loader2, Filter, Calendar, Building2, User, Flag } from "lucide-react";

const BRANCHES = ["فرع زكريا", "فرع بسيسة", "فرع المنشية"];
const PRIORITY_LABELS = { high: "عالية", medium: "متوسطة", low: "منخفضة" };
const PRIORITY_COLORS = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  low: "bg-green-50 text-green-700 border-green-200",
};
const STATUS_COLORS = {
  "مكتمل": "bg-green-50 text-green-700 border-green-200",
  "قيد التنفيذ": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "جديد": "bg-blue-50 text-blue-700 border-blue-200",
  "متأخر": "bg-red-50 text-red-700 border-red-200",
};

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

export default function TasksDistribution() {
  const [branchFilter, setBranchFilter] = useState("");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks-distribution", branchFilter],
    queryFn: () => {
      if (branchFilter) return base44.entities.Task.filter({ branch_name: branchFilter }, "-due_date");
      return base44.entities.Task.list("-due_date", 1000);
    },
  });

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-800">توزيع المهام</h1>
        </div>
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
      </div>

      {isLoading ? (
        <Spinner />
      ) : tasks.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد مهام {branchFilter ? `لفرع "${branchFilter}"` : ""}</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-right text-gray-600">
                  <th className="p-3 font-semibold">العنوان</th>
                  <th className="p-3 font-semibold">الفرع</th>
                  <th className="p-3 font-semibold">المسؤول</th>
                  <th className="p-3 font-semibold">تاريخ الاستحقاق</th>
                  <th className="p-3 font-semibold">الأولوية</th>
                  <th className="p-3 font-semibold">الحالة</th>
                  <th className="p-3 font-semibold">نسبة الإنجاز</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{t.title || "—"}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        {t.branch_name || "—"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-gray-600">
                        <User className="w-3 h-3 text-gray-400" />
                        {t.assigned_to_name || "—"}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{t.due_date ? new Date(t.due_date).toLocaleDateString("ar-EG") : "—"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${PRIORITY_COLORS[t.priority] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                        {PRIORITY_LABELS[t.priority] || t.priority || "—"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[t.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                        {t.status || "—"}
                      </span>
                    </td>
                    <td className="p-3">
                      {t.completion_score != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-1.5 bg-teal-500 rounded-full"
                              style={{ width: `${Math.min(t.completion_score, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{t.completion_score}%</span>
                        </div>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
