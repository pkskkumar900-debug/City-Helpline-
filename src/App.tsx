/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { CursorGlow } from './components/ui/CursorGlow';

// Pages
import Home from './pages/Home';
import Auth from './pages/Auth';
import AddListing from './pages/AddListing';
import EditListing from './pages/EditListing';
import ListingDetails from './pages/ListingDetails';
import AdminDashboard from './pages/AdminDashboard';
import Search from './pages/Search';
import Profile from './pages/Profile';

export default function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'system';
    if (theme === 'light' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-transparent flex flex-col">
          <CursorGlow />
          <Toaster position="top-center" theme="dark" />
          <Navbar />
          <main className="flex-grow pb-16 md:pb-0">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/signup" element={<Auth />} />
              <Route path="/listing/:id" element={<ListingDetails />} />
              
              {/* Protected Routes */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/add-listing" 
                element={
                  <ProtectedRoute>
                    <AddListing />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/edit-listing/:id" 
                element={
                  <ProtectedRoute>
                    <EditListing />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </Router>
    </AuthProvider>
  );
}
