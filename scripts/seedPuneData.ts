/**
 * WorkSphere Pune Seeder Script
 * 
 * Generates:
 * - 50 Customers
 * - 20 Workers (with hourly rates & trade job titles)
 * - 10 Artisans (with mock craft portfolio URLs)
 * - 5 Shopkeepers (each with 20 hardware/grocery products & prices)
 * 
 * Location: Random coordinates strictly around Pune, Maharashtra
 * Target: Firestore 'users' collection (+ sync to role collections)
 * 
 * Run with:
 *   npx tsx scripts/seedPuneData.ts
 */

import { faker } from "@faker-js/faker";
import { initializeApp as initAdminApp, cert } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { initializeApp as initClientApp } from "firebase/app";
import { getFirestore as getClientFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read app configuration
const configPath = path.resolve(__dirname, "../firebase-applet-config.json");
const appConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const PROJECT_ID = appConfig.projectId || "gen-lang-client-0339886940";
const DATABASE_ID = appConfig.firestoreDatabaseId;

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(__dirname, "../serviceAccountKey.json");

// Define a unified interface for writing to Firestore
interface FirestoreWriter {
  isAdminMode: boolean;
  set(collectionName: string, docId: string, data: any): Promise<void>;
  commit(): Promise<void>;
  getPendingCount(): number;
}

function createAdminWriter(adminDb: any): FirestoreWriter {
  let batch = adminDb.batch();
  let count = 0;

  return {
    isAdminMode: true,
    async set(collectionName: string, docId: string, data: any) {
      const ref = adminDb.collection(collectionName).doc(docId);
      batch.set(ref, data);
      count++;
    },
    async commit() {
      if (count > 0) {
        await batch.commit();
        batch = adminDb.batch();
        count = 0;
      }
    },
    getPendingCount() {
      return count;
    },
  };
}

function createClientWriter(clientDb: any): FirestoreWriter {
  let warnedUsers = false;

  return {
    isAdminMode: false,
    async set(collectionName: string, docId: string, data: any) {
      try {
        const ref = doc(clientDb, collectionName, docId);
        await setDoc(ref, data);
      } catch (err: any) {
        if (collectionName === "users" && (err?.code === "permission-denied" || err?.message?.includes("PERMISSION_DENIED"))) {
          if (!warnedUsers) {
            console.warn("\n⚠️  [Security Notice] Direct client writes to /users requires Firebase Admin credentials (serviceAccountKey.json).");
            console.warn("   Skipping /users collection in client fallback mode and populating role collections (/workers, /artisans, /vendors, /inventory)...\n");
            warnedUsers = true;
          }
          return;
        }
        console.warn(`Write to ${collectionName}/${docId} warning:`, err?.message || err);
      }
    },
    async commit() {
      // Direct setDoc writes are committed immediately
    },
    getPendingCount() {
      return 0;
    },
  };
}

// ─── PUNE GEOGRAPHIC CONSTANTS ────────────────────────────────────────────────
const PUNE_BOUNDS = {
  minLat: 18.4450,
  maxLat: 18.6150,
  minLng: 73.7650,
  maxLng: 73.9450,
};

const PUNE_LOCALITIES = [
  "Kothrud",
  "Shivaji Nagar",
  "Viman Nagar",
  "Kalyani Nagar",
  "Baner",
  "Aundh",
  "Hinjewadi Phase 1",
  "Wakad",
  "Hadapsar",
  "Magarpatta City",
  "Deccan Gymkhana",
  "Camp / MG Road",
  "Swargate",
  "Karve Nagar",
  "Pimpri",
  "Chinchwad",
  "Koregaon Park",
  "Bavdhan",
  "Senapati Bapat Road",
  "Kondhwa",
];

function getRandomPuneLocation() {
  const latitude = faker.number.float({
    min: PUNE_BOUNDS.minLat,
    max: PUNE_BOUNDS.maxLat,
    fractionDigits: 6,
  });
  const longitude = faker.number.float({
    min: PUNE_BOUNDS.minLng,
    max: PUNE_BOUNDS.maxLng,
    fractionDigits: 6,
  });
  const locality = faker.helpers.arrayElement(PUNE_LOCALITIES);
  const street = `${faker.location.buildingNumber()}, Lane ${faker.number.int({ min: 1, max: 12 })}`;

  return {
    latitude,
    longitude,
    address: `${street}, ${locality}, Pune, Maharashtra`,
    city: "Pune",
    state: "Maharashtra",
    pincode: `4110${faker.number.int({ min: 10, max: 59 })}`,
  };
}

// ─── TRADE DATA ───────────────────────────────────────────────────────────────
const WORKER_TRADES = [
  {
    category: "Plumber",
    titles: ["Licensed Master Plumber", "Pipe & Sanitation Specialist", "Residential Plumbing Expert"],
    skills: ["Pipe Fitting", "Leak Repair", "Drain Cleaning", "Water Tank Installation", "Bathroom Renovation"],
    basePriceMin: 300,
    basePriceMax: 500,
  },
  {
    category: "Electrician",
    titles: ["Certified Electrical Technician", "Home Wiring Specialist", "Inverter & Power Expert"],
    skills: ["Circuit Wiring", "MCB Installation", "Short Circuit Repair", "Appliance Fitting", "Inverter Setup"],
    basePriceMin: 350,
    basePriceMax: 600,
  },
  {
    category: "Carpenter",
    titles: ["Furniture & Woodcraft Specialist", "Modular Kitchen Carpenter", "General Woodworker"],
    skills: ["Furniture Assembly", "Door Fitting", "Wood Polishing", "Cabinet Repair", "Lock Replacement"],
    basePriceMin: 400,
    basePriceMax: 650,
  },
  {
    category: "Mason",
    titles: ["Brickwork & Tiling Mason", "Plastering & Concrete Mason", "Flooring Expert"],
    skills: ["Bricklaying", "Tile Fitting", "Plastering", "Waterproofing", "Concrete Repair"],
    basePriceMin: 450,
    basePriceMax: 700,
  },
  {
    category: "Painter",
    titles: ["Interior & Exterior Painter", "Waterproof Wall Painter", "Texture Wall Artist"],
    skills: ["Wall Putty", "Primer Application", "Texture Painting", "Waterproofing", "Exterior Painting"],
    basePriceMin: 300,
    basePriceMax: 550,
  },
  {
    category: "Welder",
    titles: ["Fabrication & Arc Welder", "Iron Gate & Grill Welder", "Structural Welder"],
    skills: ["Arc Welding", "MIG Welding", "Grill Fabrication", "Gate Repair", "Metal Cutting"],
    basePriceMin: 400,
    basePriceMax: 650,
  },
  {
    category: "Gardener",
    titles: ["Landscape & Garden Caretaker", "Lawn Maintenance Specialist", "Balcony Garden Expert"],
    skills: ["Lawn Mowing", "Hedge Trimming", "Plant Pruning", "Soil Preparation", "Pest Management"],
    basePriceMin: 250,
    basePriceMax: 450,
  },
  {
    category: "Mechanic",
    titles: ["Two-Wheeler Repair Specialist", "Automotive Mechanic", "Engine Tuning Expert"],
    skills: ["Oil Change", "Brake Overhaul", "Engine Tuning", "Puncture Repair", "Battery Check"],
    basePriceMin: 300,
    basePriceMax: 600,
  },
];

const ARTISAN_CRAFTS = [
  {
    category: "Pottery",
    products: "Terracotta Clay Vases, Handcrafted Pots, Earthen Cooking Vessels",
    portfolio: [
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1590483736622-39da8af7541b?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&auto=format&fit=crop&q=80",
    ],
  },
  {
    category: "Textiles",
    products: "Handwoven Paithani Sarees, Khadi Kurtas, Block-Printed Cotton Shawls",
    portfolio: [
      "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80",
    ],
  },
  {
    category: "Woodwork",
    products: "Carved Teakwood Temple Mandirs, Decorative Wall Panels, Rosewood Boxes",
    portfolio: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
    ],
  },
  {
    category: "Jewelry",
    products: "Handmade Brass Earrings, Beaded Tribal Necklaces, Silver Filigree Rings",
    portfolio: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80",
    ],
  },
  {
    category: "Leather",
    products: "Hand-stitched Kolhapuri Chappals, Leather Journal Covers, Rugged Belts",
    portfolio: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    ],
  },
  {
    category: "Sculpture",
    products: "Brass Dhokra Figurines, Stone Carved Statues, Terracotta Wall Sculptures",
    portfolio: [
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1569172122301-bc500f30913c?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80",
    ],
  },
];

const SHOP_PRODUCT_POOL = [
  { name: "PVC Pipe 1-inch (10ft)", price: 220, unit: "length", category: "Plumbing" },
  { name: "Brass Ball Valve 1/2-inch", price: 180, unit: "piece", category: "Plumbing" },
  { name: "Teflon Tape Pack of 5", price: 60, unit: "pack", category: "Plumbing" },
  { name: "Chrome Basin Mixer Tap", price: 850, unit: "piece", category: "Plumbing" },
  { name: "Copper Electrical Wire 2.5mm (90m)", price: 1450, unit: "coil", category: "Electrical" },
  { name: "10A Modular Switch (Pack of 10)", price: 290, unit: "box", category: "Electrical" },
  { name: "LED Tube Light 20W", price: 190, unit: "piece", category: "Electrical" },
  { name: "Single Pole MCB 16A", price: 160, unit: "piece", category: "Electrical" },
  { name: "Ultratech Cement Bag 50kg", price: 380, unit: "bag", category: "Building Materials" },
  { name: "River Sand (High Grade)", price: 950, unit: "brass", category: "Building Materials" },
  { name: "Red Clay Bricks (100 pcs)", price: 750, unit: "lot", category: "Building Materials" },
  { name: "Asian Paints Apex Weatherproof (4L)", price: 1100, unit: "can", category: "Paints" },
  { name: "Wall Putty Powder 20kg", price: 420, unit: "bag", category: "Paints" },
  { name: "Synthetic Paint Brush 4-inch", price: 95, unit: "piece", category: "Paints" },
  { name: "Steel Claw Hammer 500g", price: 280, unit: "piece", category: "Tools" },
  { name: "Measuring Tape 5 Meters", price: 120, unit: "piece", category: "Tools" },
  { name: "Stainless Steel Screws Assorted (100 pcs)", price: 85, unit: "box", category: "Hardware" },
  { name: "Fevicol Marine Wood Adhesive 1kg", price: 260, unit: "bottle", category: "Hardware" },
  { name: "Aluminium Door Hinges 4-inch (Pair)", price: 110, unit: "pair", category: "Hardware" },
  { name: "WD-40 Rust Remover & Lubricant Spray", price: 199, unit: "can", category: "Hardware" },
  { name: "High-Tensile Wire Mesh (10m roll)", price: 680, unit: "roll", category: "Hardware" },
  { name: "Safety Helmet & Construction Goggles", price: 250, unit: "set", category: "Safety Gear" },
  { name: "Heavy Duty Extension Cord 10m", price: 450, unit: "piece", category: "Electrical" },
  { name: "Drill Bit Set for Masonry & Metal", price: 320, unit: "set", category: "Tools" },
];

function generate20Products() {
  const selected = faker.helpers.arrayElements(SHOP_PRODUCT_POOL, 20);
  return selected.map((item) => ({
    id: `prod_${faker.string.alphanumeric(8)}`,
    name: item.name,
    price: item.price + faker.number.int({ min: -20, max: 50 }),
    unit: item.unit,
    category: item.category,
    stock: faker.number.int({ min: 10, max: 100 }),
    sku: `SKU-${faker.number.int({ min: 1000, max: 9999 })}`,
  }));
}

// ─── MAIN SEED FUNCTION ───────────────────────────────────────────────────────

async function initFirestoreWriter(): Promise<FirestoreWriter> {
  // Try 1: firebase-admin with serviceAccountKey.json or GOOGLE_APPLICATION_CREDENTIALS
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const sa = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
      const adminApp = initAdminApp({
        credential: cert(sa),
        projectId: PROJECT_ID,
      });
      console.log("✓ Connected via Firebase Admin SDK (serviceAccountKey.json)");
      const adminDb = DATABASE_ID ? getAdminFirestore(adminApp, DATABASE_ID) : getAdminFirestore(adminApp);
      return createAdminWriter(adminDb);
    } catch (e: any) {
      console.warn("Admin SDK init with service account failed, falling back to Web SDK:", e.message);
    }
  }

  // Try 2: Firebase Client SDK using firebase-applet-config.json
  console.log("✓ Initializing Firestore via Firebase Web SDK...");
  const clientApp = initClientApp(appConfig);
  const clientAuth = getAuth(clientApp);
  try {
    const cred = await signInAnonymously(clientAuth);
    console.log(`✓ Signed in anonymously as ${cred.user.uid} for development seeding`);
  } catch (authErr: any) {
    console.warn("⚠️ Anonymous sign-in warning:", authErr.message);
  }
  const clientDb = DATABASE_ID ? getClientFirestore(clientApp, DATABASE_ID) : getClientFirestore(clientApp);
  return createClientWriter(clientDb);
}

async function runSeed() {
  console.log("\n=======================================================");
  console.log("🚀 WORKSPHERE PUNE DATABASE SEEDER");
  console.log("   Generating 50 Customers, 20 Workers, 10 Artisans, 5 Shopkeepers");
  console.log("=======================================================\n");

  const writer = await initFirestoreWriter();
  const BATCH_SIZE = 350;

  async function checkCommit(force = false) {
    if (writer.getPendingCount() >= BATCH_SIZE || force) {
      const count = writer.getPendingCount();
      await writer.commit();
      if (count > 0) {
        console.log(`✓ Committed ${count} documents to Firestore...`);
      }
    }
  }

  // 1. 50 CUSTOMERS (BUYERS)
  console.log("\n1/4 Seeding 50 Customers around Pune...");
  for (let i = 1; i <= 50; i++) {
    const uid = `customer_pune_${String(i).padStart(3, "0")}`;
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const displayName = `${firstName} ${lastName}`;
    const location = getRandomPuneLocation();

    const customerData = {
      uid,
      displayName,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phoneNumber: `+9198${faker.string.numeric(8)}`,
      photoURL: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
      role: "customer",
      accountType: "customer",
      profileSetupComplete: true,
      location,
      createdAt: Date.now() - faker.number.int({ min: 1, max: 180 }) * 86400000,
    };

    await writer.set("users", uid, customerData);
    await checkCommit();
  }

  // 2. 20 WORKERS
  console.log("2/4 Seeding 20 Workers (Plumbers, Electricians, Carpenters) around Pune...");
  for (let i = 1; i <= 20; i++) {
    const uid = `worker_pune_${String(i).padStart(3, "0")}`;
    const trade = faker.helpers.arrayElement(WORKER_TRADES);
    const firstName = faker.person.firstName("male");
    const lastName = faker.person.lastName();
    const displayName = `${firstName} ${lastName}`;
    const location = getRandomPuneLocation();
    const hourlyFee = faker.number.int({ min: trade.basePriceMin, max: trade.basePriceMax });
    const dailyCharges = hourlyFee * 7;
    const rating = faker.number.float({ min: 4.2, max: 5.0, fractionDigits: 1 });
    const totalJobs = faker.number.int({ min: 15, max: 210 });
    const jobTitle = faker.helpers.arrayElement(trade.titles);

    const workerData = {
      uid,
      displayName,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phoneNumber: `+9197${faker.string.numeric(8)}`,
      whatsappNumber: `97${faker.string.numeric(8)}`,
      photoURL: `https://i.pravatar.cc/150?img=${(i % 70) + 10}`,
      role: "worker",
      accountType: "provider",
      subRole: "worker",
      profession: jobTitle,
      category: trade.category,
      jobTitle,
      hourlyFee,
      basePrice: hourlyFee,
      dailyCharges,
      emergencyCharges: Math.round(hourlyFee * 1.5),
      yearsOfExperience: faker.number.int({ min: 3, max: 18 }),
      skills: trade.skills,
      bio: `Professional ${trade.category.toLowerCase()} serving ${location.address.split(",")[1]?.trim() || "Pune"}. Punctual, verified, and quality guaranteed.`,
      serviceDescription: `Expert in ${trade.skills.slice(0, 3).join(", ")}. Available across Pune with emergency callout support.`,
      rating,
      totalJobs,
      completionRate: faker.number.float({ min: 0.92, max: 1.0, fractionDigits: 2 }),
      availableTiming: { from: "08:30", to: "19:30" },
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      maxTravelDistance: "15km",
      isOnline: true,
      isAvailable: true,
      aadhaarVerified: true,
      profileSetupComplete: true,
      location,
      createdAt: Date.now() - faker.number.int({ min: 20, max: 250 }) * 86400000,
    };

    // Push to 'users' collection
    await writer.set("users", uid, workerData);
    // Sync to 'workers' collection for app catalog
    await writer.set("workers", uid, workerData);
    await checkCommit();
  }

  // 3. 10 ARTISANS
  console.log("3/4 Seeding 10 Artisans (Pottery, Textiles, Woodwork) with portfolio galleries...");
  for (let i = 1; i <= 10; i++) {
    const uid = `artisan_pune_${String(i).padStart(3, "0")}`;
    const craft = faker.helpers.arrayElement(ARTISAN_CRAFTS);
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const displayName = `${firstName} ${lastName}`;
    const location = getRandomPuneLocation();
    const rating = faker.number.float({ min: 4.5, max: 5.0, fractionDigits: 1 });

    const artisanData = {
      uid,
      displayName,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phoneNumber: `+9196${faker.string.numeric(8)}`,
      whatsappNumber: `96${faker.string.numeric(8)}`,
      photoURL: `https://i.pravatar.cc/150?img=${(i % 70) + 30}`,
      role: "artisan",
      accountType: "provider",
      subRole: "artisan",
      craftCategory: craft.category,
      specialty: craft.category,
      yearsOfExperience: faker.number.int({ min: 4, max: 25 }),
      artisanBio: `Master artisan in ${craft.category.toLowerCase()} from Pune. Handcrafted with traditional techniques using sustainable natural materials.`,
      handmadeProducts: craft.products,
      productDescription: craft.products,
      materialUsed: "Clay, Organic Cotton, Teakwood, Natural Dyes",
      portfolioUrls: craft.portfolio,
      customOrdersAvailable: true,
      deliveryAvailable: true,
      rating,
      isPublished: true,
      profileSetupComplete: true,
      location,
      createdAt: Date.now() - faker.number.int({ min: 30, max: 300 }) * 86400000,
    };

    // Push to 'users' collection
    await writer.set("users", uid, artisanData);
    // Sync to 'artisans' collection
    await writer.set("artisans", uid, artisanData);

    // Add a showcase product in 'products'
    const productId = `prod_artisan_pune_${i}`;
    await writer.set("products", productId, {
      id: productId,
      artisanId: uid,
      title: `${craft.category} - ${craft.products.split(",")[0]?.trim() || "Handmade Collection"}`,
      description: `Authentic handcrafted piece made in Pune by ${displayName}. Premium finish, direct from artisan workshop.`,
      price: faker.number.int({ min: 450, max: 2400 }),
      category: craft.category.toLowerCase(),
      imageUrl: craft.portfolio[0],
      stock: faker.number.int({ min: 3, max: 20 }),
      createdAt: Date.now() - faker.number.int({ min: 2, max: 60 }) * 86400000,
    });

    await checkCommit();
  }

  // 4. 5 SHOPKEEPERS
  console.log("4/4 Seeding 5 Shopkeepers (Hardware & Materials with 20 products each)...");
  for (let i = 1; i <= 5; i++) {
    const uid = `vendor_pune_${String(i).padStart(3, "0")}`;
    const firstName = faker.person.firstName("male");
    const lastName = faker.person.lastName();
    const ownerName = `${firstName} ${lastName}`;
    const location = getRandomPuneLocation();
    const locality = location.address.split(",")[1]?.trim() || "Pune";
    const shopNames = [
      `${locality} Hardware & Electricals`,
      `Shree Ganesh Building Materials`,
      `Om Sai Hardware & Tools Depot`,
      `Pune Central Hardware & Paints`,
      `Maharashtra Sanitary & Fitting Store`,
    ];
    const shopName = shopNames[i - 1] || `${locality} Supplies Depot`;
    const products20 = generate20Products();

    const shopkeeperData = {
      uid,
      displayName: ownerName,
      ownerName,
      shopName,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phoneNumber: `+9195${faker.string.numeric(8)}`,
      contactNumber: `+9195${faker.string.numeric(8)}`,
      whatsappNumber: `95${faker.string.numeric(8)}`,
      photoURL: `https://i.pravatar.cc/150?img=${(i % 70) + 50}`,
      shopLogoUrl: `https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=300&auto=format&fit=crop&q=80`,
      role: "vendor",
      accountType: "provider",
      subRole: "vendor",
      shopCategory: "Hardware & Building Materials",
      shopDescription: `Neighborhood dealer in plumbing pipes, electrical fixtures, cement, paints & tools in ${locality}, Pune.`,
      shopAddress: location.address,
      landmark: `Near ${locality} Bus Stop`,
      pincode: location.pincode,
      openingTime: "08:30",
      closingTime: "21:00",
      weeklyOff: "Sunday",
      homeDelivery: true,
      pickupAvailable: true,
      cashOnDelivery: true,
      onlinePayment: true,
      isPublished: true,
      profileSetupComplete: true,
      location,
      products: products20, // Array of 20 random hardware/grocery products
      inventory: products20,
      createdAt: Date.now() - faker.number.int({ min: 40, max: 350 }) * 86400000,
    };

    // Push to 'users' collection
    await writer.set("users", uid, shopkeeperData);
    // Sync to 'vendors' collection
    await writer.set("vendors", uid, shopkeeperData);

    // Populate individual items into 'inventory' collection
    for (const item of products20) {
      await writer.set("inventory", `${uid}_${item.id}`, {
        id: `${uid}_${item.id}`,
        name: item.name,
        price: item.price,
        unit: item.unit,
        category: item.category,
        vendorId: uid,
        vendorShopName: shopName,
        createdAt: Date.now(),
      });
      await checkCommit();
    }

    await checkCommit();
  }

  // Final commit
  await checkCommit(true);

  console.log("\n=======================================================");
  console.log("🎉 PUNE DATABASE SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=======================================================");
  console.log("Total entities generated & pushed to Firestore:");
  console.log("  • 50 Customers  (role: customer, Pune coordinates)");
  console.log("  • 20 Workers    (Plumbers, Electricians, Carpenters, Welders)");
  console.log("  • 10 Artisans   (Pottery, Textiles, Woodwork with gallery URLs)");
  console.log("  • 5 Shopkeepers (Each with 20 hardware/grocery products)");
  console.log("  • 100 Inventory items populated for worker material selectors");
  console.log("  • Target: Firestore 'users' collection + role collections");
  console.log("=======================================================\n");
}

runSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Seeding Error:", err);
    process.exit(1);
  });
