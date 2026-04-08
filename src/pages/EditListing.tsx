import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadImage } from '../lib/storage';
import { Listing } from '../types';
import { UploadCloud, X, ArrowLeft, Tag, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { CATEGORIES, STATE_CITIES } from '../lib/constants';
import { SearchableSelect } from '../components/ui/SearchableSelect';

export default function EditListing() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('PG');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [contact, setContact] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviewUrls, setNewImagePreviewUrls] = useState<string[]>([]);

  const categoryOptions = CATEGORIES.map(cat => ({ value: cat, label: cat }));
  
  const cityOptions = Object.entries(STATE_CITIES).flatMap(([state, cities]) => 
    cities.map(c => ({ value: c, label: c, group: state }))
  );

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Listing;
          const isDefaultAdmin = currentUser?.email === 'pkskkumar900@gmail.com';
          if (currentUser?.uid !== data.authorId && userProfile?.role !== 'admin' && !isDefaultAdmin) {
            navigate('/');
            return;
          }
          setTitle(data.title);
          setDescription(data.description);
          setCategory(data.category);
          setCity(data.city);
          setAddress(data.address);
          setPrice(data.price.toString());
          setContact(data.contact);
          setExistingImages(data.images || []);
        } else {
          setError('Listing not found');
        }
      } catch (err) {
        console.error("Error fetching listing:", err);
        setError('Failed to load listing');
      } finally {
        setFetching(false);
      }
    };
    fetchListing();
  }, [id, currentUser, userProfile, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files) as File[];
      setNewImages(prev => [...prev, ...filesArray]);
      
      const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));
      setNewImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile || !id) return;
    
    if (!category) {
      setError('Please select a category');
      return;
    }
    
    if (!city) {
      setError('Please select a city');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // 1. Upload new images (Placeholder)
      const uploadedImageUrls: string[] = [];
      for (const image of newImages) {
        const downloadUrl = await uploadImage(image);
        if (downloadUrl) {
          uploadedImageUrls.push(downloadUrl);
        }
      }

      const finalImages = [...existingImages, ...uploadedImageUrls];

      // 2. Update listing in Firestore
      const updatedListing = {
        title,
        description,
        category,
        city,
        address,
        price: Number(price),
        contact,
        images: finalImages,
      };

      await updateDoc(doc(db, 'listings', id), updatedListing);
      
      navigate(-1);
    } catch (err: any) {
      console.error("Error updating listing:", err);
      setError(err.message || 'Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20 md:pb-12"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-8 lg:p-12 relative overflow-hidden"
        >
          {/* Decorative Background Elements */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 mb-10 tracking-tight drop-shadow-sm">Edit Listing</h1>
            
            {error && (
              <div className="mb-10 bg-red-900/20 border border-red-800/50 text-red-200 px-6 py-4 rounded-2xl text-sm backdrop-blur-md shadow-inner flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Title</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-[rgba(255,255,255,0.05)] border border-white/10 text-white rounded-2xl focus:ring-0 focus:border-[#00E5FF]/50 focus:bg-[rgba(255,255,255,0.08)] outline-none transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] text-lg font-light backdrop-blur-xl"
                    placeholder="e.g., Premium Boys PG near Allen"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>

                <div className="relative z-30">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Category</label>
                  <div className="bg-[rgba(255,255,255,0.05)] rounded-2xl border border-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] focus-within:bg-[rgba(255,255,255,0.08)] focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-300">
                    <SearchableSelect
                      options={categoryOptions}
                      value={category}
                      onChange={setCategory}
                      placeholder="Select Category"
                      icon={<Tag className="h-5 w-5 text-gray-400" />}
                    />
                  </div>
                </div>

                <div className="relative z-20">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">City</label>
                  <div className="bg-[rgba(255,255,255,0.05)] rounded-2xl border border-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] focus-within:bg-[rgba(255,255,255,0.08)] focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-300">
                    <SearchableSelect
                      options={cityOptions}
                      value={city}
                      onChange={setCity}
                      placeholder="Select City"
                      icon={<MapPin className="h-5 w-5 text-gray-400" />}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Description</label>
                  <textarea
                    required
                    rows={5}
                    className="w-full px-5 py-4 bg-[rgba(255,255,255,0.05)] border border-white/10 text-white rounded-2xl focus:ring-0 focus:border-[#00E5FF]/50 focus:bg-[rgba(255,255,255,0.08)] outline-none transition-all resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] text-lg font-light backdrop-blur-xl"
                    placeholder="Describe your listing in detail..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Full Address</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-5 py-4 bg-[rgba(255,255,255,0.05)] border border-white/10 text-white rounded-2xl focus:ring-0 focus:border-[#00E5FF]/50 focus:bg-[rgba(255,255,255,0.08)] outline-none transition-all resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] text-lg font-light backdrop-blur-xl"
                    placeholder="Enter complete address"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Price (₹ per month)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-5 py-4 bg-[rgba(255,255,255,0.05)] border border-white/10 text-white rounded-2xl focus:ring-0 focus:border-[#00E5FF]/50 focus:bg-[rgba(255,255,255,0.08)] outline-none transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] text-lg font-light backdrop-blur-xl"
                    placeholder="e.g., 5000"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Number</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-[rgba(255,255,255,0.05)] border border-white/10 text-white rounded-2xl focus:ring-0 focus:border-[#00E5FF]/50 focus:bg-[rgba(255,255,255,0.08)] outline-none transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] text-lg font-light backdrop-blur-xl"
                    placeholder="e.g., +91 9876543210"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Images</label>
                  <div className="mt-2 flex justify-center px-6 pt-8 pb-8 border-2 border-white/10 border-dashed rounded-3xl hover:bg-[rgba(255,255,255,0.05)] transition-colors bg-[rgba(255,255,255,0.02)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] group cursor-pointer relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute inset-0 bg-[#00E5FF]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="space-y-3 text-center relative z-10">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(255,255,255,0.05)] mb-2 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,229,255,0.1)] border border-white/10 group-hover:border-[#00E5FF]/50">
                        <UploadCloud className="h-8 w-8 text-[#00E5FF]" />
                      </div>
                      <div className="flex text-sm text-gray-300 justify-center font-medium">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md text-[#00E5FF] hover:text-white focus-within:outline-none transition-colors"
                        >
                          <span>Upload new files</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </div>

                  {/* Existing Images */}
                  {existingImages.length > 0 && (
                    <div className="mt-8">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Existing Images</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                        {existingImages.map((url, index) => (
                          <div key={index} className="relative group rounded-2xl overflow-hidden border border-gray-700/50 aspect-square shadow-lg">
                            <img src={url} alt={`Existing ${index}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => removeExistingImage(index)}
                                className="bg-red-500/90 backdrop-blur-sm text-white rounded-full p-3 transform hover:scale-110 transition-all shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400/50"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Image Previews */}
                  {newImagePreviewUrls.length > 0 && (
                    <div className="mt-8">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">New Images</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                        {newImagePreviewUrls.map((url, index) => (
                          <div key={index} className="relative group rounded-2xl overflow-hidden border border-gray-700/50 aspect-square shadow-lg">
                            <img src={url} alt={`New Preview ${index}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => removeNewImage(index)}
                                className="bg-red-500/90 backdrop-blur-sm text-white rounded-full p-3 transform hover:scale-110 transition-all shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400/50"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-10 border-t border-gray-700/50 flex justify-end gap-5">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-8 py-4 rounded-2xl text-sm font-bold text-gray-400 hover:bg-gray-800/60 hover:text-white transition-all border border-transparent hover:border-gray-700/50 uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0 uppercase tracking-wider"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
