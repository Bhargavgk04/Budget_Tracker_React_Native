import { useAuth as useAuthContext } from '@/context/AuthContext';

// Re-export the useAuth hook for cleaner imports
export const useAuth = useAuthContext;
export default useAuthContext;