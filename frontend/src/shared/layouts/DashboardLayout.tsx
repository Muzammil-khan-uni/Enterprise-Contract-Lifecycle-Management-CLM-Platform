import { useEffect, useRef, useState } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  ListChecks,
  ScrollText,
  Building2,
  Network,
  Handshake,
  FileStack,
  Library,
  Users,
  Menu,
  X,
  LogOut,
  FileSignature,
  RefreshCw,
  ChevronLeft,
} from 'lucide-react';
import { humanizeLabel } from '../lib/display';
import { useSocket } from '../hooks/useSocket';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLoadNotifications } from '../../features/notifications/api/notificationApi';
import { NotificationBell } from '../../features/notifications/components/NotificationBell';
import { EmailVerificationBanner } from '../../features/auth/components/EmailVerificationBanner';
import { useLogout } from '../../features/auth/api/authApi';
import { useAppSelector } from '../hooks/redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Avatar } from '../components/ui/Avatar';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const WORKSPACE_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/contracts', label: 'Contracts', icon: FileText },
  { to: '/approvals', label: 'Approvals', icon: ClipboardCheck },
  { to: '/obligations', label: 'Obligations', icon: ListChecks },
  
  
  
  
  
  
  
  
  
  
  
  { to: '/signatures', label: 'Sign', icon: FileSignature },
  { to: '/renewals', label: 'Renewals', icon: RefreshCw },
];

const ADMIN_ITEMS: NavItem[] = [
  { to: '/audit-logs', label: 'Audit Log', icon: ScrollText },
  { to: '/settings/business-units', label: 'Business Units', icon: Building2 },
  { to: '/settings/departments', label: 'Departments', icon: Network },
  { to: '/settings/vendors', label: 'Vendors', icon: Handshake },
  { to: '/templates', label: 'Templates', icon: FileStack },
  { to: '/templates/clauses', label: 'Clause Library', icon: Library },
];

const SIDEBAR_COLLAPSED_KEY = 'clm-sidebar-collapsed';

const DRAWER_TRANSITION_MS = 320;

function getInitialSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
}

export function DashboardLayout() {
  useSocket();
  useLoadNotifications();

  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector(selectCurrentUser);
  const logout = useLogout();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  
  
  
  
  
  
  
  
  
  
  
  
  const [drawerVisible, setDrawerVisible] = useState(false);

  const openDrawer = () => setDrawerOpen(true);

  const closeDrawer = () => {
    setDrawerVisible(false);
    
    
    
    
    setTimeout(() => setDrawerOpen(false), DRAWER_TRANSITION_MS);
  };

  useEffect(() => {
    if (!drawerOpen) return;
    const raf = requestAnimationFrame(() => setDrawerVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [drawerOpen]);

  
  
  
  
  
  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  
  
  
  
  
  useBodyScrollLock(drawerOpen);

  const drawerPanelRef = useRef<HTMLElement>(null);
  useFocusTrap(drawerPanelRef, drawerOpen);

  const [collapsed, setCollapsed] = useState(getInitialSidebarCollapsed);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  const isLegalOrAdmin = user?.role === 'Admin' || user?.role === 'LegalOfficer';
  const isAdmin = user?.role === 'Admin';

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => navigate('/login', { replace: true }) });
  };

  const navLinkClasses = (isCollapsed: boolean) =>
    ({ isActive }: { isActive: boolean }) =>
      
      
      
      
      
      
      
      
      
      
      `group flex items-center py-2 text-sm font-medium transition-all duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] relative ${
        isCollapsed ? 'px-2.5 gap-0' : 'px-3 gap-3'
      } ${
        isActive
          ? 'bg-ink-800 text-white shadow-[inset_0_0_0_1px_rgba(199,153,82,0.25)]'
          : 'text-slate-300 hover:bg-ink-800/60 hover:text-white'
      }`;

  

  function collapsibleLabelClasses(isCollapsed: boolean, width: 'nav' | 'profile'): string {
    const base = 'overflow-hidden whitespace-nowrap transition-all duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)]';
    if (width === 'profile') {
      return `${base} ${isCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[140px]'}`;
    }
    return `${base} ${isCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[160px]'}`;
  }

  

  function renderSidebarContent(isCollapsed: boolean, showToggle: boolean) {
    const linkClasses = navLinkClasses(isCollapsed);
    return (
      <>
        <div className={`flex items-center justify-between py-5 bg-ink-wash border-b border-black/20 transition-all duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isCollapsed ? 'px-2.5' : 'px-4'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brass-sheen font-display text-sm font-bold text-ink-950 shadow-glow-brass-dark">
              C
            </span>
            <span className={`font-display text-lg font-semibold tracking-tight text-white ${collapsibleLabelClasses(isCollapsed, 'nav')}`}>
              CLM Platform
            </span>
          </div>
          {showToggle && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white transition-colors duration-150"
            >
              <ChevronLeft size={16} className={`transition-transform duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        <nav className={`flex-1 overflow-y-auto pb-4 space-y-6 transition-all duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isCollapsed ? 'px-2 pt-3' : 'px-3'}`}>
          <div className="space-y-1">
            {WORKSPACE_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={linkClasses}
                onClick={closeDrawer}
                title={isCollapsed ? item.label : undefined}
                aria-label={isCollapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className={`absolute top-1.5 bottom-1.5 w-0.5 rounded-full bg-brass-400 transition-all duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isCollapsed ? 'left-0.5' : 'left-0'}`} />
                    )}
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                      <item.icon className="h-4.5 w-4.5" size={18} />
                    </span>
                    <span className={collapsibleLabelClasses(isCollapsed, 'nav')}>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {isLegalOrAdmin && (
            <div className="space-y-1">
              <div className="relative h-5">
                <p
                  className={`absolute inset-0 px-3 flex items-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden transition-opacity duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isCollapsed ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  Administration
                </p>
                <div
                  className={`absolute inset-0 flex items-center px-1 transition-opacity duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isCollapsed ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-ink-800" />
                </div>
              </div>
              {ADMIN_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={linkClasses}
                  onClick={closeDrawer}
                  title={isCollapsed ? item.label : undefined}
                  aria-label={isCollapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className={`absolute top-1.5 bottom-1.5 w-0.5 rounded-full bg-brass-400 transition-all duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isCollapsed ? 'left-0.5' : 'left-0'}`} />
                      )}
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                        <item.icon size={18} />
                      </span>
                      <span className={collapsibleLabelClasses(isCollapsed, 'nav')}>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink
                  to="/settings/users"
                  className={linkClasses}
                  onClick={closeDrawer}
                  title={isCollapsed ? 'Users' : undefined}
                  aria-label={isCollapsed ? 'Users' : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className={`absolute top-1.5 bottom-1.5 w-0.5 rounded-full bg-brass-400 transition-all duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isCollapsed ? 'left-0.5' : 'left-0'}`} />
                      )}
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                        <Users size={18} />
                      </span>
                      <span className={collapsibleLabelClasses(isCollapsed, 'nav')}>Users</span>
                    </>
                  )}
                </NavLink>
              )}
            </div>
          )}
        </nav>

        <div className={`border-t border-ink-800 py-3 transition-all duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {

}
          <div className="flex flex-col gap-1">
            <Link
              to="/profile"
              onClick={closeDrawer}
              title={isCollapsed ? user?.name : undefined}
              className={`group flex items-center min-w-0 rounded-lg transition-all duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-ink-800/60 ${
                isCollapsed ? 'p-1 gap-0' : '-mx-1.5 px-1.5 py-1 gap-2.5'
              }`}
            >
              <Avatar name={user?.name ?? '?'} seed={user?.id} size="sm" photoUrl={user?.avatarUrl} />
              <div className={collapsibleLabelClasses(isCollapsed, 'profile')}>
                <p className="truncate text-sm font-medium text-white">{user?.name}</p>
                <p className="truncate text-xs text-slate-400 group-hover:text-slate-300">{humanizeLabel(user?.role)}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              aria-label="Sign out"
              title={isCollapsed ? 'Sign out' : undefined}
              className={`flex items-center min-w-0 rounded-lg text-slate-400 hover:bg-ink-800 hover:text-white transition-all duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isCollapsed ? 'p-1.5 gap-0' : '-mx-1.5 px-1.5 py-1.5 gap-2.5'
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                <LogOut size={16} />
              </span>
              <span className={`text-sm font-medium ${collapsibleLabelClasses(isCollapsed, 'profile')}`}>Sign out</span>
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-ink-950 transition-colors duration-200">
      {

}
      <aside
        
        
        
        
        
        
        
        
        
        
        style={{ willChange: 'width' }}
        className={`hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:flex-col bg-ink-950 border-r border-black/20 transition-[width] duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          collapsed ? 'lg:w-[68px]' : 'lg:w-64'
        }`}
      >
        {renderSidebarContent(collapsed,  true)}
      </aside>

      {

}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className={`absolute inset-0 bg-ink-950/50 transition-opacity duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              drawerVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <aside
            ref={drawerPanelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            style={{ willChange: 'transform' }}
            className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] flex flex-col bg-ink-950 shadow-ambient-dark transition-transform duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              drawerVisible ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <button
              onClick={closeDrawer}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-md p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            {renderSidebarContent(false,  false)}
          </aside>
        </div>
      )}

      <div
        style={{ willChange: 'padding-left' }}
        className={`flex flex-col min-h-screen transition-[padding] duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? 'lg:pl-[68px]' : 'lg:pl-64'}`}
      >
        <header className="sticky top-0 z-30 glass-surface border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 dark:border-ink-800 transition-colors duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={openDrawer}
              aria-label="Open menu"
              className="lg:hidden rounded-md p-2 -ml-2 text-slate-600 hover:bg-slate-100 transition-colors dark:text-slate-300 dark:hover:bg-white/10"
            >
              <Menu size={20} />
            </button>
            <Link to="/dashboard" className="lg:hidden font-display text-base font-semibold text-ink-950 dark:text-white truncate">
              CLM Platform
            </Link>
            <span className="hidden lg:block text-sm text-slate-400 dark:text-slate-500 truncate">
              {breadcrumbFromPath(location.pathname)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              to="/contracts/new"
              aria-label="New contract"
              title="New contract"
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-white shadow-card transition-all hover:bg-ink-800 hover:shadow-elevated dark:bg-brass-500 dark:text-ink-950 dark:hover:bg-brass-400 dark:hover:shadow-glow-brass-dark"
            >
              <FileSignature size={14} />
              <span className="hidden sm:inline">New contract</span>
            </Link>
            <ThemeToggle />
            <NotificationBell />
            <Link
              to="/profile"
              aria-label="My profile"
              title="My profile"
              className="ml-1 rounded-full transition-transform hover:scale-105"
            >
              <Avatar name={user?.name ?? '?'} seed={user?.id} size="sm" photoUrl={user?.avatarUrl} />
            </Link>
          </div>
        </header>

        <EmailVerificationBanner />

        <main key={location.pathname} className="flex-1 animate-fade-in-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function breadcrumbFromPath(pathname: string): string {
  const segment = pathname.split('/').filter(Boolean)[0] ?? 'dashboard';
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
