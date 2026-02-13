// src/types/express/index.d.ts
// Express type extensions

export {}; // Make this file a module

declare global {
  namespace Express {
    interface Request {
      /**
       * Authenticated admin user (set by auth middleware)
       */
      admin?: {
        id: number;
        username: string;
        displayName: string | null;
        role: string;
      };

      /**
       * Authenticated player (set by player middleware)
       */
      player?: {
        id: number;
        phone: string;
        name: string | null;
      };
    }
  }
}
