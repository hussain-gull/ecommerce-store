import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import DashboardPage from "@/app/dashboard/page.tsx";
import HomeContentPage from "@/app/content/home/page.tsx";
import AboutContentPage from "@/app/content/about/page.tsx";
import ContactContentPage from "@/app/content/contact/page.tsx";
import BlogContentPage from "@/app/content/blog/page.tsx";
import ConditionGuideContentPage from "@/app/content/condition-guide/page.tsx";
import MessagesPage from "@/app/messages/page.tsx";
import ProductsPage from "@/app/products/page.tsx";
import FiltersPage from "@/app/filters/page.tsx";
import OrdersPage from "@/app/orders/page.tsx";
import PaymentPage from "@/app/payment/page.tsx";
import { AdminLoginPage } from "@/components/auth/admin-login-page";
import { Toaster } from "@/components/ui/sonner";
import type { AdminRoute } from "@/lib/routes";
import { useAdminAuthStore } from "@/lib/store/admin-auth.store";

function AuthenticatedRoutes() {
  const navigate = useNavigate();
  const onNavigate = (route: AdminRoute) => navigate(`/${route}`);

  return (
    <Routes>
      <Route
        path="/dashboard"
        element={<DashboardPage onNavigate={onNavigate} />}
      />
      <Route
        path="/content-home"
        element={<HomeContentPage onNavigate={onNavigate} />}
      />
      <Route
        path="/content-about"
        element={<AboutContentPage onNavigate={onNavigate} />}
      />
      <Route
        path="/content-contact"
        element={<ContactContentPage onNavigate={onNavigate} />}
      />
      <Route
        path="/content-blog"
        element={<BlogContentPage onNavigate={onNavigate} />}
      />
      <Route
        path="/content-condition-guide"
        element={<ConditionGuideContentPage onNavigate={onNavigate} />}
      />
      <Route
        path="/messages"
        element={<MessagesPage onNavigate={onNavigate} />}
      />
      <Route
        path="/products"
        element={<ProductsPage onNavigate={onNavigate} />}
      />
      <Route path="/orders" element={<OrdersPage onNavigate={onNavigate} />} />
      <Route
        path="/payment"
        element={<PaymentPage onNavigate={onNavigate} />}
      />
      <Route
        path="/filters"
        element={<FiltersPage onNavigate={onNavigate} />}
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export function App() {
  const user = useAdminAuthStore((s) => s.user);

  if (!user) {
    return (
      <>
        <AdminLoginPage />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <AuthenticatedRoutes />
      <Toaster />
    </>
  );
}

export default App;
