import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, orderBy, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Listing, Review } from '../types';
import { MapPin, Phone, User, Star, Calendar, MessageCircle, ArrowLeft, Heart } from 'lucide-react';
import { motion } from 'motion/react';

export default function ListingDetails() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, userProfile } = useAuth();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchListingAndReviews = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Fetch Listing
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Listing;
          
          const isAuthor = currentUser && currentUser.uid === data.authorId;
          const isAdmin = userProfile?.role === 'admin' || currentUser?.email === 'pkskkumar900@gmail.com';
          
          if (data.status === 'approved' || isAuthor || isAdmin) {
            setListing(data);
          } else {
            setListing(null);
          }
        } else {
          setListing(null);
        }

        // Fetch Reviews
        const q = query(
          collection(db, 'reviews'),
          where('listingId', '==', id),
          orderBy('createdAt', 'desc')
        );
        const reviewSnap = await getDocs(q);
        const fetchedReviews = reviewSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Review[];
        setReviews(fetchedReviews);
      } catch (error: any) {
        console.error("Error fetching details:", error);
        if (error.code === 'permission-denied') {
          setListing(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchListingAndReviews();
  }, [id, currentUser, userProfile]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile || !id) return;

    setSubmittingReview(true);
    try {
      const newReview: Omit<Review, 'id'> = {
        listingId: id,
        userId: currentUser.uid,
        userName: userProfile.name,
        rating,
        comment,
        createdAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, 'reviews'), newReview);
      const updatedReviews = [{ id: docRef.id, ...newReview }, ...reviews];
      setReviews(updatedReviews);
      
      // Update listing with new average rating and review count
      const newReviewCount = updatedReviews.length;
      const newAverageRating = updatedReviews.reduce((acc, rev) => acc + rev.rating, 0) / newReviewCount;
      
      await updateDoc(doc(db, 'listings', id), {
        averageRating: newAverageRating,
        reviewCount: newReviewCount
      });
      
      setListing(prev => prev ? { ...prev, averageRating: newAverageRating, reviewCount: newReviewCount } : null);

      setComment('');
      setRating(5);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (!listing) {
    return <div className="text-center py-20 text-2xl font-bold text-gray-700">Listing not found</div>;
  }

  const averageRating = listing.averageRating 
    ? listing.averageRating.toFixed(1) 
    : (reviews.length > 0 
        ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1) 
        : 'New');

  const isSaved = userProfile?.savedListings?.includes(listing.id) || false;

  const toggleSave = async () => {
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20 md:pb-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <Link to={-1 as any} className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>

        {/* Header Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl overflow-hidden mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image Gallery */}
            <div className="bg-gray-800/50 h-64 lg:h-auto relative min-h-[400px]">
              {listing.images && listing.images.length > 0 ? (
                <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">No Image Available</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent"></div>
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  {listing.category}
                </span>
                {listing.featured && (
                  <span className="bg-yellow-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    Featured
                  </span>
                )}
              </div>
              {currentUser && (
                <button 
                  onClick={toggleSave}
                  className="absolute top-4 right-4 p-3 rounded-full bg-gray-900/50 backdrop-blur-sm hover:bg-gray-900/80 transition-colors shadow-lg group/btn z-10"
                >
                  <Heart 
                    className={`h-6 w-6 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-white group-hover/btn:text-red-400'}`} 
                  />
                </button>
              )}
            </div>

            {/* Details */}
            <div className="p-8 lg:p-10 flex flex-col justify-center bg-gray-900/40">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 drop-shadow-sm">{listing.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 mb-8">
                <div className="flex items-center bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700/50">
                  <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                  {listing.city}
                </div>
                <div className="flex items-center bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700/50">
                  <Star className="h-4 w-4 mr-2 text-yellow-400" />
                  <span className="font-medium text-white mr-1">{averageRating}</span> 
                  ({reviews.length} reviews)
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-medium text-blue-400 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-gray-300 leading-relaxed">{listing.description}</p>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-medium text-blue-400 uppercase tracking-wider mb-2">Address</h3>
                <p className="text-gray-300 bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">{listing.address}</p>
              </div>

              <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-700/50">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Monthly Rent</h3>
                  <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">
                    ₹{listing.price.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Listed By</h3>
                  <div className="flex items-center justify-end gap-2 text-white font-medium bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
                    <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    {listing.authorName}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={`tel:${listing.contact}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:-translate-y-1"
                >
                  <Phone className="h-5 w-5" />
                  Call Now
                </a>
                <a
                  href={`https://wa.me/${listing.contact.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-400 hover:to-emerald-300 text-white font-medium py-4 px-6 rounded-xl transition-all shadow-lg shadow-green-500/20 hover:-translate-y-1"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reviews Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-8 lg:p-10"
        >
          <h2 className="text-2xl font-bold text-white mb-8">Reviews & Ratings</h2>

          {/* Add Review Form */}
          {currentUser ? (
            <form onSubmit={handleReviewSubmit} className="mb-10 bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
              <h3 className="text-lg font-medium text-white mb-4">Write a Review</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-3xl focus:outline-none transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-gray-600'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Comment</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Share your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          ) : (
            <div className="mb-10 bg-blue-900/20 p-8 rounded-xl border border-blue-800/50 text-center backdrop-blur-sm">
              <p className="text-blue-200 mb-6 text-lg">You must be logged in to write a review.</p>
              <Link to="/login" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-xl transition-colors shadow-lg shadow-blue-500/20">
                Log in to Review
              </Link>
            </div>
          )}

          {/* Review List */}
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (index * 0.1) }}
                  key={review.id} 
                  className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-white block">{review.userName}</span>
                        <div className="flex items-center text-xs text-gray-400 mt-0.5">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center bg-gray-900/50 px-2 py-1 rounded-lg">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current drop-shadow-[0_0_2px_rgba(250,204,21,0.5)]' : 'text-gray-700'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{review.comment}</p>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-800/20 rounded-xl border border-gray-700/30 border-dashed">
                <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No reviews yet. Be the first to share your experience!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
