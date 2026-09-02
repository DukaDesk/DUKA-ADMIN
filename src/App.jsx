import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import useToast from "./hooks/useToast";
import Toast from "./components/UI/Toast";
import AdminLogin from "./components/Auth/AdminLogin";
import AdminSidebar from "./components/Layout/AdminSidebar";
import AdminTopbar from "./components/Layout/AdminTopbar";
import { canAccessPage, getDefaultPage } from "./services/permissions";
import ErrorBoundary from "./components/UI/ErrorBoundary";
import styles from "./App.module.css";
import { unwrapAuth } from "./utils/unwrapAuth";

const AdminDashboard = lazy(() => import("./pages/Dashboard/AdminDashboard"));
const MerchantManagement = lazy(() => import("./pages/Merchants/MerchantManagement"));
const MarketplaceListings = lazy(() => import("./pages/Marketplace/MarketplaceListings"));
const AuditLog = lazy(() => import("./pages/Audit/AuditLog"));
const SubscriptionManagement = lazy(() => import("./pages/Subscriptions/SubscriptionManagement"));
const Settings = lazy(() => import("./pages/Settings/Settings"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound"));

const PAGE_ROUTES = ["dashboard", "merchants", "marketplace", "audit", "subscriptions", "settings"];

function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "var(--gray-400)", fontSize: 14 }}>
      Loading...
    </div>
  );
}

export default function App() {
  const { admin, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toasts, showToast, dismissToast } = useToast();

  const [page, setPageState] = useState(() => {
    if (!admin) return "login";
    const path = location.pathname.replace(/^\//, "") || "dashboard";
    return PAGE_ROUTES.includes(path) ? path : "404";
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const setPage = (name) => {
    if (!canAccessPage(admin, name)) {
      showToast("You do not have permission to open that section", "error");
      return;
    }
    setPageState(name);
    setSidebarOpen(false);
    navigate("/" + name, { replace: true });
  };

  const closeSidebar = () => setSidebarOpen(false);

useEffect(() => {
    const path = location.pathname.replace(/^\//, "") || "dashboard";
    if (path === page) return;

    let persisted = null;
    try {
      const raw = localStorage.getItem("dukadesk_admin");
      persisted = raw ? JSON.parse(raw) : null;
    } catch {
      persisted = null;
    }
    const hasAdmin = admin || persisted;

    if (!hasAdmin && path !== "login") {
      setPageState("login");
      return;
    }

    if (hasAdmin && path === "login") {
      const target = getDefaultPage(hasAdmin) || "dashboard";
      setPageState(target);
      navigate(`/${target}`, { replace: true });
      return;
    }

    if (PAGE_ROUTES.includes(path) && canAccessPage(hasAdmin, path)) {
      setPageState(path);
      return;
    }

    const fallback = getDefaultPage(hasAdmin);
    if (fallback) {
      setPageState(fallback);
      navigate(`/${fallback}`, { replace: true });
    } else if (hasAdmin) {
      setPageState("dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [location.pathname, admin, page]);

  const handleLogin = (data) => {
    const { token, admin } = unwrapAuth(data);
    const nextAdmin = { ...admin, token };
    login(nextAdmin);
    const nextPage = getDefaultPage(nextAdmin) || "dashboard";
    setPageState(nextPage);
    showToast("Authenticated successfully", "success");
    navigate(`/${nextPage}`, { replace: true });
  };

  if (!admin) {
    return (
      <>
        {toasts.map((t) => <Toast key={t.id} toast={t} onDismiss={dismissToast} />)}
        <AdminLogin onLogin={handleLogin} showToast={showToast} />
      </>
    );
  }

return (
    <div className={styles.layout}>
      {toasts.map((t) => <Toast key={t.id} toast={t} onDismiss={dismissToast} />)}
      {sidebarOpen && <div className={styles.backdrop} onClick={closeSidebar} />}
      <AdminSidebar page={page} setPage={setPage} admin={admin} showToast={showToast} sidebarOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <div className={styles.mainArea}>
        <AdminTopbar page={page} showToast={showToast} setPage={setPage} onMenuClick={() => setSidebarOpen(true)} />
        <main className={styles.content}>
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              {page === "dashboard" && <AdminDashboard setPage={setPage} showToast={showToast} />}
              {page === "merchants" && <MerchantManagement showToast={showToast} />}
              {page === "marketplace" && <MarketplaceListings />}
              {page === "audit" && <AuditLog />}
              {page === "subscriptions" && <SubscriptionManagement />}
              {page === "settings" && <Settings showToast={showToast} />}
              {page === "404" && <NotFound setPage={setPage} />}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
