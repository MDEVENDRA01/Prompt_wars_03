import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url');

let supabaseClientInstance = null;

if (isSupabaseConfigured) {
  try {
    supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

// Browser Mock Implementation of Supabase using localStorage
const createMockSupabaseClient = () => {
  const isBrowser = typeof window !== 'undefined';

  const getStorageItem = (key) => {
    if (!isBrowser) return null;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  };

  const setStorageItem = (key, val) => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('Error writing mock storage:', e);
    }
  };

  const getSessionUser = () => {
    return getStorageItem('ecomind_session_user');
  };

  const authCallbacks = new Set();

  const triggerAuthChange = (event, session) => {
    authCallbacks.forEach(cb => {
      try {
        cb(event, session);
      } catch (err) {
        console.error('Auth change callback error:', err);
      }
    });
  };

  return {
    isMock: true,
    auth: {
      signUp: async ({ email, password, options }) => {
        if (!isBrowser) return { data: null, error: new Error('Not running in browser') };

        const users = getStorageItem('ecomind_users') || [];
        if (users.some(u => u.email === email)) {
          return { data: null, error: { message: 'User already exists.' } };
        }

        const name = options?.data?.name || email.split('@')[0];
        const newUser = {
          id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
          email,
          password, // Mock testing only
          name,
          created_at: new Date().toISOString()
        };

        users.push(newUser);
        setStorageItem('ecomind_users', users);

        const session = { user: { id: newUser.id, email: newUser.email, user_metadata: { name } } };
        setStorageItem('ecomind_session_user', session.user);
        triggerAuthChange('SIGNED_IN', session);

        return { data: session, error: null };
      },

      signInWithPassword: async ({ email, password }) => {
        if (!isBrowser) return { data: null, error: new Error('Not running in browser') };

        const users = getStorageItem('ecomind_users') || [];
        const user = users.find(u => u.email === email);

        if (!user || user.password !== password) {
          return { data: null, error: { message: 'Invalid login credentials.' } };
        }

        const session = { user: { id: user.id, email: user.email, user_metadata: { name: user.name } } };
        setStorageItem('ecomind_session_user', session.user);
        triggerAuthChange('SIGNED_IN', session);

        return { data: session, error: null };
      },

      signOut: async () => {
        if (isBrowser) {
          localStorage.removeItem('ecomind_session_user');
        }
        triggerAuthChange('SIGNED_OUT', null);
        return { error: null };
      },

      getUser: async () => {
        const user = getSessionUser();
        if (!user) return { data: { user: null }, error: null };
        return { data: { user }, error: null };
      },

      onAuthStateChange: (callback) => {
        authCallbacks.add(callback);
        const user = getSessionUser();
        const session = user ? { user } : null;
        callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', session);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authCallbacks.delete(callback);
              }
            }
          }
        };
      }
    },

    from: (tableName) => {
      let data = [];
      if (isBrowser) {
        if (tableName === 'users') {
          data = getStorageItem('ecomind_users') || [];
        } else if (tableName === 'assessments') {
          data = getStorageItem('ecomind_assessments') || [];
        }
      }

      let currentQuery = [...data];

      const chain = {
        select: (columns = '*') => {
          // Simplification: return all fields
          return chain;
        },
        eq: (field, value) => {
          currentQuery = currentQuery.filter(item => {
            if (field === 'user_id' && item.user_id) {
              return item.user_id === value;
            }
            return item[field] === value;
          });
          return chain;
        },
        order: (field, { ascending = true } = {}) => {
          currentQuery.sort((a, b) => {
            const valA = a[field];
            const valB = b[field];
            if (valA < valB) return ascending ? -1 : 1;
            if (valA > valB) return ascending ? 1 : -1;
            return 0;
          });
          return chain;
        },
        limit: (n) => {
          currentQuery = currentQuery.slice(0, n);
          return chain;
        },
        insert: async (rows) => {
          if (!isBrowser) return { data: null, error: new Error('Not running in browser') };

          const rowsArray = Array.isArray(rows) ? rows : [rows];
          const assessments = getStorageItem('ecomind_assessments') || [];

          const preparedRows = rowsArray.map(r => ({
            id: Math.random().toString(36).substring(2, 9),
            created_at: new Date().toISOString(),
            ...r
          }));

          assessments.push(...preparedRows);
          setStorageItem('ecomind_assessments', assessments);

          return { data: preparedRows, error: null };
        },
        // For standard promise returns
        then: (resolve, reject) => {
          resolve({ data: currentQuery, error: null });
        }
      };

      return chain;
    }
  };
};

export const supabase = supabaseClientInstance || createMockSupabaseClient();
export const isMockMode = !supabaseClientInstance;
