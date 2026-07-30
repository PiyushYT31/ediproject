export enum UserRole {
  CONSUMER = "consumer",
  WORKER = "worker",
  VENDOR = "vendor",
  ARTISAN = "artisan",
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  photoURL?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    state?: string;
    city?: string;
  };
  createdAt: number;
}

export interface WorkerProfile extends UserProfile {
  category: string;
  rating: number;
  totalJobs: number;
  completionRate: number;
  basePrice: number;
  bio: string;
  isAvailable: boolean;
  reviewsCount?: number;
}

export interface ArtisanProfile extends UserProfile {
  artisanBio: string;
  specialty: string;
  rating: number;
  galleryUrls?: string[];
}

export interface Product {
  id: string;
  artisanId: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  createdAt: number;
}

export interface Order {
  id: string;
  consumerId: string;
  artisanId: string;
  productId: string;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  shippingAddress: string;
  createdAt: number;
}

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export interface Review {
  id: string;
  workerId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface HardwareVendor extends UserProfile {
  shopName: string;
  inventory: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
}

export interface JobRequest {
  id: string;
  consumerId: string;
  workerId: string;
  status: JobStatus;
  category: string;
  description: string;
  images?: string[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
    state?: string;
    city?: string;
  };
  quotedPrice?: number;
  materials?: {
    itemId: string;
    name: string;
    quantity: number;
    pricePerUnit: number;
  }[];
  createdAt: number;
  updatedAt: number;
}

export enum JobStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}
