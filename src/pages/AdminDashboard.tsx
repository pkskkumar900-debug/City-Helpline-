import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';

import { CheckCircle, XCircle, Trash2, Star, Users, Building, Shield, Search, Ban, Edit } from 'lucide-react';
import { motion } from 'motion/react';
import { CATEGORIES, STATE_CITIES } from '../lib/constants';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { currentUser, userProfile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'users'>('listings');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  const [listingSearch, setListingSearch] = useState('');
  const [listingCity, setListingCity] = useState('');
  const [listingCategory, setListingCategory] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const fetchData = async () => {
    const isDefaultAdmin = currentUser?.email === 'pkskkumar900@gmail.com';
    if (!currentUser || (userProfile?.role !== 'admin' && !isDefaultAdmin)) return;

    setLoading(true);
    try {
      // Fetch Listings
      const listingsQuery = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
      const listingsSnap = await getDocs(listingsQuery);
      setListings(listingsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Listing[]);

      // Fetch Users
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const usersSnap = await getDocs(usersQuery);
      setUsers(usersSnap.docs.map(d => ({ uid: d.id, ...d.data() })) as UserProfile[]);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && (userProfile?.role === 'admin' || currentUser.email === 'pkskkumar900@gmail.com')) {
      fetchData();
    }
  }, [currentUser, userProfile]);

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'listings', id), { status });
      setListings(listings.map(l => l.id === id ? { ...l, status } : l));
      toast.success(`Listing ${status} successfully`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      await updateDoc(doc(db, 'listings', id), { featured: !currentFeatured });
      setListings(listings.map(l => l.id === id ? { ...l, featured: !currentFeatured } : l));
      toast.success(`Listing ${!currentFeatured ? 'featured' : 'unfeatured'} successfully`);
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast.error("Failed to toggle featured status");
    }
  };

  const handleDeleteListing = async (id: string) => {
    toast('Are you sure you want to delete this listing?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteDoc(doc(db, 'listings', id));
            setListings(listings.filter(l => l.id !== id));
            toast.success("Listing deleted successfully");
          } catch (error) {
            console.error("Error deleting listing:", error);
            toast.error("Failed to delete listing");
          }
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      }
    });
  };

  const handleRoleChange = async (uid: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole as any } : u));
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update user role");
    }
  };

  const handleDeleteUser = async (uid: string) => {
    toast('Are you sure you want to delete this user? This action cannot be undone.', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteDoc(doc(db, 'users', uid));
            setUsers(users.filter(u => u.uid !== uid));
            toast.success("User deleted successfully");
          } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Failed to delete user");
          }
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      }
    });
  };

  const handleBanUser = async (uid: string, currentBanned: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { banned: !currentBanned });
      setUsers(users.map(u => u.uid === uid ? { ...u, banned: !currentBanned } : u));
      toast.success(`User ${!currentBanned ? 'banned' : 'unbanned'} successfully`);
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("Failed to update user ban status");
    }
  };

  const isDefaultAdmin = currentUser?.email === 'pkskkumar900@gmail.com';
  if (!currentUser || (userProfile?.role !== 'admin' && !isDefaultAdmin)) {
    return <Navigate to="/" />;
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  const pendingCount = listings.filter(l => l.status === 'pending').length;
  const contributorsCount = users.filter(u => u.role === 'contributor').length;

  const filteredListings = listings.filter(l => {
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchesCity = listingCity === '' || l.city === listingCity;
    const matchesCategory = listingCategory === '' || l.category === listingCategory;
    const matchesSearch = listingSearch === '' || 
      l.title.toLowerCase().includes(listingSearch.toLowerCase()) || 
      l.authorName.toLowerCase().includes(listingSearch.toLowerCase());
    return matchesStatus && matchesCity && matchesCategory && matchesSearch;
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = userSearch === '' || 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    return matchesSearch;
  });

  const cityOptions = Object.entries(STATE_CITIES).flatMap(([state, cities]) => cities);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20 md:pb-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#00E5FF] to-[#8A2BE2] rounded-2xl shadow-[0_0_20px_rgba(0,229,255,0.3)]">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm font-medium mt-1">Manage your platform's content and users</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 bg-[rgba(255,255,255,0.05)] backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(0,229,255,0.05)]">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#8A2BE2] flex items-center justify-center overflow-hidden">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="Admin" className="h-full w-full object-cover" />
              ) : (
                <span className="text-white font-bold">{userProfile?.name?.charAt(0) || 'A'}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{userProfile?.name || 'Admin'}</p>
              <p className="text-xs text-[#00E5FF] font-medium">System Administrator</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-3xl p-6 relative overflow-hidden group border border-white/10"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-[#00E5FF]/10 rounded-full blur-2xl group-hover:bg-[#00E5FF]/20 transition-colors"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="p-3 bg-[#00E5FF]/10 text-[#00E5FF] rounded-xl border border-[#00E5FF]/20">
                <Building className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-1 rounded-lg border border-[#00E5FF]/20">+12%</span>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Listings</p>
              <p className="text-4xl font-extrabold text-white">{listings.length}</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-3xl p-6 relative overflow-hidden group border border-white/10"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-colors"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/20">
                <CheckCircle className="h-6 w-6" />
              </div>
              {pendingCount > 0 && <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">Action Needed</span>}
            </div>
            <div className="relative z-10">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Pending Approval</p>
              <p className="text-4xl font-extrabold text-white">{pendingCount}</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-3xl p-6 relative overflow-hidden group border border-white/10"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-[#8A2BE2]/10 rounded-full blur-2xl group-hover:bg-[#8A2BE2]/20 transition-colors"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="p-3 bg-[#8A2BE2]/10 text-[#8A2BE2] rounded-xl border border-[#8A2BE2]/20">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Users</p>
              <p className="text-4xl font-extrabold text-white">{users.length}</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-3xl p-6 relative overflow-hidden group border border-white/10"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-[#FF3B3B]/10 rounded-full blur-2xl group-hover:bg-[#FF3B3B]/20 transition-colors"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="p-3 bg-[#FF3B3B]/10 text-[#FF3B3B] rounded-xl border border-[#FF3B3B]/20">
                <Star className="h-6 w-6" />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Contributors</p>
              <p className="text-4xl font-extrabold text-white">{contributorsCount}</p>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex bg-[rgba(255,255,255,0.05)] backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(0,229,255,0.05)]">
            <button
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'listings' ? 'bg-[#00E5FF] text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              onClick={() => setActiveTab('listings')}
            >
              Manage Listings
            </button>
            <button
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'users' ? 'bg-[#00E5FF] text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              onClick={() => setActiveTab('users')}
            >
              Manage Users
            </button>
          </div>
          
          {activeTab === 'listings' && (
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              <div className="flex bg-[rgba(255,255,255,0.05)] backdrop-blur-md rounded-xl p-1.5 border border-white/10 flex-grow lg:flex-grow-0 shadow-[0_0_15px_rgba(0,229,255,0.05)]">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`flex-1 lg:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${statusFilter === 'all' ? 'bg-[rgba(255,255,255,0.1)] text-white shadow-md border border-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`flex-1 lg:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${statusFilter === 'pending' ? 'bg-yellow-500/20 text-yellow-400 shadow-md border border-yellow-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('approved')}
                  className={`flex-1 lg:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${statusFilter === 'approved' ? 'bg-[#00E5FF]/20 text-[#00E5FF] shadow-md border border-[#00E5FF]/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setStatusFilter('rejected')}
                  className={`flex-1 lg:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${statusFilter === 'rejected' ? 'bg-[#FF3B3B]/20 text-[#FF3B3B] shadow-md border border-[#FF3B3B]/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  Rejected
                </button>
              </div>
              <Link
                to="/add-listing"
                className="px-5 py-2.5 bg-gradient-to-r from-[#00E5FF] to-[#8A2BE2] hover:from-[#8A2BE2] hover:to-[#00E5FF] text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-[0_5px_15px_rgba(0,229,255,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.5)] hover:scale-105 whitespace-nowrap"
              >
                + Create Listing
              </Link>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          {activeTab === 'listings' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00E5FF] to-[#8A2BE2] rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative flex items-center bg-[rgba(255,255,255,0.05)] rounded-xl border border-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                  <Search className="absolute left-4 h-5 w-5 text-gray-400 group-focus-within:text-[#00E5FF] transition-colors" />
                  <input
                    type="text"
                    placeholder="Search listings..."
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-sm bg-transparent text-white placeholder-gray-500 focus:outline-none focus:ring-0 rounded-xl"
                  />
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00E5FF] to-[#8A2BE2] rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <select
                  value={listingCategory}
                  onChange={(e) => setListingCategory(e.target.value)}
                  className="relative w-full px-4 py-3 text-sm bg-[rgba(255,255,255,0.05)] border border-white/10 text-white rounded-xl focus:outline-none focus:ring-0 appearance-none backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] [&>option]:bg-[#0B0E14]"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00E5FF] to-[#8A2BE2] rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <select
                  value={listingCity}
                  onChange={(e) => setListingCity(e.target.value)}
                  className="relative w-full px-4 py-3 text-sm bg-[rgba(255,255,255,0.05)] border border-white/10 text-white rounded-xl focus:outline-none focus:ring-0 appearance-none backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] [&>option]:bg-[#0B0E14]"
                >
                  <option value="">All Cities</option>
                  {cityOptions.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="relative max-w-md group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00E5FF] to-[#8A2BE2] rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative flex items-center bg-[rgba(255,255,255,0.05)] rounded-xl border border-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                <Search className="absolute left-4 h-5 w-5 text-gray-400 group-focus-within:text-[#00E5FF] transition-colors" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-sm bg-transparent text-white placeholder-gray-500 focus:outline-none focus:ring-0 rounded-xl"
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-3xl overflow-hidden border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
        >
          {activeTab === 'listings' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[rgba(255,255,255,0.02)] border-b border-white/10">
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Listing</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Category</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">City</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[rgba(0,0,0,0.2)]">
                  {filteredListings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-[rgba(255,255,255,0.05)] flex-shrink-0 overflow-hidden border border-white/10">
                            {listing.images && listing.images.length > 0 ? (
                              <img src={listing.images[0]} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Building className="h-6 w-6 m-3 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#00E5FF] transition-colors">{listing.title}</p>
                            <p className="text-xs font-medium text-gray-500 mt-0.5">by {listing.authorName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-300">
                        {listing.category}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-300">
                        {listing.city}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-2 items-start">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                            listing.status === 'approved' ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20' : 
                            listing.status === 'rejected' ? 'bg-[#FF3B3B]/10 text-[#FF3B3B] border border-[#FF3B3B]/20' : 
                            'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}>
                            {listing.status}
                          </span>
                          {listing.featured && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#00E5FF]/20 to-[#8A2BE2]/20 text-[#00E5FF] border border-[#00E5FF]/20">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {listing.status !== 'approved' && (
                            <button onClick={() => handleStatusChange(listing.id, 'approved')} className="p-2 text-[#00E5FF] hover:bg-[#00E5FF]/20 rounded-xl transition-all hover:scale-110" title="Approve">
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                          {listing.status !== 'rejected' && (
                            <button onClick={() => handleStatusChange(listing.id, 'rejected')} className="p-2 text-[#FF3B3B] hover:bg-[#FF3B3B]/20 rounded-xl transition-all hover:scale-110" title="Reject">
                              <XCircle className="h-5 w-5" />
                            </button>
                          )}
                          <button onClick={() => handleToggleFeatured(listing.id, listing.featured)} className={`p-2 rounded-xl transition-all hover:scale-110 ${listing.featured ? 'text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/20' : 'text-gray-400 hover:bg-[rgba(255,255,255,0.05)]'}`} title="Toggle Featured">
                            <Star className={`h-5 w-5 ${listing.featured ? 'fill-[#00E5FF]' : ''}`} />
                          </button>
                          <Link to={`/edit-listing/${listing.id}`} className="p-2 text-gray-400 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 rounded-xl transition-all hover:scale-110" title="Edit">
                            <Edit className="h-5 w-5" />
                          </Link>
                          <button onClick={() => handleDeleteListing(listing.id)} className="p-2 text-gray-400 hover:text-[#FF3B3B] hover:bg-[#FF3B3B]/10 rounded-xl transition-all hover:scale-110" title="Delete">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredListings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="relative mb-4">
                            <div className="absolute inset-0 bg-[#00E5FF]/20 rounded-full blur-xl animate-pulse"></div>
                            <div className="h-16 w-16 bg-[rgba(255,255,255,0.05)] backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(0,229,255,0.1)] relative z-10">
                              <Search className="h-8 w-8 text-gray-400" />
                            </div>
                          </div>
                          <p className="text-lg font-bold text-white mb-1">No listings found</p>
                          <p className="text-sm font-medium text-gray-500">Try adjusting your search or filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900/80 border-b border-gray-800/60">
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Contact</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Role</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Joined</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 bg-gray-900/30">
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className={`hover:bg-gray-800/40 transition-colors group ${user.banned ? 'opacity-50 bg-red-900/5' : ''}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold border border-gray-600">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white flex items-center gap-2">
                              {user.name}
                              {user.banned && <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-red-500/20">Banned</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-medium text-gray-300">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{user.city || 'No city specified'}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="relative">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                            className={`w-full px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                              user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                              user.role === 'contributor' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              'bg-gray-800 text-gray-300 border-gray-700'
                            }`}
                          >
                            <option value="user">User</option>
                            <option value="contributor">Contributor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleBanUser(user.uid, user.banned || false)} 
                            className={`p-2 rounded-xl transition-all hover:scale-110 ${user.banned ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-yellow-400 hover:bg-yellow-500/10'}`}
                            title={user.banned ? "Unban User" : "Ban User"}
                          >
                            <Ban className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.uid)} 
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all hover:scale-110"
                            title="Delete User"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="relative mb-4">
                            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
                            <div className="h-16 w-16 bg-gray-800/80 backdrop-blur-xl rounded-full flex items-center justify-center border border-gray-700/50 shadow-xl relative z-10">
                              <Users className="h-8 w-8 text-gray-400" />
                            </div>
                          </div>
                          <p className="text-lg font-bold text-white mb-1">No users found</p>
                          <p className="text-sm font-medium text-gray-500">Try adjusting your search criteria.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
