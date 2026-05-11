// AdminLayout — layout guarda-chuva das rotas /admin/*.
// Espelhado do lemehubapp-main: sidebar desktop + Outlet + bottom nav mobile.
// O guard (StaffOnly) já é aplicado pelo wrapper no App.tsx.

import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminBottomNav } from "./AdminBottomNav";
import { PageLoader } from "@/components/PageLoader";

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-background flex w-full">
      <AdminSidebar />
      <main className="flex-1 min-h-screen min-w-0 overflow-x-hidden pb-20 md:pb-0">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <AdminBottomNav />
    </div>
  );
}

export default AdminLayout;
