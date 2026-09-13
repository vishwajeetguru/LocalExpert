import { config } from '../config';
import { AuthRepository, CategoryRepository, ChatRepository, RequestRepository, SocialRepository, VendorRepository, ApiBundle } from '../repository';
import { mockCategories as categoryList } from './categories';
import { mockVendors } from './vendors';
import { mockConversations, mockMessages, mockRequests, mockReviews } from './engagement';
import { mockCustomer } from './users';
import { Category, Conversation, ID, Message, Review, ServiceRequest, User, Vendor } from '../../types/models';

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const PAGE = () => config.pageSize;

let sessionUser: User | null = null;
let requests: ServiceRequest[] = [...mockRequests];
let conversations: Conversation[] = [...mockConversations];
let messages: Record<string, Message[]> = JSON.parse(JSON.stringify(mockMessages));
let liveVendors: Vendor[] = [...mockVendors];
let liveReviews: Review[] = [...mockReviews];

/** Shegaon demo pins — same coordinates as the WordPress seed. */
const MOCK_GEO: Record<string, [number, number]> = {
  'v-sharma-electricals': [20.8055, 76.6985],
  'v-coolcare': [20.7905, 76.689],
  'v-pankha-house': [20.801, 76.699],
  'v-jal-plumbing': [20.812, 76.71],
  'v-woodcraft': [20.785, 76.678],
  'v-frostline': [20.802, 76.69],
  'v-mobile-doctor': [20.8005, 76.6975],
  'v-smile-dental': [20.794, 76.701],
  'v-shree-clinic': [20.808, 76.683],
  'v-glamour-salon': [20.796, 76.692],
  'v-speed-bike': [20.818, 76.712],
  'v-safai': [20.815, 76.705],
  'v-master-tailor': [20.7975, 76.6945],
  'v-gyan-tutor': [20.791, 76.688],
  'v-click-studio': [20.8035, 76.7025],
  'v-compucare': [20.799, 76.696],
  'v-rang-painter': [20.81, 76.708],
  'v-print-point': [20.8008, 76.6972],
  'v-new-fridge-care': [20.806, 76.703],
};

const withMockGeo = (list: Vendor[]): Vendor[] =>
  list.map((v) => {
    const g = MOCK_GEO[v.id];
    if (!g || v.location.geo) return v;
    return { ...v, location: { ...v.location, geo: { lat: g[0], lng: g[1] } } };
  });

liveVendors = withMockGeo(liveVendors);

const publicVendors = () => liveVendors.filter((v) => v.verificationStatus === 'approved');

const requireVerified = () => {
  if (sessionUser && !sessionUser.emailVerified) {
    throw new Error('Verify your email to continue.');
  }
};

let otpCodes: Record<string, string> = {};
/** Mock-mode password store (in-memory only, mirrors the password_hash column). */
let mockPasswords: Record<string, string> = {};

const mockCode = (email: string) => {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpCodes[email.toLowerCase()] = code;
  return code;
};

export const mockAuth: AuthRepository = {
  async loginWithEmail(email) {
    await delay(600);
    const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    sessionUser = { ...mockCustomer, email: email.toLowerCase(), name: name || 'Guest User', emailVerified: false, hasPassword: !!mockPasswords[email.toLowerCase()] };
    const demoCode = mockCode(email);
    return { user: sessionUser, needsVerification: true, demoCode };
  },
  async register(name, email, phone) {
    await delay(600);
    sessionUser = { ...mockCustomer, id: `u-${Date.now()}`, name, email: email.toLowerCase(), phone, emailVerified: false, hasPassword: false };
    const demoCode = mockCode(email);
    return { user: sessionUser, needsVerification: true, demoCode };
  },
  async requestOtp(email) {
    await delay(500);
    return { sent: true, demoCode: mockCode(email) };
  },
  async verifyOtp(email, code) {
    await delay(600);
    const want = otpCodes[email.toLowerCase()];
    if (!want || want !== code.trim()) {
      throw new Error('Wrong code. Check and try again.');
    }
    delete otpCodes[email.toLowerCase()];
    if (!sessionUser) {
      sessionUser = { ...mockCustomer, email: email.toLowerCase(), emailVerified: true, hasPassword: !!mockPasswords[email.toLowerCase()] };
    } else {
      sessionUser = { ...sessionUser, emailVerified: true };
    }
    return { user: sessionUser, needsVerification: false };
  },
  async loginWithPassword(email, password) {
    await delay(600);
    const key = email.toLowerCase();
    const want = mockPasswords[key];
    if (!want) {
      throw new Error('No password set for this email yet. Verify your email to set one.');
    }
    if (want !== password) {
      throw new Error('Wrong email or password.');
    }
    if (!sessionUser || sessionUser.email !== key) {
      sessionUser = { ...mockCustomer, email: key, emailVerified: true, hasPassword: true };
    } else {
      sessionUser = { ...sessionUser, emailVerified: true, hasPassword: true };
    }
    return { user: sessionUser, needsVerification: false };
  },
  async setPassword(password) {
    await delay(400);
    if (!sessionUser) throw new Error('Not logged in');
    if (password.length < 6) throw new Error('Password must be 6–72 characters.');
    mockPasswords[sessionUser.email.toLowerCase()] = password;
    sessionUser = { ...sessionUser, hasPassword: true };
    return sessionUser;
  },
  async requestPasswordReset(email) {
    await delay(500);
    return { sent: true, demoCode: mockCode(email) };
  },
  async confirmPasswordReset(email, code, newPassword) {
    await delay(600);
    const want = otpCodes[email.toLowerCase()];
    if (!want || want !== code.trim()) {
      throw new Error('Wrong code. Check and try again.');
    }
    if (newPassword.length < 6) throw new Error('Password must be 6–72 characters.');
    delete otpCodes[email.toLowerCase()];
    mockPasswords[email.toLowerCase()] = newPassword;
    if (!sessionUser) {
      sessionUser = { ...mockCustomer, email: email.toLowerCase(), emailVerified: true, hasPassword: true };
    } else {
      sessionUser = { ...sessionUser, emailVerified: true, hasPassword: true };
    }
    return { user: sessionUser, needsVerification: false };
  },
  async refreshSession() {
    await delay(200);
    return sessionUser;
  },
  async changeEmail(newEmail) {
    await delay(600);
    if (!sessionUser) throw new Error('Not logged in');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      throw new Error('Enter a valid email address.');
    }
    sessionUser = { ...sessionUser, email: newEmail.trim().toLowerCase(), emailVerified: false };
    return { user: sessionUser, sent: true, demoCode: mockCode(newEmail) };
  },
  async logout() {
    await delay(200);
    sessionUser = null;
  },
  async updatePushToken() {
    await delay(150);
    // Mock has no push gateway — token is accepted and echoed on the user.
    if (!sessionUser) throw new Error('Not logged in');
    return sessionUser;
  },
  async currentUser() {
    await delay(150);
    return sessionUser;
  },
  async updateProfile(patch) {
    await delay(300);
    if (!sessionUser) throw new Error('Not logged in');
    sessionUser = { ...sessionUser, ...patch };
    return sessionUser;
  },
};

/** Expand a group id to its leaf ids; leaves pass through. */
const scopeIds = (categoryId: ID): ID[] => {
  const kids = categoryList.filter((c: Category) => c.parentId === categoryId).map((c: Category) => c.id);
  return kids.length > 0 ? kids : [categoryId];
};

const withCounts = (cats: Category[]): Category[] => {
  const approved = publicVendors();
  const leafCount: Record<string, number> = {};
  for (const v of approved) leafCount[v.categoryId] = (leafCount[v.categoryId] ?? 0) + 1;
  return cats.map((c) => {
    if (c.parentId) return { ...c, vendorCount: leafCount[c.id] ?? 0 };
    const kids = cats.filter((k) => k.parentId === c.id);
    return { ...c, vendorCount: kids.reduce((s, k) => s + (leafCount[k.id] ?? 0), 0) };
  });
};

export const mockCategoriesRepo: CategoryRepository = {
  async list() {
    await delay(250);
    return withCounts(categoryList);
  },
  async popular() {
    await delay(250);
    return withCounts(categoryList).filter((c: Category) => c.popular);
  },
};

export const mockVendorsRepo: VendorRepository = {
  async list(params) {
    await delay();
    let items = publicVendors();
    if (params?.categoryId) {
      const scope = scopeIds(params.categoryId);
      items = items.filter((v) => scope.includes(v.categoryId));
    }
    if (params?.query) {
      const q = params.query.toLowerCase();
      items = items.filter(
        (v) =>
          v.businessName.toLowerCase().includes(q) ||
          v.categoryName.toLowerCase().includes(q) ||
          v.servicesOffered.some((s) => s.toLowerCase().includes(q)) ||
          v.location.area?.toLowerCase().includes(q),
      );
    }
    items = params?.sort === 'near'
      ? [...items].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
      : [...items].sort((a, b) => b.rating - a.rating);
    const page = params?.page ?? 0;
    const size = PAGE();
    const slice = items.slice(page * size, page * size + size);
    return { items: slice, page, hasMore: (page + 1) * size < items.length, total: items.length };
  },
  async getById(id) {
    await delay(250);
    // Allow owner to preview own pending vendor
    return liveVendors.find((v) => v.id === id) ?? null;
  },
  async byCategory(categoryId, page = 0) {
    return this.list({ categoryId, page });
  },
  async search(query) {
    await delay(300);
    const q = query.trim().toLowerCase();
    if (!q) return { categories: [], vendors: [] };
    const categories = withCounts(categoryList).filter(
      (c: Category) => c.name.toLowerCase().includes(q) || c.keywords.some((k: string) => k.includes(q)),
    ).slice(0, 12);
    // Relevance-ranked like the live API: exact > prefix > contains.
    const words = q.split(/\s+/).filter((w) => w.length >= 2).slice(0, 4);
    const keys = words.length > 0 ? words : [q];
    const score = (v: Vendor) => {
      const name = v.businessName.toLowerCase();
      const cat = v.categoryName.toLowerCase();
      const svc = [...v.servicesOffered, v.location.area ?? ''].join(' ').toLowerCase();
      let best = 99;
      for (const w of keys) {
        if (name === w || name === q) best = Math.min(best, 0);
        else if (name.startsWith(w)) best = Math.min(best, 1);
        else if (name.includes(w)) best = Math.min(best, 2);
        else if (cat.includes(w)) best = Math.min(best, 3);
        else if (svc.includes(w)) best = Math.min(best, 4);
      }
      return best;
    };
    const vendors = publicVendors()
      .filter(
        (v) =>
          v.businessName.toLowerCase().includes(q) ||
          v.categoryName.toLowerCase().includes(q) ||
          v.servicesOffered.some((s) => s.toLowerCase().includes(q)) ||
          keys.some((w) => v.businessName.toLowerCase().includes(w) || v.categoryName.toLowerCase().includes(w)),
      )
      .sort((a, b) => score(a) - score(b) || b.rating - a.rating)
      .slice(0, 20);
    return { categories, vendors };
  },
  async createDraft(input) {
    await delay(700);
    requireVerified();
    const cat = categoryList.find((c: Category) => c.id === input.categoryId);
    const vendor: Vendor = {
      id: `v-${Date.now()}`,
      ownerId: input.ownerId,
      businessName: input.businessName,
      slug: input.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      categoryId: input.categoryId,
      categoryName: cat?.name ?? 'Service',
      description: input.description,
      servicesOffered: input.servicesOffered,
      phone: input.phone,
      email: input.email,
      location: {
        city: input.city ?? 'Shegaon',
        area: input.area ?? '',
        address: input.address,
        serviceAreas: [input.area ?? 'Shegaon'],
        ...(input.lat != null && input.lng != null ? { geo: { lat: input.lat, lng: input.lng } } : {}),
      },
      workingHours: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day: d, open: '09:00', close: '20:00', closed: d === 0 })),
      photos: input.photos,
      rating: 0,
      reviewCount: 0,
      completedJobs: 0,
      yearsExperience: 1,
      verificationStatus: 'pending',
      isVerified: false,
      homeVisitAvailable: input.homeVisitAvailable,
      availableToday: false,
      createdAt: new Date().toISOString(),
    };
    liveVendors = [vendor, ...liveVendors];
    // Mirror the server: submitting promotes the owner to a vendor account.
    if (sessionUser && sessionUser.id === input.ownerId) {
      sessionUser = { ...sessionUser, role: 'vendor', vendorId: vendor.id };
    }
    return vendor;
  },
  async updateVendor(id, patch) {
    await delay(400);
    liveVendors = liveVendors.map((v) => (v.id === id ? { ...v, ...patch } : v));
    return liveVendors.find((v) => v.id === id)!;
  },
  async addPhoto(id, asset) {
    await delay(500);
    requireVerified();
    liveVendors = liveVendors.map((v) =>
      v.id === id ? { ...v, photos: [...v.photos, asset.uri].slice(0, 5) } : v,
    );
    return liveVendors.find((v) => v.id === id)!;
  },
  async removePhoto(id, url) {
    await delay(300);
    requireVerified();
    liveVendors = liveVendors.map((v) =>
      v.id === id ? { ...v, photos: v.photos.filter((p) => p !== url) } : v,
    );
    return liveVendors.find((v) => v.id === id)!;
  },
  async myVendor(ownerId) {
    await delay(300);
    return liveVendors.find((v) => v.ownerId === ownerId) ?? null;
  },
};

export const mockRequestsRepo: RequestRepository = {
  async create(input) {
    await delay(600);
    requireVerified();
    const now = new Date().toISOString();
    const req: ServiceRequest = { ...input, id: `r-${Date.now()}`, status: 'pending', createdAt: now, updatedAt: now };
    requests = [req, ...requests];
    return req;
  },
  async listForCustomer(customerId) {
    await delay(300);
    return requests.filter((r) => r.customerId === customerId);
  },
  async listForVendor(vendorId) {
    await delay(300);
    return requests.filter((r) => r.vendorId === vendorId);
  },
  async updateStatus(id, status) {
    await delay(350);
    requests = requests.map((r) => (r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r));
    return requests.find((r) => r.id === id)!;
  },
  async getById(id) {
    await delay(200);
    return requests.find((r) => r.id === id) ?? null;
  },
};

export const mockChat: ChatRepository = {
  async conversationsFor(userId) {
    await delay(300);
    return conversations.filter((c) => c.customerId === userId || c.vendorId === userId);
  },
  async messages(conversationId) {
    await delay(300);
    return messages[conversationId] ?? [];
  },
  async send(conversationId, senderId, senderRole, text) {
    await delay(250);
    requireVerified();
    const msg: Message = {
      id: `m-${Date.now()}`,
      conversationId,
      senderId,
      senderRole,
      text,
      createdAt: new Date().toISOString(),
      read: false,
    };
    messages[conversationId] = [...(messages[conversationId] ?? []), msg];
    conversations = conversations.map((c) =>
      c.id === conversationId ? { ...c, lastMessage: text, lastAt: msg.createdAt, unreadCount: 0 } : c,
    );
    return msg;
  },
  async ensureConversation(customerId, customerName, vendor) {
    await delay(300);
    requireVerified();
    const existing = conversations.find((c) => c.vendorId === vendor.id && c.customerId === customerId);
    if (existing) return existing;
    const conv: Conversation = {
      id: `conv-${Date.now()}`,
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      customerId,
      customerName,
      lastMessage: '',
      lastAt: new Date().toISOString(),
      unreadCount: 0,
      vendorCategory: vendor.categoryName,
    };
    conversations = [conv, ...conversations];
    messages[conv.id] = [];
    return conv;
  },
  async markRead(conversationId) {
    conversations = conversations.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c));
  },
};

export const mockSocial: SocialRepository = {
  async reviewsFor(vendorId) {
    await delay(280);
    return liveReviews.filter((r) => r.vendorId === vendorId);
  },
  async submitReview(vendorId, rating, text) {
    await delay(500);
    requireVerified();
    const author = sessionUser?.name ?? 'Guest';
    if (liveReviews.some((r) => r.vendorId === vendorId && r.authorName === author)) {
      throw new Error('You already reviewed this provider.');
    }
    const review: Review = {
      id: `rev-${Date.now()}`,
      vendorId,
      authorName: author,
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    liveReviews.unshift(review);
    liveVendors = liveVendors.map((v) => {
      if (v.id !== vendorId) return v;
      const all = liveReviews.filter((r) => r.vendorId === vendorId);
      const avg = all.reduce((s, r) => s + r.rating, 0) / Math.max(1, all.length);
      return { ...v, rating: Math.round(avg * 10) / 10, reviewCount: all.length };
    });
    return review;
  },
  async toggleSaved(user, vendorId) {
    await delay(200);
    requireVerified();
    const has = user.savedVendorIds.includes(vendorId);
    const savedVendorIds = has ? user.savedVendorIds.filter((id) => id !== vendorId) : [...user.savedVendorIds, vendorId];
    const next = { ...user, savedVendorIds };
    if (sessionUser && sessionUser.id === user.id) sessionUser = next;
    return next;
  },
};

export const mockApi: ApiBundle = {
  auth: mockAuth,
  categories: mockCategoriesRepo,
  vendors: mockVendorsRepo,
  requests: mockRequestsRepo,
  chat: mockChat,
  social: mockSocial,
};

export function __resetMocksForTests() {
  sessionUser = null;
  requests = [...mockRequests];
  conversations = [...mockConversations];
  messages = JSON.parse(JSON.stringify(mockMessages));
  liveVendors = withMockGeo([...mockVendors]);
  liveReviews = [...mockReviews];
  otpCodes = {};
  mockPasswords = {};
}
