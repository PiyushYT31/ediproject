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

async function inspectData() {
  const app = initializeApp(appConfig);
  const auth = getAuth(app);
  await signInAnonymously(auth);

  const db = appConfig.firestoreDatabaseId
    ? getFirestore(app, appConfig.firestoreDatabaseId)
    : getFirestore(app);

  const snap = await getDocs(collection(db, "workers"));
  console.log("--- WORKERS ---");
  snap.forEach(d => {
    console.log(d.id, JSON.stringify(d.data()));
  });

  const snapV = await getDocs(collection(db, "vendors"));
  console.log("--- VENDORS ---");
  snapV.forEach(d => {
    console.log(d.id, JSON.stringify(d.data()));
  });

  const snapA = await getDocs(collection(db, "artisans"));
  console.log("--- ARTISANS ---");
  snapA.forEach(d => {
    console.log(d.id, JSON.stringify(d.data()));
  });
}

inspectData().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
