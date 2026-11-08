import { useState, useEffect, createContext, useContext } from 'react';
import { GoogleGenAI } from "@google/genai";

export type Language = 'en' | 'hi' | 'mr';

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

export const translations: Translations = {
  welcome: {
    en: 'Welcome to WorkSphere',
    hi: 'WorkSphere में आपका स्वागत है',
    mr: 'WorkSphere मध्ये आपले स्वागत आहे',
  },
  tagline: {
    en: 'Connecting daily wage workers with local opportunities.',
    hi: 'दैनिक वेतन भोगी श्रमिकों को स्थानीय अवसरों से जोड़ना।',
    mr: 'दैनिक वेतन कामगारांना स्थानिक संधींशी जोडणे.',
  },
  selectLanguage: {
    en: 'Select your language',
    hi: 'अपनी भाषा चुनें',
    mr: 'तुमची भाषा निवडा',
  },
  getStarted: {
    en: 'Get Started',
    hi: 'शुरू करें',
    mr: 'सुरु करा',
  },
  explore: {
    en: 'Explore',
    hi: 'खोजें',
    mr: 'शोधा',
  },
  nearby: {
    en: 'Nearby',
    hi: 'पास में',
    mr: 'जवळपास',
  },
  jobs: {
    en: 'Jobs',
    hi: 'काम',
    mr: 'कामे',
  },
  profile: {
    en: 'Profile',
    hi: 'प्रोफ़ाइल',
    mr: 'प्रोफाइल',
  },
  searchPlaceholder: {
    en: 'Search for workers, services...',
    hi: 'श्रमिकों, सेवाओं की खोज करें...',
    mr: 'कामगार, सेवा शोधा...',
  },
  categories: {
    en: 'Categories',
    hi: 'श्रेणियाँ',
    mr: 'श्रेणी',
  },
  recommended: {
    en: 'Recommended for you',
    hi: 'आपके लिए अनुशंसित',
    mr: 'तुमच्यासाठी शिफारस केलेले',
  },
  noWorkers: {
    en: 'No workers found in this category.',
    hi: 'इस श्रेणी में कोई श्रमिक नहीं मिला।',
    mr: 'या श्रेणीमध्ये कोणतेही कामगार आढळले नाहीत.',
  },
  signIn: {
    en: 'Sign In with Google',
    hi: 'Google के साथ साइन इन करें',
    mr: 'Google सह साइन इन करा',
  },
  signOut: {
    en: 'Sign Out',
    hi: 'साइन आउट',
    mr: 'साइन आउट',
  },
  becomeWorker: {
    en: 'Become a Worker',
    hi: 'श्रमिक बनें',
    mr: 'कामगार बना',
  },
  becomeVendor: {
    en: 'Become a Hardware Vendor',
    hi: 'हार्डवेयर विक्रेता बनें',
    mr: 'हार्डवेअर विक्रेता बना',
  },
  vendorPortal: {
    en: 'Vendor Portal',
    hi: 'विक्रेता पोर्टल',
    mr: 'विक्रेता पोर्टल',
  },
  myBookings: {
    en: 'My Bookings',
    hi: 'मेरी बुकिंग',
    mr: 'माझ्या बुकिंग',
  },
  myAssignments: {
    en: 'My Assignments',
    hi: 'मेरे कार्य',
    mr: 'माझी कामे',
  },
  bookNow: {
    en: 'Book Now',
    hi: 'अभी बुक करें',
    mr: 'आता बुक करा',
  },
  availableNow: {
    en: 'Available Now',
    hi: 'अभी उपलब्ध है',
    mr: 'आता उपलब्ध आहे',
  },
  distance: {
    en: 'Distance',
    hi: 'दूरी',
    mr: 'अंतर',
  },
  rating: {
    en: 'Rating',
    hi: 'रेटिंग',
    mr: 'रेटिंग',
  },
  about: {
    en: 'About',
    hi: 'के बारे में',
    mr: 'बद्दल',
  },
  reviews: {
    en: 'Reviews',
    hi: 'समीक्षाएं',
    mr: 'समीक्षा',
  },
  writeReview: {
    en: 'Write a Review',
    hi: 'समीक्षा लिखें',
    mr: 'समीक्षा लिहा',
  },
  submitReview: {
    en: 'Submit Review',
    hi: 'समीक्षा सबमिट करें',
    mr: 'समीक्षा सबमिट करा',
  },
  cancel: {
    en: 'Cancel',
    hi: 'रद्द करें',
    mr: 'रद्द करा',
  },
  loading: {
    en: 'Loading...',
    hi: 'लोड हो रहा है...',
    mr: 'लोड होत आहे...',
  },
  chat: {
    en: 'Chat',
    hi: 'चैट',
    mr: 'चॅट',
  },
  call: {
    en: 'Call',
    hi: 'कॉल',
    mr: 'कॉल',
  },
  score: {
    en: 'Score',
    hi: 'स्कोर',
    mr: 'स्कोअर',
  },
  jobsCount: {
    en: 'Jobs',
    hi: 'काम',
    mr: 'कामे',
  },
  km: {
    en: 'km',
    hi: 'किमी',
    mr: 'किमी',
  },
  noReviews: {
    en: 'No reviews yet',
    hi: 'अभी तक कोई समीक्षा नहीं',
    mr: 'अद्याप कोणतीही समीक्षा नाही',
  },
  reviewPlaceholder: {
    en: 'Share your experience with this worker...',
    hi: 'इस श्रमिक के साथ अपना अनुभव साझा करें...',
    mr: 'या कामगारासोबतचा तुमचा अनुभव शेअर करा...',
  },
  Plumber: {
    en: 'Plumber',
    hi: 'प्लंबर',
    mr: 'प्लंबर',
  },
  Electrician: {
    en: 'Electrician',
    hi: 'इलेक्ट्रीशियन',
    mr: 'इलेक्ट्रीशियन',
  },
  Carpenter: {
    en: 'Carpenter',
    hi: 'बढ़ई',
    mr: 'सुतार',
  },
  Painter: {
    en: 'Painter',
    hi: 'पेंटर',
    mr: 'पेंटर',
  },
  Mason: {
    en: 'Mason',
    hi: 'राजमिस्त्री',
    mr: 'गवंडी',
  },
  Cleaner: {
    en: 'Cleaner',
    hi: 'क्लीनर',
    mr: 'क्लीनर',
  },
  Gardener: {
    en: 'Gardener',
    hi: 'माली',
    mr: 'माळी',
  },
  Mechanic: {
    en: 'Mechanic',
    hi: 'मैकेनिक',
    mr: 'मेकॅनिक',
  },
  Welder: {
    en: 'Welder',
    hi: 'वेल्डर',
    mr: 'वेल्डर',
  },
  'AC Technician': {
    en: 'AC Technician',
    hi: 'एसी तकनीशियन',
    mr: 'एसी तंत्रज्ञ',
  },
  Cement: {
    en: 'Cement',
    hi: 'सीमेंट',
    mr: 'सिमेंट',
  },
  Pipes: {
    en: 'Pipes',
    hi: 'पाइप्स',
    mr: 'पाईप्स',
  },
  Electrical: {
    en: 'Electrical',
    hi: 'विद्युत',
    mr: 'इलेक्ट्रिकल',
  },
  Paint: {
    en: 'Paint',
    hi: 'पेंट',
    mr: 'पेंट',
  },
  Wood: {
    en: 'Wood',
    hi: 'लकड़ी',
    mr: 'लाकूड',
  },
  Metal: {
    en: 'Metal',
    hi: 'धातु',
    mr: 'धातू',
  },
  Tools: {
    en: 'Tools',
    hi: 'उपकरण',
    mr: 'साधने',
  },
  addMaterials: {
    en: 'Add Materials',
    hi: 'सामग्री जोड़ें',
    mr: 'साहित्य जोडा',
  },
  searchMaterials: {
    en: 'Search materials (cement, pipes, bricks...)',
    hi: 'सामग्री खोजें (सीमेंट, पाइप, ईंटें...)',
    mr: 'साहित्य शोधा (सिमेंट, पाईप्स, विटा...)',
  },
  fetchingVendors: {
    en: 'Fetching Vendors...',
    hi: 'विक्रेताओं को प्राप्त किया जा रहा है...',
    mr: 'विक्रेते मिळवत आहे...',
  },
  noMaterialsFound: {
    en: 'No materials found.',
    hi: 'कोई सामग्री नहीं मिली।',
    mr: 'कोणतेही साहित्य आढळले नाही.',
  },
  totalMaterialsCost: {
    en: 'Total Materials Cost',
    hi: 'कुल सामग्री लागत',
    mr: 'एकूण साहित्य खर्च',
  },
  itemsCount: {
    en: 'Items',
    hi: 'वस्तुएं',
    mr: 'वस्तू',
  },
  addToJobQuote: {
    en: 'Add to Job Quote',
    hi: 'जॉब कोट में जोड़ें',
    mr: 'जॉब कोटमध्ये जोडा',
  },
  category: {
    en: 'Category',
    hi: 'श्रेणी',
    mr: 'श्रेणी',
  },
  unknownWorker: {
    en: 'Unknown Worker',
    hi: 'अज्ञात श्रमिक',
    mr: 'अज्ञात कामगार',
  },
  consumer: {
    en: 'Consumer',
    hi: 'उपभोक्ता',
    mr: 'ग्राहक',
  },
  worker: {
    en: 'Worker',
    hi: 'श्रमिक',
    mr: 'कामगार',
  },
  vendor: {
    en: 'Vendor',
    hi: 'विक्रेता',
    mr: 'विक्रेता',
  },
  basePrice: {
    en: 'Base Price',
    hi: 'आधार मूल्य',
    mr: 'आधार किंमत',
  },
  Pending: {
    en: 'Pending',
    hi: 'लंबित',
    mr: 'प्रलंबित',
  },
  Accepted: {
    en: 'Accepted',
    hi: 'स्वीकार कर लिया',
    mr: 'स्वीकारले',
  },
  'In Progress': {
    en: 'In Progress',
    hi: 'प्रगति पर है',
    mr: 'प्रगतीपथावर',
  },
  Completed: {
    en: 'Completed',
    hi: 'पूरा हुआ',
    mr: 'पूर्ण झाले',
  },
  Cancelled: {
    en: 'Cancelled',
    hi: 'रद्द कर दिया गया',
    mr: 'रद्द केले',
  },
  accept: {
    en: 'Accept',
    hi: 'स्वीकार करें',
    mr: 'स्वीकारा',
  },
  startWork: {
    en: 'Start Work',
    hi: 'काम शुरू करें',
    mr: 'काम सुरू करा',
  },
  markCompleted: {
    en: 'Mark Completed',
    hi: 'पूरा चिह्नित करें',
    mr: 'पूर्ण झाले म्हणून चिन्हांकित करा',
  },
  materialsRequested: {
    en: 'Materials Requested',
    hi: 'सामग्री का अनुरोध किया गया',
    mr: 'साहित्याची विनंती केली',
  },
  materialsTotal: {
    en: 'Materials Total',
    hi: 'कुल सामग्री',
    mr: 'एकूण साहित्य',
  },
  totalQuote: {
    en: 'Total Quote',
    hi: 'कुल उद्धरण',
    mr: 'एकूण कोट',
  },
  inventory: {
    en: 'Inventory',
    hi: 'इन्वेंटरी',
    mr: 'इन्वेंटरी',
  },
  manageInventory: {
    en: 'Manage your shop items and prices',
    hi: 'अपनी दुकान की वस्तुओं और कीमतों का प्रबंधन करें',
    mr: 'तुमच्या दुकानातील वस्तू आणि किमती व्यवस्थापित करा',
  },
  searchInventory: {
    en: 'Search inventory...',
    hi: 'इन्वेंटरी खोजें...',
    mr: 'इन्वेंटरी शोधा...',
  },
  noInventory: {
    en: 'No items in your inventory.',
    hi: 'आपकी इन्वेंटरी में कोई आइटम नहीं है।',
    mr: 'तुमच्या इन्वेंटरीमध्ये कोणतीही वस्तू नाही.',
  },
  addItem: {
    en: 'Add New Item',
    hi: 'नई वस्तु जोड़ें',
    mr: 'नवीन वस्तू जोडा',
  },
  editItem: {
    en: 'Edit Item',
    hi: 'वस्तु संपादित करें',
    mr: 'वस्तू संपादित करा',
  },
  itemName: {
    en: 'Item Name',
    hi: 'वस्तु का नाम',
    mr: 'वस्तूचे नाव',
  },
  price: {
    en: 'Price',
    hi: 'कीमत',
    mr: 'किंमत',
  },
  unit: {
    en: 'Unit',
    hi: 'इकाई',
    mr: 'युनिट',
  },
  updateItem: {
    en: 'Update Item',
    hi: 'वस्तु अपडेट करें',
    mr: 'वस्तू अपडेट करा',
  },
  confirmDelete: {
    en: 'Are you sure you want to delete this item?',
    hi: 'क्या आप वाकई इस आइटम को हटाना चाहते हैं?',
    mr: 'तुम्हाला खात्री आहे की तुम्ही ही वस्तू हटवू इच्छिता?',
  },
  selectCategory: {
    en: 'Select Your Category',
    hi: 'अपनी श्रेणी चुनें',
    mr: 'तुमची श्रेणी निवडा',
  },
  baseServicePrice: {
    en: 'Base Service Price (₹)',
    hi: 'आधार सेवा मूल्य (₹)',
    mr: 'आधार सेवा किंमत (₹)',
  },
  professionalBio: {
    en: 'Professional Bio',
    hi: 'पेशेवर जैव',
    mr: 'व्यावसायिक बायो',
  },
  bioPlaceholder: {
    en: 'Tell us about your experience...',
    hi: 'हमें अपने अनुभव के बारे में बताएं...',
    mr: 'आम्हाला तुमच्या अनुभवाबद्दल सांगा...',
  },
  completeRegistration: {
    en: 'Complete Registration',
    hi: 'पंजीकरण पूरा करें',
    mr: 'नोंदणी पूर्ण करा',
  },
  allSet: {
    en: "You're all set!",
    hi: 'आप पूरी तरह तैयार हैं!',
    mr: 'तुम्ही पूर्णपणे तयार आहात!',
  },
  profileLive: {
    en: 'Your profile is now live on the marketplace.',
    hi: 'आपका प्रोफ़ाइल अब बाज़ार में लाइव है।',
    mr: 'तुमचे प्रोफाइल आता मार्केटप्लेसवर लाइव्ह आहे.',
  },
  shopName: {
    en: 'Shop Name',
    hi: 'दुकान का नाम',
    mr: 'दुकानाचे नाव',
  },
  shopAddress: {
    en: 'Shop Address',
    hi: 'दुकान का पता',
    mr: 'दुकानाचा पत्ता',
  },
  shopNamePlaceholder: {
    en: 'e.g. Agarwal Hardware & Tools',
    hi: 'जैसे अग्रवाल हार्डवेयर एंड टूल्स',
    mr: 'उदा. अग्रवाल हार्डवेअर आणि टूल्स',
  },
  shopAddressPlaceholder: {
    en: 'Full address of your physical store...',
    hi: 'आपके भौतिक स्टोर का पूरा पता...',
    mr: 'तुमच्या प्रत्यक्ष स्टोअरचा पूर्ण पत्ता...',
  },
  vendorBenefit: {
    en: "By registering as a vendor, you'll be able to list your inventory and receive material requests from local workers and consumers.",
    hi: 'एक विक्रेता के रूप में पंजीकरण करके, आप अपनी इन्वेंट्री को सूचीबद्ध कर पाएंगे और स्थानीय श्रमिकों और उपभोक्ताओं से सामग्री अनुरोध प्राप्त कर पाएंगे।',
    mr: 'विक्रेता म्हणून नोंदणी करून, तुम्ही तुमची इन्व्हेंटरी सूचीबद्ध करू शकाल आणि स्थानिक कामगार आणि ग्राहकांकडून साहित्याच्या विनंत्या प्राप्त करू शकाल.',
  },
  registerShop: {
    en: 'Register Shop',
    hi: 'दुकान पंजीकृत करें',
    mr: 'दुकानाची नोंदणी करा',
  },
  shopRegistered: {
    en: 'Shop Registered!',
    hi: 'दुकान पंजीकृत!',
    mr: 'दुकानाची नोंदणी झाली!',
  },
  startAddingItems: {
    en: 'You can now start adding items to your inventory.',
    hi: 'अब आप अपनी इन्वेंट्री में आइटम जोड़ना शुरू कर सकते हैं।',
    mr: 'तुम्ही आता तुमच्या इन्व्हेंटरीमध्ये वस्तू जोडणे सुरू करू शकता.',
  },
  workAssigned: {
    en: 'Work Assigned',
    hi: 'सौंपा गया काम',
    mr: 'सोपवलेले काम',
  },
  signInToViewJobs: {
    en: 'Sign in to view your jobs',
    hi: 'अपनी नौकरियां देखने के लिए साइन इन करें',
    mr: 'तुमच्या नोकऱ्या पाहण्यासाठी साइन इन करा',
  },
  noJobsFound: {
    en: 'No jobs found',
    hi: 'कोई नौकरी नहीं मिली',
    mr: 'कोणतीही नोकरी सापडली नाही',
  },
  bookingDescription: {
    en: 'When you book a worker, your job status will appear here.',
    hi: 'जब आप किसी कर्मचारी को बुक करते हैं, तो आपकी नौकरी की स्थिति यहां दिखाई देगी।',
    mr: 'जेव्हा तुम्ही कामगार बुक करता, तेव्हा तुमच्या कामाची स्थिती येथे दिसेल.',
  },
  assignmentDescription: {
    en: 'When someone books you, the request will appear here.',
    hi: 'जब कोई आपको बुक करता है, तो अनुरोध यहां दिखाई देगा।',
    mr: 'जेव्हा कोणी तुम्हाला बुक करेल, तेव्हा विनंती येथे दिसेल.',
  },
  guestUser: {
    en: 'Guest User',
    hi: 'अतिथि उपयोगकर्ता',
    mr: 'पाहुणे वापरकर्ता',
  },
  changeLanguage: {
    en: 'Change Language',
    hi: 'भाषा बदलें',
    mr: 'भाषा बदला',
  },
  accountSettings: {
    en: 'Account Settings',
    hi: 'खाता सेटिंग्ज',
    mr: 'खाते सेटिंग्ज',
  },
  paymentMethods: {
    en: 'Payment Methods',
    hi: 'भुगतान के तरीके',
    mr: 'पेमेंट पद्धती',
  },
  helpSupport: {
    en: 'Help & Support',
    hi: 'सहायता और समर्थन',
    mr: 'मदत आणि समर्थन',
  },
  becomeWorkerBtn: {
    en: 'Become a Worker',
    hi: 'एक कार्यकर्ता बनें',
    mr: 'एक कामगार बना',
  },
  becomeVendorBtn: {
    en: 'Become a Hardware Vendor',
    hi: 'हार्डवेयर विक्रेता बनें',
    mr: 'हार्डवेअर विक्रेता बना',
  },
  vendorPortalBtn: {
    en: 'Hardware Vendor Portal',
    hi: 'हार्डवेयर विक्रेता पोर्टल',
    mr: 'हार्डवेअर विक्रेता पोर्टल',
  },
  backToProfile: {
    en: 'Back to Profile',
    hi: 'प्रोफ़ाइल पर वापस जाएं',
    mr: 'प्रोफाइलवर परत जा',
  },
  nearbyWorkers: {
    en: 'Nearby Workers',
    hi: 'आस-पास के कर्मचारी',
    mr: 'जवळपासचे कामगार',
  },
  withinRadius: {
    en: 'Within 10km radius',
    hi: '10 किमी के दायरे में',
    mr: '10 किमी परिघात',
  },
  noWorkersNearby: {
    en: 'No workers nearby',
    hi: 'आस-पास कोई कर्मचारी नहीं है',
    mr: 'जवळपास कोणीही कामगार नाही',
  },
  nearbyDescription: {
    en: 'Try increasing your search radius or checking back later.',
    hi: 'अपनी खोज का दायरा बढ़ाने का प्रयास करें या बाद में पुन: प्रयास करें।',
    mr: 'तुमची शोध त्रिज्या वाढवण्याचा प्रयत्न करा किंवा नंतर पुन्हा तपासा.',
  },
  clear: {
    en: 'Clear',
    hi: 'साफ़ करें',
    mr: 'साफ करा',
  },
  mapView: {
    en: 'Map View',
    hi: 'मानचित्र दृश्य',
    mr: 'नकाशा दृश्य',
  },
  listView: {
    en: 'List View',
    hi: 'सूची दृश्य',
    mr: 'यादी दृश्य',
  },
  signInPrompt: {
    en: 'Sign in to book workers',
    hi: 'श्रमिकों को बुक करने के लिए साइन इन करें',
    mr: 'कामगार बुक करण्यासाठी साइन इन करा',
  },
  becomeArtisanBtn: {
    en: 'Become an Artisan',
    hi: 'एक कारीगर बनें',
    mr: 'एक कारागीर बना',
  },
  artisanPortalBtn: {
    en: 'Artisan Portal',
    hi: 'कारीगर पोर्टल',
    mr: 'कारागीर पोर्टल',
  },
  artisan: {
    en: 'Artisan',
    hi: 'कारीगर',
    mr: 'कारागीर',
  },
  catalog: {
    en: 'Artisan Catalog',
    hi: 'कारीगर कैटलॉग',
    mr: 'कारागीर कॅटलॉग',
  },
  products: {
    en: 'Products',
    hi: 'उत्पाद',
    mr: 'उत्पादने',
  },
  orders: {
    en: 'Orders',
    hi: 'आदेश',
    mr: 'ऑर्डर्स',
  },
  addToCart: {
    en: 'Add to Cart',
    hi: 'कार्ट में जोड़ें',
    mr: 'कार्टमध्ये जोडा',
  },
  buyNow: {
    en: 'Buy Now',
    hi: 'अभी खरीदें',
    mr: 'आता खरेदी करा',
  },
  state: {
    en: 'State',
    hi: 'राज्य',
    mr: 'राज्य',
  },
  city: {
    en: 'City',
    hi: 'शहर',
    mr: 'शहर',
  },
  selectState: {
    en: 'Select State',
    hi: 'राज्य चुनें',
    mr: 'राज्य निवडा',
  },
  selectCity: {
    en: 'Select City',
    hi: 'शहर चुनें',
    mr: 'शहर निवडा',
  },
  artisanBio: {
    en: 'Artisan Biography',
    hi: 'कारीगर की जीवनी',
    mr: 'कारागीर जीवनचरित्र',
  },
  specialty: {
    en: 'Artisan specialty',
    hi: 'कारीगर की विशेषता',
    mr: 'कारागीर वैशिष्ट्य',
  },
  pottery: {
    en: 'Pottery',
    hi: 'मिट्टी के पात्र',
    mr: 'कुंभारकाम',
  },
  textiles: {
    en: 'Textiles',
    hi: 'कपड़ा',
    mr: 'वस्त्रोद्योग',
  },
  jewelry: {
    en: 'Jewelry',
    hi: 'आभूषण',
    mr: 'दागिने',
  },
  woodwork: {
    en: 'Woodwork',
    hi: 'लकड़ी का काम',
    mr: 'लाकूडकाम',
  },
  leather: {
    en: 'Leather',
    hi: 'चमड़ा',
    mr: 'चामडे काम',
  },
  sculpture: {
    en: 'Sculpture',
    hi: 'मूर्तिकला',
    mr: 'शिल्पकला',
  },
  paintings: {
    en: 'Paintings',
    hi: 'चित्रकारी',
    mr: 'चित्रे',
  },
  uploadImages: {
    en: 'Upload Images',
    hi: 'छवियां अपलोड करें',
    mr: 'प्रतिमा अपलोड करा',
  },
  onlyConsumerCanBook: {
    en: 'Only consumers can book workers',
    hi: 'केवल उपभोक्ता ही श्रमिकों को बुक कर सकते हैं',
    mr: 'केवळ ग्राहक कामगारांना बुक करू शकतात',
  },
  cannotBookSelf: {
    en: 'You cannot book yourself',
    hi: 'आप स्वयं को बुक नहीं कर सकते',
    mr: 'तुम्ही स्वतःला बुक करू शकत नाही',
  },
  viewingOwnProfile: {
    en: 'Viewing your own profile',
    hi: 'अपनी स्वयं की प्रोफाइल देख रहे हैं',
    mr: 'तुमची स्वतःची प्रोफाइल पाहत आहात',
  },
  exitGuest: {
    en: 'Exit Guest Mode',
    hi: 'अतिथि मोड से बाहर निकलें',
    mr: 'अतिथी मोडमधून बाहेर पडा',
  },
  switchToConsumer: {
    en: 'Switch to Customer Mode',
    hi: 'ग्राहक मोड पर स्विच करें',
    mr: 'ग्राहक मोडवर स्विच करा',
  },
  switchToWorker: {
    en: 'Switch to Worker Mode',
    hi: 'कार्यकर्ता मोड पर स्विच करें',
    mr: 'कामगार मोडवर स्विच करा',
  },
  switchToVendor: {
    en: 'Switch to Vendor Mode',
    hi: 'विक्रेता मोड पर स्विच करें',
    mr: 'विक्रेता मोडवर स्विच करा',
  },
  switchToArtisan: {
    en: 'Switch to Artisan Mode',
    hi: 'कारीगर मोड पर स्विच करें',
    mr: 'कारागीर मोडवर स्विच करा',
  },
  roleSwitchWarning: {
    en: 'Your account role will be updated. You can switch back at any time.',
    hi: 'आपके खाते की भूमिका अपडेट कर दी जाएगी। आप किसी भी समय वापस स्विच कर सकते हैं।',
    mr: 'तुमच्या खात्याची भूमिका अपडेट केली जाईल. तुम्ही कधीही परत स्विच करू शकता.',
  },
  chooseLanguageTitle: {
    en: 'Choose Your Language',
    hi: 'अपनी भाषा चुनें',
    mr: 'तुमची भाषा निवडा',
  },
  chooseLanguageSubtitle: {
    en: 'Select your preferred language.',
    hi: 'अपनी पसंदीदा भाषा का चयन करें।',
    mr: 'तुमची आवडती भाषा निवडा.',
  },
  continue: {
    en: 'Continue',
    hi: 'जारी रखें',
    mr: 'सुरू ठेवा',
  },
  skipDefaultEnglish: {
    en: 'Skip (Default English)',
    hi: 'छोड़ें (डिफ़ॉल्ट अंग्रेज़ी)',
    mr: 'वगळा (डिफॉल्ट इंग्रजी)',
  },
  welcomeToWorksphere: {
    en: 'Welcome to WorkSphere',
    hi: 'WorkSphere में आपका स्वागत है',
    mr: 'WorkSphere मध्ये आपले स्वागत आहे',
  },
  createAccountToContinue: {
    en: 'Create an account to continue',
    hi: 'जारी रखने के लिए खाता बनाएं',
    mr: 'सुरू ठेवण्यासाठी खाते तयार करा',
  },
  signInToContinue: {
    en: 'Sign in to continue',
    hi: 'जारी रखने के लिए साइन इन करें',
    mr: 'सुरू ठेवण्यासाठी साइन इन करा',
  },
  fullName: {
    en: 'Full Name',
    hi: 'पूरा नाम',
    mr: 'पूर्ण नाव',
  },
  phoneNumber: {
    en: 'Phone Number',
    hi: 'फ़ोन नंबर',
    mr: 'फोन नंबर',
  },
  emailAddress: {
    en: 'Email Address',
    hi: 'ईमेल पता',
    mr: 'ईमेल पत्ता',
  },
  password: {
    en: 'Password',
    hi: 'पासवर्ड',
    mr: 'पासवर्ड',
  },
  createPassword: {
    en: 'Create Password',
    hi: 'पासवर्ड बनाएं',
    mr: 'पासवर्ड तयार करा',
  },
  confirmPassword: {
    en: 'Confirm Password',
    hi: 'पासवर्ड की पुष्टि करें',
    mr: 'पासवर्डची पुष्टी करा',
  },
  selectYourRole: {
    en: 'Select Your Role',
    hi: 'अपनी भूमिका चुनें',
    mr: 'तुमची भूमिका निवडा',
  },
  signInBtn: {
    en: 'Sign In',
    hi: 'साइन इन करें',
    mr: 'साइन इन करा',
  },
  or: {
    en: 'OR',
    hi: 'या',
    mr: 'किंवा',
  },
  dontHaveAccount: {
    en: "Don't have an account?",
    hi: 'खाता नहीं है?',
    mr: 'खाते नाही?',
  },
  alreadyHaveAccount: {
    en: 'Already have an account?',
    hi: 'क्या आपके पास पहले से खाता है?',
    mr: 'आधीपासूनच खाते आहे?',
  },
  registerNow: {
    en: 'Register Now',
    hi: 'अभी रजिस्टर करें',
    mr: 'आता नोंदणी करा',
  },
  loginHere: {
    en: 'Login Here',
    hi: 'यहाँ लॉगिन करें',
    mr: 'येथे लॉगिन करा',
  },
  customer: {
    en: 'Customer',
    hi: 'ग्राहक',
    mr: 'ग्राहक',
  },
  shopkeeper: {
    en: 'Shopkeeper',
    hi: 'दुकानदार',
    mr: 'दुकानदार',
  },
  roleDescCustomer: {
    en: 'Hire workers & buy items',
    hi: 'श्रमिकों को काम पर रखें और सामान खरीदें',
    mr: 'कामगार नेमा आणि वस्तू खरेदी करा',
  },
  roleDescShopkeeper: {
    en: 'Sell hardware & materials',
    hi: 'हार्डवेयर और सामग्री बेचें',
    mr: 'हार्डवेअर आणि साहित्य विका',
  },
  roleDescWorker: {
    en: 'Offer your services',
    hi: 'अपनी सेवाएं प्रदान करें',
    mr: 'तुमच्या सेवा द्या',
  },
  roleDescArtisan: {
    en: 'Sell handmade crafts',
    hi: 'हस्तनिर्मित शिल्प बेचें',
    mr: 'हस्तकला उत्पादने विका',
  },
  deleteAccount: {
    en: 'Delete Account',
    hi: 'खाता हटाएं',
    mr: 'खाते हटवा',
  },
  deleteAccountConfirm: {
    en: 'Are you sure you want to permanently delete your account? This action cannot be undone.',
    hi: 'क्या आप सच में अपना खाता स्थायी रूप से हटाना चाहते हैं? यह क्रिया वापस नहीं की जा सकती।',
    mr: 'तुम्हाला खरोखर तुमचे खाते कायमस्वरूपी हटवायचे आहे का? हे पूर्ववत करता येणार नाही.',
  },
  deleteAccountWarning: {
    en: 'Delete My Account Permanently',
    hi: 'मेरा खाता स्थायी रूप से हटाएं',
    mr: 'माझे खाते कायमस्वरूपी हटवा',
  },
  uploadProfilePhoto: {
    en: 'Upload Profile Photo',
    hi: 'प्रोफ़ाइल फ़ोटो अपलोड करें',
    mr: 'प्रोफाइल फोटो अपलोड करा',
  },
  changeProfilePhoto: {
    en: 'Change Profile Photo',
    hi: 'प्रोफ़ाइल फ़ोटो बदलें',
    mr: 'प्रोफाइल फोटो बदला',
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export function TranslatedText({ text, lang }: { text: string; lang: Language }) {
  const [translated, setTranslated] = useState(text);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lang === 'en' || !text) {
      setTranslated(text);
      return;
    }

    const translate = async () => {
      setLoading(true);
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Translate the following text to ${lang === 'hi' ? 'Hindi' : 'Marathi'}. Return ONLY the translated text: "${text}"`,
        });
        if (response.text) {
          setTranslated(response.text.trim());
        }
      } catch (error) {
        console.error("Translation error:", error);
      } finally {
        setLoading(false);
      }
    };

    translate();
  }, [text, lang]);

  if (loading) return <span className="animate-pulse opacity-50">{translated || text}</span>;
  return <span>{translated}</span>;
}
