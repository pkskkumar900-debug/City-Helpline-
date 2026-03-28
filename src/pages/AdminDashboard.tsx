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
        <div className="flex gap-4 mb-6">
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

        {/* Content */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          {activeTab === 'listings' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700/50">
                <thead className="bg-gray-900/40">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {listings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{listing.title}</div>
                        <div className="text-xs text-gray-400 mt-1">{listing.city} • {listing.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {listing.authorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                          listing.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                          listing.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                          {listing.status}
                        </span>
                        {listing.featured && (
                          <span className="ml-2 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-3">
                          {listing.status !== 'approved' && (
                            <button onClick={() => handleStatusChange(listing.id, 'approved')} className="text-green-400 hover:text-green-300 transition-colors bg-green-400/10 p-2 rounded-lg hover:bg-green-400/20" title="Approve">
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                          {listing.status !== 'rejected' && (
                            <button onClick={() => handleStatusChange(listing.id, 'rejected')} className="text-red-400 hover:text-red-300 transition-colors bg-red-400/10 p-2 rounded-lg hover:bg-red-400/20" title="Reject">
                              <XCircle className="h-5 w-5" />
                            </button>
                          )}
                          <button onClick={() => handleToggleFeatured(listing.id, listing.featured)} className={`${listing.featured ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400 bg-gray-700/50'} hover:text-yellow-300 transition-colors p-2 rounded-lg hover:bg-yellow-400/20`} title="Toggle Featured">
                            <Star className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleDeleteListing(listing.id)} className="text-red-400 hover:text-red-300 transition-colors bg-red-400/10 p-2 rounded-lg hover:bg-red-400/20 ml-2" title="Delete">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
