import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

/**
 * Storage Service for managing file uploads and downloads.
 * Uses Replit Object Storage in Replit environment, Cloudinary in Cloud Run/other environments.
 * Handles file storage with organized paths and automatic cleanup.
 */
class StorageService {
    private client: any;
    private initialized: boolean = false;
    private isReplit: boolean = false;
    private useCloudinary: boolean = false;

    constructor() {
        // Detect environment - only use Replit storage if REPLIT_BUCKET_ID is set
        this.isReplit = !!process.env.REPLIT_BUCKET_ID;
        
        if (!this.isReplit) {
            // Use Cloudinary for Cloud Run and other environments
            console.log('🌩️  Cloud environment detected, using Cloudinary for file storage');
            this.useCloudinary = true;
            this.initialized = true;
        } else {
            // Initialize Replit storage only if in Replit environment
            try {
                const { Client } = require('@replit/object-storage');
                const bucketId = process.env.REPLIT_BUCKET_ID;
                this.client = new Client(bucketId ? { bucketId } : undefined);
                this.initialized = true;
                console.log('✅ Replit Storage Service initialized', bucketId ? `with bucket: ${bucketId}` : 'with default bucket');
            } catch (error) {
                console.warn('⚠️  Failed to initialize Replit storage, falling back to Cloudinary:', error);
                this.useCloudinary = true;
                this.initialized = true;
            }
        }
    }

    /**
     * Initialize the storage service (called automatically in constructor)
     */
    async initialize(): Promise<void> {
        if (!this.initialized) {
            if (this.isReplit && !this.useCloudinary) {
                try {
                    const { Client } = require('@replit/object-storage');
                    const bucketId = process.env.REPLIT_BUCKET_ID;
                    this.client = new Client(bucketId ? { bucketId } : undefined);
                    console.log('✅ Replit Storage Service initialized');
                } catch (error) {
                    console.warn('⚠️  Falling back to Cloudinary');
                    this.useCloudinary = true;
                }
            }
            this.initialized = true;
        }
    }

    /**
     * Upload a file from local filesystem to storage
     * @param localPath - Path to file on local filesystem
     * @param storagePath - Destination path in storage bucket
     * @returns Success status
     */
    async uploadFile(localPath: string, storagePath: string): Promise<boolean> {
        try {
            console.log(`📤 Uploading file from ${localPath} to ${storagePath}`);

            if (this.useCloudinary) {
                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(localPath, {
                    folder: 'attachments',
                    public_id: storagePath.replace(/\//g, '_'),
                    resource_type: 'auto'
                });

                // Clean up temp file after successful upload
                try {
                    fs.unlinkSync(localPath);
                    console.log(`🗑️  Cleaned up temp file: ${localPath}`);
                } catch (cleanupError) {
                    console.warn('Failed to cleanup temp file:', cleanupError);
                }

                console.log(`✅ File uploaded to Cloudinary: ${result.secure_url}`);
                return true;
            } else {
                // Use Replit storage
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
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            return false;
        }
    }

    /**
     * Upload a file from buffer to storage
     * @param buffer - File buffer
     * @param storagePath - Destination path in storage bucket
     * @returns Success status
     */
    async uploadFromBuffer(buffer: Buffer, storagePath: string): Promise<boolean> {
        try {
            console.log(`📤 Uploading buffer to ${storagePath}`);

            if (this.useCloudinary) {
                // Upload buffer to Cloudinary
                return new Promise((resolve) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'attachments',
                            public_id: storagePath.replace(/\//g, '_'),
                            resource_type: 'auto'
                        },
                        (error, result) => {
                            if (error) {
                                console.error('Failed to upload buffer:', error);
                                resolve(false);
                            } else {
                                console.log(`✅ Buffer uploaded to Cloudinary: ${result?.secure_url}`);
                                resolve(true);
                            }
                        }
                    );
                    uploadStream.end(buffer);
                });
            } else {
                // Use Replit storage
                const result = await this.client.uploadFromBytes(storagePath, buffer);

                if (!result.ok) {
                    console.error('Failed to upload buffer:', result.error);
                    return false;
                }

                console.log(`✅ Buffer uploaded successfully to ${storagePath}`);
                return true;
            }
        } catch (error) {
            console.error('Error uploading buffer:', error);
            return false;
        }
    }

    /**
     * Download a file from storage as a buffer
     * @param storagePath - Path to file in storage bucket
     * @returns File buffer or null if failed
     */
    async downloadFile(storagePath: string): Promise<Buffer | null> {
        try {
            console.log(`📥 Downloading file from ${storagePath}`);

            if (this.useCloudinary) {
                // Download from Cloudinary - construct URL from storage path
                const publicId = `attachments/${storagePath.replace(/\//g, '_')}`;
                const resourceType = storagePath.match(/\.(pdf|doc|docx|xls|xlsx)$/i) ? 'raw' : 'image';
                const url = cloudinary.url(publicId, { resource_type: resourceType });
                
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data);
                
                console.log(`✅ File downloaded successfully from Cloudinary`);
                return buffer;
            } else {
                // Use Replit storage
                const result = await this.client.downloadAsBytes(storagePath);

                if (!result.ok) {
                    console.error('Failed to download file:', result.error);
                    return null;
                }

                console.log(`✅ File downloaded successfully from ${storagePath}`);
                return result.value[0];
            }
        } catch (error) {
            console.error('Error downloading file:', error);
            return null;
        }
    }

    /**
     * Delete a file from storage
     * @param storagePath - Path to file in storage bucket
     * @returns Success status
     */
    async deleteFile(storagePath: string): Promise<boolean> {
        try {
            console.log(`🗑️  Deleting file from ${storagePath}`);

            if (this.useCloudinary) {
                // Delete from Cloudinary
                const publicId = `attachments/${storagePath.replace(/\//g, '_')}`;
                const resourceType = storagePath.match(/\.(pdf|doc|docx|xls|xlsx)$/i) ? 'raw' : 'image';
                
                await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
                console.log(`✅ File deleted from Cloudinary`);
                return true;
            } else {
                // Use Replit storage
                const result = await this.client.delete(storagePath);

                if (!result.ok) {
                    console.error('Failed to delete file:', result.error);
                    return false;
                }

                console.log(`✅ File deleted successfully from ${storagePath}`);
                return true;
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    /**
     * Check if a file exists in storage
     * @param storagePath - Path to file in storage bucket
     * @returns True if file exists, false otherwise
     */
    async fileExists(storagePath: string): Promise<boolean> {
        try {
            if (this.useCloudinary) {
                // Check Cloudinary - try to get resource info
                const publicId = `attachments/${storagePath.replace(/\//g, '_')}`;
                try {
                    await cloudinary.api.resource(publicId);
                    return true;
                } catch (error: any) {
                    if (error.http_code === 404) {
                        return false;
                    }
                    throw error;
                }
            } else {
                // Use Replit storage
                const result = await this.client.exists(storagePath);

                if (!result.ok) {
                    console.error('Failed to check file existence:', result.error);
                    return false;
                }

                return result.value;
            }
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    }

    /**
     * List files in storage with optional prefix filter
     * @param prefix - Optional prefix to filter files
     * @returns Array of storage paths
     */
    async listFiles(prefix?: string): Promise<string[]> {
        try {
            console.log(`📋 Listing files${prefix ? ` with prefix: ${prefix}` : ''}`);

            if (this.useCloudinary) {
                // List from Cloudinary
                const result = await cloudinary.api.resources({
                    type: 'upload',
                    prefix: prefix ? `attachments/${prefix}` : 'attachments',
                    max_results: 500
                });
                
                return result.resources.map((r: any) => 
                    r.public_id.replace('attachments/', '').replace(/_/g, '/')
                );
            } else {
                // Use Replit storage
                const result = await this.client.list(prefix ? { prefix } : undefined);

                if (!result.ok) {
                    console.error('Failed to list files:', result.error);
                    return [];
                }

                return result.value.map((obj: any) => obj.name);
            }
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
export const replitStorage = new StorageService();
