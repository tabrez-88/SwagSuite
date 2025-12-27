// Type definition for Replit Auth user with claims
// Note: Replit Auth adds a user object to req with claims property
declare global {
    namespace Express {
        interface User {
            claims: {
                sub: string;
                email?: string;
                [key: string]: any;
            };
        }
    }
}

// This export makes the file a module, which is required for global augmentation
export { };
