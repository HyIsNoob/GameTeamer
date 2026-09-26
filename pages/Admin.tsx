import React, { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { isAdminUser, loadAdminCatalog } from '../utils/catalogService';
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

  const fetchAdminCatalog = useCallback(async () => {
    try {
      const data = await loadAdminCatalog();
      setAdminCatalog(data);
      await refreshGlobalCatalog();
    } catch (err) {
      console.error('Failed to load admin catalog:', err);
    }
  }, [refreshGlobalCatalog]);

  const checkAuth = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setCheckingAuth(false);
      return;
    }

    try {
      setCheckingAuth(true);
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setIsAuthenticated(true);
        setUserEmail(data.session.user.email);
        const adminCheck = await isAdminUser();
        setIsAdmin(adminCheck);
        if (adminCheck) {
          await fetchAdminCatalog();
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUserEmail(undefined);
      }
    } catch (err) {
      console.error('Auth verification error:', err);
      setIsAuthenticated(false);
      setIsAdmin(false);
    } finally {
      setCheckingAuth(false);
    }
  }, [fetchAdminCatalog]);

  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email);
        const adminCheck = await isAdminUser();
        setIsAdmin(adminCheck);
        if (adminCheck) {
          await fetchAdminCatalog();
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUserEmail(undefined);
      }
    });

    return () => {
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
