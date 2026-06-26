import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import useToast from "./hooks/useToast";
import Toast from "./components/UI/Toast";
import AdminLogin from "./components/Auth/AdminLogin";
import AdminSidebar from "./components/Layout/AdminSidebar";
import AdminTopbar from "./components/Layout/AdminTopbar";
import styles from "./App.module.css";

const AdminDashboard = lazy(() => import("./pages/Dashboard/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/Users/UserManagement"));
const MerchantManagement = lazy(() => import("./pages/Merchants/MerchantManagement"));
const AppModeration = lazy(() => import("./pages/Apps/AppModeration"));
const ReportsQueue = lazy(() => import("./pages/Reports/ReportsQueue"));
const RevenueDashboard = lazy(() => import("./pages/Revenue/RevenueDashboard"));
const WaitlistManagement = lazy(() => import("./pages/Waitlist/WaitlistManagement"));
const AdminSettings = lazy(() => import("./pages/Settings/AdminSettings"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound"));

const PAGE_ROUTES = ["dashboard", "users", "merchants", "apps", "reports", "revenue", "waitlist", "settings"];

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

  const setPage = (name) => {
    setPageState(name);
    navigate("/" + name, { replace: true });
  };

  useEffect(() => {
    const path = location.pathname.replace(/^\//, "") || "dashboard";
    if (path === page) return;

    if (!admin && path !== "login") {
      setPageState("login");
      return;
    }

    if (admin && path === "login") {
      setPageState("dashboard");
      navigate("/dashboard", { replace: true });
      return;
    }

    setPageState(PAGE_ROUTES.includes(path) ? path : "404");
  }, [location.pathname, admin]);

  const handleLogin = (data) => {
    login(data);
    showToast("Authenticated successfully", "success");
    navigate("/dashboard", { replace: true });
  };

  if (page === "login" || !admin) {
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
      <AdminSidebar page={page} setPage={setPage} admin={admin} showToast={showToast} />
      <div className={styles.mainArea}>
        <AdminTopbar page={page} showToast={showToast} setPage={setPage} />
        <main className={styles.content}>
          <Suspense fallback={<Loading />}>
            {page === "dashboard" && <AdminDashboard setPage={setPage} showToast={showToast} />}
            {page === "users" && <UserManagement showToast={showToast} />}
            {page === "merchants" && <MerchantManagement showToast={showToast} />}
            {page === "apps" && <AppModeration showToast={showToast} />}
            {page === "reports" && <ReportsQueue showToast={showToast} />}
            {page === "revenue" && <RevenueDashboard showToast={showToast} />}
            {page === "waitlist" && <WaitlistManagement showToast={showToast} />}
            {page === "settings" && <AdminSettings showToast={showToast} />}
            {page === "404" && <NotFound setPage={setPage} />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
