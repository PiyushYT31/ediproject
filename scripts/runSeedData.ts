import { seedAllData } from "../src/scripts/seedData";
import { auth } from "../src/firebase";
import { signInAnonymously } from "firebase/auth";

async function run() {
  console.log("Signing in anonymously...");
  const cred = await signInAnonymously(auth);
  console.log("Signed in as:", cred.user.uid);
  
  console.log("Running seedAllData()...");
  const res = await seedAllData();
  console.log("Result:", res);
}

run().then(() => process.exit(0)).catch(err => {
  console.error("Error in run:", err);
  process.exit(1);
});
