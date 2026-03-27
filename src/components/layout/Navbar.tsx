import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, LogOut, PlusCircle, User, ShieldCheck, Search, Home } from 'lucide-react';

export function Navbar() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="hidden md:block glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-white">City Helpline</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/') ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`}
            >
              <Home className="h-5 w-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              to="/search"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/search') ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`}
            >
              <Search className="h-5 w-5" />
              <span className="hidden sm:inline">Search</span>
            </Link>

            {currentUser ? (
              <>
                <Link
                  to="/add-listing"
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/add-listing') ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`}
                >
                  <PlusCircle className="h-5 w-5" />
                  <span className="hidden sm:inline">Add Listing</span>
                </Link>
                
                {userProfile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/admin') ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`}
                  >
                    <ShieldCheck className="h-5 w-5" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}

                <div className="flex items-center gap-3 ml-2 pl-6 border-l border-gray-700">
                  <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-300 hover:text-blue-400 transition-colors">
                    <User className="h-5 w-5" />
                    <span className="hidden sm:inline font-medium">{userProfile?.name || 'Profile'}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-gray-700"
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
                  className="text-sm font-medium text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
