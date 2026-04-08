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
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5FF]"></div></div>;
  }

  if (!listing) {
    return <div className="text-center py-20 text-2xl font-bold text-gray-400">Listing not found</div>;
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
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#00E5FF]/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#8A2BE2]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 relative z-10">
            {/* Image Gallery */}
            <div className="bg-[rgba(255,255,255,0.02)] h-64 lg:h-auto relative min-h-[400px] lg:min-h-[500px]">
              {listing.images && listing.images.length > 0 ? (
                <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">No Image Available</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A]/90 via-[#0B0F1A]/20 to-transparent"></div>
              <div className="absolute top-6 left-6 flex gap-3">
                <span className="bg-[#00E5FF]/20 backdrop-blur-md text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(0,229,255,0.3)] border border-[#00E5FF]/50 uppercase tracking-wider">
                  {listing.category}
                </span>
                {listing.featured && (
                  <span className="bg-yellow-500/20 backdrop-blur-md text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.3)] border border-yellow-400/50 uppercase tracking-wider">
                    Featured
                  </span>
                )}
              </div>
              {currentUser && (
                <button 
                  onClick={toggleSave}
                  className="absolute top-6 right-6 p-3.5 rounded-full bg-[rgba(255,255,255,0.05)] backdrop-blur-md hover:bg-[rgba(255,255,255,0.1)] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] group/btn z-10 border border-white/10 hover:scale-110"
                >
                  <Heart 
                    className={`h-6 w-6 transition-colors ${isSaved ? 'fill-[#FF3B3B] text-[#FF3B3B] drop-shadow-[0_0_8px_rgba(255,59,59,0.6)]' : 'text-white group-hover/btn:text-[#FF3B3B]'}`} 
                  />
                </button>
              )}
            </div>

            {/* Details */}
            <div className="p-8 lg:p-12 flex flex-col justify-center bg-[rgba(255,255,255,0.02)] backdrop-blur-sm">
              <h1 className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 mb-6 tracking-tight drop-shadow-sm">{listing.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 mb-10">
                <div className="flex items-center bg-[rgba(255,255,255,0.05)] px-4 py-2 rounded-full border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md">
                  <MapPin className="h-4 w-4 mr-2 text-[#00E5FF]" />
                  {listing.city}
                </div>
                <div className="flex items-center bg-[rgba(255,255,255,0.05)] px-4 py-2 rounded-full border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md">
                  <Star className="h-4 w-4 mr-2 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]" />
                  <span className="font-bold text-white mr-1">{averageRating}</span> 
                  <span className="text-gray-400">({reviews.length} reviews)</span>
                </div>
              </div>

              <div className="mb-10">
                <h3 className="text-xs font-bold text-[#00E5FF] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="h-px w-6 bg-[#00E5FF]/50"></div> Description
                </h3>
                <p className="text-gray-300 leading-relaxed text-lg font-light">{listing.description}</p>
              </div>

              <div className="mb-10">
                <h3 className="text-xs font-bold text-[#00E5FF] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="h-px w-6 bg-[#00E5FF]/50"></div> Address
                </h3>
                <p className="text-gray-300 bg-[rgba(255,255,255,0.02)] p-5 rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] font-light backdrop-blur-md">{listing.address}</p>
              </div>

              <div className="flex items-center justify-between mb-10 pb-10 border-b border-white/10">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Monthly Rent</h3>
                  <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#8A2BE2] drop-shadow-sm">
                    ₹{listing.price.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Listed By</h3>
                  <div className="flex items-center justify-end gap-3 text-white font-medium bg-[rgba(255,255,255,0.05)] px-5 py-2.5 rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md">
                    <div className="h-10 w-10 bg-gradient-to-br from-[#00E5FF] to-[#8A2BE2] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg">{listing.authorName}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                <a
                  href={`tel:${listing.contact}`}
                  className="flex-1 flex items-center justify-center gap-3 bg-[rgba(0,229,255,0.1)] hover:bg-[rgba(0,229,255,0.2)] text-[#00E5FF] border border-[#00E5FF]/30 font-bold py-4 px-6 rounded-2xl transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_20px_rgba(0,229,255,0.2)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_30px_rgba(0,229,255,0.4)] hover:-translate-y-1 backdrop-blur-md"
                >
                  <Phone className="h-5 w-5" />
                  Call Now
                </a>
                <a
                  href={`https://wa.me/${listing.contact.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 bg-[rgba(16,185,129,0.1)] hover:bg-[rgba(16,185,129,0.2)] text-emerald-400 border border-emerald-400/30 font-bold py-4 px-6 rounded-2xl transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_30px_rgba(16,185,129,0.4)] hover:-translate-y-1 backdrop-blur-md"
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
              <form onSubmit={handleReviewSubmit} className="mb-12 bg-[rgba(255,255,255,0.02)] p-8 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md">
                <h3 className="text-xl font-bold text-white mb-6">Write a Review</h3>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Rating</label>
                  <div className="flex gap-2 bg-[rgba(255,255,255,0.05)] inline-flex p-2 rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
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
                    className="w-full px-5 py-4 bg-[rgba(255,255,255,0.05)] border border-white/10 text-white rounded-2xl focus:ring-0 focus:border-[#00E5FF]/50 focus:bg-[rgba(255,255,255,0.08)] outline-none transition-all resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] text-lg font-light backdrop-blur-xl"
                    placeholder="Share your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-gradient-to-r from-[#00E5FF] to-[#8A2BE2] hover:from-[#8A2BE2] hover:to-[#00E5FF] text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-[0_5px_15px_rgba(0,229,255,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="mb-12 bg-[rgba(0,229,255,0.05)] p-10 rounded-3xl border border-[#00E5FF]/20 text-center backdrop-blur-md relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00E5FF]/10 to-[#8A2BE2]/10 opacity-50"></div>
                <div className="relative z-10">
                  <p className="text-blue-200 mb-8 text-xl font-light">You must be logged in to write a review.</p>
                  <Link to="/login" className="inline-block bg-gradient-to-r from-[#00E5FF] to-[#8A2BE2] hover:from-[#8A2BE2] hover:to-[#00E5FF] text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-[0_5px_15px_rgba(0,229,255,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.5)] hover:-translate-y-1">
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
                    className="bg-[rgba(255,255,255,0.02)] p-8 rounded-3xl border border-white/10 hover:bg-[rgba(255,255,255,0.05)] transition-colors backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-[#00E5FF] to-[#8A2BE2] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(0,229,255,0.3)] border border-white/10">
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
                      <div className="flex items-center bg-[rgba(255,255,255,0.05)] px-3 py-1.5 rounded-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] self-start sm:self-auto">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]' : 'text-gray-700'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-lg font-light">{review.comment}</p>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 bg-[rgba(255,255,255,0.02)] rounded-3xl border border-white/10 border-dashed relative overflow-hidden backdrop-blur-md">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00E5FF]/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#00E5FF]/20 to-[#8A2BE2]/20 rounded-full blur-xl animate-pulse"></div>
                      <div className="h-24 w-24 bg-[rgba(255,255,255,0.05)] backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(0,229,255,0.1)] relative z-10">
                        <MessageCircle className="h-10 w-10 text-[#00E5FF]" />
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
