import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadImageToCloudinary } from '../lib/cloudinary';
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
      // 1. Upload new images to Cloudinary
      const uploadedImageUrls: string[] = [];
      for (const image of newImages) {
        const downloadUrl = await uploadImageToCloudinary(image);
        uploadedImageUrls.push(downloadUrl);
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
          className="glass-card rounded-2xl p-8 lg:p-10"
        >
          <h1 className="text-3xl font-extrabold text-white mb-8 drop-shadow-sm">Edit Listing</h1>
          
          {error && (
            <div className="mb-8 bg-red-900/30 border border-red-800/50 text-red-200 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g., Premium Boys PG near Allen"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className="relative z-30">
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <SearchableSelect
                  options={categoryOptions}
                  value={category}
                  onChange={setCategory}
                  placeholder="Select Category"
                  icon={<Tag className="h-5 w-5" />}
                />
              </div>

              <div className="relative z-20">
                <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                <SearchableSelect
                  options={cityOptions}
                  value={city}
                  onChange={setCity}
                  placeholder="Select City"
                  icon={<MapPin className="h-5 w-5" />}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Describe your listing in detail..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Address</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Enter complete address"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price (₹ per month)</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g., 5000"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Contact Number</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g., +91 9876543210"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Images</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-xl hover:bg-gray-800/50 transition-colors bg-gray-900/30">
                  <div className="space-y-2 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-400 justify-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none"
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
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-gray-300 mb-2">Existing Images</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {existingImages.map((url, index) => (
                        <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-700/50 aspect-square">
                          <img src={url} alt={`Existing ${index}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeExistingImage(index)}
                              className="bg-red-500 text-white rounded-full p-2 transform hover:scale-110 transition-transform shadow-lg"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Image Previews */}
                {newImagePreviewUrls.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-gray-300 mb-2">New Images</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {newImagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-700/50 aspect-square">
                          <img src={url} alt={`New Preview ${index}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeNewImage(index)}
                              className="bg-red-500 text-white rounded-full p-2 transform hover:scale-110 transition-transform shadow-lg"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-8 border-t border-gray-700/50 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors border border-transparent hover:border-gray-700/50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}
