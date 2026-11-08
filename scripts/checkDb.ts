import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, "../firebase-applet-config.json");
const appConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

async function checkCollections() {
  const app = initializeApp(appConfig);
  const auth = getAuth(app);
  try {
    await signInAnonymously(auth);
    console.log("Signed in anonymously");
  } catch (e: any) {
    console.log("Anonymous sign in error:", e.message);
  }

  const db = appConfig.firestoreDatabaseId
    ? getFirestore(app, appConfig.firestoreDatabaseId)
    : getFirestore(app);

  const collections = ["users", "workers", "vendors", "artisans", "products", "inventory", "jobs", "orders"];

  for (const col of collections) {
    try {
      const snap = await getDocs(collection(db, col));
      console.log(`Collection '${col}': ${snap.size} documents`);
    } catch (err: any) {
      console.log(`Collection '${col}': Error (${err.code || err.message})`);
    }
  }
}

checkCollections().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
