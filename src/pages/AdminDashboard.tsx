import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

import { CheckCircle, XCircle, Trash2, Star, Users, Building, Shield } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const { currentUser, userProfile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'users'>('listings');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

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

  const isDefaultAdmin = currentUser?.email === 'pkskkumar900@gmail.com';
  if (!currentUser || (userProfile?.role !== 'admin' && !isDefaultAdmin)) {
    return <Navigate to="/" />;
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  const pendingCount = listings.filter(l => l.status === 'pending').length;

  const filteredListings = statusFilter === 'all' 
    ? listings 
    : listings.filter(l => l.status === statusFilter);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20 md:pb-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white drop-shadow-sm">Admin Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 rounded-2xl flex items-center gap-4"
          >
            <div className="p-4 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 shadow-inner">
              <Building className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Listings</p>
              <p className="text-3xl font-bold text-white">{listings.length}</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 rounded-2xl flex items-center gap-4"
          >
            <div className="p-4 bg-yellow-500/20 text-yellow-400 rounded-xl border border-yellow-500/30 shadow-inner">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Pending Approvals</p>
              <p className="text-3xl font-bold text-white">{pendingCount}</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6 rounded-2xl flex items-center gap-4"
          >
            <div className="p-4 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30 shadow-inner">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Users</p>
              <p className="text-3xl font-bold text-white">{users.length}</p>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-4">
            <button
              className={`py-3 px-6 font-medium text-sm rounded-xl transition-all ${activeTab === 'listings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white border border-gray-700/50'}`}
              onClick={() => setActiveTab('listings')}
            >
              Manage Listings
            </button>
            <button
              className={`py-3 px-6 font-medium text-sm rounded-xl transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white border border-gray-700/50'}`}
              onClick={() => setActiveTab('users')}
            >
              Manage Users
            </button>
          </div>
          
          {activeTab === 'listings' && (
            <div className="flex bg-gray-800/50 rounded-xl p-1 border border-gray-700/50">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${statusFilter === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${statusFilter === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:text-white'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${statusFilter === 'approved' ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white'}`}
              >
                Approved
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${statusFilter === 'rejected' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white'}`}
              >
                Rejected
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          {activeTab === 'listings' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden flex flex-col">
                  <div className="h-48 relative bg-gray-900">
                    {listing.images && listing.images.length > 0 ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full shadow-lg ${
                        listing.status === 'approved' ? 'bg-green-500 text-white' : 
                        listing.status === 'rejected' ? 'bg-red-500 text-white' : 
                        'bg-yellow-500 text-white'
                      }`}>
                        {listing.status.toUpperCase()}
                      </span>
                      {listing.featured && (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500 text-white shadow-lg">
                          FEATURED
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-5 flex-grow flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{listing.title}</h3>
                    <div className="flex items-center text-xs text-gray-400 mb-3 gap-2">
                      <span className="bg-gray-700/50 px-2 py-1 rounded-md">{listing.category}</span>
                      <span>•</span>
                      <span>{listing.city}</span>
                    </div>
                    
                    <p className="text-sm text-gray-300 line-clamp-2 mb-4 flex-grow">
                      {listing.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700/50 mt-auto">
                      <div className="text-xs text-gray-400">
                        By <span className="text-gray-300 font-medium">{listing.authorName}</span>
                      </div>
                      <div className="flex gap-2">
                        {listing.status !== 'approved' && (
                          <button onClick={() => handleStatusChange(listing.id, 'approved')} className="flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors bg-green-400/10 px-3 py-2 rounded-lg hover:bg-green-400/20" title="Approve">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Approve</span>
                          </button>
                        )}
                        {listing.status !== 'rejected' && (
                          <button onClick={() => handleStatusChange(listing.id, 'rejected')} className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors bg-red-400/10 px-3 py-2 rounded-lg hover:bg-red-400/20" title="Reject">
                            <XCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Reject</span>
                          </button>
                        )}
                        <button onClick={() => handleToggleFeatured(listing.id, listing.featured)} className={`${listing.featured ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 bg-gray-700/50'} hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-400/20`} title="Toggle Featured">
                          <Star className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleDeleteListing(listing.id)} className="text-red-400 hover:text-red-300 transition-colors bg-red-400/10 p-2 rounded-lg hover:bg-red-400/20" title="Delete">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredListings.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400">
                  No listings found for the selected status.
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700/50">
                <thead className="bg-gray-900/40">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {users.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-sm bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl appearance-none"
                        >
                          <option value="user">User</option>
                          <option value="contributor">Contributor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
