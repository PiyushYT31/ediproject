export enum UserRole {
  CUSTOMER = "customer",
  PROVIDER = "provider",
  // Backward compatibility aliases
  CONSUMER = "consumer",
  WORKER = "worker",
  VENDOR = "vendor",
  ARTISAN = "artisan",
}

export enum ProviderSubRole {
  WORKER = "worker",       // Daily Wage Worker (Plumber, Electrician, Loader, etc.)
  ARTISAN = "artisan",     // Artisan (Potter, Weaver, Carpenter, etc.)
  SHOPKEEPER = "vendor",   // Shopkeeper (Local hardware, grocery, materials)
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  accountType?: "customer" | "provider";
  subRole?: ProviderSubRole | "worker" | "artisan" | "vendor";
  photoURL?: string;
  idVerificationUrl?: string;
  isVerified?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    state?: string;
    city?: string;
  };
  profileSetupComplete?: boolean;
  createdAt: number;
}

export interface WorkerProfile extends UserProfile {
  category: string;
  profession: string;
  yearsOfExperience: number;
  skills: string[];
  languagesSpoken: string[];
  serviceDescription: string;
  hourlyFee: number;
  dailyCharges: number;
  emergencyCharges: number;
  availableTiming: { from: string; to: string };
  availableDays: string[];
  maxTravelDistance: string;
  isOnline: boolean;
  portfolioUrls: string[];
  videoUrls: string[];
  aadhaarVerified: boolean;
  skillCertificateUrl?: string;
  whatsappNumber?: string;
  rating: number;
  totalJobs: number;
  completionRate: number;
  basePrice: number;
  bio: string;
  isAvailable: boolean;
  reviewsCount?: number;
}

export interface ShopkeeperProfile extends UserProfile {
  shopName: string;
  ownerName: string;
  shopCategory: string;
  shopDescription: string;
  shopAddress: string;
  landmark: string;
  pincode: string;
  gstNumber?: string;
  openingTime: string;
  closingTime: string;
  weeklyOff: string;
  contactNumber: string;
  whatsappNumber: string;
  shopLogoUrl?: string;
  shopPhotoUrls: string[];
  homeDelivery: boolean;
  pickupAvailable: boolean;
  cashOnDelivery: boolean;
  onlinePayment: boolean;
  shopLicenseUrl?: string;
  aadhaarVerified: boolean;
  isPublished: boolean;
  inventory: InventoryItem[];
}

// Keep backward compat alias
export type HardwareVendor = ShopkeeperProfile;

export interface ArtisanProfile extends UserProfile {
  artisanBio: string;
  craftCategory: string;
  specialty: string;
  yearsOfExperience: number;
  handmadeProducts: string;
  productDescription: string;
  materialUsed: string;
  customOrdersAvailable: boolean;
  price: number;
  stockAvailable: number;
  productionTime: string;
  deliveryAvailable: boolean;
  shippingCharges: number;
  workshopAddress: string;
  workshopPhotoUrls: string[];
  videoUrls: string[];
  handicraftCertificateUrl?: string;
  isPublished: boolean;
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
  productTitle?: string;
  productImage?: string;
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
