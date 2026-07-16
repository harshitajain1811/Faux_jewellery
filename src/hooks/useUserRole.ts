import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useUserRole(userId: string | null) {
  const isMounted = useRef(true);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (error?.code === 'PGRST116') {
          // profile row does not exist yet → treat as a brand‑new customer
          setRole('customer');
        } else if (error) {
          throw error;
        } else {
          setRole(data?.role ?? 'customer');
        }
      } catch (err) {
        console.error('⚠️ role fetch error', err);
        setRole('customer'); // safest fallback
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    fetchRole();

    return () => {
      isMounted.current = false;
    };
  }, [userId]);

  return { role, loading };
}