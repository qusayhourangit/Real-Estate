// src/hooks/useAuth.js
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../API/api';
import { loginUser, logout } from './authSlice'; // استيراد من authSlice بدلاً من loginStart...

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector(state => state.auth);

  const login = async (credentials) => {
    try {
      const result = await dispatch(loginUser(credentials)).unwrap();
      return { success: true };
    } catch (error) {
      return { success: false, error: error || 'فشل تسجيل الدخول' };
    }
  };

  const performLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return { auth, login, logout: performLogout };
};