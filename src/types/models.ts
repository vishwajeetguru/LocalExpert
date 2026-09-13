/**
 * Canonical domain models. These mirror the future WordPress REST API
 * shapes so the UI never needs to change when mock → WP swap happens.
 * WordPress mapping lives in src/api/wordpress/mappers.ts
 */

export type ID = string;

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type RequestStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
export type UserRole = 'customer' | 'vendor' | 'admin';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface ServiceLocation {
  city: string;
  area?: string;
  address: string;
  pincode?: string;
  geo?: GeoPoint;
  serviceAreas?: string[];
}

export interface WorkingHours {
  /** 0 = Sunday … 6 = Saturday */
  day: number;
  open: string; // "09:30"
  close: string; // "20:00"
  closed?: boolean;
}

export interface Category {
  id: ID;
  slug: string;
  name: string;
  tagline?: string;
  /** MaterialCommunity icon name used by CategoryTile */
  icon: string;
  /** soft tint background for tiles */
  tint: string;
  vendorCount: number;
  popular?: boolean;
  /** Null for parent groups; group id for bookable leaf subcategories. */
  parentId: ID | null;
  /** 'services' | 'government' — browse sections. */
  section: string;
  keywords: string[];
}

export interface Vendor {
  id: ID;
  ownerId?: ID;
  businessName: string;
  slug: string;
  categoryId: ID;
  categoryName: string;
  /** WordPress category slug (present in live API mode) — preferred i18n key. */
  categorySlug?: string;
  description: string;
  servicesOffered: string[];
  phone: string;
  email?: string;
  location: ServiceLocation;
  distanceKm?: number;
  workingHours: WorkingHours[];
  photos: string[];
  avatar?: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  yearsExperience: number;
  verificationStatus: VerificationStatus;
  isVerified: boolean;
  homeVisitAvailable: boolean;
  availableToday: boolean;
  responseTimeMin?: string;
  priceHint?: string;
  createdAt: string;
}

export interface User {
  id: ID;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  city: string;
  emailVerified: boolean;
  /** ISO expiry of the passwordless session (live API mode). */
  tokenExpiresAt?: string | null;
  savedVendorIds: ID[];
  vendorId?: ID; // linked vendor profile when role === vendor
  createdAt: string;
}

export interface ServiceItem {
  id: ID;
  vendorId: ID;
  name: string;
  description?: string;
  price?: string;
  durationMin?: number;
}

export interface ServiceRequest {
  id: ID;
  vendorId: ID;
  vendorName: string;
  vendorAvatar?: string;
  categoryName: string;
  customerId: ID;
  customerName: string;
  serviceSummary: string;
  description: string;
  preferredDate: string; // ISO date
  preferredTime: string; // "10:00 AM"
  address: string;
  phone: string;
  note?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: ID;
  vendorId: ID;
  vendorName: string;
  vendorAvatar?: string;
  customerId: ID;
  customerName: string;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
  vendorCategory?: string;
}

export interface Message {
  id: ID;
  conversationId: ID;
  senderId: ID;
  senderRole: UserRole;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface Review {
  id: ID;
  vendorId: ID;
  authorName: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface NotificationItem {
  id: ID;
  title: string;
  body: string;
  kind: 'request' | 'chat' | 'verification' | 'system';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface CallLog {
  id: ID;
  callerId: ID;
  receiverVendorId: ID;
  receiverName: string;
  timestamp: string;
  status: 'initiated' | 'completed' | 'cancelled' | 'unknown';
  /** Never faked — stays undefined when OS doesn't provide it. */
  durationSec?: number;
}

export interface Paged<T> {
  items: T[];
  page: number;
  hasMore: boolean;
  total: number;
}
