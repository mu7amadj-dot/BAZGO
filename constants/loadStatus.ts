export const STATUS_LABELS: Record<string, string> = {
  available: 'متاحة', negotiating: 'قيد التفاوض', expired: 'انتهى التفاوض', open: 'متاحة', applications: 'وصلت طلبات',
  selected: 'تم اختيار سائق', confirmed: 'مؤكد', in_transit: 'قيد النقل', delivered: 'تم التسليم', completed: 'مكتمل', cancelled: 'ملغي',
};
export const STATUS_COLORS: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
  available: 'success', negotiating: 'warning', expired: 'danger', open: 'info', applications: 'warning', selected: 'warning',
  confirmed: 'info', in_transit: 'warning', delivered: 'success', completed: 'success', cancelled: 'danger',
};
