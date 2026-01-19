import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from '@clerk/clerk-react';
import Entries from './pages/Entries';
import ProfitLossReport from './pages/ProfitLossReport';
import BalanceSheetReport from './pages/BalanceSheetReport';
import SignInPage from './pages/SignIn';
import SignUpPage from './pages/SignUp';

import { FileText, BarChart3, Scale } from 'lucide-react';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">

        {/* Header */}
        <SignedIn>
          <header className="bg-surface border-b border-border sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-4 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-primary">Accounting Reports</h1>
                  <p className="text-sm text-text-secondary">Double Entry System</p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Navigation Tabs */}
                  <nav className="flex bg-background rounded-lg p-1 border border-border">
                    <NavLink
                      to="/"
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                        }`
                      }
                    >
                      <FileText size={16} />
                      <span className="hidden sm:inline">Entries</span>
                    </NavLink>
                    <NavLink
                      to="/profit-loss"
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                        }`
                      }
                    >
                      <BarChart3 size={16} />
                      <span className="hidden sm:inline">P&L</span>
                    </NavLink>
                    <NavLink
                      to="/balance-sheet"
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                        }`
                      }
                    >
                      <Scale size={16} />
                      <span className="hidden sm:inline">Balance Sheet</span>
                    </NavLink>
                  </nav>

                  {/* User Button */}
                  <UserButton afterSignOutUrl="/sign-in" />
                </div>
              </div>
            </div>
          </header>
        </SignedIn>

        {/* Main Content */}
        <main className="flex-grow p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <Routes>
              {/* Public Routes */}
              <Route path="/sign-in/*" element={<SignInPage />} />
              <Route path="/sign-up/*" element={<SignUpPage />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <>
                    <SignedIn>
                      <Entries />
                    </SignedIn>
                    <SignedOut>
                      <RedirectToSignIn />
                    </SignedOut>
                  </>
                }
              />
              <Route
                path="/profit-loss"
                element={
                  <>
                    <SignedIn>
                      <ProfitLossReport />
                    </SignedIn>
                    <SignedOut>
                      <RedirectToSignIn />
                    </SignedOut>
                  </>
                }
              />
              <Route
                path="/balance-sheet"
                element={
                  <>
                    <SignedIn>
                      <BalanceSheetReport />
                    </SignedIn>
                    <SignedOut>
                      <RedirectToSignIn />
                    </SignedOut>
                  </>
                }
              />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <SignedIn>
          <footer className="bg-surface border-t border-border py-4 text-center text-xs text-text-secondary">
            Accounting Reports App • Real-time Updates
          </footer>
        </SignedIn>
      </div>
    </BrowserRouter>
  );
}

export default App;
