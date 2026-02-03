import { BrowserRouter, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { SignedIn, SignedOut, RedirectToSignIn, UserButton, useUser } from '@clerk/clerk-react';
import Entries from './pages/Entries';
import DashboardPage from './pages/Dashboard';
import ProfitLossReport from './pages/ProfitLossReport';
import BalanceSheetReport from './pages/BalanceSheetReport';
import SignInPage from './pages/SignIn';
import SignUpPage from './pages/SignUp';

import { FileText, BarChart3, Scale, LogIn, AlertCircle, Menu, X, LayoutDashboard } from 'lucide-react';

function AppContent() {
  const { isSignedIn, isLoaded } = useUser();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Check if we are on an authentication page
  // Check if we are on an authentication page
  const isAuthPage = ['/sign-in', '/sign-up'].some(path => location.pathname.startsWith(path));

  return (
    <div className="min-h-screen flex flex-col">

      {/* Header - Hidden on Auth Pages */}
      {!isAuthPage && (
        <header className="bg-surface/95 border-b border-border sticky top-0 z-20 backdrop-blur">
          <div className="w-full px-0 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 px-4">
                <button
                  type="button"
                  className="md:hidden p-2 rounded-md border border-border text-text-secondary hover:text-primary hover:bg-surface-highlight transition-colors"
                  onClick={() => setMobileOpen(prev => !prev)}
                  aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                >
                  {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
                <Link to="/" className="hover:opacity-80 transition-opacity">
                  <h1 className="text-xl sm:text-2xl font-bold text-primary">Accounts Manager</h1>
                </Link>
              </div>

              <div className="flex items-center gap-3 px-4">
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
                <SignedOut>
                  <Link
                    to="/sign-in"
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

      {/* Main Content */}
      <main className={`flex-grow ${isAuthPage ? '' : ''}`}>
        <div className={isAuthPage ? '' : 'w-full'}>
          <div className={isAuthPage ? '' : 'flex'}>
            {!isAuthPage && (
              <aside className="hidden md:flex md:w-52 lg:w-60 xl:w-64 flex-col border-r border-border bg-surface px-4 py-6 md:sticky md:top-[64px] md:h-[calc(100vh-64px)] md:overflow-y-auto">
                <div className="flex items-center gap-3 px-2 pb-5 border-b border-border">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    AR
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Workspace</p>
                    <p className="text-xs text-text-secondary">Main Ledger</p>
                  </div>
                </div>
                <div className="pt-5">
                  <p className="px-2 text-[11px] uppercase tracking-[0.2em] text-text-secondary">Navigation</p>
                  <nav className="mt-3 space-y-1.5">
                    <NavLink
                      to="/"
                      end
                      className={({ isActive }) =>
                        `group flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                        }`
                      }
                    >
                      <LayoutDashboard size={16} className="opacity-80 group-hover:opacity-100" />
                      Dashboard
                    </NavLink>
                    <NavLink
                      to="/entries"
                      end
                      className={({ isActive }) =>
                        `group flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                        }`
                      }
                    >
                      <FileText size={16} className="opacity-80 group-hover:opacity-100" />
                      Entries
                    </NavLink>
                    <NavLink
                      to="/profit-loss"
                      className={({ isActive }) =>
                        `group flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                        }`
                      }
                    >
                      <BarChart3 size={16} className="opacity-80 group-hover:opacity-100" />
                      P&L
                    </NavLink>
                    <NavLink
                      to="/balance-sheet"
                      className={({ isActive }) =>
                        `group flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                        }`
                      }
                    >
                      <Scale size={16} className="opacity-80 group-hover:opacity-100" />
                      Balance Sheet
                    </NavLink>
                  </nav>
                </div>
                <div className="mt-auto pt-6 text-xs text-text-secondary">
                  <div className="px-2 py-3 rounded-lg bg-surface-highlight border border-border">
                    Ledger synced locally
                  </div>
                </div>
              </aside>
            )}

            {/* Mobile Sidebar Drawer */}
            {!isAuthPage && mobileOpen && (
              <div className="md:hidden fixed inset-0 z-30">
                <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
                <aside className="absolute left-0 top-0 h-full w-72 bg-surface border-r border-border px-4 py-6 shadow-xl overflow-y-auto">
                  <div className="flex items-center gap-3 pb-5 border-b border-border">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      AR
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Workspace</p>
                      <p className="text-xs text-text-secondary">Main Ledger</p>
                    </div>
                  </div>
                  <div className="pt-5">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-text-secondary">Navigation</p>
                  </div>
                  <nav className="mt-3 space-y-1.5">
                    <NavLink
                      to="/"
                      end
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `group flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                        }`
                      }
                    >
                      <LayoutDashboard size={16} className="opacity-80 group-hover:opacity-100" />
                      Dashboard
                    </NavLink>
                    <NavLink
                      to="/entries"
                      end
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `group flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                        }`
                      }
                    >
                      <FileText size={16} className="opacity-80 group-hover:opacity-100" />
                      Entries
                    </NavLink>
                    <NavLink
                      to="/profit-loss"
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `group flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                        }`
                      }
                    >
                      <BarChart3 size={16} className="opacity-80 group-hover:opacity-100" />
                      P&L
                    </NavLink>
                    <NavLink
                      to="/balance-sheet"
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `group flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                        }`
                      }
                    >
                      <Scale size={16} className="opacity-80 group-hover:opacity-100" />
                      Balance Sheet
                    </NavLink>
                  </nav>
                  <div className="mt-6 text-xs text-text-secondary">
                    <div className="px-3 py-3 rounded-lg bg-surface-highlight border border-border">
                      Ledger synced locally
                    </div>
                  </div>
                </aside>
              </div>
            )}

            <div className={isAuthPage ? '' : 'flex-1 min-w-0 p-4 md:p-6 lg:p-8'}>
              <div className={isAuthPage ? '' : 'max-w-6xl mx-auto w-full'}>
                <Routes>
                  {/* Public/Auth Routes */}
                  <Route path="/sign-in/*" element={<SignInPage />} />
                  <Route path="/sign-up/*" element={<SignUpPage />} />

                  {/* Application Routes - Accessible by both Guests and Authenticated Users */}
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/entries" element={<Entries />} />
                  <Route path="/profit-loss" element={<ProfitLossReport />} />
                  <Route path="/balance-sheet" element={<BalanceSheetReport />} />
                </Routes>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Guest Mode Banner - Moved to Bottom, Hidden on Auth Pages */}
      {!isAuthPage && isLoaded && !isSignedIn && (
        <div className="bg-primary/10 border-t border-primary/20 py-3 px-4 shadow-sm mt-auto">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-primary font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>You are in <strong>Guest Mode</strong>. Data is stored temporarily in this session.</span>
            </div>
            <Link to="/sign-in" className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-md hover:bg-primary-dark transition-colors">
              <LogIn size={14} />
              Sign In to Save
            </Link>
          </div>
        </div>
      )}

      {/* Footer - Hidden on Auth Pages */}
      {!isAuthPage && (
        <footer className="bg-surface border-t border-border py-4 text-center text-xs text-text-secondary">
          Accounting Reports App • {isLoaded && !isSignedIn ? 'Guest Mode' : 'Real-time Updates'}
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
