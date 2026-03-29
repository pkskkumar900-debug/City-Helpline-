import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing } from '../types';
import { Search as SearchIcon, MapPin, Tag } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { CATEGORIES, STATE_CITIES } from '../lib/constants';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { ListingCard } from '../components/ListingCard';

export default function Search() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const initialQuery = location.state?.query || '';
  const initialCategory = location.state?.category || '';
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const q = query(
          collection(db, 'listings'), 
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
        setListings(data);
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const categoryOptions = CATEGORIES.map(cat => ({ value: cat, label: cat }));
  
  const cityOptions = Object.entries(STATE_CITIES).flatMap(([state, cities]) => 
    cities.map(city => ({ value: city, label: city, group: state }))
  );

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (listing.description && listing.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory ? listing.category === selectedCategory : true;
    const matchesCity = selectedCity ? listing.city === selectedCity : true;
    
    return matchesSearch && matchesCategory && matchesCity;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-16 md:mb-0"
    >
      <div className="glass-card rounded-3xl p-8 mb-10 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-8 tracking-tight">Discover Services</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative flex items-center bg-gray-900/80 rounded-2xl border border-gray-700/50 backdrop-blur-xl">
                <SearchIcon className="absolute left-4 h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search services, places, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-transparent text-white placeholder-gray-500 focus:outline-none focus:ring-0 rounded-2xl"
                />
              </div>
            </div>
            
            <div className="relative z-30 group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-gray-900/80 rounded-2xl border border-gray-700/50 backdrop-blur-xl h-full">
                <SearchableSelect
                  options={categoryOptions}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="All Categories"
                  icon={<Tag className="h-5 w-5 text-gray-400" />}
                />
              </div>
            </div>
            
            <div className="relative z-20 group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-gray-900/80 rounded-2xl border border-gray-700/50 backdrop-blur-xl h-full">
                <SearchableSelect
                  options={cityOptions}
                  value={selectedCity}
                  onChange={setSelectedCity}
                  placeholder="All Cities"
                  icon={<MapPin className="h-5 w-5 text-gray-400" />}
                />
              </div>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap gap-3 mt-8">
            {['PG', 'Hostel', 'Library', 'Coaching'].map((chip) => (
              <button
                key={chip}
                onClick={() => setSelectedCategory(selectedCategory === chip ? '' : chip)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                  selectedCategory === chip 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                    : 'bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-700 hover:border-gray-600'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass-card rounded-3xl h-[400px] animate-pulse bg-gray-800/50 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            </div>
          ))}
        </div>
      ) : filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredListings.map((listing, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -8 }}
              key={listing.id}
              className="h-full"
            >
              <ListingCard listing={listing} />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-16 text-center border-dashed border-2 border-gray-700/50 mt-8 relative overflow-hidden"
        >
          {/* Decorative background for empty state */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="h-32 w-32 bg-gray-900/80 backdrop-blur-xl rounded-full flex items-center justify-center border border-gray-700/50 shadow-2xl relative z-10">
                <SearchIcon className="h-12 w-12 text-gray-400" />
                <div className="absolute -bottom-2 -right-2 h-12 w-12 bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-900 shadow-lg">
                  <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-500">?</span>
                </div>
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tight">No results found</h3>
            <p className="text-gray-400 max-w-md mx-auto text-lg leading-relaxed">We couldn't find any listings matching your search criteria. Try adjusting your filters or search terms.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedCity('');
              }}
              className="mt-10 px-8 py-4 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 border border-gray-600/50"
            >
              Clear All Filters
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
