import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, LogOut, Settings, PlusCircle, Building2, MapPin, List, Star, ArrowLeft, Search } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import AccountSettings from '../components/AccountSettings';

export default function Profile() {
  const { currentUser, userProfile, logout } = useAuth();
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'saved' | 'settings'>('listings');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListings = async () => {
      if (!currentUser) return;
      
      try {
        // Fetch My Listings
        const qMy = query(
          collection(db, 'listings'),
          where('authorId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshotMy = await getDocs(qMy);
        const dataMy = snapshotMy.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
        setMyListings(dataMy);

        // Fetch Saved Listings
        if (userProfile?.savedListings && userProfile.savedListings.length > 0) {
          // Firestore 'in' query supports max 10 items. For simplicity, we'll fetch all and filter client-side if > 10,
          // or just fetch the ones we need. Since this is a demo, we'll fetch all listings and filter.
          const qAll = query(collection(db, 'listings'));
          const snapshotAll = await getDocs(qAll);
          const dataAll = snapshotAll.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
          const saved = dataAll.filter(listing => userProfile.savedListings?.includes(listing.id));
          setSavedListings(saved);
        } else {
          setSavedListings([]);
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [currentUser, userProfile?.savedListings]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <GlassCard className="p-8 text-center max-w-md w-full" intensity="low">
          <User className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Not Logged In</h2>
          <p className="text-gray-400 mb-6">Please log in to view your profile and manage your listings.</p>
          <Link to="/login" className="block w-full py-3 bg-[#00E5FF] hover:bg-[#00E5FF]/80 text-black rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(0,229,255,0.4)]">
            Log In
          </Link>
        </GlassCard>
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
          <motion.div 
            whileHover={{ y: -5 }}
            className="sticky top-24 relative overflow-hidden"
          >
            <GlassCard className="p-8" intensity="low">
              {/* Background Glow */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#00E5FF]/20 to-transparent pointer-events-none"></div>

              <div className="flex flex-col items-center text-center mb-8 relative z-10">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#00E5FF] to-[#8A2BE2] rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative h-28 w-28 bg-[rgba(255,255,255,0.06)] rounded-full flex items-center justify-center shadow-2xl overflow-hidden border-2 border-white/10 backdrop-blur-md">
                    {userProfile?.photoURL ? (
                      <img src={userProfile.photoURL} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#00E5FF] to-[#8A2BE2]">
                        {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-white mt-6 mb-1 tracking-tight">{userProfile?.name}</h2>
                <p className="text-gray-400 font-medium">{userProfile?.email}</p>
                <div className="mt-4 px-4 py-1.5 bg-[#00E5FF]/10 rounded-full text-sm font-semibold text-[#00E5FF] border border-[#00E5FF]/20 shadow-[0_0_15px_rgba(0,229,255,0.15)]">
                  {userProfile?.role === 'admin' ? 'Administrator' : 'User'}
                </div>
              </div>

              <div className="space-y-3 border-t border-white/10 pt-8 relative z-10">
                {userProfile?.role === 'contributor' && (
                  <Link to="/add-listing" className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-[rgba(255,255,255,0.06)] text-gray-400 hover:text-white transition-all duration-300">
                    <div className="p-2 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] group-hover:bg-[#00E5FF] group-hover:text-black transition-colors shadow-[0_0_10px_rgba(0,229,255,0.2)]">
                      <PlusCircle className="h-5 w-5" />
                    </div>
                    <span className="font-semibold">Add New Listing</span>
                  </Link>
                )}
                {userProfile?.role === 'contributor' && (
                  <button 
                    onClick={() => setActiveTab('listings')}
                    className={`w-full group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${activeTab === 'listings' ? 'bg-[rgba(0,229,255,0.1)] text-white border border-[#00E5FF]/20 shadow-[0_0_15px_rgba(0,229,255,0.1)]' : 'hover:bg-[rgba(255,255,255,0.06)] text-gray-400 hover:text-white'}`}
                  >
                    <div className={`p-2 rounded-xl transition-colors ${activeTab === 'listings' ? 'bg-[#00E5FF] text-black shadow-[0_0_10px_rgba(0,229,255,0.5)]' : 'bg-[rgba(255,255,255,0.06)] text-gray-400 group-hover:bg-[rgba(255,255,255,0.1)] group-hover:text-white'}`}>
                      <List className="h-5 w-5" />
                    </div>
                    <span className="font-semibold">My Listings</span>
                  </button>
                )}
                <button 
                  onClick={() => setActiveTab('saved')}
                  className={`w-full group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${activeTab === 'saved' ? 'bg-[rgba(0,229,255,0.1)] text-white border border-[#00E5FF]/20 shadow-[0_0_15px_rgba(0,229,255,0.1)]' : 'hover:bg-[rgba(255,255,255,0.06)] text-gray-400 hover:text-white'}`}
                >
                  <div className={`p-2 rounded-xl transition-colors ${activeTab === 'saved' ? 'bg-[#00E5FF] text-black shadow-[0_0_10px_rgba(0,229,255,0.5)]' : 'bg-[rgba(255,255,255,0.06)] text-gray-400 group-hover:bg-[rgba(255,255,255,0.1)] group-hover:text-white'}`}>
                    <Star className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">Saved Listings</span>
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`w-full group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${activeTab === 'settings' ? 'bg-[rgba(0,229,255,0.1)] text-white border border-[#00E5FF]/20 shadow-[0_0_15px_rgba(0,229,255,0.1)]' : 'hover:bg-[rgba(255,255,255,0.06)] text-gray-400 hover:text-white'}`}
                >
                  <div className={`p-2 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-[#00E5FF] text-black shadow-[0_0_10px_rgba(0,229,255,0.5)]' : 'bg-[rgba(255,255,255,0.06)] text-gray-400 group-hover:bg-[rgba(255,255,255,0.1)] group-hover:text-white'}`}>
                    <Settings className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">Account Settings</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full group flex items-center gap-4 p-4 rounded-2xl hover:bg-[#FF3B3B]/10 text-gray-400 hover:text-[#FF3B3B] transition-all duration-300 mt-2"
                >
                  <div className="p-2 rounded-xl bg-[rgba(255,255,255,0.06)] text-gray-400 group-hover:bg-[#FF3B3B]/20 group-hover:text-[#FF3B3B] transition-colors">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">Log Out</span>
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'settings' ? (
            <AccountSettings />
          ) : activeTab === 'saved' ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">Saved Listings</h2>
                <span className="bg-[#00E5FF]/10 text-[#00E5FF] py-1.5 px-4 rounded-full text-sm font-semibold border border-[#00E5FF]/20 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                  {savedListings.length} Total
                </span>
              </div>

              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="glass-card rounded-3xl h-40 animate-pulse bg-[rgba(255,255,255,0.05)] border border-white/10"></div>
                  ))}
                </div>
              ) : savedListings.length > 0 ? (
                <div className="space-y-6">
                  {savedListings.map((listing, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                      key={listing.id}
                    >
                      <GlassCard className="p-5 flex flex-col sm:flex-row gap-6 hover:border-white/20 transition-all duration-300 group" intensity="low">
                        <div className="w-full sm:w-48 h-48 sm:h-auto rounded-2xl overflow-hidden flex-shrink-0 bg-[rgba(255,255,255,0.06)] relative">
                          {listing.images && listing.images.length > 0 ? (
                            <>
                              <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D]/80 via-transparent to-transparent"></div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[rgba(255,255,255,0.06)]">
                              <Building2 className="h-10 w-10 text-gray-600" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-grow flex flex-col justify-between py-2">
                          <div>
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-[#00E5FF] transition-colors">{listing.title}</h3>
                                <div className="flex items-center mt-2 space-x-3">
                                  <div className="flex items-center bg-[rgba(255,255,255,0.06)] px-2 py-1 rounded-lg border border-white/10">
                                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 mr-1.5" />
                                    <span className="text-white text-xs font-bold">
                                      {listing.averageRating ? listing.averageRating.toFixed(1) : 'New'}
                                    </span>
                                    {listing.reviewCount !== undefined && listing.reviewCount > 0 && (
                                      <span className="text-gray-400 text-xs ml-1.5">({listing.reviewCount})</span>
                                    )}
                                  </div>
                                  <div className="flex items-center text-gray-400 text-sm bg-[rgba(255,255,255,0.06)] px-2 py-1 rounded-lg border border-white/10">
                                    <MapPin className="h-3.5 w-3.5 mr-1" />
                                    {listing.city}
                                  </div>
                                </div>
                              </div>
                              <span className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap shadow-sm ${
                                listing.status === 'approved' ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20' : 
                                listing.status === 'rejected' ? 'bg-[#FF3B3B]/10 text-[#FF3B3B] border border-[#FF3B3B]/20' : 
                                'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              }`}>
                                {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm mt-4 line-clamp-2 leading-relaxed">{listing.description}</p>
                          </div>
                          
                          <div className="flex items-center justify-end mt-6">
                            <Link to={`/listing/${listing.id}`} className="inline-flex items-center justify-center px-4 py-2 bg-[rgba(255,255,255,0.06)] hover:bg-[#00E5FF]/20 hover:text-[#00E5FF] border border-white/10 hover:border-[#00E5FF]/50 text-white text-sm font-semibold rounded-xl transition-all duration-300">
                              View Details
                              <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                            </Link>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card rounded-3xl p-16 text-center border-dashed border-2 border-white/10 relative overflow-hidden"
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00E5FF]/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#00E5FF]/20 to-[#8A2BE2]/20 rounded-full blur-xl animate-pulse"></div>
                      <div className="h-24 w-24 bg-[rgba(255,255,255,0.05)] backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(0,229,255,0.1)] relative z-10">
                        <Star className="h-10 w-10 text-[#00E5FF]" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-extrabold text-white mb-3 tracking-tight">No saved listings</h3>
                    <p className="text-gray-400 max-w-md mx-auto text-base leading-relaxed mb-8">You haven't saved any listings yet. Explore the city and save your favorites!</p>
                    <Link to="/search" className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#00E5FF] to-[#8A2BE2] hover:from-[#8A2BE2] hover:to-[#00E5FF] text-white rounded-2xl font-bold shadow-[0_5px_15px_rgba(0,229,255,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.5)] transition-all hover:scale-105">
                      <Search className="h-5 w-5" />
                      Explore Listings
                    </Link>
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">My Listings</h2>
                <span className="bg-[#00E5FF]/10 text-[#00E5FF] py-1.5 px-4 rounded-full text-sm font-semibold border border-[#00E5FF]/20 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                  {myListings.length} Total
                </span>
              </div>

              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="glass-card rounded-3xl h-40 animate-pulse bg-[rgba(255,255,255,0.02)] border border-white/10"></div>
                  ))}
                </div>
              ) : myListings.length > 0 ? (
                <div className="space-y-6">
                  {myListings.map((listing, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                      key={listing.id}
                      className="glass-card rounded-3xl p-5 flex flex-col sm:flex-row gap-6 hover:border-white/20 transition-all duration-300 group"
                    >
                      <div className="w-full sm:w-48 h-48 sm:h-auto rounded-2xl overflow-hidden flex-shrink-0 bg-[rgba(255,255,255,0.06)] relative">
                        {listing.images && listing.images.length > 0 ? (
                          <>
                            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D]/80 via-transparent to-transparent"></div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[rgba(255,255,255,0.06)]">
                            <Building2 className="h-10 w-10 text-gray-600" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-grow flex flex-col justify-between py-2">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-[#00E5FF] transition-colors">{listing.title}</h3>
                              <div className="flex items-center mt-2 space-x-3">
                                <div className="flex items-center bg-[rgba(255,255,255,0.06)] px-2 py-1 rounded-lg border border-white/10">
                                  <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 mr-1.5" />
                                  <span className="text-white text-xs font-bold">
                                    {listing.averageRating ? listing.averageRating.toFixed(1) : 'New'}
                                  </span>
                                  {listing.reviewCount !== undefined && listing.reviewCount > 0 && (
                                    <span className="text-gray-400 text-xs ml-1.5">({listing.reviewCount})</span>
                                  )}
                                </div>
                                <div className="flex items-center text-gray-400 text-sm bg-[rgba(255,255,255,0.06)] px-2 py-1 rounded-lg border border-white/10">
                                  <MapPin className="h-3.5 w-3.5 mr-1" />
                                  {listing.city}
                                </div>
                              </div>
                            </div>
                            <span className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap shadow-sm ${
                              listing.status === 'approved' ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20' : 
                              listing.status === 'rejected' ? 'bg-[#FF3B3B]/10 text-[#FF3B3B] border border-[#FF3B3B]/20' : 
                              'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mt-4 line-clamp-2 leading-relaxed">{listing.description}</p>
                        </div>
                        
                        <div className="flex items-center justify-end mt-6">
                          <Link to={`/listing/${listing.id}`} className="inline-flex items-center justify-center px-4 py-2 bg-[rgba(255,255,255,0.06)] hover:bg-[#00E5FF]/20 hover:text-[#00E5FF] border border-white/10 hover:border-[#00E5FF]/50 text-white text-sm font-semibold rounded-xl transition-all duration-300">
                            View Details
                            <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card rounded-3xl p-16 text-center border-dashed border-2 border-white/10 relative overflow-hidden"
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00E5FF]/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#00E5FF]/20 to-[#8A2BE2]/20 rounded-full blur-xl animate-pulse"></div>
                      <div className="h-24 w-24 bg-[rgba(255,255,255,0.05)] backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(0,229,255,0.1)] relative z-10">
                        <List className="h-10 w-10 text-[#00E5FF]" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-extrabold text-white mb-3 tracking-tight">No listings yet</h3>
                    <p className="text-gray-400 max-w-md mx-auto text-base leading-relaxed mb-8">You haven't created any listings. Share your services with the city and start reaching more people!</p>
                    <Link to="/add-listing" className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#00E5FF] to-[#8A2BE2] hover:from-[#8A2BE2] hover:to-[#00E5FF] text-white rounded-2xl font-bold shadow-[0_5px_15px_rgba(0,229,255,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.5)] transition-all hover:scale-105">
                      <PlusCircle className="h-5 w-5" />
                      Create Your First Listing
                    </Link>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
