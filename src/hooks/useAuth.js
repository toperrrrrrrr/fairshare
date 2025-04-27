import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Custom hook to access auth context
export const useAuth = () => useContext(AuthContext);
