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
          className="glass-card rounded-3xl overflow-hidden mb-12 relative"
        >
          {/* Decorative Background Elements */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 relative z-10">
            {/* Image Gallery */}
            <div className="bg-gray-800/50 h-64 lg:h-auto relative min-h-[400px] lg:min-h-[500px]">
              {listing.images && listing.images.length > 0 ? (
                <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">No Image Available</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent"></div>
              <div className="absolute top-6 left-6 flex gap-3">
                <span className="bg-blue-600/90 backdrop-blur-md text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-blue-500/50 uppercase tracking-wider">
                  {listing.category}
                </span>
                {listing.featured && (
                  <span className="bg-yellow-500/90 backdrop-blur-md text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.3)] border border-yellow-400/50 uppercase tracking-wider">
                    Featured
                  </span>
                )}
              </div>
              {currentUser && (
                <button 
                  onClick={toggleSave}
                  className="absolute top-6 right-6 p-3.5 rounded-full bg-gray-900/60 backdrop-blur-md hover:bg-gray-800/80 transition-all shadow-xl group/btn z-10 border border-gray-700/50 hover:scale-110"
                >
                  <Heart 
                    className={`h-6 w-6 transition-colors ${isSaved ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'text-white group-hover/btn:text-red-400'}`} 
                  />
                </button>
              )}
            </div>

            {/* Details */}
            <div className="p-8 lg:p-12 flex flex-col justify-center bg-gray-900/40 backdrop-blur-sm">
              <h1 className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 mb-6 tracking-tight drop-shadow-sm">{listing.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 mb-10">
                <div className="flex items-center bg-gray-800/60 px-4 py-2 rounded-full border border-gray-700/50 shadow-inner">
                  <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                  {listing.city}
                </div>
                <div className="flex items-center bg-gray-800/60 px-4 py-2 rounded-full border border-gray-700/50 shadow-inner">
                  <Star className="h-4 w-4 mr-2 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]" />
                  <span className="font-bold text-white mr-1">{averageRating}</span> 
                  <span className="text-gray-400">({reviews.length} reviews)</span>
                </div>
              </div>

              <div className="mb-10">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="h-px w-6 bg-blue-500/50"></div> Description
                </h3>
                <p className="text-gray-300 leading-relaxed text-lg font-light">{listing.description}</p>
              </div>

              <div className="mb-10">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="h-px w-6 bg-blue-500/50"></div> Address
                </h3>
                <p className="text-gray-300 bg-gray-800/40 p-5 rounded-2xl border border-gray-700/40 shadow-inner font-light">{listing.address}</p>
              </div>

              <div className="flex items-center justify-between mb-10 pb-10 border-b border-gray-700/50">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Monthly Rent</h3>
                  <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 drop-shadow-sm">
                    ₹{listing.price.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Listed By</h3>
                  <div className="flex items-center justify-end gap-3 text-white font-medium bg-gray-800/60 px-5 py-2.5 rounded-2xl border border-gray-700/50 shadow-inner">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg">{listing.authorName}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                <a
                  href={`tel:${listing.contact}`}
                  className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] hover:-translate-y-1"
                >
                  <Phone className="h-5 w-5" />
                  Call Now
                </a>
                <a
                  href={`https://wa.me/${listing.contact.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-400 hover:to-emerald-300 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:-translate-y-1"
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
          className="glass-card rounded-3xl p-8 lg:p-12 relative overflow-hidden"
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-white mb-10 tracking-tight">Reviews & Ratings</h2>

            {/* Add Review Form */}
            {currentUser ? (
              <form onSubmit={handleReviewSubmit} className="mb-12 bg-gray-900/60 p-8 rounded-3xl border border-gray-700/50 shadow-inner">
                <h3 className="text-xl font-bold text-white mb-6">Write a Review</h3>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Rating</label>
                  <div className="flex gap-2 bg-gray-800/50 inline-flex p-2 rounded-2xl border border-gray-700/50">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-3xl focus:outline-none transition-transform hover:scale-110 p-1 ${star <= rating ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]' : 'text-gray-600 hover:text-gray-500'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Comment</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-5 py-4 bg-gray-800/50 border border-gray-700 text-white rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none shadow-inner text-lg font-light"
                    placeholder="Share your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="mb-12 bg-blue-900/10 p-10 rounded-3xl border border-blue-800/30 text-center backdrop-blur-md relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-50"></div>
                <div className="relative z-10">
                  <p className="text-blue-200 mb-8 text-xl font-light">You must be logged in to write a review.</p>
                  <Link to="/login" className="inline-block bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] hover:-translate-y-1">
                    Log in to Review
                  </Link>
                </div>
              </div>
            )}

            {/* Review List */}
            <div className="space-y-6">
              {reviews.length > 0 ? (
                reviews.map((review, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                    key={review.id} 
                    className="bg-gray-900/40 p-8 rounded-3xl border border-gray-700/40 hover:bg-gray-800/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border border-white/10">
                          {review.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white text-lg block">{review.userName}</span>
                          <div className="flex items-center text-sm text-gray-400 mt-1 font-medium">
                            <Calendar className="h-3.5 w-3.5 mr-1.5" />
                            {new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center bg-gray-800/80 px-3 py-1.5 rounded-xl border border-gray-700/50 shadow-inner self-start sm:self-auto">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]' : 'text-gray-700'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-lg font-light">{review.comment}</p>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-gray-700/50 border-dashed relative overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse"></div>
                      <div className="h-24 w-24 bg-gray-800/80 backdrop-blur-xl rounded-full flex items-center justify-center border border-gray-700/50 shadow-xl relative z-10">
                        <MessageCircle className="h-10 w-10 text-gray-400" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-extrabold text-white mb-3 tracking-tight">No reviews yet</h3>
                    <p className="text-gray-400 text-base leading-relaxed max-w-md mx-auto">Be the first to share your experience and help others make a decision!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
