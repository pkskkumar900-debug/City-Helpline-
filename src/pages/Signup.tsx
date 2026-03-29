import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile, Role } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Eye, EyeOff, Mail, Lock, User, AlertCircle, Phone, Building2, MapPin, Briefcase } from 'lucide-react';
import { CATEGORIES, STATE_CITIES } from '../lib/constants';

export default function Signup() {
  const [role, setRole] = useState<Role>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const navigate = useNavigate();

  const cityOptions = Object.entries(STATE_CITIES).flatMap(([state, cities]) => 
    cities.map(c => ({ value: c, label: c, group: state }))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (role === 'contributor') {
      if (!phone || !businessName || !businessType || !city || !address) {
        setError('Please fill in all business details');
        return;
      }
    }
    
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      const userProfile: any = {
        uid: user.uid,
        name,
        email,
        role: email === 'pkskkumar900@gmail.com' ? 'admin' : role,
        banned: false,
        createdAt: serverTimestamp(),
      };

      if (role === 'contributor') {
        userProfile.phone = phone;
        userProfile.businessName = businessName;
        userProfile.businessType = businessType;
        userProfile.city = city;
        userProfile.address = address;
      }

      await setDoc(doc(db, 'users', user.uid), userProfile);
      navigate(role === 'contributor' ? '/profile' : '/');
    } catch (err: any) {
      setError(err.message || 'Failed to create an account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user profile exists, if not create one
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const userProfile: any = {
          uid: user.uid,
          name: user.displayName || 'User',
          email: user.email,
          role: user.email === 'pkskkumar900@gmail.com' ? 'admin' : role,
          banned: false,
          createdAt: serverTimestamp(),
        };

        if (role === 'contributor') {
          userProfile.phone = phone;
          userProfile.businessName = businessName;
          userProfile.businessType = businessType;
          userProfile.city = city;
          userProfile.address = address;
        }

        await setDoc(doc(db, 'users', user.uid), userProfile);
      }
      
      navigate(role === 'contributor' ? '/profile' : '/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#0a0a0a]">
      {/* 3D Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -5, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-purple-600/20 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            y: [0, -30, 0],
            rotate: [0, 5, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-600/20 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -40, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[20%] right-[20%] w-[20rem] h-[20rem] bg-pink-500/10 rounded-full blur-[80px]"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
        className="max-w-md w-full space-y-8 p-10 rounded-[2rem] relative z-10 bg-gray-900/40 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)]"
        style={{
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 20px 40px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div className="text-center relative">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            className="mx-auto h-20 w-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)] mb-8 relative group"
          >
            <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <UserPlus className="h-10 w-10 text-white relative z-10" />
          </motion.div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 drop-shadow-sm tracking-tight">
            Create an Account
          </h2>
          <p className="mt-3 text-sm text-gray-400 font-medium">
            Join the City Helpline community
          </p>
        </div>

        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm backdrop-blur-md flex items-center shadow-[0_0_15px_rgba(239,68,68,0.15)]"
              >
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex p-1 bg-gray-900/60 rounded-xl border border-gray-700/50 mb-6">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                role === 'user' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              User
              <span className="block text-[10px] opacity-70 mt-0.5">Explore services</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('contributor')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                role === 'contributor' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              Contributor
              <span className="block text-[10px] opacity-70 mt-0.5">Add your business</span>
            </button>
          </div>

          <div className="space-y-5">
            <div className="relative group">
              <label className="block text-sm font-medium text-gray-300 mb-2 transition-colors group-focus-within:text-purple-400">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 transition-colors ${focusedInput === 'name' ? 'text-purple-400' : 'text-gray-500'}`} />
                </div>
                <input
                  type="text"
                  required
                  className="appearance-none block w-full pl-11 pr-4 py-3.5 bg-gray-900/50 border border-gray-700/50 text-white rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder-gray-500 shadow-inner"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                />
              </div>
            </div>

            <div className="relative group">
              <label className="block text-sm font-medium text-gray-300 mb-2 transition-colors group-focus-within:text-purple-400">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 transition-colors ${focusedInput === 'email' ? 'text-purple-400' : 'text-gray-500'}`} />
                </div>
                <input
                  type="email"
                  required
                  className="appearance-none block w-full pl-11 pr-4 py-3.5 bg-gray-900/50 border border-gray-700/50 text-white rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder-gray-500 shadow-inner"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </div>
            </div>

            <div className="relative group">
              <label className="block text-sm font-medium text-gray-300 mb-2 transition-colors group-focus-within:text-purple-400">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 transition-colors ${focusedInput === 'password' ? 'text-purple-400' : 'text-gray-500'}`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none block w-full pl-11 pr-12 py-3.5 bg-gray-900/50 border border-gray-700/50 text-white rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder-gray-500 shadow-inner"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {role === 'contributor' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-300 mb-2 transition-colors group-focus-within:text-purple-400">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className={`h-5 w-5 transition-colors ${focusedInput === 'phone' ? 'text-purple-400' : 'text-gray-500'}`} />
                      </div>
                      <input
                        type="tel"
                        required={role === 'contributor'}
                        className="appearance-none block w-full pl-11 pr-4 py-3.5 bg-gray-900/50 border border-gray-700/50 text-white rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder-gray-500 shadow-inner"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onFocus={() => setFocusedInput('phone')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-300 mb-2 transition-colors group-focus-within:text-purple-400">Business Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Building2 className={`h-5 w-5 transition-colors ${focusedInput === 'businessName' ? 'text-purple-400' : 'text-gray-500'}`} />
                      </div>
                      <input
                        type="text"
                        required={role === 'contributor'}
                        className="appearance-none block w-full pl-11 pr-4 py-3.5 bg-gray-900/50 border border-gray-700/50 text-white rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder-gray-500 shadow-inner"
                        placeholder="My Awesome PG"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        onFocus={() => setFocusedInput('businessName')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-300 mb-2 transition-colors group-focus-within:text-purple-400">Business Type</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Briefcase className={`h-5 w-5 transition-colors ${focusedInput === 'businessType' ? 'text-purple-400' : 'text-gray-500'}`} />
                      </div>
                      <select
                        required={role === 'contributor'}
                        className="appearance-none block w-full pl-11 pr-4 py-3.5 bg-gray-900/50 border border-gray-700/50 text-white rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all shadow-inner"
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        onFocus={() => setFocusedInput('businessType')}
                        onBlur={() => setFocusedInput(null)}
                      >
                        <option value="" disabled>Select Business Type</option>
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-300 mb-2 transition-colors group-focus-within:text-purple-400">City</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MapPin className={`h-5 w-5 transition-colors ${focusedInput === 'city' ? 'text-purple-400' : 'text-gray-500'}`} />
                      </div>
                      <select
                        required={role === 'contributor'}
                        className="appearance-none block w-full pl-11 pr-4 py-3.5 bg-gray-900/50 border border-gray-700/50 text-white rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all shadow-inner"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        onFocus={() => setFocusedInput('city')}
                        onBlur={() => setFocusedInput(null)}
                      >
                        <option value="" disabled>Select City</option>
                        {cityOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label} ({opt.group})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-300 mb-2 transition-colors group-focus-within:text-purple-400">Full Address</label>
                    <div className="relative">
                      <div className="absolute top-3.5 left-0 pl-4 flex items-start pointer-events-none">
                        <MapPin className={`h-5 w-5 transition-colors ${focusedInput === 'address' ? 'text-purple-400' : 'text-gray-500'}`} />
                      </div>
                      <textarea
                        required={role === 'contributor'}
                        rows={3}
                        className="appearance-none block w-full pl-11 pr-4 py-3.5 bg-gray-900/50 border border-gray-700/50 text-white rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder-gray-500 shadow-inner resize-none"
                        placeholder="123 Main St, Near Landmark"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        onFocus={() => setFocusedInput('address')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(168, 85, 247, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:opacity-70 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative flex items-center">
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : 'Sign up'}
              </span>
            </motion.button>
          </div>
          
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#111318] text-gray-500 rounded-full border border-gray-700/50 text-xs uppercase tracking-wider font-semibold">
                Or continue with
              </span>
            </div>
          </div>

          <div>
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: "rgba(31, 41, 55, 1)" }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-gray-700/80 rounded-xl text-sm font-medium text-white bg-gray-800/50 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 disabled:opacity-50 transition-all shadow-sm"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </motion.button>
          </div>

          <div className="text-sm text-center pt-6 mt-6 border-t border-gray-700/30">
            <span className="text-gray-400">Already have an account? </span>
            <Link to="/login" className="font-semibold text-purple-400 hover:text-purple-300 transition-colors relative group inline-block">
              <span>Log in</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-400 transition-all group-hover:w-full"></span>
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
