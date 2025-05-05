// src/hooks/useAuth.js (أو المسار الذي تستخدمه)
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
// import api from '../API/api'; // لا يبدو أنه مستخدم مباشرة هنا
import { loginUser, logout } from '../redux/authSlice'; // <-- تأكد من المسار الصحيح لـ authSlice

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // الحصول على كامل حالة المصادقة من Redux store
  const auth = useSelector(state => state.auth);

  // دالة لتسجيل الدخول (تستخدم loginUser thunk)
  const login = async (credentials) => {
    try {
      // dispatch للـ thunk و unwrap للحصول على النتيجة أو الخطأ
      const resultAction = await dispatch(loginUser(credentials)).unwrap();
      // إذا نجح (لم يتم رمي خطأ)، أرجع نجاح
      console.log("Login successful via useAuth:", resultAction);
      return { success: true, user: resultAction.user }; // إرجاع المستخدم أيضاً قد يكون مفيداً
    } catch (error) {
      // إذا فشل (تم رفض الـ thunk)، أرجع فشل مع رسالة الخطأ
      console.error("Login failed via useAuth:", error);
      return { success: false, error: error || 'فشل تسجيل الدخول' };
    }
  };

  // دالة لتسجيل الخروج (تستخدم logout action)
  const performLogout = () => {
    dispatch(logout());
    // الانتقال لصفحة الدخول بعد تسجيل الخروج
    navigate('/login', { replace: true }); // استخدام replace لتجنب العودة لصفحة محمية بزر الخلف
  };

  // إرجاع حالة المصادقة والدوال المساعدة
  return {
    // الحالة الكاملة: user, token, isAuthenticated, loading, error, statusChangeCounter
    ...auth,
    // الدوال المساعدة (مع إعادة تسمية logout للاستخدام المباشر)
    login,
    logout: performLogout,
  };
};

// لا يوجد export default هنا، الهوكات المخصصة تُصدر عادةً بهذا الشكل
// export default useAuth; // يمكنك إضافته إذا كان هذا هو أسلوبك المفضل