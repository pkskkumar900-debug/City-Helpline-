import React from 'react';
import { Link } from 'react-router-dom';
import { Listing } from '../types';
import { MapPin, Building2, ArrowRight, Star, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const { currentUser, userProfile } = useAuth();
  
  const isSaved = userProfile?.savedListings?.includes(listing.id) || false;

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the listing
    e.stopPropagation();
    
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      if (isSaved) {
        await updateDoc(userRef, {
          savedListings: arrayRemove(listing.id)
        });
      } else {
        await updateDoc(userRef, {
          savedListings: arrayUnion(listing.id)
        });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  return (
    <Link to={`/listing/${listing.id}`} className="block h-full">
      <div className="glass-card rounded-3xl overflow-hidden hover:border-blue-500/30 transition-all duration-500 hover:shadow-[0_10px_40px_rgba(59,130,246,0.15)] hover:-translate-y-2 h-full flex flex-col group relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        
        <div className="h-64 w-full relative overflow-hidden">
          {listing.images && listing.images.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
              <Building2 className="h-12 w-12" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-90"></div>
          
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10">
            {listing.featured && (
              <span className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full shadow-lg shadow-yellow-500/20">
                Featured
              </span>
            )}
            <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full shadow-lg">
              {listing.category}
            </span>
          </div>

          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center bg-gray-900/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-gray-700/50">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 mr-1.5" />
              <span className="text-white text-xs font-bold">
                {listing.averageRating ? listing.averageRating.toFixed(1) : 'New'}
              </span>
              {listing.reviewCount !== undefined && listing.reviewCount > 0 && (
                <span className="text-gray-400 text-[10px] ml-1.5">({listing.reviewCount})</span>
              )}
            </div>
          </div>

          {currentUser && (
            <button 
              onClick={toggleSave}
              className="absolute bottom-4 right-4 p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/10 transition-all duration-300 shadow-lg group/btn z-20 hover:scale-110"
            >
              <Heart 
                className={`h-5 w-5 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-white group-hover/btn:text-red-400'}`} 
              />
            </button>
          )}
          
          <div className="absolute bottom-4 left-4 right-16 z-10">
            <h3 className="text-2xl font-bold text-white mb-2 truncate drop-shadow-md group-hover:text-blue-400 transition-colors">{listing.title}</h3>
            <div className="flex items-center text-sm text-gray-300 drop-shadow-md font-medium">
              <MapPin className="h-4 w-4 mr-1.5 text-blue-400" />
              <span className="truncate">{listing.city}</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 flex-grow flex flex-col justify-between bg-gray-900/60 relative z-10">
          <p className="text-gray-400 text-sm line-clamp-2 mb-6 leading-relaxed">{listing.description || listing.address}</p>
          <div className="flex items-center justify-between mt-auto pt-5 border-t border-gray-800/80">
            <div>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block mb-1">Starting from</span>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                ₹{listing.price.toLocaleString()}<span className="text-sm text-gray-500 font-medium ml-1">/mo</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              <ArrowRight className="h-5 w-5 text-blue-400 group-hover:text-white transition-colors group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
