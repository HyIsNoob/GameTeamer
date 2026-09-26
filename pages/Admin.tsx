import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { loadAdminCatalog } from '../utils/catalogService';
import { CatalogSnapshot } from '../utils/catalogTypes';
import { getFallbackCatalog, useCatalog } from '../contexts/CatalogContext';
import { AdminLogin } from '../components/admin/AdminLogin';
import { AdminShell } from '../components/admin/AdminShell';
import { ActiveRoomsDashboard } from '../components/admin/ActiveRoomsDashboard';
import { ShieldX, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const Admin: React.FC = () => {
  const { refresh: refreshGlobalCatalog } = useCatalog();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [adminCatalog, setAdminCatalog] = useState<CatalogSnapshot>(getFallbackCatalog());

  // Prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Background catalog refresh
  const fetchAdminCatalog = useCallback(async () => {
    try {
      const data = await loadAdminCatalog();
      if (isMountedRef.current) {
        setAdminCatalog(data);
      }
      // Silently refresh global catalog without blocking
      refreshGlobalCatalog().catch(() => {});
    } catch (err) {
      console.warn('Failed to load admin catalog:', err);
    }
  }, [refreshGlobalCatalog]);

  // Check auth and admin privileges without blocking the screen
  const checkAuth = useCallback(async () => {
    if (!isSupabaseConfigured) {
      if (isMountedRef.current) setCheckingAuth(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMountedRef.current) return;

      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email);

        // Check admin role with a 4-second timeout race
        try {
          const rpcPromise = supabase.rpc('is_game_teamer_admin');
          const timeoutPromise = new Promise<{ data: boolean; error: any }>((resolve) =>
            setTimeout(() => resolve({ data: false, error: new Error('RPC timeout') }), 4000)
          );
          const { data: adminRpc } = await Promise.race([rpcPromise, timeoutPromise]);
          const adminPassed = Boolean(adminRpc);

          if (isMountedRef.current) {
            setIsAdmin(adminPassed);
            setCheckingAuth(false); // Unblock screen immediately!
          }

          if (adminPassed) {
            fetchAdminCatalog();
          }
        } catch (rpcErr) {
          console.warn('Admin check error:', rpcErr);
          if (isMountedRef.current) {
            setIsAdmin(false);
            setCheckingAuth(false);
          }
        }
      } else {
        if (isMountedRef.current) {
          setIsAuthenticated(false);
          setIsAdmin(false);
          setUserEmail(undefined);
          setCheckingAuth(false);
        }
      }
    } catch (err) {
      console.error('Auth verification error:', err);
      if (isMountedRef.current) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setCheckingAuth(false);
      }
    }
  }, [fetchAdminCatalog]);

  useEffect(() => {
    isMountedRef.current = true;

    // Safety timeout: never stay in checkingAuth for > 5 seconds under any circumstance
    const safetyTimer = setTimeout(() => {
      if (isMountedRef.current) {
        setCheckingAuth(false);
      }
    }, 5000);

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMountedRef.current) return;

      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email);
        try {
          const { data } = await supabase.rpc('is_game_teamer_admin');
          if (isMountedRef.current) {
            setIsAdmin(Boolean(data));
            setCheckingAuth(false);
          }
          if (data) {
            fetchAdminCatalog();
          }
        } catch {
          if (isMountedRef.current) {
            setIsAdmin(false);
            setCheckingAuth(false);
          }
        }
      } else {
        if (isMountedRef.current) {
          setIsAuthenticated(false);
          setIsAdmin(false);
          setUserEmail(undefined);
          setCheckingAuth(false);
        }
      }
    });

    return () => {
      isMountedRef.current = false;
      clearTimeout(safetyTimer);
      authListener.subscription.unsubscribe();
    };
  }, [checkAuth, fetchAdminCatalog]);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black uppercase text-white tracking-wide">Supabase Not Configured</h1>
          <p className="text-xs text-neutral-400">
            Please configure <code className="text-red-400">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-red-400">VITE_SUPABASE_PUBLISHABLE_KEY</code> in <code className="text-neutral-300">.env.local</code> to access the admin portal.
          </p>
        </div>
      </div>
    );
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <p className="text-xs uppercase font-mono tracking-widest text-neutral-500">Checking credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onSuccess={checkAuth} />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto">
            <ShieldX className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black uppercase text-white tracking-tight">Access Denied</h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            The account <strong className="text-white font-mono">{userEmail}</strong> is authenticated, but is not authorized in the server allowlist (<code className="text-red-400">game_admin_allowlist</code>).
          </p>
          <div className="pt-4">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                checkAuth();
              }}
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AdminShell
      catalog={adminCatalog}
      onRefreshCatalog={fetchAdminCatalog}
      onSignOut={checkAuth}
      userEmail={userEmail}
      renderRoomsDashboard={<ActiveRoomsDashboard />}
    />
  );
};

export default Admin;
