/**
 * OTP-Based Login via Firebase Authentication for WorkSphere
 * Inclusion-First Design for users without email.
 */

export enum AuthStatus {
  UNAUTHENTICATED = "unauthenticated",
  AUTHENTICATING = "authenticating",
  AUTHENTICATED = "authenticated",
}

export interface AuthState {
  status: AuthStatus;
  user: {
    uid: string;
    phoneNumber: string;
    displayName?: string;
  } | null;
}

export async function sendOTP(phoneNumber: string): Promise<string> {
  // Simulated OTP send flow
  // In production, this would use Firebase Authentication's signInWithPhoneNumber
  console.log(`Sending OTP to ${phoneNumber}...`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("verification_id_123");
    }, 2000);
  });
}

export async function verifyOTP(
  verificationId: string,
  otp: string
): Promise<AuthState> {
  // Simulated OTP verification flow
  // In production, this would use Firebase Authentication's PhoneAuthProvider
  console.log(`Verifying OTP ${otp} for verification ID ${verificationId}...`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: AuthStatus.AUTHENTICATED,
        user: {
          uid: "u123",
          phoneNumber: "+919876543210",
          displayName: "Siddharth Mohite",
        },
      });
    }, 2000);
  });
}

export function signOut(): void {
  // Simulated sign out flow
  console.log("WorkSphere User Signed Out...");
}
