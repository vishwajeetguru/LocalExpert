import { Conversation, Message, Review, ServiceRequest } from '../../types/models';

export const mockRequests: ServiceRequest[] = [
  {
    id: 'r-1001', vendorId: 'v-sharma-electricals', vendorName: 'Sharma Electricals & Repair',
    categoryName: 'Electrician', customerId: 'u-customer-1', customerName: 'Rahul Deshmukh',
    serviceSummary: 'Ceiling fan not working + switch spark',
    description: 'Hall ceiling fan stopped yesterday. Switch board sparks when turned on. Need check today evening.',
    preferredDate: '2026-09-12', preferredTime: '06:00 PM',
    address: 'Plot 5, Anand Nagar, Shegaon', phone: '+91 98XXXXXX21',
    status: 'accepted', createdAt: '2026-09-10T09:00:00Z', updatedAt: '2026-09-10T11:00:00Z',
  },
  {
    id: 'r-1002', vendorId: 'v-coolcare', vendorName: 'CoolCare Cooler & Fan Clinic',
    categoryName: 'Cooler Repair', customerId: 'u-customer-1', customerName: 'Rahul Deshmukh',
    serviceSummary: 'Cooler pump no water throw',
    description: 'Desert cooler motor runs but no water circulation. Need pump + pad check.',
    preferredDate: '2026-09-13', preferredTime: '11:00 AM',
    address: 'Plot 5, Anand Nagar, Shegaon', phone: '+91 98XXXXXX21',
    status: 'pending', createdAt: '2026-09-11T07:30:00Z', updatedAt: '2026-09-11T07:30:00Z',
  },
  {
    id: 'r-1003', vendorId: 'v-smile-dental', vendorName: 'SmileCare Dental Clinic',
    categoryName: 'Dentist', customerId: 'u-customer-1', customerName: 'Rahul Deshmukh',
    serviceSummary: 'Tooth pain — lower right',
    description: 'Sensitivity + pain since 3 days. Need appointment.',
    preferredDate: '2026-09-11', preferredTime: '07:00 PM',
    address: 'Clinic visit', phone: '+91 98XXXXXX21',
    status: 'completed', createdAt: '2026-09-08T10:00:00Z', updatedAt: '2026-09-09T10:00:00Z',
  },
];

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1', vendorId: 'v-sharma-electricals', vendorName: 'Sharma Electricals & Repair',
    customerId: 'u-customer-1', customerName: 'Rahul Deshmukh',
    lastMessage: 'Yes, I can come at 6 PM today. Address same?', lastAt: '2026-09-11T08:20:00Z',
    unreadCount: 1, vendorCategory: 'Electrician',
  },
  {
    id: 'conv-2', vendorId: 'v-coolcare', vendorName: 'CoolCare Cooler & Fan Clinic',
    customerId: 'u-customer-1', customerName: 'Rahul Deshmukh',
    lastMessage: 'Pump Rs. 450 with fitting, khus pad Rs. 250. OK?', lastAt: '2026-09-11T06:10:00Z',
    unreadCount: 0, vendorCategory: 'Cooler Repair',
  },
];

export const mockMessages: Record<string, Message[]> = {
  'conv-1': [
    { id: 'm-1', conversationId: 'conv-1', senderId: 'u-customer-1', senderRole: 'customer', text: 'Namaste, hall fan stopped working, switch sparks.', createdAt: '2026-09-11T07:55:00Z', read: true },
    { id: 'm-2', conversationId: 'conv-1', senderId: 'u-vendor-1', senderRole: 'vendor', text: 'Namaste! Do not use that switch. I will check wiring + fan. When are you home?', createdAt: '2026-09-11T08:05:00Z', read: true },
    { id: 'm-3', conversationId: 'conv-1', senderId: 'u-customer-1', senderRole: 'customer', text: 'After 6 PM today works.', createdAt: '2026-09-11T08:12:00Z', read: true },
    { id: 'm-4', conversationId: 'conv-1', senderId: 'u-vendor-1', senderRole: 'vendor', text: 'Yes, I can come at 6 PM today. Address same?', createdAt: '2026-09-11T08:20:00Z', read: false },
  ],
  'conv-2': [
    { id: 'm-5', conversationId: 'conv-2', senderId: 'u-customer-1', senderRole: 'customer', text: 'Cooler not throwing water, motor sound OK.', createdAt: '2026-09-11T05:50:00Z', read: true },
    { id: 'm-6', conversationId: 'conv-2', senderId: 'u-vendor-2', senderRole: 'vendor', text: 'Pump Rs. 450 with fitting, khus pad Rs. 250. OK?', createdAt: '2026-09-11T06:10:00Z', read: true },
  ],
};

export const mockReviews: Review[] = [
  { id: 'rev-1', vendorId: 'v-sharma-electricals', authorName: 'Sachin J.', rating: 5, text: 'Came in 40 minutes, fixed fan + switchboard. Clean work, proper bill.', createdAt: '2026-08-20T10:00:00Z' },
  { id: 'rev-2', vendorId: 'v-sharma-electricals', authorName: 'Priya A.', rating: 5, text: 'Polite and explained safety issue clearly. Highly trusted.', createdAt: '2026-08-02T10:00:00Z' },
  { id: 'rev-3', vendorId: 'v-sharma-electricals', authorName: 'Nilesh K.', rating: 4, text: 'Good work, slightly late in evening slot but informed on call.', createdAt: '2026-07-18T10:00:00Z' },
  { id: 'rev-4', vendorId: 'v-coolcare', authorName: 'Asha P.', rating: 5, text: 'Cooler cooling like new after pump + pad change.', createdAt: '2026-06-11T10:00:00Z' },
];

