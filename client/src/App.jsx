import { BrowserRouter, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { SignedIn, SignedOut, RedirectToSignIn, UserButton, useUser } from '@clerk/clerk-react';
import Entries from './pages/Entries';
import ProfitLossReport from './pages/ProfitLossReport';
import BalanceSheetReport from './pages/BalanceSheetReport';
import SignInPage from './pages/SignIn';
import SignUpPage from './pages/SignUp';

import { FileText, BarChart3, Scale, LogIn, AlertCircle, Menu, X } from 'lucide-react';

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
        <header className="bg-surface border-b border-border sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="sm:hidden p-2 rounded-md border border-border text-text-secondary hover:text-primary hover:bg-surface-highlight transition-colors"
                  onClick={() => setMobileOpen(prev => !prev)}
                  aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                >
                  {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
                <Link to="/" className="hover:opacity-80 transition-opacity">
                  <h1 className="text-xl sm:text-2xl font-bold text-primary">Accounting Reports</h1>
                  <p className="hidden sm:block text-sm text-text-secondary">Double Entry System</p>
                </Link>
              </div>

              <div className="flex items-center gap-3">
                {/* Desktop Navigation Tabs */}
                <nav className="hidden sm:flex bg-background rounded-lg p-1 border border-border">
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                      }`
                    }
                  >
                    <FileText size={16} />
                    <span>Entries</span>
                  </NavLink>
                  <NavLink
                    to="/profit-loss"
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                      }`
                    }
                  >
                    <BarChart3 size={16} />
                    <span>P&L</span>
                  </NavLink>
                  <NavLink
                    to="/balance-sheet"
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                      }`
                    }
                  >
                    <Scale size={16} />
                    <span>Balance Sheet</span>
                  </NavLink>
                </nav>

                {/* User Action */}
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
                <SignedOut>
                  <Link to="/sign-in" className="p-2 text-text-secondary hover:text-primary transition-colors" title="Sign In">
                    <LogIn size={20} />
                  </Link>
                </SignedOut>
              </div>
            </div>
          </div>

          {/* Mobile Nav Drawer */}
          {mobileOpen && (
            <div className="sm:hidden border-t border-border bg-surface">
              <nav className="px-4 py-3 space-y-2">
                <NavLink
                  to="/"
                  end
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                    }`
                  }
                >
                  <FileText size={16} />
                  Entries
                </NavLink>
                <NavLink
                  to="/profit-loss"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                    }`
                  }
                >
                  <BarChart3 size={16} />
                  P&L
                </NavLink>
                <NavLink
                  to="/balance-sheet"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                    }`
                  }
                >
                  <Scale size={16} />
                  Balance Sheet
                </NavLink>
              </nav>
            </div>
          )}
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-grow ${isAuthPage ? '' : 'p-4 md:p-8'}`}>
        <div className={isAuthPage ? '' : 'max-w-5xl mx-auto'}>
          <Routes>
            {/* Public/Auth Routes */}
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />

            {/* Application Routes - Accessible by both Guests and Authenticated Users */}
            <Route path="/" element={<Entries />} />
            <Route path="/profit-loss" element={<ProfitLossReport />} />
            <Route path="/balance-sheet" element={<BalanceSheetReport />} />
          </Routes>
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
