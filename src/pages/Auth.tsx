import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, googleProvider, githubProvider, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, fetchSignInMethodsForEmail, linkWithPopup, GithubAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Role } from '../types';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import { LogIn, UserPlus, Eye, EyeOff, Mail, Lock, User, AlertCircle, Phone, Building2, MapPin, Briefcase, Github, ChevronRight } from 'lucide-react';
import { CATEGORIES, STATE_CITIES } from '../lib/constants';
import { toast } from 'sonner';

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(location.pathname === '/login');

  // Update state if URL changes
  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  // 3D Tilt Effect State
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const toggleAuthMode = () => {
    const newMode = !isLogin;
    setIsLogin(newMode);
    navigate(newMode ? '/login' : '/signup', { replace: true });
  };

  // Shared State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // First Time User State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);

  // Account Linking State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkProvider, setLinkProvider] = useState('');
  const [pendingCred, setPendingCred] = useState<any>(null);
  const [linkPassword, setLinkPassword] = useState('');

  // Signup Specific State
  const [role, setRole] = useState<Role>('user');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  const cityOptions = Object.entries(STATE_CITIES).flatMap(([state, cities]) => 
    cities.map(c => ({ value: c, label: c, group: state }))
  );

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.banned) {
          await auth.signOut();
          toast.error('Your account has been banned. Please contact support.');
          setLoading(false);
          return;
        }

        // Update lastLogin
        await setDoc(doc(db, 'users', userCredential.user.uid), { lastLogin: serverTimestamp() }, { merge: true });

        toast.success('Logged in successfully');
        if (userData.role === 'contributor') {
          navigate('/profile');
        } else {
          navigate('/');
        }
      } else {
        toast.success('Logged in successfully');
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed, try again');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (role === 'contributor') {
      if (!phone || !businessName || !businessType || !city || !address) {
        toast.error('Please fill in all business details');
        return;
      }
    }
    
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userProfile: any = {
        uid: user.uid,
        name,
        email,
        role: email === 'pkskkumar900@gmail.com' ? 'admin' : role,
        banned: false,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };

      if (role === 'contributor') {
        userProfile.phone = phone;
        userProfile.businessName = businessName;
        userProfile.businessType = businessType;
        userProfile.city = city;
        userProfile.address = address;
      }

      await setDoc(doc(db, 'users', user.uid), userProfile);
      toast.success('Account created successfully');
      navigate(role === 'contributor' ? '/profile' : '/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create an account');
    } finally {
      setLoading(false);
    }
  };

  const githubLogin = async () => {
    try {
      const provider = new GithubAuthProvider();
      const user = await handleSocialAuth(provider);
      if (user) {
        console.log("GitHub login success:", user);
      }
    } catch (error) {
      console.error("GitHub login error:", error);
    }
  };

  const handleSocialAuth = async (provider: any) => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // First Time User
        setPendingUser(user);
        setShowRoleModal(true);
      } else {
        // Returning User
        const userData = userDoc.data();
        if (userData.banned) {
          await auth.signOut();
          toast.error('Your account has been banned. Please contact support.');
          setLoading(false);
          return null;
        }
        
        // Update lastLogin
        await setDoc(doc(db, 'users', user.uid), { lastLogin: serverTimestamp() }, { merge: true });

        toast.success('Logged in successfully');
        if (userData.role === 'contributor') {
          navigate('/profile');
        } else {
          navigate('/');
        }
      }
      return user;
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        alert('Popup blocked by browser. Please allow popups for this site.');
        setLoading(false);
        return;
      }
      if (err.code === 'auth/account-exists-with-different-credential') {
        const email = err.customData?.email;
        let pendingCredential;
        if (provider.providerId === 'github.com') {
          pendingCredential = GithubAuthProvider.credentialFromError(err);
        } else if (provider.providerId === 'google.com') {
          pendingCredential = GoogleAuthProvider.credentialFromError(err);
        }

        if (email && pendingCredential) {
          try {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            
            let primaryProvider = '';
            if (methods.includes('google.com')) {
              primaryProvider = 'google.com';
            } else if (methods.includes('github.com')) {
              primaryProvider = 'github.com';
            } else if (methods.includes('password')) {
              primaryProvider = 'password';
            }

            if (primaryProvider) {
              setLinkEmail(email);
              setLinkProvider(primaryProvider);
              setPendingCred(pendingCredential);
              setShowLinkModal(true);
              setLoading(false);
              return;
            } else {
              setLoading(false);
              return;
            }
          } catch (fetchErr) {
            console.error('Error fetching sign-in methods:', fetchErr);
            setLoading(false);
            return;
          }
        }
      }
      toast.error(err.message || 'Login failed, try again');
    } finally {
      if (!showLinkModal) {
        setLoading(false);
      }
    }
  };

  const handleLinkAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      let userCredential;
      if (linkProvider === 'google.com') {
        userCredential = await signInWithPopup(auth, googleProvider);
      } else if (linkProvider === 'github.com') {
        userCredential = await signInWithPopup(auth, githubProvider);
      } else if (linkProvider === 'password') {
        userCredential = await signInWithEmailAndPassword(auth, linkEmail, linkPassword);
      }

      if (userCredential && pendingCred) {
        const providerToLink = pendingCred.providerId === 'github.com' ? githubProvider : googleProvider;
        await linkWithPopup(userCredential.user, providerToLink);
        toast.success('Accounts linked successfully!');
        
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.banned) {
            await auth.signOut();
            toast.error('Your account has been banned.');
            setLoading(false);
            setShowLinkModal(false);
            return;
          }
          await setDoc(doc(db, 'users', userCredential.user.uid), { lastLogin: serverTimestamp() }, { merge: true });
          
          if (userData.role === 'contributor') {
            navigate('/profile');
          } else {
            navigate('/');
          }
        } else {
          // If the linked account was somehow incomplete, show role modal
          setPendingUser(userCredential.user);
          setShowRoleModal(true);
        }
        setShowLinkModal(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to link accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = async (selectedRole: Role) => {
    if (!pendingUser) return;
    setLoading(true);
    try {
      const userProfile: any = {
        uid: pendingUser.uid,
        name: pendingUser.displayName || 'User',
        email: pendingUser.email,
        photoURL: pendingUser.photoURL || '',
        role: selectedRole,
        banned: false,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', pendingUser.uid), userProfile);
      setShowRoleModal(false);
      toast.success('Account created successfully');
      navigate(selectedRole === 'contributor' ? '/profile' : '/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save user role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#0a0a0a]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1200 }}
    >
      {/* 3D Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div style={{ x: useTransform(mouseXSpring, [-0.5, 0.5], [30, -30]), y: useTransform(mouseYSpring, [-0.5, 0.5], [30, -30]) }} className="absolute inset-0">
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-600/20 rounded-full blur-[120px]"
          />
        </motion.div>
        <motion.div style={{ x: useTransform(mouseXSpring, [-0.5, 0.5], [-40, 40]), y: useTransform(mouseYSpring, [-0.5, 0.5], [-40, 40]) }} className="absolute inset-0">
          <motion.div 
            animate={{ 
              y: [0, 30, 0],
              rotate: [0, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-purple-600/20 rounded-full blur-[120px]"
          />
        </motion.div>
        <motion.div style={{ x: useTransform(mouseXSpring, [-0.5, 0.5], [20, -20]), y: useTransform(mouseYSpring, [-0.5, 0.5], [-20, 20]) }} className="absolute inset-0">
          <motion.div 
            animate={{ 
              x: [0, 40, 0],
              y: [0, 20, 0]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[20%] right-[20%] w-[20rem] h-[20rem] bg-indigo-500/10 rounded-full blur-[80px]"
          />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
        className="max-w-md w-full space-y-8 p-10 rounded-[2rem] relative z-10 bg-gray-900/40 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)]"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 20px 40px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Toggle Switch */}
        <div className="flex p-1 bg-gray-900/60 rounded-xl border border-gray-700/50 mb-8 relative">
          <motion.div 
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md"
            animate={{ left: isLogin ? '4px' : 'calc(50%)' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <button
            type="button"
            onClick={() => !isLogin && toggleAuthMode()}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors relative z-10 ${
              isLogin ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => isLogin && toggleAuthMode()}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors relative z-10 ${
              !isLogin ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="text-center relative">
          <motion.div 
            key={isLogin ? 'login-icon' : 'signup-icon'}
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            whileHover={{ scale: 1.05, rotate: isLogin ? 5 : -5 }}
            whileTap={{ scale: 0.95 }}
            className={`mx-auto h-20 w-20 bg-gradient-to-br ${isLogin ? 'from-blue-500 to-purple-600' : 'from-purple-500 to-blue-600'} rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)] mb-8 relative group`}
          >
            <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            {isLogin ? (
              <LogIn className="h-10 w-10 text-white relative z-10" />
            ) : (
              <UserPlus className="h-10 w-10 text-white relative z-10" />
            )}
          </motion.div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 drop-shadow-sm tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="mt-3 text-sm text-gray-400 font-medium">
            {isLogin ? 'Log in to access your account' : 'Join the City Helpline community'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.form 
            key={isLogin ? 'login-form' : 'signup-form'}
            initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
            transition={{ duration: 0.3 }}
            className="mt-10 space-y-6" 
            onSubmit={isLogin ? handleLoginSubmit : handleSignupSubmit}
          >
            {!isLogin && (
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
            )}

            <div className="space-y-5">
              {!isLogin && (
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
              )}

              <div className="relative group">
                <label className={`block text-sm font-medium text-gray-300 mb-2 transition-colors group-focus-within:${isLogin ? 'text-blue-400' : 'text-purple-400'}`}>Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 transition-colors ${focusedInput === 'email' ? (isLogin ? 'text-blue-400' : 'text-purple-400') : 'text-gray-500'}`} />
                  </div>
                  <input
                    type="email"
                    required
                    className={`appearance-none block w-full pl-11 pr-4 py-3.5 bg-gray-900/50 border border-gray-700/50 text-white rounded-xl focus:ring-2 focus:ring-${isLogin ? 'blue' : 'purple'}-500/50 focus:border-${isLogin ? 'blue' : 'purple'}-500 outline-none transition-all placeholder-gray-500 shadow-inner`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </div>
              </div>

              <div className="relative group">
                <div className="flex justify-between items-center mb-2">
                  <label className={`block text-sm font-medium text-gray-300 transition-colors group-focus-within:${isLogin ? 'text-blue-400' : 'text-purple-400'}`}>Password</label>
                  {isLogin && (
                    <a href="#" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 transition-colors ${focusedInput === 'password' ? (isLogin ? 'text-blue-400' : 'text-purple-400') : 'text-gray-500'}`} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className={`appearance-none block w-full pl-11 pr-12 py-3.5 bg-gray-900/50 border border-gray-700/50 text-white rounded-xl focus:ring-2 focus:ring-${isLogin ? 'blue' : 'purple'}-500/50 focus:border-${isLogin ? 'blue' : 'purple'}-500 outline-none transition-all placeholder-gray-500 shadow-inner`}
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

              {!isLogin && role === 'contributor' && (
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
              
              {isLogin && (
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 bg-gray-900 border-gray-700 rounded text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                    Remember me
                  </label>
                </div>
              )}
            </div>

            <div>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: isLogin ? "0 0 20px rgba(59, 130, 246, 0.4)" : "0 0 20px rgba(168, 85, 247, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r ${isLogin ? 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:ring-blue-500' : 'from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 focus:ring-purple-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-70 transition-all overflow-hidden`}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative flex items-center">
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isLogin ? 'Authenticating...' : 'Creating account...'}
                    </>
                  ) : (isLogin ? 'Log in securely' : 'Sign up')}
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

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={githubLogin}
                disabled={loading}
                className="relative w-full h-[54px] flex justify-center items-center gap-3 rounded-2xl text-white font-semibold overflow-hidden group transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              >
                {/* Animated Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Glass Overlay */}
                <div className="absolute inset-0 backdrop-blur-md bg-white/5" />
                
                {/* Shimmer Effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                  initial={{ x: '-150%' }}
                  whileHover={{ x: '150%' }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <Github className="w-5 h-5 relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                <span className="relative z-10 tracking-wide text-[15px]">Continue with GitHub</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleSocialAuth(googleProvider)}
                disabled={loading}
                className="relative w-full h-[54px] p-[1px] rounded-2xl overflow-hidden group transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]"
              >
                {/* Animated Gradient Border Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/60 via-red-500/60 to-orange-500/60 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Inner Button Content */}
                <div className="relative w-full h-full flex justify-center items-center gap-3 rounded-[15px] bg-red-600 backdrop-blur-xl group-hover:bg-red-500 transition-colors duration-300">
                  {/* Shimmer */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                    initial={{ x: '-150%' }}
                    whileHover={{ x: '150%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                  {/* Icon & Text */}
                  <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center relative z-10 shadow-sm">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  </div>
                  <span className="relative z-10 text-white font-semibold tracking-wide text-[15px]">Continue with Google</span>
                </div>
              </motion.button>
            </div>
          </motion.form>
        </AnimatePresence>
      </motion.div>

      {/* Role Selection Modal */}
      <AnimatePresence>
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="relative w-full max-w-2xl bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
              
              <div className="text-center mb-10">
                <h3 className="text-3xl font-bold text-white mb-3">Select Your Role</h3>
                <p className="text-gray-400">Choose how you want to use the app</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.button
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelection('user')}
                  className="group relative flex flex-col items-center p-8 rounded-2xl border border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/80 hover:border-blue-500/50 transition-all text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <User className="w-8 h-8 text-blue-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">User</h4>
                  <p className="text-sm text-gray-400 text-center">Browse listings, search, and view details</p>
                  <div className="mt-6 flex items-center text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Continue as User <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelection('contributor')}
                  className="group relative flex flex-col items-center p-8 rounded-2xl border border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/80 hover:border-purple-500/50 transition-all text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="w-8 h-8 text-purple-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Contributor</h4>
                  <p className="text-sm text-gray-400 text-center">Add listings, manage business, and upload data</p>
                  <div className="mt-6 flex items-center text-purple-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Continue as Contributor <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Account Linking Modal */}
      <AnimatePresence>
        {showLinkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="relative w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Account Exists</h3>
                <p className="text-gray-400 text-sm">
                  Account already exists with another login method. Continue to link accounts.
                </p>
              </div>

              {linkProvider === 'password' ? (
                <form onSubmit={handleLinkAccount} className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={linkPassword}
                      onChange={(e) => setLinkPassword(e.target.value)}
                      className="block w-full pl-11 pr-10 py-3.5 border border-gray-700/50 rounded-xl bg-gray-900/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all sm:text-sm"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-70 transition-all"
                  >
                    {loading ? 'Linking...' : 'Sign In & Link'}
                  </motion.button>
                </form>
              ) : (
                <div className="space-y-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLinkAccount()}
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-all flex items-center justify-center gap-3"
                  >
                    {linkProvider === 'google.com' ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    ) : (
                      <Github className="w-5 h-5" />
                    )}
                    {loading ? 'Linking...' : `Continue with ${linkProvider === 'google.com' ? 'Google' : 'GitHub'}`}
                  </motion.button>
                </div>
              )}
              
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setPendingCred(null);
                }}
                className="mt-6 w-full text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
