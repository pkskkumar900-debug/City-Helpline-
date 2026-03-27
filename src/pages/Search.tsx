import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
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
        const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
        setListings(data.filter(l => l.status === 'approved'));
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
      <div className="glass-card rounded-2xl p-6 mb-8">
        <h1 className="text-2xl font-bold text-white mb-6">Search Listings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="relative z-30">
            <SearchableSelect
              options={categoryOptions}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="All Categories"
              icon={<Tag className="h-5 w-5" />}
            />
          </div>
          
          <div className="relative z-20">
            <SearchableSelect
              options={cityOptions}
              value={selectedCity}
              onChange={setSelectedCity}
              placeholder="All Cities"
              icon={<MapPin className="h-5 w-5" />}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass-card rounded-xl h-64 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={listing.id}
            >
              <ListingCard listing={listing} />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
