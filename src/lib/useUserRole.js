import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useUserRole() {
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const role = user?.role || "viewer";
  const isAdmin = role === "admin";
  const isManager = role === "admin" || role === "manager";
  const isViewer = role === "viewer";
  const deliveryRole = user?.delivery_role || null;
  const isDeliveryRider = deliveryRole === "مندوب";
  const isDeliverySupervisor = deliveryRole === "مشرف";
  const isDeliveryAdmin = deliveryRole === "أدمن";
  const hasDeliveryAccess = isDeliveryRider || isDeliverySupervisor || isDeliveryAdmin || isAdmin;

  return {
    role, isAdmin, isManager, isViewer, user,
    canDeleteInvoice: isAdmin || !!user?.can_delete_invoice,
    canSaveInvoice: isAdmin || role === "manager" || !!user?.can_save_invoice,
    canManageTeam: isAdmin || !!user?.can_manage_team,
    canSetBudget: isAdmin || !!user?.can_set_budget,
    deliveryRole, isDeliveryRider, isDeliverySupervisor, isDeliveryAdmin, hasDeliveryAccess,
  };
}
