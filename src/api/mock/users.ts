import { User } from '../../types/models';

export const mockCustomer: User = {
  id: 'u-customer-1',
  name: 'Rahul Deshmukh',
  email: 'rahul.demo@example.in',
  phone: '+91 98XXXXXX21',
  role: 'customer',
  city: 'Shegaon',
  emailVerified: true,
  hasPassword: false,
  savedVendorIds: ['v-sharma-electricals', 'v-smile-dental'],
  createdAt: '2025-01-10T10:00:00Z',
};

export const mockVendorOwner: User = {
  id: 'u-vendor-1',
  name: 'Ramesh Sharma',
  email: 'sharma.electricals@example.in',
  phone: '+91 9822001101',
  role: 'vendor',
  city: 'Shegaon',
  emailVerified: true,
  hasPassword: false,
  savedVendorIds: [],
  vendorId: 'v-sharma-electricals',
  createdAt: '2024-02-11T10:00:00Z',
};

