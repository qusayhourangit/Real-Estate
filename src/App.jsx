import React, { useState, useEffect } from 'react';
import "bootstrap/dist/css/bootstrap.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// مكونات الواجهة المشتركة
import NavBar from './components/NavBar';
import AddPropertyForm from './components/modal/AddPropertyForm';

// الصفحات العامة
import Home from './pages/Home';
import PropertyListingsPage from './pages/PropertyListingsPage';
import PropertyDetailsPage from './pages/PropertyDetailsPage';
import SavedPropertiesPage from './pages/SavedPropertiesPage';
import NotFoundPage from './pages/NotFoundPage';

// مكونات المصادقة
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import UnauthorizedPage from './pages/UnauthorizedPage';

// صفحات لوحة تحكم المستخدم
import UserDashboardLayout from './components/Dashboard/User/UserDashboardLayout';
import MyProperties from './components/Dashboard/User/MyProperties';
import ProfileSettings from './components/Dashboard/User/ProfileSettings';
import SavedProperties from './components/Dashboard/User/SavedProperties';


// صفحات لوحة تحكم المدير
import AdminDashboardLayout from './components/Dashboard/Admin/AdminDashboardLayout';
import PendingProperties from './components/Dashboard/Admin/PendingProperties';
import ManageUsers from './components/Dashboard/Admin/ManageUsers';
import SiteStats from './components/Dashboard/Admin/SiteStats';
import ContactUs from './pages/ContactUs';
import AboutUs from './pages/AboutUs';


function App() {


  return (
   <>
      <NavBar />

      <Routes>
        {/* المسارات العامة */}
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<PropertyListingsPage />} />
        <Route path="/properties/:propertyId" element={<PropertyDetailsPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/savedproperties" element={<SavedPropertiesPage />} />
        <Route path="/Contactus" element={<ContactUs />} />
        <Route path="/Aboutus" element={<AboutUs />} />


        <Route
          path="/login"
          element={<Login />} // Login سيستخدم Context للتحقق وإعادة التوجيه إذا لزم الأمر
        />
        <Route path="/addproperty" element={
          <ProtectedRoute allowedRoles={['user', 'admin']}> {/* فقط المستخدم المسجل يمكنه الإضافة */}
            <AddPropertyForm />
          </ProtectedRoute>
        } />
        {/* مسارات المستخدم */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="my-properties" replace />} />
          <Route path="saved" element={<SavedProperties />} />
          <Route path="my-properties" element={<MyProperties />} />
          <Route path="settings" element={<ProfileSettings />} />
        </Route>

        {/* مسارات المدير */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="pending" replace />} />
          <Route path="pending" element={<PendingProperties />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="stats" element={<SiteStats />} />
        </Route>
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* مسار الصفحة غير موجودة */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </>
  );
}

export default App;