import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, LogOut, PlusCircle, User, ShieldCheck, Search, Home } from 'lucide-react';
import { LiquidButton } from '../ui/LiquidButton';

export function Navbar() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  const isDefaultAdmin = currentUser?.email === 'pkskkumar900@gmail.com';
  const isAdmin = userProfile?.role === 'admin' || isDefaultAdmin;

  return (
    <nav className="hidden md:block sticky top-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-xl bg-[rgba(255,255,255,0.06)] border border-white/10 group-hover:border-[#00E5FF]/50 transition-colors shadow-[0_0_15px_rgba(0,229,255,0.1)] group-hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                <Building2 className="h-6 w-6 text-[#00E5FF]" />
              </div>
              <span className="text-xl font-bold text-white tracking-wide">City Helpline</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/') ? 'text-[#00E5FF]' : 'text-gray-400 hover:text-white'}`}
            >
              <Home className="h-5 w-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              to="/search"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/search') ? 'text-[#00E5FF]' : 'text-gray-400 hover:text-white'}`}
            >
              <Search className="h-5 w-5" />
              <span className="hidden sm:inline">Search</span>
            </Link>

            {currentUser ? (
              <>
                <Link
                  to="/add-listing"
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/add-listing') ? 'text-[#00E5FF]' : 'text-gray-400 hover:text-white'}`}
                >
                  <PlusCircle className="h-5 w-5" />
                  <span className="hidden sm:inline">Add Listing</span>
                </Link>
                
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/admin') ? 'text-[#00E5FF]' : 'text-gray-400 hover:text-white'}`}
                  >
                    <ShieldCheck className="h-5 w-5" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}

                <div className="flex items-center gap-3 ml-2 pl-6 border-l border-white/10">
                  <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <User className="h-5 w-5" />
                    <span className="hidden sm:inline font-medium">{userProfile?.name || 'Profile'}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-[#FF3B3B] transition-colors rounded-full hover:bg-[rgba(255,255,255,0.06)]"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link to="/signup">
                  <LiquidButton variant="primary" className="py-2 px-6 text-sm">
                    Sign up
                  </LiquidButton>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
