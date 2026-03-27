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
            <div className="flex items-center bg-gray-900/80 backdrop-blur-md px-2.5 py-1 rounded-full shadow-lg border border-gray-700/50">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 mr-1.5" />
              <span className="text-white text-xs font-bold">
                {listing.averageRating ? listing.averageRating.toFixed(1) : 'New'}
              </span>
              {listing.reviewCount !== undefined && listing.reviewCount > 0 && (
                <span className="text-gray-400 text-[10px] ml-1">({listing.reviewCount})</span>
              )}
            </div>
          </div>

          {currentUser && (
            <button 
              onClick={toggleSave}
              className="absolute top-4 left-4 p-2 rounded-full bg-gray-900/50 backdrop-blur-sm hover:bg-gray-900/80 transition-colors shadow-lg group/btn z-10"
            >
              <Heart 
                className={`h-5 w-5 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-white group-hover/btn:text-red-400'}`} 
              />
            </button>
          )}
          
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white mb-1 truncate drop-shadow-md">{listing.title}</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-300 drop-shadow-md">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">{listing.city}</span>
              </div>
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
