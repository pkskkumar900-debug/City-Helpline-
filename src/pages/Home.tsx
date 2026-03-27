import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing } from '../types';
import { Search, MapPin, Tag, Building2, BookOpen, Coffee, GraduationCap, ArrowRight, Star } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const fetchListings = async () => {
    setLoading(true);
    try {
      // Fetch Featured
      const featuredQ = query(
        collection(db, 'listings'),
        where('status', '==', 'approved'),
        where('featured', '==', true),
        limit(3)
      );
      const featuredSnapshot = await getDocs(featuredQ);
      setFeaturedListings(featuredSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing)));

      // Fetch Recent
      const recentQ = query(
        collection(db, 'listings'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc'),
        limit(6)
      );
      const recentSnapshot = await getDocs(recentQ);
      setRecentListings(recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing)));

    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/search', { state: { query: searchQuery } });
    }
  };

  const categories = [
    { name: 'PG / Hostel', icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { name: 'Mess / Tiffin', icon: Coffee, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    { name: 'Library', icon: BookOpen, color: 'text-green-400', bg: 'bg-green-500/20' },
    { name: 'Coaching', icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-transparent"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 bg-blue-500 blur-[120px] rounded-full pointer-events-none"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
              Find Your Perfect <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Student Setup
              </span>
            </h1>
            <p className="mt-4 text-xl max-w-2xl mx-auto text-gray-300 mb-10">
              PGs, Hostels, Messes, Libraries, and Coaching centers in your city. All in one place.
            </p>
          </motion.div>
          
          {/* Search Bar */}
          <motion.form 
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-2xl mx-auto glass-card rounded-full p-2 flex items-center shadow-2xl shadow-blue-900/20"
          >
            <div className="flex-grow flex items-center pl-4">
              <Search className="h-6 w-6 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search for PGs, libraries, cities..."
                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-400 text-lg py-3 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg shadow-blue-500/30"
            >
              Search
            </button>
          </motion.form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        
        {/* Categories */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
        >
          {categories.map((cat, index) => {
            const Icon = cat.icon;
            return (
              <Link to="/search" key={index} className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform duration-300 group cursor-pointer">
                <div className={`p-4 rounded-full ${cat.bg} ${cat.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-white font-medium">{cat.name}</h3>
              </Link>
            );
          })}
        </motion.div>

        {loading ? (
          <div className="space-y-8">
            <div>
              <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={i} className="glass-card rounded-2xl h-80 animate-pulse"></div>)}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Featured Listings */}
            {featuredListings.length > 0 && (
              <div className="mb-16">
                <div className="flex justify-between items-end mb-6">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" /> 
                    Featured Places
                  </h2>
                  <Link to="/search" className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredListings.map((listing, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      key={listing.id}
                    >
                      <ListingCard listing={listing} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Listings */}
            <div>
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-3xl font-bold text-white">Recently Added</h2>
                <Link to="/search" className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {recentListings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentListings.map((listing, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      key={listing.id}
                    >
                      <ListingCard listing={listing} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <p className="text-gray-400 text-lg">No listings available right now.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link to={`/listing/${listing.id}`} className="block h-full">
      <div className="glass-card rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-2 h-full flex flex-col group">
        <div className="h-56 w-full relative overflow-hidden">
          {listing.images && listing.images.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
              <Building2 className="h-12 w-12" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80"></div>
          
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            {listing.featured && (
              <span className="bg-yellow-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                FEATURED
              </span>
            )}
            <span className="bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              {listing.category}
            </span>
          </div>
          
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white mb-1 truncate drop-shadow-md">{listing.title}</h3>
            <div className="flex items-center text-sm text-gray-300 drop-shadow-md">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{listing.city}</span>
            </div>
          </div>
        </div>
        
        <div className="p-5 flex-grow flex flex-col justify-between bg-gray-900/40">
          <p className="text-gray-400 text-sm line-clamp-2 mb-4">{listing.address}</p>
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-700/50">
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">
              ₹{listing.price.toLocaleString()}<span className="text-sm text-gray-500 font-normal">/mo</span>
            </span>
            <span className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
