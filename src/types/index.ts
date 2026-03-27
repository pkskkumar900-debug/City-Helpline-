export type Role = 'user' | 'contributor' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: Role;
  createdAt: number;
}

export type ListingStatus = 'pending' | 'approved' | 'rejected';

export interface Listing {
  id: string;
  title: string;
  category: string;
  city: string;
  address: string;
  price: number;
  contact: string;
  images: string[];
  status: ListingStatus;
  featured: boolean;
  authorId: string;
  authorName: string;
  createdAt: number;
}

export interface Review {
  id: string;
  listingId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: number;
}
