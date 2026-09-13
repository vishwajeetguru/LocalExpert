import {
  Category,
  Conversation,
  ID,
  Message,
  Paged,
  Review,
  ServiceRequest,
  User,
  Vendor,
} from '../types/models';

/**
 * Repository contracts. Screens/services depend ONLY on these.
 * Implementations: Mock* (today) → WordPress* (later). No UI change needed.
 */

export interface AuthResult {
  user: User;
  /** True when the email still needs OTP verification (no token issued). */
  needsVerification: boolean;
  /** Mock mode only: the demo code, shown on the verify screen. */
  demoCode?: string;
}

export interface AuthRepository {
  loginWithEmail(email: string, name?: string): Promise<AuthResult>;
  register(name: string, email: string, phone?: string): Promise<AuthResult>;
  requestOtp(email: string): Promise<{ sent: boolean; verified?: boolean; demoCode?: string }>;
  verifyOtp(email: string, code: string): Promise<AuthResult & { demoCode?: string }>;
  /** Rotates an expiring session. Returns null when re-login is required. */
  refreshSession(): Promise<User | null>;
  /** Move an unverified account to a corrected address + resend code. */
  changeEmail(newEmail: string): Promise<{ user: User; sent: boolean; demoCode?: string }>;
  logout(): Promise<void>;
  currentUser(): Promise<User | null>;
  updateProfile(patch: Partial<User>): Promise<User>;
}

export interface CategoryRepository {
  list(): Promise<Category[]>;
  popular(): Promise<Category[]>;
}

export interface VendorRepository {
  list(params?: { categoryId?: ID; query?: string; page?: number; verifiedOnly?: boolean }): Promise<Paged<Vendor>>;
  getById(id: ID): Promise<Vendor | null>;
  byCategory(categoryId: ID, page?: number): Promise<Paged<Vendor>>;
  search(query: string): Promise<{ categories: Category[]; vendors: Vendor[] }>;
  createDraft(input: VendorDraftInput): Promise<Vendor>;
  updateVendor(id: ID, patch: Partial<Vendor>): Promise<Vendor>;
  /** Upload one listing photo (multipart). Returns the updated vendor. */
  addPhoto(id: ID, asset: { uri: string; name: string; type: string }): Promise<Vendor>;
  /** Remove a listing photo by URL. Returns the updated vendor. */
  removePhoto(id: ID, url: string): Promise<Vendor>;
  myVendor(ownerId: ID): Promise<Vendor | null>;
}

export interface VendorDraftInput {
  categoryId: ID;
  businessName: string;
  description: string;
  servicesOffered: string[];
  phone: string;
  email?: string;
  address: string;
  area?: string;
  city?: string;
  homeVisitAvailable: boolean;
  photos: string[];
  lat?: number | null;
  lng?: number | null;
  ownerId: ID;
  ownerName: string;
}

export interface RequestRepository {
  create(input: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<ServiceRequest>;
  listForCustomer(customerId: ID): Promise<ServiceRequest[]>;
  listForVendor(vendorId: ID): Promise<ServiceRequest[]>;
  updateStatus(id: ID, status: ServiceRequest['status']): Promise<ServiceRequest>;
  getById(id: ID): Promise<ServiceRequest | null>;
}

export interface ChatRepository {
  conversationsFor(userId: ID, role: string): Promise<Conversation[]>;
  messages(conversationId: ID): Promise<Message[]>;
  send(conversationId: ID, senderId: ID, senderRole: 'customer' | 'vendor', text: string): Promise<Message>;
  ensureConversation(customerId: ID, customerName: string, vendor: Vendor): Promise<Conversation>;
  markRead(conversationId: ID): Promise<void>;
}

export interface SocialRepository {
  reviewsFor(vendorId: ID): Promise<Review[]>;
  submitReview(vendorId: ID, rating: number, text: string): Promise<Review>;
  toggleSaved(user: User, vendorId: ID): Promise<User>;
}

export interface ApiBundle {
  auth: AuthRepository;
  categories: CategoryRepository;
  vendors: VendorRepository;
  requests: RequestRepository;
  chat: ChatRepository;
  social: SocialRepository;
}

