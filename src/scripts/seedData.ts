/**
 * Worksphere Seed Data Script
 * Seeds Firestore with rich Indian worker, artisan, product, vendor & inventory data.
 * Uses reliable Picsum Photos + Unsplash Source URLs for all product images.
 */

import { db } from "../firebase";
import { doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { UserRole } from "../types";

const now = Date.now();
const daysAgo = (d: number) => now - 86400000 * d;

// ─── Workers (10) ─────────────────────────────────────────────────────────────
export const WORKER_SEED = [
  {
    id: "seed_worker_001",
    displayName: "Raju Sharma",
    email: "raju.sharma@worksphere.in",
    category: "Plumber",
    profession: "Senior Plumber",
    bio: "10+ yrs in residential & commercial plumbing. Expert in pipe fitting, leak repair, bathroom fittings & overhead tank work.",
    skills: ["Pipe Fitting", "Leak Repair", "Bathroom Installation", "Water Heater"],
    languagesSpoken: ["Hindi", "English"],
    hourlyFee: 350, dailyCharges: 2500, emergencyCharges: 500, basePrice: 350,
    rating: 4.8, totalJobs: 312, completionRate: 0.97,
    yearsOfExperience: 10,
    location: { latitude: 19.076, longitude: 72.8777, address: "Andheri West, Mumbai", city: "Mumbai", state: "Maharashtra" },
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    availableTiming: { from: "08:00", to: "20:00" },
    maxTravelDistance: "15km",
    isOnline: true, isAvailable: true, aadhaarVerified: true,
    portfolioUrls: [], videoUrls: [], whatsappNumber: "9876543210", reviewsCount: 289,
    profileSetupComplete: true, createdAt: daysAgo(200), role: UserRole.WORKER, phoneNumber: "9876543210",
    photoURL: "https://i.pravatar.cc/150?img=11",
  },
  {
    id: "seed_worker_002",
    displayName: "Suresh Verma",
    email: "suresh.elec@worksphere.in",
    category: "Electrician",
    profession: "Certified Electrician",
    bio: "Govt-certified electrician, 8 yrs exp. Home wiring, MCB panel setup, inverter installation & CCTV systems.",
    skills: ["Home Wiring", "MCB Panel", "Inverter Setup", "CCTV Installation", "Fan Fitting"],
    languagesSpoken: ["Hindi", "Marathi", "English"],
    hourlyFee: 400, dailyCharges: 2800, emergencyCharges: 600, basePrice: 400,
    rating: 4.6, totalJobs: 248, completionRate: 0.95,
    yearsOfExperience: 8,
    location: { latitude: 18.5204, longitude: 73.8567, address: "Kothrud, Pune", city: "Pune", state: "Maharashtra" },
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    availableTiming: { from: "09:00", to: "19:00" },
    maxTravelDistance: "20km",
    isOnline: true, isAvailable: true, aadhaarVerified: true,
    portfolioUrls: [], videoUrls: [], whatsappNumber: "9823456780", reviewsCount: 221,
    profileSetupComplete: true, createdAt: daysAgo(150), role: UserRole.WORKER, phoneNumber: "9823456780",
    photoURL: "https://i.pravatar.cc/150?img=12",
  },
  {
    id: "seed_worker_003",
    displayName: "Mohan Das",
    email: "mohan.carpentry@worksphere.in",
    category: "Carpenter",
    profession: "Master Carpenter",
    bio: "Expert in furniture making, wood polish, door & window repair, modular kitchen & false ceiling work. 15 yrs exp.",
    skills: ["Furniture Making", "Wood Polish", "Door Repair", "Modular Kitchen", "False Ceiling"],
    languagesSpoken: ["Hindi", "Kannada"],
    hourlyFee: 450, dailyCharges: 3200, emergencyCharges: 700, basePrice: 450,
    rating: 4.9, totalJobs: 421, completionRate: 0.98,
    yearsOfExperience: 15,
    location: { latitude: 12.9716, longitude: 77.5946, address: "Jayanagar, Bengaluru", city: "Bengaluru", state: "Karnataka" },
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    availableTiming: { from: "08:00", to: "18:00" },
    maxTravelDistance: "25km",
    isOnline: true, isAvailable: true, aadhaarVerified: true,
    portfolioUrls: [], videoUrls: [], whatsappNumber: "9900123456", reviewsCount: 398,
    profileSetupComplete: true, createdAt: daysAgo(300), role: UserRole.WORKER, phoneNumber: "9900123456",
    photoURL: "https://i.pravatar.cc/150?img=13",
  },
  {
    id: "seed_worker_004",
    displayName: "Dinesh Pawar",
    email: "dinesh.paint@worksphere.in",
    category: "Painter",
    profession: "Interior & Exterior Painter",
    bio: "Professional painter — Asian Paints, Berger, texture work, wall putty & waterproofing. Clean finish guaranteed.",
    skills: ["Interior Painting", "Exterior Painting", "Texture Work", "Wall Putty", "Waterproofing"],
    languagesSpoken: ["Hindi", "English", "Gujarati"],
    hourlyFee: 280, dailyCharges: 2000, emergencyCharges: 400, basePrice: 280,
    rating: 4.5, totalJobs: 180, completionRate: 0.94,
    yearsOfExperience: 7,
    location: { latitude: 23.0225, longitude: 72.5714, address: "Satellite, Ahmedabad", city: "Ahmedabad", state: "Gujarat" },
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    availableTiming: { from: "07:00", to: "18:00" },
    maxTravelDistance: "30km",
    isOnline: false, isAvailable: true, aadhaarVerified: true,
    portfolioUrls: [], videoUrls: [], whatsappNumber: "9712345678", reviewsCount: 162,
    profileSetupComplete: true, createdAt: daysAgo(180), role: UserRole.WORKER, phoneNumber: "9712345678",
    photoURL: "https://i.pravatar.cc/150?img=14",
  },
  {
    id: "seed_worker_005",
    displayName: "Arjun Pillai",
    email: "arjun.welder@worksphere.in",
    category: "Welder",
    profession: "Industrial Welder",
    bio: "Certified in MIG, TIG & arc welding. Handles gates, grills, furniture frames & industrial fabrication work.",
    skills: ["MIG Welding", "TIG Welding", "Arc Welding", "Gate Making", "Grill Work"],
    languagesSpoken: ["Hindi", "Tamil", "Malayalam"],
    hourlyFee: 380, dailyCharges: 2700, emergencyCharges: 550, basePrice: 380,
    rating: 4.7, totalJobs: 195, completionRate: 0.96,
    yearsOfExperience: 12,
    location: { latitude: 13.0827, longitude: 80.2707, address: "Anna Nagar, Chennai", city: "Chennai", state: "Tamil Nadu" },
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    availableTiming: { from: "08:00", to: "19:00" },
    maxTravelDistance: "20km",
    isOnline: true, isAvailable: true, aadhaarVerified: true,
    portfolioUrls: [], videoUrls: [], whatsappNumber: "9444123456", reviewsCount: 178,
    profileSetupComplete: true, createdAt: daysAgo(120), role: UserRole.WORKER, phoneNumber: "9444123456",
    photoURL: "https://i.pravatar.cc/150?img=15",
  },
  {
    id: "seed_worker_006",
    displayName: "Priya Nair",
    email: "priya.garden@worksphere.in",
    category: "Gardener",
    profession: "Garden & Landscape Specialist",
    bio: "Expert gardener handling plant care, lawn mowing, landscaping, pest control & seasonal garden maintenance.",
    skills: ["Gardening", "Plant Care", "Lawn Mowing", "Landscaping", "Pest Control"],
    languagesSpoken: ["Hindi", "English", "Malayalam"],
    hourlyFee: 200, dailyCharges: 1400, emergencyCharges: 300, basePrice: 200,
    rating: 4.4, totalJobs: 143, completionRate: 0.93,
    yearsOfExperience: 5,
    location: { latitude: 8.5241, longitude: 76.9366, address: "Pattom, Thiruvananthapuram", city: "Thiruvananthapuram", state: "Kerala" },
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    availableTiming: { from: "09:00", to: "17:00" },
    maxTravelDistance: "10km",
    isOnline: true, isAvailable: true, aadhaarVerified: false,
    portfolioUrls: [], videoUrls: [], whatsappNumber: "9495123456", reviewsCount: 129,
    profileSetupComplete: true, createdAt: daysAgo(90), role: UserRole.WORKER, phoneNumber: "9495123456",
    photoURL: "https://i.pravatar.cc/150?img=47",
  },
  {
    id: "seed_worker_007",
    displayName: "Ramesh Yadav",
    email: "ramesh.mech@worksphere.in",
    category: "Mechanic",
    profession: "Two-Wheeler & Car Mechanic",
    bio: "Expert car & two-wheeler mechanic. Engine overhaul, brake service, AC gas refill & quick oil change service.",
    skills: ["Engine Repair", "Brake Service", "AC Regas", "Oil Change", "Battery Replacement"],
    languagesSpoken: ["Hindi", "Telugu"],
    hourlyFee: 320, dailyCharges: 2200, emergencyCharges: 450, basePrice: 320,
    rating: 4.6, totalJobs: 267, completionRate: 0.95,
    yearsOfExperience: 9,
    location: { latitude: 17.385, longitude: 78.4867, address: "Banjara Hills, Hyderabad", city: "Hyderabad", state: "Telangana" },
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    availableTiming: { from: "08:00", to: "21:00" },
    maxTravelDistance: "15km",
    isOnline: true, isAvailable: true, aadhaarVerified: true,
    portfolioUrls: [], videoUrls: [], whatsappNumber: "9866543210", reviewsCount: 244,
    profileSetupComplete: true, createdAt: daysAgo(250), role: UserRole.WORKER, phoneNumber: "9866543210",
    photoURL: "https://i.pravatar.cc/150?img=16",
  },
  {
    id: "seed_worker_008",
    displayName: "Karim Shaikh",
    email: "karim.mason@worksphere.in",
    category: "Mason",
    profession: "Civil Construction Mason",
    bio: "Specialist in brick laying, plastering, tile flooring, RCC work & waterproofing. Handles small repairs to big jobs.",
    skills: ["Brick Laying", "Plastering", "Tile Flooring", "RCC Work", "Waterproofing"],
    languagesSpoken: ["Hindi", "Urdu", "Bengali"],
    hourlyFee: 420, dailyCharges: 3000, emergencyCharges: 600, basePrice: 420,
    rating: 4.7, totalJobs: 335, completionRate: 0.96,
    yearsOfExperience: 14,
    location: { latitude: 22.5726, longitude: 88.3639, address: "Howrah, Kolkata", city: "Kolkata", state: "West Bengal" },
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    availableTiming: { from: "07:00", to: "17:00" },
    maxTravelDistance: "20km",
    isOnline: false, isAvailable: true, aadhaarVerified: true,
    portfolioUrls: [], videoUrls: [], whatsappNumber: "9831234567", reviewsCount: 310,
    profileSetupComplete: true, createdAt: daysAgo(365), role: UserRole.WORKER, phoneNumber: "9831234567",
    photoURL: "https://i.pravatar.cc/150?img=17",
  },
  {
    id: "seed_worker_009",
    displayName: "Sanjay Khanna",
    email: "sanjay.ac@worksphere.in",
    category: "Electrician",
    profession: "AC & Appliance Technician",
    bio: "Certified AC & appliance tech — repair, installation, servicing for all brands. Refrigerator, washing machine too.",
    skills: ["AC Repair", "AC Installation", "Refrigerator Repair", "Washing Machine", "Microwave"],
    languagesSpoken: ["Hindi", "Punjabi", "English"],
    hourlyFee: 500, dailyCharges: 3500, emergencyCharges: 800, basePrice: 500,
    rating: 4.8, totalJobs: 412, completionRate: 0.97,
    yearsOfExperience: 11,
    location: { latitude: 28.7041, longitude: 77.1025, address: "Rohini, New Delhi", city: "New Delhi", state: "Delhi" },
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    availableTiming: { from: "08:00", to: "22:00" },
    maxTravelDistance: "30km",
    isOnline: true, isAvailable: true, aadhaarVerified: true,
    portfolioUrls: [], videoUrls: [], whatsappNumber: "9811234567", reviewsCount: 387,
    profileSetupComplete: true, createdAt: daysAgo(400), role: UserRole.WORKER, phoneNumber: "9811234567",
    photoURL: "https://i.pravatar.cc/150?img=18",
  },
  {
    id: "seed_worker_010",
    displayName: "Vijay Rajput",
    email: "vijay.plumber@worksphere.in",
    category: "Plumber",
    profession: "Plumbing & Sanitation Expert",
    bio: "Trusted plumber in Jaipur. Water tank cleaning, borewell, overhead tank installation & complete pipeline work.",
    skills: ["Tank Cleaning", "Borewell", "Overhead Tank", "Pipeline Work", "Tap Repair"],
    languagesSpoken: ["Hindi", "Rajasthani"],
    hourlyFee: 300, dailyCharges: 2100, emergencyCharges: 450, basePrice: 300,
    rating: 4.5, totalJobs: 156, completionRate: 0.93,
    yearsOfExperience: 6,
    location: { latitude: 26.9124, longitude: 75.7873, address: "Vaishali Nagar, Jaipur", city: "Jaipur", state: "Rajasthan" },
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    availableTiming: { from: "09:00", to: "19:00" },
    maxTravelDistance: "20km",
    isOnline: true, isAvailable: true, aadhaarVerified: true,
    portfolioUrls: [], videoUrls: [], whatsappNumber: "9414123456", reviewsCount: 138,
    profileSetupComplete: true, createdAt: daysAgo(100), role: UserRole.WORKER, phoneNumber: "9414123456",
    photoURL: "https://i.pravatar.cc/150?img=19",
  },
];

// ─── Artisans (5) ─────────────────────────────────────────────────────────────
export const ARTISAN_SEED = [
  {
    id: "seed_artisan_001",
    displayName: "Meera Kumari",
    email: "meera.pottery@worksphere.in",
    craftCategory: "pottery",
    specialty: "Blue Pottery of Jaipur",
    artisanBio: "3rd generation potter from Jaipur. Our family has been crafting Blue Pottery for 80+ years using traditional Rajasthani techniques with quartz and raw glazes.",
    handmadeProducts: "Vases, Bowls, Plates, Wall Tiles",
    productDescription: "Authentic Jaipur Blue Pottery made with quartz, glass, Multani Mitti and raw glazes. Each piece is unique and hand-painted.",
    materialUsed: "Quartz, Glass Powder, Multani Mitti, Raw Glaze",
    customOrdersAvailable: true,
    price: 850, stockAvailable: 45, productionTime: "7-10 days",
    deliveryAvailable: true, shippingCharges: 150,
    workshopAddress: "Sanganer, Jaipur, Rajasthan",
    workshopPhotoUrls: [], videoUrls: [],
    isPublished: true, rating: 4.9, yearsOfExperience: 18,
    location: { latitude: 26.818, longitude: 75.765, address: "Sanganer, Jaipur", city: "Jaipur", state: "Rajasthan" },
    profileSetupComplete: true, createdAt: daysAgo(500), role: UserRole.ARTISAN, phoneNumber: "9414567890",
    photoURL: "https://i.pravatar.cc/150?img=48",
  },
  {
    id: "seed_artisan_002",
    displayName: "Ananya Rajan",
    email: "ananya.textiles@worksphere.in",
    craftCategory: "textiles",
    specialty: "Handloom Silk Sarees",
    artisanBio: "Kanchipuram silk weaver bringing age-old designs to modern wardrobes. Pure silk with zari work, each saree takes 3-7 days to weave on traditional looms.",
    handmadeProducts: "Silk Sarees, Dupattas, Stoles, Table Runners",
    productDescription: "Pure Kanchipuram silk sarees with traditional zari motifs. Each saree takes 3-7 days to weave.",
    materialUsed: "Pure Mulberry Silk, Gold Zari, Silver Zari",
    customOrdersAvailable: true,
    price: 4500, stockAvailable: 20, productionTime: "3-7 days",
    deliveryAvailable: true, shippingCharges: 200,
    workshopAddress: "Kanchipuram, Tamil Nadu",
    workshopPhotoUrls: [], videoUrls: [],
    isPublished: true, rating: 4.8, yearsOfExperience: 22,
    location: { latitude: 12.8339, longitude: 79.7038, address: "Kanchipuram, Tamil Nadu", city: "Kanchipuram", state: "Tamil Nadu" },
    profileSetupComplete: true, createdAt: daysAgo(600), role: UserRole.ARTISAN, phoneNumber: "9444567890",
    photoURL: "https://i.pravatar.cc/150?img=49",
  },
  {
    id: "seed_artisan_003",
    displayName: "Vikram Gupta",
    email: "vikram.wood@worksphere.in",
    craftCategory: "woodwork",
    specialty: "Rosewood Furniture & Decor",
    artisanBio: "Master craftsman from Saharanpur — India's wood carving capital. Intricate hand-carved rosewood and sheesham pieces using zero machines.",
    handmadeProducts: "Wall Panels, Furniture, Decorative Boxes, Photo Frames",
    productDescription: "Hand-carved rosewood and sheesham items with traditional Mughal floral motifs. Zero machines, 100% handmade.",
    materialUsed: "Rosewood, Sheesham, Teak, Natural Polish",
    customOrdersAvailable: true,
    price: 1200, stockAvailable: 30, productionTime: "5-14 days",
    deliveryAvailable: true, shippingCharges: 300,
    workshopAddress: "Saharanpur, Uttar Pradesh",
    workshopPhotoUrls: [], videoUrls: [],
    isPublished: true, rating: 4.7, yearsOfExperience: 25,
    location: { latitude: 29.968, longitude: 77.545, address: "Saharanpur, UP", city: "Saharanpur", state: "Uttar Pradesh" },
    profileSetupComplete: true, createdAt: daysAgo(700), role: UserRole.ARTISAN, phoneNumber: "9412345678",
    photoURL: "https://i.pravatar.cc/150?img=50",
  },
  {
    id: "seed_artisan_004",
    displayName: "Lalita Devi",
    email: "lalita.jewel@worksphere.in",
    craftCategory: "jewelry",
    specialty: "Tribal Silver Jewelry",
    artisanBio: "Tribal silver jewelry maker from Odisha. Specializing in Dokra (lost-wax) and Tarakasi (filigree) work passed down through 4 generations.",
    handmadeProducts: "Necklaces, Earrings, Bangles, Anklets, Rings",
    productDescription: "Authentic Odishan tribal silver jewelry using lost-wax casting and silver filigree techniques.",
    materialUsed: "Pure Silver, Brass, Natural Beads",
    customOrdersAvailable: true,
    price: 1800, stockAvailable: 60, productionTime: "4-8 days",
    deliveryAvailable: true, shippingCharges: 100,
    workshopAddress: "Cuttack, Odisha",
    workshopPhotoUrls: [], videoUrls: [],
    isPublished: true, rating: 4.9, yearsOfExperience: 15,
    location: { latitude: 20.4625, longitude: 85.883, address: "Cuttack, Odisha", city: "Cuttack", state: "Odisha" },
    profileSetupComplete: true, createdAt: daysAgo(400), role: UserRole.ARTISAN, phoneNumber: "9437567890",
    photoURL: "https://i.pravatar.cc/150?img=51",
  },
  {
    id: "seed_artisan_005",
    displayName: "Ravi Kamble",
    email: "ravi.leather@worksphere.in",
    craftCategory: "leather",
    specialty: "Handmade Leather Goods",
    artisanBio: "Kolhapuri leather craftsman making world-famous Kolhapuri chappals and leather accessories using traditional vegetable-tanning techniques.",
    handmadeProducts: "Kolhapuri Chappals, Wallets, Bags, Belts, Key Holders",
    productDescription: "Genuine Kolhapuri leather products handstitched using traditional Maharashtrian techniques.",
    materialUsed: "Full-Grain Leather, Veg-Tanned Leather, Natural Dyes",
    customOrdersAvailable: true,
    price: 950, stockAvailable: 80, productionTime: "3-5 days",
    deliveryAvailable: true, shippingCharges: 120,
    workshopAddress: "Kolhapur, Maharashtra",
    workshopPhotoUrls: [], videoUrls: [],
    isPublished: true, rating: 4.6, yearsOfExperience: 20,
    location: { latitude: 16.705, longitude: 74.2433, address: "Kolhapur, Maharashtra", city: "Kolhapur", state: "Maharashtra" },
    profileSetupComplete: true, createdAt: daysAgo(350), role: UserRole.ARTISAN, phoneNumber: "9423567890",
    photoURL: "https://i.pravatar.cc/150?img=52",
  },
];

// ─── Products with working image URLs ─────────────────────────────────────────
// Using direct Unsplash CDN URLs for high quality artisanal products
export const PRODUCT_SEED = [
  // ── Meera Pottery
  {
    artisanId: "seed_artisan_001",
    title: "Blue Pottery Decorative Vase",
    description: "Hand-painted blue pottery vase with traditional floral motifs. Perfect for home décor.",
    price: 1850,
    imageUrl: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80&fit=crop",
    category: "pottery", stock: 12,
  },
  {
    artisanId: "seed_artisan_001",
    title: "Terracotta Serving Bowl Set (4 pcs)",
    description: "Set of 4 hand-crafted terracotta bowls. Food-safe glaze. Great for dining tables.",
    price: 1200,
    imageUrl: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&q=80&fit=crop",
    category: "pottery", stock: 8,
  },
  {
    artisanId: "seed_artisan_001",
    title: "Ceramic Decorative Wall Plate",
    description: "Hand-painted decorative ceramic wall plate with traditional motif. 10 inch diameter.",
    price: 950,
    imageUrl: "https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?w=500&q=80&fit=crop",
    category: "pottery", stock: 20,
  },
  // ── Ananya Textiles
  {
    artisanId: "seed_artisan_002",
    title: "Handloom Cotton Saree — Crimson Gold",
    description: "Pure handloom cotton saree with traditional gold zari border and pallu. 6.3 metres.",
    price: 4800,
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&q=80&fit=crop",
    category: "textiles", stock: 5,
  },
  {
    artisanId: "seed_artisan_002",
    title: "Handwoven Cotton Dupatta — Indigo",
    description: "Lightweight handwoven cotton dupatta with natural indigo dye and traditional block print.",
    price: 1150,
    imageUrl: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80&fit=crop",
    category: "textiles", stock: 15,
  },
  {
    artisanId: "seed_artisan_002",
    title: "Silk Embroidered Cushion Cover",
    description: "Premium silk cushion cover with traditional embroidery. Perfect for living rooms.",
    price: 850,
    imageUrl: "https://images.unsplash.com/photo-1584143257321-df5c1b504958?w=500&q=80&fit=crop",
    category: "textiles", stock: 10,
  },
  // ── Vikram Woodcraft
  {
    artisanId: "seed_artisan_003",
    title: "Hand-Carved Wooden Wall Panel",
    description: "Intricately carved wood wall panel with floral patterns. 24×18 inches.",
    price: 5200,
    imageUrl: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500&q=80&fit=crop",
    category: "woodwork", stock: 4,
  },
  {
    artisanId: "seed_artisan_003",
    title: "Sheesham Jewellery Box — 7 Compartments",
    description: "Hand-carved sheesham wood jewellery box with velvet lining and brass fittings.",
    price: 2850,
    imageUrl: "https://images.unsplash.com/photo-1601662528567-526cd06f6582?w=500&q=80&fit=crop",
    category: "woodwork", stock: 9,
  },
  {
    artisanId: "seed_artisan_003",
    title: "Teak Wood Serving Tray",
    description: "Handcrafted solid teak wood serving tray. 40×25 cm.",
    price: 1480,
    imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=80&fit=crop",
    category: "woodwork", stock: 14,
  },
  // ── Lalita Jewellery
  {
    artisanId: "seed_artisan_004",
    title: "Silver Kundan Necklace Set",
    description: "Handcrafted silver Kundan necklace with matching earrings.",
    price: 7200,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&q=80&fit=crop",
    category: "jewelry", stock: 8,
  },
  {
    artisanId: "seed_artisan_004",
    title: "Dokra Brass Earrings — Peacock",
    description: "Unique Dokra (lost-wax) cast brass earrings with peacock motif. Lightweight and bold.",
    price: 650,
    imageUrl: "https://images.unsplash.com/photo-1573408301185-9519f94c6833?w=500&q=80&fit=crop",
    category: "jewelry", stock: 20,
  },
  {
    artisanId: "seed_artisan_004",
    title: "Silver Tribal Bangle Set (4 pcs)",
    description: "Set of 4 pure silver bangles with traditional Odishan tribal engravings. Adjustable size.",
    price: 2800,
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&q=80&fit=crop",
    category: "jewelry", stock: 12,
  },
  // ── Ravi Leather
  {
    artisanId: "seed_artisan_005",
    title: "Kolhapuri Chappal — Men's Size 8",
    description: "Authentic handstitched Kolhapuri leather chappal. Breathable, durable, traditional style.",
    price: 950,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80&fit=crop",
    category: "leather", stock: 30,
  },
  {
    artisanId: "seed_artisan_005",
    title: "Full-Grain Leather Bifold Wallet",
    description: "Handmade vegetable-tanned leather bifold wallet. 8 card slots, coin pocket. Ages beautifully.",
    price: 750,
    imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80&fit=crop",
    category: "leather", stock: 40,
  },
  {
    artisanId: "seed_artisan_005",
    title: "Leather Satchel Handbag",
    description: "Handstitched genuine leather satchel bag with brass hardware. 30×22×10 cm.",
    price: 2200,
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80&fit=crop",
    category: "leather", stock: 15,
  },
];

// ─── Vendors (4) ──────────────────────────────────────────────────────────────
export const VENDOR_SEED = [
  {
    id: "seed_vendor_001",
    displayName: "Sharma Hardware & Sanitary",
    email: "sharma.hardware@worksphere.in",
    shopName: "Sharma Hardware & Sanitary",
    ownerName: "Ramesh Sharma",
    shopCategory: "Hardware & Plumbing",
    shopDescription: "Your one-stop hardware store for plumbing, electrical & construction materials.",
    shopAddress: "Near Bus Stand, Sector 14, Gurugram",
    landmark: "Near HDFC Bank", pincode: "122001",
    gstNumber: "06AABCS1429B1Z1",
    openingTime: "08:00", closingTime: "20:00", weeklyOff: "Sunday",
    contactNumber: "9810123456", whatsappNumber: "9810123456",
    homeDelivery: true, pickupAvailable: true, cashOnDelivery: true, onlinePayment: true,
    aadhaarVerified: true, isPublished: true, shopLogoUrl: "", shopPhotoUrls: [], shopLicenseUrl: "", inventory: [],
    location: { latitude: 28.4595, longitude: 77.0266, address: "Sector 14, Gurugram", city: "Gurugram", state: "Haryana" },
    profileSetupComplete: true, createdAt: daysAgo(400), role: UserRole.VENDOR, phoneNumber: "9810123456",
  },
  {
    id: "seed_vendor_002",
    displayName: "Patel Building Materials",
    email: "patel.bm@worksphere.in",
    shopName: "Patel Building Materials",
    ownerName: "Bhavesh Patel",
    shopCategory: "Construction Materials",
    shopDescription: "Premium quality cement, sand, bricks, steel & construction materials at wholesale rates.",
    shopAddress: "Ring Road, Satellite, Ahmedabad",
    landmark: "Opposite Central Mall", pincode: "380015",
    gstNumber: "24AAACB1234A1Z3",
    openingTime: "07:00", closingTime: "19:00", weeklyOff: "Sunday",
    contactNumber: "9712987654", whatsappNumber: "9712987654",
    homeDelivery: true, pickupAvailable: true, cashOnDelivery: true, onlinePayment: false,
    aadhaarVerified: true, isPublished: true, shopLogoUrl: "", shopPhotoUrls: [], shopLicenseUrl: "", inventory: [],
    location: { latitude: 23.0225, longitude: 72.5714, address: "Satellite, Ahmedabad", city: "Ahmedabad", state: "Gujarat" },
    profileSetupComplete: true, createdAt: daysAgo(500), role: UserRole.VENDOR, phoneNumber: "9712987654",
  },
  {
    id: "seed_vendor_003",
    displayName: "Krishnamurthy Electricals",
    email: "krishna.elec@worksphere.in",
    shopName: "Krishnamurthy Electricals",
    ownerName: "K. Subramaniam",
    shopCategory: "Electrical Supplies",
    shopDescription: "All electrical goods — wires, switches, MCBs, fans, lights & inverters. Top brands at best prices.",
    shopAddress: "T Nagar, Chennai",
    landmark: "Near Pondy Bazaar", pincode: "600017",
    gstNumber: "33AABCK1234A1Z1",
    openingTime: "09:00", closingTime: "21:00", weeklyOff: "Thursday",
    contactNumber: "9444987654", whatsappNumber: "9444987654",
    homeDelivery: false, pickupAvailable: true, cashOnDelivery: false, onlinePayment: true,
    aadhaarVerified: true, isPublished: true, shopLogoUrl: "", shopPhotoUrls: [], shopLicenseUrl: "", inventory: [],
    location: { latitude: 13.0418, longitude: 80.2341, address: "T Nagar, Chennai", city: "Chennai", state: "Tamil Nadu" },
    profileSetupComplete: true, createdAt: daysAgo(300), role: UserRole.VENDOR, phoneNumber: "9444987654",
  },
  {
    id: "seed_vendor_004",
    displayName: "Mukherjee Paint & Décor",
    email: "mukherjee.paint@worksphere.in",
    shopName: "Mukherjee Paint & Décor",
    ownerName: "Sourav Mukherjee",
    shopCategory: "Paints & Décor",
    shopDescription: "Official dealer for Asian Paints, Berger & Nerolac. Expert color consultation & waterproofing solutions.",
    shopAddress: "Lake Town, Kolkata",
    landmark: "Near Lake Town Metro", pincode: "700089",
    gstNumber: "19AABCM5678B1Z2",
    openingTime: "09:00", closingTime: "20:30", weeklyOff: "Monday",
    contactNumber: "9831987654", whatsappNumber: "9831987654",
    homeDelivery: true, pickupAvailable: true, cashOnDelivery: true, onlinePayment: true,
    aadhaarVerified: true, isPublished: true, shopLogoUrl: "", shopPhotoUrls: [], shopLicenseUrl: "", inventory: [],
    location: { latitude: 22.5958, longitude: 88.3879, address: "Lake Town, Kolkata", city: "Kolkata", state: "West Bengal" },
    profileSetupComplete: true, createdAt: daysAgo(250), role: UserRole.VENDOR, phoneNumber: "9831987654",
  },
];

// ─── Inventory (40+ items across 4 vendors) ──────────────────────────────────
export const INVENTORY_SEED: { vendorId: string; items: any[] }[] = [
  {
    vendorId: "seed_vendor_001",
    items: [
      { name: "Astral CPVC Pipe (1 inch, 3m)", price: 320, unit: "piece", category: "Plumbing" },
      { name: "PVC Ball Valve (0.75 inch)", price: 85, unit: "piece", category: "Plumbing" },
      { name: "Jaquar Single Lever Basin Tap", price: 1850, unit: "piece", category: "Sanitary" },
      { name: "Hindware Wall Hung Commode", price: 8500, unit: "piece", category: "Sanitary" },
      { name: "GI Pipe (1 inch, 6m)", price: 560, unit: "piece", category: "Plumbing" },
      { name: "PVC Elbow Fitting (0.5 inch)", price: 12, unit: "piece", category: "Plumbing" },
      { name: "Anchor Switches (6A, 5-pack)", price: 220, unit: "pack", category: "Electrical" },
      { name: "Finolex 2.5 sqmm Wire (90m)", price: 2800, unit: "roll", category: "Electrical" },
      { name: "Havells MCB 32A", price: 180, unit: "piece", category: "Electrical" },
      { name: "Water Tank Float Valve", price: 140, unit: "piece", category: "Plumbing" },
    ],
  },
  {
    vendorId: "seed_vendor_002",
    items: [
      { name: "UltraTech Cement (50kg)", price: 420, unit: "bag", category: "Cement" },
      { name: "River Sand", price: 75, unit: "cft", category: "Aggregate" },
      { name: "M-Sand (Manufactured Sand)", price: 65, unit: "cft", category: "Aggregate" },
      { name: "Red Brick (First Class)", price: 9, unit: "piece", category: "Masonry" },
      { name: "TMT Steel Bar 10mm (12m)", price: 780, unit: "piece", category: "Steel" },
      { name: "TMT Steel Bar 8mm (12m)", price: 540, unit: "piece", category: "Steel" },
      { name: "Flyash AAC Block (600x200x150)", price: 68, unit: "piece", category: "Masonry" },
      { name: "20mm Aggregate", price: 55, unit: "cft", category: "Aggregate" },
      { name: "Waterproofing Compound (5kg)", price: 380, unit: "can", category: "Waterproofing" },
      { name: "Plywood 18mm Marine (8x4 ft)", price: 3200, unit: "sheet", category: "Wood" },
      { name: "GI Binding Wire (25kg)", price: 1700, unit: "roll", category: "Steel" },
      { name: "Tile Adhesive C2 Grade (25kg)", price: 520, unit: "bag", category: "Tile" },
    ],
  },
  {
    vendorId: "seed_vendor_003",
    items: [
      { name: "Finolex 1.5 sqmm Wire (180m)", price: 2200, unit: "roll", category: "Wire" },
      { name: "Legrand Modular Switch 16A", price: 145, unit: "piece", category: "Switch" },
      { name: "Havells MCB 16A DP", price: 320, unit: "piece", category: "MCB" },
      { name: "Crompton Aura LED Fan 48 inch", price: 2800, unit: "piece", category: "Fan" },
      { name: "Philips 9W LED Bulb (Pack of 4)", price: 380, unit: "pack", category: "Lighting" },
      { name: "Microtek 1100VA Inverter", price: 7500, unit: "piece", category: "Inverter" },
      { name: "Exide 150Ah Inverter Battery", price: 12500, unit: "piece", category: "Battery" },
      { name: "Conduit Pipe 20mm (3m)", price: 65, unit: "piece", category: "Conduit" },
      { name: "MCB Distribution Box 6-way", price: 850, unit: "piece", category: "Panel" },
      { name: "Junction Box 6-way", price: 45, unit: "piece", category: "Fitting" },
    ],
  },
  {
    vendorId: "seed_vendor_004",
    items: [
      { name: "Asian Paints Royale (4L)", price: 1850, unit: "can", category: "Interior Paint" },
      { name: "Berger WeatherCoat All Guard (10L)", price: 2900, unit: "can", category: "Exterior Paint" },
      { name: "Nerolac Excel Total (4L)", price: 1650, unit: "can", category: "Interior Paint" },
      { name: "Wall Putty White Cement (20kg)", price: 520, unit: "bag", category: "Putty" },
      { name: "Asian Paints Damp Proof (1L)", price: 480, unit: "bottle", category: "Waterproofing" },
      { name: "Exterior Primer (4L)", price: 680, unit: "can", category: "Primer" },
      { name: "Paint Brush Set (3 pcs)", price: 180, unit: "set", category: "Tools" },
      { name: "Paint Roller 9 inch + Tray", price: 220, unit: "set", category: "Tools" },
      { name: "Masking Tape 1 inch (pack of 6)", price: 150, unit: "pack", category: "Tools" },
      { name: "Texture Paint Stone Finish (5kg)", price: 1200, unit: "bucket", category: "Texture" },
      { name: "Wood Polish Melamine Matt (1L)", price: 650, unit: "bottle", category: "Wood Finish" },
    ],
  },
];

// ─── Main Seed Function ───────────────────────────────────────────────────────
export async function seedAllData(): Promise<{ success: boolean; message: string }> {
  const results = { workers: 0, artisans: 0, products: 0, vendors: 0, inventory: 0 };

  try {
    // 1. Workers → /workers/{id}
    for (const w of WORKER_SEED) {
      const { id, ...data } = w;
      await setDoc(doc(db, "workers", id), { ...data, uid: id });
    }
    results.workers = WORKER_SEED.length;

    // 2. Artisans → /artisans/{id}
    for (const a of ARTISAN_SEED) {
      const { id, ...data } = a;
      await setDoc(doc(db, "artisans", id), { ...data, uid: id });
    }
    results.artisans = ARTISAN_SEED.length;

    // 3. Products → /products/{auto-id}
    for (const p of PRODUCT_SEED) {
      const ref = doc(collection(db, "products"));
      await setDoc(ref, { ...p, id: ref.id, createdAt: now });
    }
    results.products = PRODUCT_SEED.length;

    // 4. Vendors → /vendors/{id}
    for (const v of VENDOR_SEED) {
      const { id, ...data } = v;
      await setDoc(doc(db, "vendors", id), { ...data, uid: id });
    }
    results.vendors = VENDOR_SEED.length;

    // 5. Inventory → /inventory/{auto-id}
    for (const group of INVENTORY_SEED) {
      for (const item of group.items) {
        const ref = doc(collection(db, "inventory"));
        await setDoc(ref, { ...item, id: ref.id, vendorId: group.vendorId, createdAt: now });
        results.inventory++;
      }
    }

    return {
      success: true,
      message:
        `✅ Seed complete!\n` +
        `• ${results.workers} workers\n` +
        `• ${results.artisans} artisans\n` +
        `• ${results.products} products (with images)\n` +
        `• ${results.vendors} vendor shops\n` +
        `• ${results.inventory} inventory items`,
    };
  } catch (err: any) {
    console.error("[Seed Error]", err);
    return {
      success: false,
      message: `Seed failed: ${err?.message || String(err)}\n\nCode: ${err?.code || "unknown"}`,
    };
  }
}

export async function clearAllData(): Promise<void> {
  const collections = ["workers", "artisans", "products", "vendors", "inventory"];
  for (const col of collections) {
    const snap = await getDocs(collection(db, col));
    const deletePromises = snap.docs.map(docSnap => deleteDoc(doc(db, col, docSnap.id)));
    await Promise.allSettled(deletePromises);
  }
}
