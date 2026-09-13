/**
 * WordPress REST implementation of the ApiBundle contracts.
 * Talks ONLY to the SevaSathi plugin namespace — never to the WP database.
 * App auth: X-Seva-App-Key header (EXPO_PUBLIC_API_KEY) on every request.
 * User auth: X-Seva-Token header issued by /auth/login|register, kept in SecureStore.
 */
import {
  ApiBundle,
  AuthRepository,
  CategoryRepository,
  ChatRepository,
  RequestRepository,
  SocialRepository,
  VendorDraftInput,
  VendorRepository,
} from '../repository';
import {
  Category,
  Conversation,
  ID,
  Message,
  Review,
  ServiceRequest,
  User,
  Vendor,
} from '../../types/models';
import { getToken, setToken } from './token';
import { config } from '../config';

function base(): string {
  return (config.apiUrl || '').replace(/\/$/, '');
}

/** Dependency-free base64 for the staging tunnel's HTTP Basic header. */
function toBase64(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let out = '';
  for (let i = 0; i < input.length; i += 3) {
    const a = input.charCodeAt(i);
    const b = i + 1 < input.length ? input.charCodeAt(i + 1) : NaN;
    const c = i + 2 < input.length ? input.charCodeAt(i + 2) : NaN;
    const n = (a << 16) | ((isNaN(b) ? 0 : b) << 8) | (isNaN(c) ? 0 : c);
    out += chars[(n >> 18) & 63] + chars[(n >> 12) & 63] + (isNaN(b) ? '=' : chars[(n >> 6) & 63]) + (isNaN(c) ? '=' : chars[n & 63]);
  }
  return out;
}

/** Live-Link tunnels are password-gated; production ignores these envs. */
function tunnelHeader(): Record<string, string> {
  if (config.appEnv === 'staging' && config.tunnelUser && config.tunnelPass) {
    return { Authorization: `Basic ${toBase64(`${config.tunnelUser}:${config.tunnelPass}`)}` };
  }
  return {};
}

/** Plugin app key — required on EVERY sevasathi/v1 request (see WP → SevaSathi → Settings). */
function appKeyHeader(): Record<string, string> {
  return config.apiKey ? { 'X-Seva-App-Key': config.apiKey } : {};
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** fetch with a hard ceiling — a dead tunnel must fail FAST, never hang boot. */
async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') {
      throw new ApiError('Server is taking too long. Check the API URL and connection.', 0);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

const REQUEST_TIMEOUT_MS = 12000;

async function req<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${base()}${path}`,
      {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...tunnelHeader(),
          ...appKeyHeader(),
          ...(token ? { 'X-Seva-Token': token } : {}),
          ...(init?.headers ?? {}),
        },
      },
      REQUEST_TIMEOUT_MS,
    );
  } catch {
    throw new ApiError('Cannot reach the SevaSathi server. Check EXPO_PUBLIC_API_URL and that the site is running.', 0);
  }
  // Sliding sessions: one silent refresh + retry on an expired token.
  // App-key 401s must NEVER trigger a refresh — peek at the error code first.
  if (res.status === 401 && token && !retried && !path.startsWith('/auth/')) {
    let keyProblem = false;
    try {
      const peek = (await res.clone().json()) as { code?: unknown };
      keyProblem =
        peek?.code === 'seva_missing_key' || peek?.code === 'seva_invalid_key' || peek?.code === 'seva_no_key';
    } catch {
      keyProblem = false;
    }
    if (!keyProblem) {
      const rotated = await tryRefresh(token);
      if (rotated) return req<T>(path, init, true);
    }
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    const bodyObj = body && typeof body === 'object' ? (body as { message?: unknown; code?: unknown }) : null;
    const code = typeof bodyObj?.code === 'string' ? bodyObj.code : '';
    // Fix = copy the key from WP → SevaSathi → Settings into EXPO_PUBLIC_API_KEY and rebuild.
    if (code === 'seva_missing_key' || code === 'seva_invalid_key' || code === 'seva_no_key') {
      throw new ApiError(
        'App key missing or invalid. Copy the key from WordPress → SevaSathi → Settings into EXPO_PUBLIC_API_KEY and rebuild the app.',
        401,
      );
    }
    if (code === 'seva_rate_limited') {
      throw new ApiError('Too many requests. Wait a moment and try again.', 429);
    }
    if (code === 'rest_not_logged_in') {
      throw new ApiError(
        'The site blocks anonymous API access (security plugin). Allowlist /wp-json/sevasathi/* for the app key, then retry.',
        401,
      );
    }
    const msg =
      body && typeof body === 'object' && 'message' in body && typeof (body as { message: unknown }).message === 'string'
        ? (body as { message: string }).message
        : `Request failed (${res.status})`;
    const clean = String(msg).replace(/<[^>]*>/g, '').slice(0, 300);
    if (res.status === 404) {
      let host = base();
      try {
        host = new URL(base()).host || base();
      } catch {
        // keep raw base
      }
      // 404 almost always means wrong base URL or inactive plugin — say so.
      throw new ApiError(`API not found at ${host}. Check the API URL and that the SevaSathi plugin is active.`, 404);
    }
    throw new ApiError(clean, res.status);
  }
  return body as T;
}

const jpost = <T>(path: string, data?: object): Promise<T> =>
  req<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined });

const jpatch = <T>(path: string, data?: object): Promise<T> =>
  req<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined });

async function tryRefresh(oldToken: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(
      `${base()}/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...tunnelHeader(), ...appKeyHeader(), 'X-Seva-Token': oldToken },
      },
      REQUEST_TIMEOUT_MS,
    );
    if (!res.ok) {
      if (res.status === 401) await setToken(null);
      return false;
    }
    const body = (await res.json()) as { token?: string };
    if (body?.token) {
      await setToken(body.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const str = (v: unknown): string => String(v ?? '');
const asUser = (u: User): User => ({ ...u, id: str(u.id), vendorId: u.vendorId ? str(u.vendorId) : undefined, savedVendorIds: (u.savedVendorIds ?? []).map(str), hasPassword: !!u.hasPassword });
const asVendor = (v: Vendor): Vendor => ({ ...v, id: str(v.id), ownerId: v.ownerId ? str(v.ownerId) : undefined });
const asRequest = (r: ServiceRequest): ServiceRequest => ({ ...r, id: str(r.id), vendorId: str(r.vendorId), customerId: str(r.customerId) });
const asConversation = (c: Conversation): Conversation => ({ ...c, id: str(c.id), vendorId: str(c.vendorId), customerId: str(c.customerId) });
const asMessage = (m: Message): Message => ({ ...m, id: str(m.id), conversationId: str(m.conversationId), senderId: str(m.senderId) });

const auth: AuthRepository = {
  async loginWithEmail(email, name) {
    const res = await jpost<{ user: User; token: string | null; needsVerification: boolean }>('/auth/login', { email, name });
    // SECURITY: email alone must NEVER grant a session. Some backends return
    // a token + needsVerification:false for already-verified emails — accepting
    // that would let anyone log in as anyone. Always drop the token and force
    // the OTP step; the session is issued only by /auth/otp/verify.
    await setToken(null);
    if (!res.needsVerification) {
      try {
        await jpost('/auth/otp/request', { email });
      } catch {
        // Verify screen offers resend — a send failure here must not block it.
      }
      return { user: asUser(res.user), needsVerification: true };
    }
    return { user: asUser(res.user), needsVerification: true };
  },
  async register(name, email, phone) {
    const res = await jpost<{ user: User; token: string | null; needsVerification: boolean }>('/auth/register', { name, email, phone });
    // Same rule for new accounts — no session until the email OTP is verified.
    await setToken(null);
    if (!res.needsVerification) {
      try {
        await jpost('/auth/otp/request', { email });
      } catch {
        // Verify screen offers resend.
      }
      return { user: asUser(res.user), needsVerification: true };
    }
    return { user: asUser(res.user), needsVerification: true };
  },
  async requestOtp(email) {
    return jpost<{ sent: boolean; verified?: boolean }>('/auth/otp/request', { email });
  },
  async verifyOtp(email, code) {
    const res = await jpost<{ user: User; token: string | null; needsVerification: boolean }>('/auth/otp/verify', { email, code });
    if (res.token) await setToken(res.token);
    return { user: asUser(res.user), needsVerification: !!res.needsVerification };
  },
  async loginWithPassword(email, password) {
    // Password login issues a real session — the ONLY non-OTP path that may
    // store a token. Server enforces: verified + password set + rate limits.
    const res = await jpost<{ user: User; token: string | null; needsVerification: boolean }>('/auth/password/login', { email, password });
    if (res.token) await setToken(res.token);
    else await setToken(null);
    return { user: asUser(res.user), needsVerification: !!res.needsVerification };
  },
  async setPassword(password) {
    const user = await jpost<User>('/auth/password/set', { password });
    return asUser(user);
  },
  async requestPasswordReset(email) {
    return jpost<{ sent: boolean }>('/auth/password/reset/request', { email });
  },
  async confirmPasswordReset(email, code, newPassword) {
    const res = await jpost<{ user: User; token: string | null; needsVerification: boolean }>('/auth/password/reset/confirm', { email, code, new_password: newPassword });
    if (res.token) await setToken(res.token);
    else await setToken(null);
    return { user: asUser(res.user), needsVerification: !!res.needsVerification };
  },
  async refreshSession() {
    const token = await getToken();
    if (!token) return null;
    const ok = await tryRefresh(token);
    if (!ok) return null;
    try {
      return asUser(await req<User>('/users/me'));
    } catch {
      return null;
    }
  },
  async changeEmail(newEmail: string) {
    const res = await jpost<{ user: User; sent: boolean }>('/auth/email/change', { new_email: newEmail });
    return { user: asUser(res.user), sent: !!res.sent };
  },  async logout() {
    await setToken(null);
  },
  async currentUser() {
    const token = await getToken();
    if (!token) return null;
    try {
      return asUser(await req<User>('/users/me'));
    } catch (e) {
      // Boot must never crash: dead tunnel / expired session / 404 all
      // resolve to "logged out". Screens surface their own retry UI.
      if (e instanceof ApiError && e.status === 401) await setToken(null);
      return null;
    }
  },
  async updatePushToken(token: string) {
    return asUser(await jpatch<User>('/users/me', { push_token: token }));
  },
  async updateProfile(patch) {
    return asUser(await jpatch<User>('/users/me', patch));
  },
};

const categories: CategoryRepository = {
  async list() {
    const items = await req<Category[]>('/categories');
    return arr<Category>(items).map((c) => ({ ...c, id: str(c.id) }));
  },
  async popular() {
    return (await this.list()).filter((c) => c.popular);
  },
};

const vendors: VendorRepository = {
  async list(params) {
    const q = new URLSearchParams();
    if (params?.categoryId) q.set('category_id', params.categoryId);
    if (params?.query) q.set('q', params.query);
    if (params?.lat != null && params?.lng != null) {
      q.set('lat', String(params.lat));
      q.set('lng', String(params.lng));
    }
    if (params?.sort) q.set('sort', params.sort);
    q.set('page', String(params?.page ?? 0));
    const page = await req<{ items: Vendor[]; page: number; hasMore: boolean; total: number }>(`/vendors?${q.toString()}`);
    return { ...page, items: arr<Vendor>(page.items).map(asVendor) };
  },
  async getById(id) {
    try {
      return asVendor(await req<Vendor>(`/vendors/${encodeURIComponent(id)}`));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },
  async byCategory(categoryId, page = 0) {
    return this.list({ categoryId, page });
  },
  async search(query, geo) {
    const q = new URLSearchParams({ q: query });
    if (geo) {
      q.set('lat', String(geo.lat));
      q.set('lng', String(geo.lng));
    }
    const res = await req<{ categories: Category[]; vendors: Vendor[] }>(`/search?${q.toString()}`);
    return {
      categories: arr<Category>(res.categories).map((c) => ({ ...c, id: str(c.id) })),
      vendors: arr<Vendor>(res.vendors).map(asVendor),
    };
  },
  async createDraft(input: VendorDraftInput) {
    const v = await jpost<Vendor>('/vendors', {
      category_id: input.categoryId,
      business_name: input.businessName,
      description: input.description,
      services: input.servicesOffered,
      phone: input.phone,
      email: input.email,
      address: input.address,
      area: input.area,
      home_visit: input.homeVisitAvailable,
      lat: input.lat ?? undefined,
      lng: input.lng ?? undefined,
    });
    return asVendor(v);
  },
  async updateVendor(id, patch) {
    const body: Record<string, unknown> = {};
    if (patch.description !== undefined) body.description = patch.description;
    if (patch.phone !== undefined) body.phone = patch.phone;
    if (patch.location?.address !== undefined) body.address = patch.location.address;
    if (patch.homeVisitAvailable !== undefined) body.home_visit = patch.homeVisitAvailable;
    if (patch.location !== undefined) {
      // Null clears the pin; absent keys leave it untouched (array_key_exists server-side).
      body.lat = patch.location.geo?.lat ?? null;
      body.lng = patch.location.geo?.lng ?? null;
    }
    return asVendor(await jpatch<Vendor>(`/vendors/${encodeURIComponent(id)}`, body));
  },
  async addPhoto(id, asset) {
    const token = await getToken();
    const form = new FormData();
    form.append('photo', {
      uri: asset.uri,
      name: asset.name,
      type: asset.type,
    } as unknown as Blob);
    const res = await fetchWithTimeout(
      `${base()}/vendors/${encodeURIComponent(id)}/photos`,
      {
        method: 'POST',
        headers: {
          ...tunnelHeader(),
          ...appKeyHeader(),
          ...(token ? { 'X-Seva-Token': token } : {}),
        },
        body: form,
      },
      60000,
    );
    if (!res.ok) throw new ApiError(`Photo upload failed (${res.status})`, res.status);
    return asVendor((await res.json()) as Vendor);
  },
  async removePhoto(id, url) {
    const token = await getToken();
    const res = await fetchWithTimeout(
      `${base()}/vendors/${encodeURIComponent(id)}/photos?url=${encodeURIComponent(url)}`,
      {
        method: 'DELETE',
        headers: {
          ...tunnelHeader(),
          ...appKeyHeader(),
          ...(token ? { 'X-Seva-Token': token } : {}),
        },
      },
      REQUEST_TIMEOUT_MS,
    );
    if (!res.ok) throw new ApiError(`Photo removal failed (${res.status})`, res.status);
    return asVendor((await res.json()) as Vendor);
  },
  async myVendor() {
    const v = await req<Vendor | null>('/vendors/mine');
    return v ? asVendor(v) : null;
  },
};

const requests: RequestRepository = {
  async create(input) {
    const r = await jpost<ServiceRequest>('/requests', {
      vendor_id: input.vendorId,
      service_summary: input.serviceSummary,
      description: input.description,
      preferred_date: input.preferredDate,
      preferred_time: input.preferredTime,
      address: input.address,
      phone: input.phone,
      note: input.note,
    });
    return asRequest(r);
  },
  async listForCustomer() {
    return arr<ServiceRequest>(await req<ServiceRequest[]>('/requests')).map(asRequest);
  },
  async listForVendor() {
    return arr<ServiceRequest>(await req<ServiceRequest[]>('/requests?as=vendor')).map(asRequest);
  },
  async updateStatus(id, status) {
    return asRequest(await jpatch<ServiceRequest>(`/requests/${encodeURIComponent(id)}`, { status }));
  },
  async getById(id) {
    try {
      return asRequest(await req<ServiceRequest>(`/requests/${encodeURIComponent(id)}`));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },
};

const chat: ChatRepository = {
  async conversationsFor() {
    return arr<Conversation>(await req<Conversation[]>('/conversations')).map(asConversation);
  },
  async messages(conversationId) {
    return arr<Message>(await req<Message[]>(`/conversations/${encodeURIComponent(conversationId)}/messages`)).map(asMessage);
  },
  async send(conversationId, senderId, senderRole, text) {
    void senderId;
    void senderRole;
    return asMessage(
      await jpost<Message>(`/conversations/${encodeURIComponent(conversationId)}/messages`, { text }),
    );
  },
  async ensureConversation(customerId, customerName, vendor) {
    void customerId;
    void customerName;
    return asConversation(await jpost<Conversation>('/conversations/ensure', { vendor_id: vendor.id }));
  },
  async markRead() {
    // Server marks conversations read on message fetch; nothing extra needed.
  },
};

const social: SocialRepository = {
  async reviewsFor(vendorId) {
    const items = await req<Review[]>(`/vendors/${encodeURIComponent(vendorId)}/reviews`);
    return arr<Review>(items).map((r) => ({ ...r, id: str(r.id), vendorId: str(r.vendorId) }));
  },
  async submitReview(vendorId, rating, text) {
    const r = await jpost<Review>(`/vendors/${encodeURIComponent(vendorId)}/reviews`, { rating, text });
    return { ...r, id: str(r.id), vendorId: str(r.vendorId) };
  },
  async toggleSaved(user, vendorId) {
    const res = await jpost<{ saved: boolean; user: User }>('/users/me/saved', { vendor_id: vendorId });
    void user;
    return asUser(res.user);
  },
};

export const wordpressApi: ApiBundle = { auth, categories, vendors, requests, chat, social };

/** Raw GET for health checks / diagnostics. */
export async function wpGet<T>(path: string): Promise<T> {
  return req<T>(path);
}
