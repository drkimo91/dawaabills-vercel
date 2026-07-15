import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Gauge, Loader2, CheckSquare, ShoppingBag, PackageSearch, RotateCcw, TrendingUp, Users } from "lucide-react";

const BRANCHES = ["فرع زكريا", "فرع بسيسة", "فرع المنشية"];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

export default function BranchEfficiency() {
  const { data: tasks = [], isLoading: lt } = useQuery({
    queryKey: ["eff-tasks"],
    queryFn: () => base44.entities.Task.list("-created_date", 2000),
  });
  const { data: orders = [], isLoading: lo } = useQuery({
    queryKey: ["eff-orders"],
    queryFn: () => base44.entities.CustomerOrder.list("-created_date", 2000),
  });
  const { data: counts = [], isLoading: lc } = useQuery({
    queryKey: ["eff-counts"],
    queryFn: () => base44.entities.InventoryCountTask.list("-created_date", 2000),
  });
  const { data: returns = [], isLoading: lr } = useQuery({
    queryKey: ["eff-returns"],
    queryFn: () => base44.entities.Return.list("-created_date", 2000),
  });

  const isLoading = lt || lo || lc || lr;

  const branchStats = BRANCHES.map((branch) => {
    const bTasks = tasks.filter((t) => t.branch_name === branch);
    const bOrders = orders.filter((o) => o.branch === branch);
    const bCounts = counts.filter((c) => c.branch === branch);
    const bReturns = returns.filter((r) => (r.branch_name || r.branch) === branch);

    const completedTasks = bTasks.filter((t) => t.status === "مكتمل").length;
    const completedOrders = bOrders.filter((o) => o.status === "تم التسليم").length;
    const completedCounts = bCounts.filter((c) => c.status === "مكتمل").length;
    const processedReturns = bReturns.filter((r) => r.status === "تم المعالجة" || r.status === "تم الاستلام").length;

    const taskRate = bTasks.length > 0 ? Math.round((completedTasks / bTasks.length) * 100) : 0;
    const orderRate = bOrders.length > 0 ? Math.round((completedOrders / bOrders.length) * 100) : 0;
    const countRate = bCounts.length > 0 ? Math.round((completedCounts / bCounts.length) * 100) : 0;
    const returnRate = bReturns.length > 0 ? Math.round((processedReturns / bReturns.length) * 100) : 0;

    const overall = Math.round((taskRate + orderRate + countRate + returnRate) / 4);

    return {
      branch,
      tasks: bTasks.length, completedTasks, taskRate,
      orders: bOrders.length, completedOrders, orderRate,
      counts: bCounts.length, completedCounts, countRate,
      returns: bReturns.length, processedReturns, returnRate,
      overall,
    };
  });

  const totals = {
    tasks: tasks.length,
    orders: orders.length,
    counts: counts.length,
    returns: returns.length,
  };

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <Gauge className="w-6 h-6 text-teal-600" />
        <h1 className="text-2xl font-bold text-gray-800">كفاءة الفروع</h1>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 shrink-0"><CheckSquare className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-gray-500">إجمالي المهام</p>
                <p className="text-xl font-bold text-gray-800">{totals.tasks}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50 shrink-0"><ShoppingBag className="w-5 h-5 text-teal-600" /></div>
              <div>
                <p className="text-xs text-gray-500">طلبات العملاء</p>
                <p className="text-xl font-bold text-gray-800">{totals.orders}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 shrink-0"><PackageSearch className="w-5 h-5 text-purple-600" /></div>
              <div>
                <p className="text-xs text-gray-500">عمليات الجرد</p>
                <p className="text-xl font-bold text-gray-800">{totals.counts}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50 shrink-0"><RotateCcw className="w-5 h-5 text-orange-600" /></div>
              <div>
                <p className="text-xs text-gray-500">المرتجعات</p>
                <p className="text-xl font-bold text-gray-800">{totals.returns}</p>
              </div>
            </Card>
          </div>

          {/* Branch Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branchStats.map((stat) => (
              <Card key={stat.branch} className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    {stat.branch}
                  </h3>
                  <div className="text-left">
                    <p className="text-xs text-gray-400">الكفاءة العامة</p>
                    <p className={`text-2xl font-bold ${stat.overall >= 75 ? "text-green-600" : stat.overall >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                      {stat.overall}%
                    </p>
                  </div>
                </div>

                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${stat.overall >= 75 ? "bg-green-500" : stat.overall >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                    style={{ width: `${stat.overall}%` }}
                  />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">المهام المكتملة</span>
                    <span className="font-medium">{stat.completedTasks}/{stat.tasks} ({stat.taskRate}%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">الطلبات المسلّمة</span>
                    <span className="font-medium">{stat.completedOrders}/{stat.orders} ({stat.orderRate}%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">عمليات الجرد المكتملة</span>
                    <span className="font-medium">{stat.completedCounts}/{stat.counts} ({stat.countRate}%)</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-gray-500">المرتجعات المعالجة</span>
                    <span className="font-medium">{stat.processedReturns}/{stat.returns} ({stat.returnRate}%)</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
