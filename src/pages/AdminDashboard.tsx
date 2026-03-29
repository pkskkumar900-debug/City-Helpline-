import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';

import { CheckCircle, XCircle, Trash2, Star, Users, Building, Shield, Search, Ban, Edit } from 'lucide-react';
import { motion } from 'motion/react';
import { CATEGORIES, STATE_CITIES } from '../lib/constants';

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
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      await updateDoc(doc(db, 'listings', id), { featured: !currentFeatured });
      setListings(listings.map(l => l.id === id ? { ...l, featured: !currentFeatured } : l));
    } catch (error) {
      console.error("Error toggling featured:", error);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await deleteDoc(doc(db, 'listings', id));
      setListings(listings.filter(l => l.id !== id));
    } catch (error) {
      console.error("Error deleting listing:", error);
    }
  };

  const handleRoleChange = async (uid: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole as any } : u));
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      setUsers(users.filter(u => u.uid !== uid));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleBanUser = async (uid: string, currentBanned: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { banned: !currentBanned });
      setUsers(users.map(u => u.uid === uid ? { ...u, banned: !currentBanned } : u));
    } catch (error) {
      console.error("Error banning user:", error);
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
      className="min-h-screen bg-[#0B0E14] pb-20 md:pb-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-blue-600/20 rounded-lg border border-blue-500/30">
            <Shield className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Admin Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-[#151A23] border border-gray-800/60 p-5 rounded-xl flex items-center gap-4"
          >
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Listings</p>
              <p className="text-2xl font-bold text-gray-100">{listings.length}</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-[#151A23] border border-gray-800/60 p-5 rounded-xl flex items-center gap-4"
          >
            <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-bold text-gray-100">{pendingCount}</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-[#151A23] border border-gray-800/60 p-5 rounded-xl flex items-center gap-4"
          >
            <div className="p-3 bg-green-500/10 text-green-400 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Users</p>
              <p className="text-2xl font-bold text-gray-100">{users.length}</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-[#151A23] border border-gray-800/60 p-5 rounded-xl flex items-center gap-4"
          >
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contributors</p>
              <p className="text-2xl font-bold text-gray-100">{contributorsCount}</p>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-800/60 pb-4">
          <div className="flex gap-6">
            <button
              className={`pb-4 -mb-[17px] font-medium text-sm transition-all border-b-2 ${activeTab === 'listings' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
              onClick={() => setActiveTab('listings')}
            >
              Manage Listings
            </button>
            <button
              className={`pb-4 -mb-[17px] font-medium text-sm transition-all border-b-2 ${activeTab === 'users' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
              onClick={() => setActiveTab('users')}
            >
              Manage Users
            </button>
          </div>
          
          {activeTab === 'listings' && (
            <div className="flex items-center gap-3">
              <Link
                to="/add-listing"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                + Create Listing
              </Link>
              <div className="flex bg-[#1A202C] rounded-lg p-1 border border-gray-800/60">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:text-white'}`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('approved')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === 'approved' ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white'}`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setStatusFilter('rejected')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === 'rejected' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white'}`}
                >
                  Rejected
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          {activeTab === 'listings' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-[#151A23] border border-gray-800/60 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <select
                value={listingCategory}
                onChange={(e) => setListingCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#151A23] border border-gray-800/60 text-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={listingCity}
                onChange={(e) => setListingCity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#151A23] border border-gray-800/60 text-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">All Cities</option>
                {cityOptions.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-[#151A23] border border-gray-800/60 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#151A23] border border-gray-800/60 rounded-xl overflow-hidden"
        >
          {activeTab === 'listings' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1A202C] border-b border-gray-800/60">
                    <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Listing</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">City</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredListings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-gray-800/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-gray-800 flex-shrink-0 overflow-hidden">
                            {listing.images && listing.images.length > 0 ? (
                              <img src={listing.images[0]} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Building className="h-5 w-5 m-2.5 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200 line-clamp-1">{listing.title}</p>
                            <p className="text-xs text-gray-500">by {listing.authorName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {listing.category}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {listing.city}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          listing.status === 'approved' ? 'bg-green-500/10 text-green-400' : 
                          listing.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 
                          'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </span>
                        {listing.featured && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {listing.status !== 'approved' && (
                            <button onClick={() => handleStatusChange(listing.id, 'approved')} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded transition-colors" title="Approve">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {listing.status !== 'rejected' && (
                            <button onClick={() => handleStatusChange(listing.id, 'rejected')} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Reject">
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => handleToggleFeatured(listing.id, listing.featured)} className={`p-1.5 rounded transition-colors ${listing.featured ? 'text-blue-400 hover:bg-blue-500/10' : 'text-gray-500 hover:bg-gray-800'}`} title="Toggle Featured">
                            <Star className="h-4 w-4" />
                          </button>
                          <Link to={`/edit-listing/${listing.id}`} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button onClick={() => handleDeleteListing(listing.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredListings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                        No listings found matching your criteria.
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
                  <tr className="bg-[#1A202C] border-b border-gray-800/60">
                    <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">City</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className={`hover:bg-gray-800/20 transition-colors ${user.banned ? 'opacity-50' : ''}`}>
                      <td className="py-3 px-4 text-sm font-medium text-gray-200">
                        <div className="flex items-center gap-2">
                          {user.name}
                          {user.banned && <span className="bg-red-500/10 text-red-400 text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider">Banned</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {user.email}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {user.city || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-[#1A202C] border border-gray-800/60 text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded transition-all"
                        >
                          <option value="user">User</option>
                          <option value="contributor">Contributor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleBanUser(user.uid, user.banned || false)} 
                            className={`p-1.5 rounded transition-colors ${user.banned ? 'text-green-400 hover:bg-green-500/10' : 'text-yellow-400 hover:bg-yellow-500/10'}`}
                            title={user.banned ? "Unban User" : "Ban User"}
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.uid)} 
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                        No users found matching your criteria.
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
