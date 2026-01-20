import { Client } from '@replit/object-storage';
import fs from 'fs';

/**
 * Service for managing file uploads and downloads using Replit Object Storage.
 * Handles file storage with organized paths and automatic cleanup.
 */
class ReplitStorageService {
    private client: Client;
    private initialized: boolean = false;

    constructor() {
        // Initialize client with bucket ID from environment
        const bucketId = process.env.REPLIT_BUCKET_ID;
        this.client = new Client(bucketId ? { bucketId } : undefined);
        this.initialized = true;
        console.log('✅ Replit Storage Service initialized', bucketId ? `with bucket: ${bucketId}` : 'with default bucket');
    }

    /**
     * Initialize the storage service (called automatically in constructor)
     */
    async initialize(): Promise<void> {
        if (!this.initialized) {
            const bucketId = process.env.REPLIT_BUCKET_ID;
            this.client = new Client(bucketId ? { bucketId } : undefined);
            this.initialized = true;
            console.log('✅ Replit Storage Service initialized', bucketId ? `with bucket: ${bucketId}` : 'with default bucket');
        }
    }

    /**
     * Upload a file from local filesystem to Replit Storage
     * @param localPath - Path to file on local filesystem
     * @param storagePath - Destination path in storage bucket
     * @returns Success status
     */
    async uploadFile(localPath: string, storagePath: string): Promise<boolean> {
        try {
            console.log(`📤 Uploading file from ${localPath} to ${storagePath}`);

            const result = await this.client.uploadFromFilename(storagePath, localPath);

            if (!result.ok) {
                console.error('Failed to upload file:', result.error);
                return false;
            }

            // Clean up temp file after successful upload
            try {
                fs.unlinkSync(localPath);
                console.log(`🗑️  Cleaned up temp file: ${localPath}`);
            } catch (cleanupError) {
                console.warn('Failed to cleanup temp file:', cleanupError);
            }

            console.log(`✅ File uploaded successfully to ${storagePath}`);
            return true;
        } catch (error) {
            console.error('Error uploading file:', error);
            return false;
        }
    }

    /**
     * Upload a file from buffer to Replit Storage
     * @param buffer - File buffer
     * @param storagePath - Destination path in storage bucket
     * @returns Success status
     */
    async uploadFromBuffer(buffer: Buffer, storagePath: string): Promise<boolean> {
        try {
            console.log(`📤 Uploading buffer to ${storagePath}`);

            const result = await this.client.uploadFromBytes(storagePath, buffer);

            if (!result.ok) {
                console.error('Failed to upload buffer:', result.error);
                return false;
            }

            console.log(`✅ Buffer uploaded successfully to ${storagePath}`);
            return true;
        } catch (error) {
            console.error('Error uploading buffer:', error);
            return false;
        }
    }

    /**
     * Download a file from Replit Storage as a buffer
     * @param storagePath - Path to file in storage bucket
     * @returns File buffer or null if failed
     */
    async downloadFile(storagePath: string): Promise<Buffer | null> {
        try {
            console.log(`📥 Downloading file from ${storagePath}`);

            const result = await this.client.downloadAsBytes(storagePath);

            if (!result.ok) {
                console.error('Failed to download file:', result.error);
                return null;
            }

            console.log(`✅ File downloaded successfully from ${storagePath}`);
            return result.value[0];
        } catch (error) {
            console.error('Error downloading file:', error);
            return null;
        }
    }

    /**
     * Delete a file from Replit Storage
     * @param storagePath - Path to file in storage bucket
     * @returns Success status
     */
    async deleteFile(storagePath: string): Promise<boolean> {
        try {
            console.log(`🗑️  Deleting file from ${storagePath}`);

            const result = await this.client.delete(storagePath);

            if (!result.ok) {
                console.error('Failed to delete file:', result.error);
                return false;
            }

            console.log(`✅ File deleted successfully from ${storagePath}`);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    /**
     * Check if a file exists in Replit Storage
     * @param storagePath - Path to file in storage bucket
     * @returns True if file exists, false otherwise
     */
    async fileExists(storagePath: string): Promise<boolean> {
        try {
            const result = await this.client.exists(storagePath);

            if (!result.ok) {
                console.error('Failed to check file existence:', result.error);
                return false;
            }

            return result.value;
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    }

    /**
     * List files in Replit Storage with optional prefix filter
     * @param prefix - Optional prefix to filter files
     * @returns Array of storage paths
     */
    async listFiles(prefix?: string): Promise<string[]> {
        try {
            console.log(`📋 Listing files${prefix ? ` with prefix: ${prefix}` : ''}`);

            const result = await this.client.list(prefix ? { prefix } : undefined);

            if (!result.ok) {
                console.error('Failed to list files:', result.error);
                return [];
            }

            return result.value.map((obj: any) => obj.name);
        } catch (error) {
            console.error('Error listing files:', error);
            return [];
        }
    }

    /**
     * Generate a storage path for a file
     * @param category - File category (e.g., 'attachment', 'artwork', 'invoice')
     * @param identifier - Order ID or other identifier
     * @param filename - Original filename
     * @returns Organized storage path
     */
    generateStoragePath(category: string, identifier: string, filename: string): string {
        // Sanitize filename to remove any path traversal attempts
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const timestamp = Date.now();
        return `${category}/${identifier}/${timestamp}-${sanitizedFilename}`;
    }
}

// Create and export singleton instance
export const replitStorage = new ReplitStorageService();
