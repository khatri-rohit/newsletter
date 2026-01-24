// ==========================================
// USER MANAGEMENT SERVICE
// ==========================================

import * as admin from "firebase-admin";
import { z } from "zod";

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

export const UserSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  provider: z.enum(["google.com", "github.com", "password"]),
  role: z.enum(["user", "admin"]).default("user"),
  isSubscribed: z.boolean().default(true),
  createdAt: z.any(), // Firestore Timestamp
  updatedAt: z.any(), // Firestore Timestamp
  lastLoginAt: z.any(), // Firestore Timestamp
  loginCount: z.number().default(0),
  metadata: z
    .object({
      ip: z.string().optional(),
      userAgent: z.string().optional(),
    })
    .optional(),
});

export const SubscriberSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  userId: z.string().optional(), // Link to users collection if authenticated
  subscribedAt: z.any(), // Firestore Timestamp
  status: z.enum(["active", "unsubscribed", "bounced"]).default("active"),
  source: z.enum(["website", "auth"]).default("website"),
  preferences: z
    .object({
      frequency: z.enum(["daily", "weekly"]).default("daily"),
      categories: z.array(z.string()).optional(),
    })
    .optional(),
});

export type User = z.infer<typeof UserSchema>;
export type Subscriber = z.infer<typeof SubscriberSchema>;

// ==========================================
// USER SERVICE CLASS
// ==========================================

export class UserService {
  private db: admin.firestore.Firestore;
  private usersCollection: admin.firestore.CollectionReference;
  private subscribersCollection: admin.firestore.CollectionReference;

  constructor() {
    this.db = admin.firestore();
    this.usersCollection = this.db.collection("users");
    this.subscribersCollection = this.db.collection("subscribers");
  }

  // ==========================================
  // USER OPERATIONS
  // ==========================================

  /**
   * Check if user exists in Firestore
   */
  async userExists(uid: string): Promise<boolean> {
    try {
      const userDoc = await this.usersCollection.doc(uid).get();
      return userDoc.exists;
    } catch (error) {
      console.error("Error checking user existence:", error);
      throw error;
    }
  }

  /**
   * Get user by UID
   */
  async getUserByUid(uid: string): Promise<User | null> {
    try {
      const userDoc = await this.usersCollection.doc(uid).get();
      if (!userDoc.exists) {
        return null;
      }
      return userDoc.data() as User;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const querySnapshot = await this.usersCollection
        .where("email", "==", email)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      return querySnapshot.docs[0].data() as User;
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw error;
    }
  }

  /**
   * Create new user document
   */
  async createUser(userData: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    provider: string;
    ip?: string;
    userAgent?: string;
  }): Promise<User> {
    try {
      const now = admin.firestore.FieldValue.serverTimestamp();

      const newUser = {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName || null,
        photoURL: userData.photoURL || null,
        provider: userData.provider,
        role: "user",
        isSubscribed: true,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        loginCount: 1,
        metadata: {
          ip: userData.ip,
          userAgent: userData.userAgent,
        },
      };

      await this.usersCollection.doc(userData.uid).set(newUser);

      // Return user with actual timestamps (note: serverTimestamp() is pending)
      return {
        ...newUser,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      } as User;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Update user's last login
   */
  async updateUserLogin(uid: string): Promise<void> {
    try {
      await this.usersCollection.doc(uid).update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        loginCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating user login:", error);
      throw error;
    }
  }

  /**
   * Update user role (for admin management)
   */
  async updateUserRole(uid: string, role: "user" | "admin"): Promise<void> {
    try {
      await this.usersCollection.doc(uid).update({
        role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Also update Firebase Auth custom claims
      await admin.auth().setCustomUserClaims(uid, { role });
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  }

  // ==========================================
  // SUBSCRIBER OPERATIONS
  // ==========================================

  /**
   * Check if email is subscribed
   */
  async isSubscribed(email: string): Promise<boolean> {
    try {
      const querySnapshot = await this.subscribersCollection
        .where("email", "==", email)
        .where("status", "==", "active")
        .limit(1)
        .get();

      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking subscription:", error);
      throw error;
    }
  }

  /**
   * Get subscriber by email
   */
  async getSubscriberByEmail(email: string): Promise<Subscriber | null> {
    try {
      const querySnapshot = await this.subscribersCollection
        .where("email", "==", email)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      return querySnapshot.docs[0].data() as Subscriber;
    } catch (error) {
      console.error("Error getting subscriber:", error);
      throw error;
    }
  }

  /**
   * Add subscriber (called during auth or manual subscription)
   */
  async addSubscriber(subscriberData: {
    email: string;
    name?: string;
    userId?: string;
    source?: "website" | "auth";
  }): Promise<Subscriber> {
    try {
      // Check if already subscribed
      const existing = await this.getSubscriberByEmail(subscriberData.email);

      if (existing) {
        // If previously unsubscribed, reactivate
        if (existing.status !== "active") {
          await this.updateSubscriberStatus(subscriberData.email, "active");
        }
        return existing;
      }

      // Create new subscriber
      const newSubscriber = {
        email: subscriberData.email,
        name: subscriberData.name,
        userId: subscriberData.userId,
        subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "active",
        source: subscriberData.source || "website",
        preferences: {
          frequency: "daily",
          categories: [],
        },
      };

      await this.subscribersCollection.add(newSubscriber);

      return {
        ...newSubscriber,
        subscribedAt: new Date(),
      } as Subscriber;
    } catch (error) {
      console.error("Error adding subscriber:", error);
      throw error;
    }
  }

  /**
   * Update subscriber status
   */
  async updateSubscriberStatus(
    email: string,
    status: "active" | "unsubscribed" | "bounced",
  ): Promise<void> {
    try {
      const querySnapshot = await this.subscribersCollection
        .where("email", "==", email)
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        await querySnapshot.docs[0].ref.update({ status });
      }
    } catch (error) {
      console.error("Error updating subscriber status:", error);
      throw error;
    }
  }

  /**
   * Get all active subscribers (for newsletter sending)
   */
  async getAllActiveSubscribers(): Promise<Subscriber[]> {
    try {
      const querySnapshot = await this.subscribersCollection
        .where("status", "==", "active")
        .get();

      return querySnapshot.docs.map((doc) => doc.data() as Subscriber);
    } catch (error) {
      console.error("Error getting active subscribers:", error);
      throw error;
    }
  }

  /**
   * Get subscriber count by status
   */
  async getSubscriberStats(): Promise<{
    active: number;
    unsubscribed: number;
    bounced: number;
    total: number;
  }> {
    try {
      const [activeSnap, unsubSnap, bouncedSnap] = await Promise.all([
        this.subscribersCollection
          .where("status", "==", "active")
          .count()
          .get(),
        this.subscribersCollection
          .where("status", "==", "unsubscribed")
          .count()
          .get(),
        this.subscribersCollection
          .where("status", "==", "bounced")
          .count()
          .get(),
      ]);

      const active = activeSnap.data().count;
      const unsubscribed = unsubSnap.data().count;
      const bounced = bouncedSnap.data().count;

      return {
        active,
        unsubscribed,
        bounced,
        total: active + unsubscribed + bounced,
      };
    } catch (error) {
      console.error("Error getting subscriber stats:", error);
      throw error;
    }
  }

  // ==========================================
  // COMBINED OPERATIONS (AUTH + SUBSCRIPTION)
  // ==========================================

  /**
   * Handle user authentication - create/update user and manage subscription
   * Returns { isNewUser: boolean, user: User }
   */
  async handleUserAuth(authData: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    provider: string;
    ip?: string;
    userAgent?: string;
  }): Promise<{ isNewUser: boolean; user: User }> {
    try {
      const exists = await this.userExists(authData.uid);

      if (exists) {
        // Existing user - update last login
        await this.updateUserLogin(authData.uid);
        const user = await this.getUserByUid(authData.uid);

        return {
          isNewUser: false,
          user: user!,
        };
      } else {
        // New user - create user document
        const user = await this.createUser(authData);

        // Add to subscribers collection automatically
        await this.addSubscriber({
          email: authData.email,
          name: authData.displayName,
          userId: authData.uid,
          source: "auth",
        });

        return {
          isNewUser: true,
          user,
        };
      }
    } catch (error) {
      console.error("Error handling user auth:", error);
      throw error;
    }
  }
}

// Singleton instance
let userServiceInstance: UserService | null = null;

export function getUserService(): UserService {
  if (!userServiceInstance) {
    userServiceInstance = new UserService();
  }
  return userServiceInstance;
}
