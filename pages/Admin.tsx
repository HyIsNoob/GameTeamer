import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { loadAdminCatalog } from '../utils/catalogService';
import { CatalogSnapshot } from '../utils/catalogTypes';
import { getFallbackCatalog, useCatalog } from '../contexts/CatalogContext';
import { AdminLogin } from '../components/admin/AdminLogin';
import { AdminShell } from '../components/admin/AdminShell';
import { ActiveRoomsDashboard } from '../components/admin/ActiveRoomsDashboard';
import { ShieldX, Loader2, AlertCircle, LogOut, RefreshCw, Copy, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Known admin emails from config or default site owner
const ADMIN_EMAILS: string[] = [
  'khanghyomni@gmail.com',
  ...(import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean)
];

const Admin: React.FC = () => {
  const { refresh: refreshGlobalCatalog } = useCatalog();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [adminCatalog, setAdminCatalog] = useState<CatalogSnapshot>(getFallbackCatalog());

  // Manual recheck state
  const [isRechecking, setIsRechecking] = useState(false);
  const [recheckMessage, setRecheckMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Background catalog refresh
  const fetchAdminCatalog = useCallback(async () => {
    try {
      const data = await loadAdminCatalog();
      if (isMountedRef.current) {
        setAdminCatalog(data);
      }
      refreshGlobalCatalog().catch(() => {});
    } catch (err) {
      console.warn('Failed to load admin catalog:', err);
    }
  }, [refreshGlobalCatalog]);

  // Instant verification: checks config allowlist, direct query, or RPC
  const verifyAdminStatus = useCallback(async (email?: string): Promise<boolean> => {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();

    // 1. Direct configuration match: if it's the site owner's email, instant pass!
    if (ADMIN_EMAILS.includes(cleanEmail)) {
      return true;
    }

    // 2. Direct allowlist query fallback
    try {
      const { data, error } = await supabase
        .from('game_admin_allowlist')
        .select('email')
        .ilike('email', cleanEmail)
        .limit(1);

      if (!error && data && data.length > 0) {
        return true;
      }
    } catch (err) {
      console.warn('Direct allowlist query fallback:', err);
    }

    // 3. Try RPC check with strict 2-second timeout
    try {
      const rpcPromise = supabase.rpc('is_game_teamer_admin');
      const timeoutPromise = new Promise<{ data: boolean; error: any }>((resolve) =>
        setTimeout(() => resolve({ data: false, error: new Error('RPC timeout') }), 2000)
      );
      const { data: rpcResult } = await Promise.race([rpcPromise, timeoutPromise]);
      if (rpcResult === true) return true;
    } catch (e) {
      console.warn('RPC check error:', e);
    }

    return false;
  }, []);

  // Check auth and admin privileges
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

        const adminPassed = await verifyAdminStatus(session.user.email);

        if (isMountedRef.current) {
          setIsAdmin(adminPassed);
          setCheckingAuth(false);
        }

        if (adminPassed) {
          fetchAdminCatalog();
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
  }, [fetchAdminCatalog, verifyAdminStatus]);

  // Handle manual "Re-check Permission" click with live feedback
  const handleManualRecheck = async () => {
    try {
      setIsRechecking(true);
      setRecheckMessage(null);

      // Timeout-safe session refresh: never hang longer than 2 seconds
      try {
        const refreshPromise = supabase.auth.refreshSession();
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000));
        await Promise.race([refreshPromise, timeoutPromise]);
      } catch (e) {
        console.warn('Session refresh warning:', e);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const currentEmail = session?.user?.email || userEmail;

      if (!session?.user && !userEmail) {
        setRecheckMessage({ type: 'error', text: 'Chưa tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.' });
        return;
      }

      const isPermitted = await verifyAdminStatus(currentEmail);
      console.log('Manual recheck for', currentEmail, '->', isPermitted);

      if (isPermitted) {
        setRecheckMessage({ type: 'success', text: 'Xác nhận quyền Admin thành công! Đang chuyển hướng...' });
        setIsAdmin(true);
        fetchAdminCatalog();
      } else {
        setRecheckMessage({
          type: 'error',
          text: `Chưa tìm thấy email ${currentEmail} trong allowlist. Vui lòng chạy đoạn SQL bên dưới trong Supabase SQL Editor.`
        });
      }
    } catch (err: any) {
      setRecheckMessage({ type: 'error', text: err.message || 'Lỗi khi kiểm tra quyền.' });
    } finally {
      setIsRechecking(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // Safety timeout: never stay in checkingAuth for > 4 seconds
    const safetyTimer = setTimeout(() => {
      if (isMountedRef.current) {
        setCheckingAuth(false);
      }
    }, 4000);

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMountedRef.current) return;

      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email);
        const adminPassed = await verifyAdminStatus(session.user.email);
        if (isMountedRef.current) {
          setIsAdmin(adminPassed);
          setCheckingAuth(false);
        }
        if (adminPassed) {
          fetchAdminCatalog();
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
  }, [checkAuth, fetchAdminCatalog, verifyAdminStatus]);

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
    const targetEmail = userEmail || 'khanghyomni@gmail.com';
    const grantSql = `-- 1. Add email to allowlist\ninsert into public.game_admin_allowlist (email)\nvalues ('${targetEmail}')\non conflict (email) do nothing;\n\n-- 2. Ensure allowlist readable by authenticated users\nalter table public.game_admin_allowlist enable row level security;\ndrop policy if exists "Allow authenticated read game_admin_allowlist" on public.game_admin_allowlist;\ncreate policy "Allow authenticated read game_admin_allowlist"\n  on public.game_admin_allowlist for select\n  to authenticated\n  using (true);\n\n-- 3. Update admin check function to reliably check both auth.users and auth.jwt\ncreate or replace function public.is_game_teamer_admin()\nreturns boolean\nlanguage plpgsql\nsecurity definer\nset search_path = public, auth, pg_catalog\nas $$\ndeclare\n  curr_email text;\nbegin\n  begin\n    curr_email := lower(nullif(auth.jwt() ->> 'email', ''));\n  exception when others then\n    curr_email := null;\n  end;\n\n  if curr_email is null and auth.uid() is not null then\n    select lower(email) into curr_email from auth.users where id = auth.uid();\n  end if;\n\n  if curr_email is null then\n    return false;\n  end if;\n\n  return exists (\n    select 1 from public.game_admin_allowlist\n    where lower(trim(email)) = lower(trim(curr_email))\n  );\nend;\n$$;\n\ngrant execute on function public.is_game_teamer_admin() to anon, authenticated;`;

    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto">
            <ShieldX className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black uppercase text-white tracking-tight">Access Denied</h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            The account <strong className="text-white font-mono">{userEmail}</strong> is authenticated, but is not authorized in the server allowlist (<code className="text-red-400">game_admin_allowlist</code>).
          </p>

          {/* Feedback Notice */}
          <AnimatePresence>
            {recheckMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-3.5 rounded-xl text-xs font-bold flex items-start gap-2.5 text-left ${
                  recheckMessage.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}
              >
                {recheckMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <span>{recheckMessage.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick SQL Helper */}
          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-neutral-400 tracking-wider">
                Run this in Supabase SQL Editor:
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(grantSql);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1 rounded-md transition-colors"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="text-[11px] font-mono text-red-300 bg-neutral-900 p-3 rounded-xl overflow-x-auto select-all border border-neutral-800/80 leading-relaxed max-h-48 whitespace-pre">
              {grantSql}
            </pre>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleManualRecheck}
              disabled={isRechecking}
              className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-all disabled:opacity-50"
            >
              {isRechecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking Database...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Re-check Permission</span>
                </>
              )}
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                checkAuth();
              }}
              className="py-3 px-5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
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
