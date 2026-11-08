import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, "../firebase-applet-config.json");
const appConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

async function testWrite() {
  const app = initializeApp(appConfig);
  const auth = getAuth(app);
  const cred = await signInAnonymously(auth);
  const myUid = cred.user.uid;
  console.log("Logged in anonymously:", myUid);

  const db = appConfig.firestoreDatabaseId
    ? getFirestore(app, appConfig.firestoreDatabaseId)
    : getFirestore(app);

  try {
    console.log(`Testing write to users/${myUid}...`);
    await setDoc(doc(db, "users", myUid), {
      uid: myUid,
      displayName: "My Test User",
      role: "worker",
      createdAt: Date.now()
    });
    console.log(`✓ SUCCESS: Written to users/${myUid}!`);
  } catch (e: any) {
    console.log("✗ FAILED users write:", e.message, e.code);
  }

  try {
    console.log(`Testing write to workers/${myUid}...`);
    await setDoc(doc(db, "workers", myUid), {
      uid: myUid,
      displayName: "My Test Worker",
      category: "Plumber",
      basePrice: 400,
      rating: 5,
      totalJobs: 0,
      completionRate: 1,
      isAvailable: true,
      role: "worker",
      createdAt: Date.now()
    });
    console.log(`✓ SUCCESS: Written to workers/${myUid}!`);
  } catch (e: any) {
    console.log("✗ FAILED workers write:", e.message, e.code);
  }
}

testWrite().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
