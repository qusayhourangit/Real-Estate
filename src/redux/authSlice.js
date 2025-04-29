// src/redux/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../API/api';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
// جلب التوكن والمستخدم من التخزين المحلي
const initialState = {
  user: user || null,
  token: token || null,
  isAuthenticated: !!token, // يعتمد على وجود التوكن
  loading: false, // سنضيف loading عام أو نعتمد على loading الخاص بالـ thunks
  error: null,

};

// Thunk لتسجيل الدخول
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/login', credentials);
      const { token, user } = response.data.data;
      const isAdmin = user.email === 'horanqusay@gmail.com'; // استبدل بالإيميل الخاص بالأدمن
      const userWithRole = { ...user, role: isAdmin ? 'admin' : 'user' };
      // حفظ التوكن والمستخدم بالـ localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return { token, user: userWithRole };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل تسجيل الدخول');
    }
  }
);

// السلايس
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
        api.defaults.headers.common['Authorization'] = `Bearer ${action.payload.token}`; // إضافة هذا السطر

      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  }
});

// تصدير الأكشنات والمخفض
export const { logout } = authSlice.actions;
export default authSlice.reducer;
// تصدير الأكشنات والمخفض
 export const { setInitialLoading } = authSlice.actions; // إذا أضفت setInitialLoading
