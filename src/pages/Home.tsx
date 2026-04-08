import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing } from '../types';
import { Search, Building2, BookOpen, Coffee, GraduationCap, ArrowRight, Star } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';
import { LiquidInput } from '../components/ui/LiquidInput';
import { motion } from 'motion/react';
import { ListingCard } from '../components/ListingCard';

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
    { name: 'PG', icon: Building2, color: 'text-[#00E5FF]', bg: 'bg-[#00E5FF]/10' },
    { name: 'Mess', icon: Coffee, color: 'text-[#FF3B3B]', bg: 'bg-[#FF3B3B]/10' },
    { name: 'Library', icon: BookOpen, color: 'text-[#8A2BE2]', bg: 'bg-[#8A2BE2]/10' },
    { name: 'Coaching Institute', icon: GraduationCap, color: 'text-[#00E5FF]', bg: 'bg-[#00E5FF]/10' },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-12 bg-transparent">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-24 pb-40 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 bg-[#00E5FF] blur-[120px] rounded-full pointer-events-none"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8A2BE2]/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF3B3B]/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] opacity-50"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white mb-0 leading-tight">
              Find Your Perfect <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
                Student Setup
              </span>
            </h1>
          </motion.div>
          
          {/* Search Bar */}
          <motion.form 
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="w-full max-w-[700px] mx-auto px-4 sm:px-0 mt-4 sm:mt-5 sticky top-20 z-40"
          >
            <div className="relative flex items-center w-full h-[60px] bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border border-white/10 rounded-[30px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.37)] focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_20px_rgba(0,229,255,0.3)] focus-within:border-[#00E5FF]/50 focus-within:bg-[rgba(255,255,255,0.08)] transition-all duration-300 overflow-hidden group">
              <div className="pl-5 flex items-center justify-center">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#00E5FF] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search PGs, libraries, coaching..."
                className="flex-grow bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 text-base py-2 px-4 outline-none font-medium w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="pr-2 flex items-center h-full py-2">
                <LiquidButton 
                  type="submit"
                  className="h-full py-0 px-6 rounded-[24px]"
                >
                  Search
                </LiquidButton>
              </div>
            </div>
          </motion.form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-20 relative z-20">
        
        {/* Categories */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24"
        >
          {categories.map((cat, index) => {
            const Icon = cat.icon;
            return (
              <GlassCard key={index} className="p-8 flex flex-col items-center justify-center text-center hover:-translate-y-2 transition-all duration-500 group cursor-pointer" intensity="low">
                <Link to="/search" state={{ category: cat.name }} className="w-full h-full flex flex-col items-center justify-center">
                  <div className={`p-5 rounded-2xl ${cat.bg} ${cat.color} mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
                    <Icon className="h-10 w-10" />
                  </div>
                  <h3 className="text-white font-bold text-lg tracking-wide">{cat.name}</h3>
                </Link>
              </GlassCard>
            );
          })}
        </motion.div>

        {loading ? (
          <div className="space-y-12">
            <div>
              <div className="h-10 w-64 bg-gray-800/50 rounded-xl animate-pulse mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => <div key={i} className="glass-card rounded-3xl h-[400px] animate-pulse border border-gray-800/50"></div>)}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Featured Listings */}
            {featuredListings.length > 0 && (
              <div className="mb-24">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-3">
                      <Star className="h-3 w-3 fill-yellow-400" />
                      Top Rated
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                      Featured Places
                    </h2>
                  </div>
                  <Link to="/search" className="group flex items-center gap-2 text-sm font-bold text-[#00E5FF] hover:text-white transition-colors bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] px-4 py-2 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                    View all <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredListings.map((listing, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                      key={listing.id}
                    >
                      <ListingCard listing={listing} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Listings */}
            <div className="mb-20">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
                <div>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                    Recently Added
                  </h2>
                </div>
                <Link to="/search" className="group flex items-center gap-2 text-sm font-bold text-[#00E5FF] hover:text-white transition-colors bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] px-4 py-2 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                  View all <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              {recentListings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recentListings.map((listing, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                      key={listing.id}
                    >
                      <ListingCard listing={listing} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <GlassCard className="p-16 text-center border-dashed border-2 border-white/10 relative overflow-hidden" intensity="low">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00E5FF]/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#00E5FF]/20 to-[#8A2BE2]/20 rounded-full blur-xl animate-pulse"></div>
                      <div className="h-24 w-24 bg-[rgba(255,255,255,0.06)] backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 shadow-xl relative z-10">
                        <Search className="h-10 w-10 text-gray-400" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-extrabold text-white mb-3 tracking-tight">No listings yet</h3>
                    <p className="text-gray-400 max-w-md mx-auto text-base leading-relaxed">Check back later for new places or be the first to add a listing in your area.</p>
                  </div>
                </GlassCard>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
