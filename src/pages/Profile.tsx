import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, LogOut, Settings, PlusCircle, Building2, MapPin, List, Star, ArrowLeft } from 'lucide-react';
import AccountSettings from '../components/AccountSettings';

export default function Profile() {
  const { currentUser, userProfile, logout } = useAuth();
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'settings'>('listings');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyListings = async () => {
      if (!currentUser) return;
      
      try {
        const q = query(
          collection(db, 'listings'),
          where('authorId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
        setMyListings(data);
      } catch (error) {
        console.error('Error fetching user listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyListings();
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="glass-card p-8 rounded-2xl text-center max-w-md w-full">
          <User className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Not Logged In</h2>
          <p className="text-gray-400 mb-6">Please log in to view your profile and manage your listings.</p>
          <Link to="/login" className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 md:mb-0"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-2xl p-6 sticky top-24">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20 overflow-hidden relative">
                {userProfile?.photoURL ? (
                  <img src={userProfile.photoURL} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white">{userProfile?.name}</h2>
              <p className="text-gray-400">{userProfile?.email}</p>
              <div className="mt-2 px-3 py-1 bg-gray-800 rounded-full text-xs font-medium text-blue-400 border border-gray-700">
                {userProfile?.role === 'admin' ? 'Administrator' : 'User'}
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-700 pt-6">
              <Link to="/add-listing" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/50 text-gray-300 hover:text-white transition-colors">
                <PlusCircle className="h-5 w-5 text-blue-400" />
                <span className="font-medium">Add New Listing</span>
              </Link>
              <button 
                onClick={() => setActiveTab(activeTab === 'settings' ? 'listings' : 'settings')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-800/50 text-gray-300 hover:text-white'}`}
              >
                {activeTab === 'settings' ? <ArrowLeft className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
                <span className="font-medium">{activeTab === 'settings' ? 'Back to Listings' : 'Account Settings'}</span>
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-colors mt-4"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Log Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'settings' ? (
            <AccountSettings />
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">My Listings</h2>
                <span className="bg-blue-600/20 text-blue-400 py-1 px-3 rounded-full text-sm font-medium border border-blue-500/20">
                  {myListings.length} Total
                </span>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="glass-card rounded-xl h-32 animate-pulse"></div>
                  ))}
                </div>
              ) : myListings.length > 0 ? (
                <div className="space-y-4">
                  {myListings.map((listing, index) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      key={listing.id}
                      className="glass-card rounded-xl p-4 flex flex-col sm:flex-row gap-4 hover:border-gray-600 transition-colors"
                    >
                      <div className="w-full sm:w-32 h-32 sm:h-auto rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                        {listing.images && listing.images.length > 0 ? (
                          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-gray-600" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-bold text-white line-clamp-1">{listing.title}</h3>
                              <div className="flex items-center mt-1">
                                <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 mr-1" />
                                <span className="text-white text-xs font-bold">
                                  {listing.averageRating ? listing.averageRating.toFixed(1) : 'New'}
                                </span>
                                {listing.reviewCount !== undefined && listing.reviewCount > 0 && (
                                  <span className="text-gray-400 text-xs ml-1">({listing.reviewCount})</span>
                                )}
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ml-2 ${
                              listing.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 
                              listing.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 
                              'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{listing.description}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center text-gray-500 text-sm">
                            <MapPin className="h-4 w-4 mr-1" />
                            {listing.city}
                          </div>
                          <Link to={`/listing/${listing.id}`} className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                            View Details →
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <div className="h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <List className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No listings yet</h3>
                  <p className="text-gray-400 mb-6">You haven't created any listings. Share your services with the city!</p>
                  <Link to="/add-listing" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
                    <PlusCircle className="h-5 w-5" />
                    Create Listing
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
