import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage, auth } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendPasswordResetEmail } from 'firebase/auth';
import { motion } from 'motion/react';
import { User, Camera, Moon, Sun, Monitor, Lock, Bell, Shield, FileText, Info, Mail, Code, ChevronRight, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccountSettings() {
  const { currentUser, userProfile, logout } = useAuth();
  const [name, setName] = useState(userProfile?.name || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
  const [notifications, setNotifications] = useState(localStorage.getItem('notifications') !== 'false');

  useEffect(() => {
    setName(userProfile?.name || '');
  }, [userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: name
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const storageRef = ref(storage, `profiles/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL
      });
      
      setMessage({ type: 'success', text: 'Profile photo updated!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload photo' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setMessage({ type: 'success', text: 'Password reset email sent!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to send reset email' });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme
    if (newTheme === 'light' || (newTheme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }

    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          themePreference: newTheme
        });
      } catch (error) {
        console.error("Failed to save theme preference to Firestore", error);
      }
    }
  };

  const handleNotificationToggle = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem('notifications', newValue.toString());
  };

  const isGoogleProvider = currentUser?.providerData.some(p => p.providerId === 'google.com');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Account Settings</h2>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}>
          {message.text}
        </div>
      )}

      {/* Profile Management */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-blue-400" />
          Profile Management
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
              <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                <Camera className="h-6 w-6 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={loading} />
              </label>
            </div>
            <span className="text-xs text-gray-400">Click to update</span>
          </div>

          <form onSubmit={handleUpdateProfile} className="flex-grow space-y-4 w-full">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                value={userProfile?.email || ''}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-400 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
            </div>
            <button
              type="submit"
              disabled={loading || name === userProfile?.name}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Sun className="h-5 w-5 text-yellow-400" />
          Theme Settings
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleThemeChange('light')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${theme === 'light' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}
          >
            <Sun className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">Light</span>
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${theme === 'dark' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}
          >
            <Moon className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">Dark</span>
          </button>
          <button
            onClick={() => handleThemeChange('system')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${theme === 'system' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}
          >
            <Monitor className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">System</span>
          </button>
        </div>
      </div>

      {/* Security Settings */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-red-400" />
          Security Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <div>
              <p className="text-white font-medium">Login Provider</p>
              <p className="text-sm text-gray-400">You are logged in using {isGoogleProvider ? 'Google' : 'Email/Password'}.</p>
            </div>
            {isGoogleProvider ? (
              <span className="px-3 py-1 bg-gray-700 rounded-full text-xs font-medium text-white">Google</span>
            ) : (
              <span className="px-3 py-1 bg-gray-700 rounded-full text-xs font-medium text-white">Email</span>
            )}
          </div>
          
          {!isGoogleProvider && (
            <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
              <div>
                <p className="text-white font-medium">Password</p>
                <p className="text-sm text-gray-400">Receive an email to reset your password.</p>
              </div>
              <button
                onClick={handlePasswordReset}
                disabled={loading}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Reset Password
              </button>
            </div>
          )}
        </div>
      </div>

      {/* App Settings */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-green-400" />
          App Settings
        </h3>
        <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <div>
            <p className="text-white font-medium">Notifications</p>
            <p className="text-sm text-gray-400">Receive alerts and updates.</p>
          </div>
          <button
            onClick={handleNotificationToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications ? 'bg-blue-600' : 'bg-gray-600'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Admin Settings */}
      {userProfile?.role === 'admin' && (
        <div className="glass-card rounded-xl p-6 border border-blue-500/30">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Admin Settings
          </h3>
          <p className="text-sm text-gray-400 mb-4">You have administrator privileges. Access the dashboard to manage users and listings.</p>
          <Link to="/admin" className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20">
            Go to Admin Dashboard <ChevronRight className="h-4 w-4 ml-2" />
          </Link>
        </div>
      )}

      {/* Legal & Information */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-purple-400" />
          Legal & Information
        </h3>
        <div className="space-y-4">
          <details className="group bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
            <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-white">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                Privacy Policy
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="p-4 pt-0 text-sm text-gray-400 border-t border-gray-700/50 mt-2">
              City Helpline respects user privacy and does not share personal data. Data is securely stored using Firebase.
            </div>
          </details>

          <details className="group bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
            <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-white">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                Terms & Conditions
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="p-4 pt-0 text-sm text-gray-400 border-t border-gray-700/50 mt-2">
              Users must provide genuine data. Admin has rights to remove any listing. Platform is not responsible for third-party services.
            </div>
          </details>

          <details className="group bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
            <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-white">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-gray-400" />
                About Developer
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="p-4 pt-0 text-sm text-gray-400 border-t border-gray-700/50 mt-2">
              Developed by Prince Kushwaha (AI Developer & Trader)
            </div>
          </details>

          <details className="group bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
            <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-white">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                Support
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="p-4 pt-0 text-sm text-gray-400 border-t border-gray-700/50 mt-2">
              Email: imprince.dev@gmail.com
            </div>
          </details>
        </div>
      </div>

      {/* Logout Button */}
      <div className="mt-8">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-colors border border-red-500/20"
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </button>
      </div>
    </div>
  );
}
