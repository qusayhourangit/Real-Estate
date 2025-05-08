// src/redux/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../API/api'; // تأكد من المسار الصحيح

// --- تهيئة الحالة الأولية من التخزين المحلي ---
const token = localStorage.getItem('token');
let storedUser = null;
try {
  // إضافة try-catch لتجنب الخطأ إذا كان التخزين المحلي تالفًا
  storedUser = JSON.parse(localStorage.getItem('user'));
} catch (e) {
  console.error("Could not parse user from localStorage", e);
  localStorage.removeItem('user'); // إزالة البيانات التالفة
  localStorage.removeItem('token'); // إزالة التوكن المرتبط بها
}

// تعيين الهيدر فقط إذا كان التوكن والمستخدم موجودين وصالحين
if (token && storedUser) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
} else {
  // التأكد من إزالة التوكن والهيدر إذا كان أحدهما مفقودًا
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];
}
// -------------------------------------------

const initialState = {
  user: storedUser || null,
  token: token && storedUser ? token : null, // تأكد من توافق التوكن والمستخدم
  isAuthenticated: !!(token && storedUser), // المصادقة تعتمد على وجود الاثنين
  loading: false, // حالة التحميل لتسجيل الدخول
  error: null, // لتخزين أخطاء المصادقة
  statusChangeCounter: 0, // <-- الـ Trigger لتحديث حالة العقارات
};

// --- Thunk لتسجيل الدخول ---
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/login', credentials);

      if (response.data?.data?.token && response.data?.data?.user) {
        const { token, user } = response.data.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        return { token, user };
      } else {
        const errorMessage =
          response.data?.message ||
          response.data?.error ||
          'فشل تسجيل الدخول: البيانات غير مكتملة من الخادم.';
      
        console.error("Login API response missing token or user:", response.data);
      
        const translatedMessage = {
          'The provided credentials are incorrect': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
          'Your account has been banned. Please contact the administrator': 'تم حظر حسابك. يرجى التواصل مع الإدارة.',
        }[errorMessage] || errorMessage;
      
        return rejectWithValue(translatedMessage);
      }

    } catch (error) {
      console.error("Login API error:", error.response?.data || error.message);

      let serverError = 'فشل تسجيل الدخول، الرجاء التحقق من البيانات أو المحاولة لاحقًا.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          serverError = error.response.data;
        } else if (error.response.data.message) {
          serverError = error.response.data.message;
        } else if (error.response.data.error) {
          serverError = error.response.data.error;
        }
      }
      return rejectWithValue(serverError);
    }
  }
);
// ---------------------------

// --- تعريف الـ Slice ---
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Reducer للـ Trigger الخاص بتحديث العقارات
    propertyStatusChanged(state) {
      state.statusChangeCounter += 1;
      console.log("Property status changed, counter:", state.statusChangeCounter); // للتتبع
    },
    // Reducer لتسجيل الخروج
    logout: (state) => {
      console.log("Logging out...");
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false; // تأكد من إعادة تعيين التحميل
      state.error = null; // تأكد من مسح الأخطاء
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    },
    // (اختياري) Reducer لتحديث بيانات المستخدم محليًا (مثل بعد تعديل الملف الشخصي)
    updateUserLocally: (state, action) => {
        if (state.user && action.payload) {
            state.user = { ...state.user, ...action.payload };
            localStorage.setItem('user', JSON.stringify(state.user));
        }
    },
    // (اختياري) Reducer لمسح أخطاء المصادقة عند الحاجة
    clearAuthError: (state) => {
        state.error = null;
    }
  },
  // التعامل مع حالات الـ Thunk الخاص بتسجيل الدخول
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null; // مسح الأخطاء السابقة عند محاولة جديدة
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user; // يجب أن يحتوي على role
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload; // تخزين رسالة الخطأ
        state.loading = false;
        // لا تقم بتغيير isAuthenticated أو user هنا، يجب أن يظلوا كما كانوا قبل محاولة الدخول الفاشلة
      });
  }
});

// --- تصدير الـ Actions والـ Reducer ---
export const { logout, propertyStatusChanged, updateUserLocally, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
// ----------------------------------