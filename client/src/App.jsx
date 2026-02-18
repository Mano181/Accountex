import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  FileBarChart2,
  Boxes,
  LogIn,
  AlertCircle,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import DashboardPage from './pages/Dashboard';
import SalesPage from './pages/Sales';
import PurchasePage from './pages/Purchase';
import ReportsPage from './pages/Reports';
import InventoryPage from './pages/Inventory';
import ProfitLossReport from './pages/ProfitLossReport';
import BalanceSheetReport from './pages/BalanceSheetReport';
import TransactionsReportPage from './pages/TransactionsReport';
import SignInPage from './pages/SignIn';
import SignUpPage from './pages/SignUp';
import { ROUTES, SIDEBAR_NAV_MODULES } from './lib/routes';

const NAV_ICON_MAP = {
  home: LayoutDashboard,
  sales: ShoppingCart,
  purchase: ShoppingBag,
  reports: FileBarChart2,
  inventory: Boxes
};

const getTargetHash = (hash) => (hash ? `#${hash}` : '');

const getHref = (item) => `${item.path}${getTargetHash(item.hash)}`;

const isChildActive = (item, pathname, hash) => {
  if (pathname !== item.path) return false;
  if (item.hash) {
    if (!hash && item.defaultOnBase) {
      return true;
    }
    return hash === getTargetHash(item.hash);
  }
  return true;
};

const isModuleActive = (module, pathname, hash) => {
  if (!module.children?.length) {
    return pathname === module.path;
  }

  if (module.children.some((item) => isChildActive(item, pathname, hash))) {
    return true;
  }

  if (pathname === module.basePath || pathname.startsWith(`${module.basePath}/`)) {
    return true;
  }

  return false;
};

const createInitialCollapsedState = () => {
  const state = {};
  SIDEBAR_NAV_MODULES.forEach((module) => {
    if (module.children?.length) {
      state[module.key] = false;
    }
  });
  return state;
};

function SidebarNavigation({ pathname, hash, onNavigate }) {
  const [collapsedModules, setCollapsedModules] = useState(createInitialCollapsedState);

  const activeMap = useMemo(() => {
    const map = {};
    SIDEBAR_NAV_MODULES.forEach((module) => {
      map[module.key] = isModuleActive(module, pathname, hash);
    });
    return map;
  }, [pathname, hash]);

  return (
    <nav className="space-y-1.5" aria-label="Main navigation">
      {SIDEBAR_NAV_MODULES.map((module) => {
        const Icon = NAV_ICON_MAP[module.icon];
        const moduleIsActive = activeMap[module.key];
        const hasChildren = Boolean(module.children?.length);
        const expanded = hasChildren ? (moduleIsActive || !collapsedModules[module.key]) : false;

        if (!hasChildren) {
          return (
            <Link
              key={module.key}
              to={module.path}
              onClick={onNavigate}
              className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                moduleIsActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
              }`}
            >
              <Icon size={16} className="opacity-90" />
              <span>{module.label}</span>
            </Link>
          );
        }

        return (
          <div key={module.key} className="rounded-lg">
            <button
              type="button"
              onClick={() =>
                setCollapsedModules((prev) => ({ ...prev, [module.key]: moduleIsActive ? false : !prev[module.key] }))
              }
              className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                moduleIsActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
              }`}
              aria-expanded={expanded}
              aria-controls={`${module.key}-submenu`}
            >
              <span className="flex items-center gap-2">
                <Icon size={16} className="opacity-90" />
                <span>{module.label}</span>
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </button>

            {expanded && (
              <div id={`${module.key}-submenu`} className="mt-1 space-y-1 pb-1 pl-5">
                {module.children.map((item) => {
                  const active = isChildActive(item, pathname, hash);
                  return (
                    <Link
                      key={item.key}
                      to={getHref(item)}
                      onClick={onNavigate}
                      className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                        active
                          ? 'bg-primary text-white'
                          : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function SidebarShell({ pathname, hash, mobile = false, onNavigate }) {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-2 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
          AR
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">Workspace</p>
          <p className="text-xs text-text-secondary">Main Ledger</p>
        </div>
      </div>

      <div className="pt-5">
        <p className="px-2 text-[11px] uppercase tracking-[0.2em] text-text-secondary">Navigation</p>
        <div className="mt-3">
          <SidebarNavigation
            pathname={pathname}
            hash={hash}
            onNavigate={mobile ? onNavigate : undefined}
          />
        </div>
      </div>
    </>
  );
}

function AppContent() {
  const { isSignedIn, isLoaded } = useUser();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthPage = [ROUTES.SIGN_IN, ROUTES.SIGN_UP].some((path) => location.pathname.startsWith(path));

  const closeMobileNav = () => setMobileOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      {!isAuthPage && (
        <header className="bg-surface/95 border-b border-border sticky top-0 z-20 backdrop-blur">
          <div className="w-full px-0 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 pl-4">
                <button
                  type="button"
                  className="md:hidden p-2 rounded-md border border-border text-text-secondary hover:text-primary hover:bg-surface-highlight transition-colors"
                  onClick={() => setMobileOpen((prev) => !prev)}
                  aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-navigation"
                >
                  {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
                <Link to={ROUTES.HOME} className="hover:opacity-80 transition-opacity">
                  <h1 className="text-xl sm:text-2xl font-bold text-primary">Accounts Manager</h1>
                </Link>
              </div>
              <div className="flex items-center gap-3 pr-4">
                <SignedIn>
                  <UserButton afterSignOutUrl={ROUTES.HOME} />
                </SignedIn>
                <SignedOut>
                  <Link
                    to={ROUTES.SIGN_IN}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:text-primary hover:border-primary/40 hover:bg-surface-highlight transition-colors"
                    title="Sign In"
                  >
                    <LogIn size={16} />
                    Sign In
                  </Link>
                </SignedOut>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="flex-grow">
        <div className={isAuthPage ? '' : 'w-full'}>
          <div className={isAuthPage ? '' : 'flex'}>
            {!isAuthPage && (
              <aside className="hidden md:flex md:w-56 lg:w-64 xl:w-72 flex-col border-r border-border bg-surface px-4 py-6 md:sticky md:top-[64px] md:h-[calc(100vh-64px)] md:overflow-y-auto">
                <SidebarShell pathname={location.pathname} hash={location.hash} />
              </aside>
            )}

            {!isAuthPage && mobileOpen && (
              <div id="mobile-navigation" className="md:hidden fixed inset-0 z-30">
                <div className="absolute inset-0 bg-black/40" onClick={closeMobileNav} />
                <aside className="absolute left-0 top-0 h-full w-[88vw] max-w-80 bg-surface border-r border-border px-4 py-6 shadow-xl overflow-y-auto">
                  <SidebarShell
                    pathname={location.pathname}
                    hash={location.hash}
                    mobile
                    onNavigate={closeMobileNav}
                  />
                </aside>
              </div>
            )}

            <div className={isAuthPage ? '' : 'flex-1 min-w-0 p-4 md:p-6 lg:p-8'}>
              <div className={isAuthPage ? '' : 'max-w-6xl mx-auto w-full'}>
                <Routes>
                  <Route path={`${ROUTES.SIGN_IN}/*`} element={<SignInPage />} />
                  <Route path={`${ROUTES.SIGN_UP}/*`} element={<SignUpPage />} />
                  <Route path={ROUTES.HOME} element={<DashboardPage />} />
                  <Route path={`${ROUTES.SALES}/*`} element={<SalesPage />} />
                  <Route path={ROUTES.PURCHASE} element={<PurchasePage />} />
                  <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
                  <Route path={ROUTES.REPORTS_PROFIT_LOSS} element={<ProfitLossReport />} />
                  <Route path={ROUTES.REPORTS_BALANCE_SHEET} element={<BalanceSheetReport />} />
                  <Route path={ROUTES.REPORTS_TRANSACTIONS} element={<TransactionsReportPage />} />
                  <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />
                </Routes>
              </div>
            </div>
          </div>
        </div>
      </main>

      {!isAuthPage && isLoaded && !isSignedIn && (
        <div className="bg-primary/10 border-t border-primary/20 py-3 px-4 shadow-sm mt-auto">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-primary font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>You are in <strong>Guest Mode</strong>. Data is stored temporarily in this session.</span>
            </div>
            <Link to={ROUTES.SIGN_IN} className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-md hover:bg-primary-dark transition-colors">
              <LogIn size={14} />
              Sign In to Save
            </Link>
          </div>
        </div>
      )}

      {!isAuthPage && (
        <footer className="bg-surface border-t border-border py-4 text-center text-xs text-text-secondary">
          Accounts Manager {isLoaded && !isSignedIn ? '• Guest Mode' : '• Real-time Updates'}
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
