// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice'; // تأكد من المسار الصحيح

export const store = configureStore({
  reducer: {
    auth: authReducer, // التأكد من أن المفتاح هو 'auth'
    // يمكنك إضافة reducers أخرى هنا إذا لزم الأمر
    // anotherFeature: anotherReducer,
  },
  // تفعيل Redux DevTools (مفيد للتطوير)
  devTools: process.env.NODE_ENV !== 'production',
});

// لا حاجة لـ export default هنا، configureStore يُرجع الـ store مباشرة
// export default store; // يمكنك إضافة هذا إذا كنت تفضل ذلك