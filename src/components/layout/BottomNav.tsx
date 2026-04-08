import { Link, useLocation } from 'react-router-dom';
import { Home, Search, List, User, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';

export function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  const { currentUser, userProfile } = useAuth();
  
  const isDefaultAdmin = currentUser?.email === 'pkskkumar900@gmail.com';
  const isAdmin = userProfile?.role === 'admin' || isDefaultAdmin;

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: List, label: 'Listings', path: '/add-listing' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  if (isAdmin) {
    navItems.splice(3, 0, { icon: ShieldCheck, label: 'Admin', path: '/admin' });
  }

  return (
    <div className="md:hidden fixed bottom-0 w-full glass-bottom-nav z-50 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = path === item.path || (item.path !== '/' && path.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute top-0 w-12 h-1 bg-[#00E5FF] rounded-b-full shadow-[0_0_10px_rgba(0,229,255,0.5)]"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                className={`h-6 w-6 mb-1 transition-colors ${
                  isActive ? 'text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]' : 'text-gray-500'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-[#00E5FF]' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
