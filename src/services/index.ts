import { api } from '../api';
import { ID, User, Vendor } from '../types/models';
import { VendorDraftInput } from '../api/repository';

/** Thin domain services — screens call these, never fetch() directly. */

export const AuthService = {
  loginWithEmail: (email: string, name?: string) => api.auth.loginWithEmail(email, name),
  register: (name: string, email: string, phone?: string) => api.auth.register(name, email, phone),
  requestOtp: (email: string) => api.auth.requestOtp(email),
  verifyOtp: (email: string, code: string) => api.auth.verifyOtp(email, code),
  refreshSession: () => api.auth.refreshSession(),
  changeEmail: (newEmail: string) => api.auth.changeEmail(newEmail),
  logout: () => api.auth.logout(),
  currentUser: () => api.auth.currentUser(),
  updateProfile: (patch: Partial<User>) => api.auth.updateProfile(patch),
};

export const CategoryService = {
  list: () => api.categories.list(),
  popular: () => api.categories.popular(),
};

export const VendorService = {
  list: (p?: { categoryId?: ID; query?: string; page?: number }) => api.vendors.list({ ...p, verifiedOnly: true }),
  getById: (id: ID) => api.vendors.getById(id),
  byCategory: (categoryId: ID, page?: number) => api.vendors.byCategory(categoryId, page),
  search: (q: string) => api.vendors.search(q),
  createDraft: (input: VendorDraftInput) => api.vendors.createDraft(input),
  updateVendor: (id: ID, patch: Partial<Vendor>) => api.vendors.updateVendor(id, patch),
  myVendor: (ownerId: ID) => api.vendors.myVendor(ownerId),
  reviewsFor: (vendorId: ID) => api.social.reviewsFor(vendorId),
  submitReview: (vendorId: ID, rating: number, text: string) => api.social.submitReview(vendorId, rating, text),
  addPhoto: (vendorId: ID, asset: { uri: string; name: string; type: string }) => api.vendors.addPhoto(vendorId, asset),
  removePhoto: (vendorId: ID, url: string) => api.vendors.removePhoto(vendorId, url),
  toggleSaved: (user: User, vendorId: ID) => api.social.toggleSaved(user, vendorId),
};

export const RequestService = {
  create: (input: Parameters<typeof api.requests.create>[0]) => api.requests.create(input),
  forCustomer: (customerId: ID) => api.requests.listForCustomer(customerId),
  forVendor: (vendorId: ID) => api.requests.listForVendor(vendorId),
  updateStatus: (id: ID, status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled') =>
    api.requests.updateStatus(id, status),
  getById: (id: ID) => api.requests.getById(id),
};

export const ChatService = {
  conversationsFor: (userId: ID, role: string) => api.chat.conversationsFor(userId, role),
  messages: (id: ID) => api.chat.messages(id),
  send: (convId: ID, senderId: ID, role: 'customer' | 'vendor', text: string) => api.chat.send(convId, senderId, role, text),
  ensureConversation: (customerId: ID, customerName: string, vendor: Vendor) =>
    api.chat.ensureConversation(customerId, customerName, vendor),
};
