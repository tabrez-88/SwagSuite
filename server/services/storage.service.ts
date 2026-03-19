import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

/**
 * Storage Service for managing file uploads and downloads via Cloudinary.
 * Handles file storage with organized paths and automatic cleanup.
 */
class StorageService {
    /**
     * Upload a file from local filesystem to Cloudinary
     */
    async uploadFile(localPath: string, storagePath: string): Promise<boolean> {
        try {
            console.log(`Uploading file from ${localPath} to ${storagePath}`);

            const result = await cloudinary.uploader.upload(localPath, {
                folder: 'attachments',
                public_id: storagePath.replace(/\//g, '_'),
                resource_type: 'auto'
            });

            try {
                fs.unlinkSync(localPath);
            } catch (cleanupError) {
                console.warn('Failed to cleanup temp file:', cleanupError);
            }

            console.log(`File uploaded to Cloudinary: ${result.secure_url}`);
            return true;
        } catch (error) {
            console.error('Error uploading file:', error);
            return false;
        }
    }

    /**
     * Upload a file from buffer to Cloudinary
     */
    async uploadFromBuffer(buffer: Buffer, storagePath: string): Promise<boolean> {
        try {
            console.log(`Uploading buffer to ${storagePath}`);

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
                            console.log(`Buffer uploaded to Cloudinary: ${result?.secure_url}`);
                            resolve(true);
                        }
                    }
                );
                uploadStream.end(buffer);
            });
        } catch (error) {
            console.error('Error uploading buffer:', error);
            return false;
        }
    }

    /**
     * Download a file from Cloudinary as a buffer
     */
    async downloadFile(storagePath: string): Promise<Buffer | null> {
        try {
            console.log(`Downloading file from ${storagePath}`);

            const publicId = `attachments/${storagePath.replace(/\//g, '_')}`;
            const resourceType = storagePath.match(/\.(pdf|doc|docx|xls|xlsx)$/i) ? 'raw' : 'image';
            const url = cloudinary.url(publicId, { resource_type: resourceType });

            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            console.log(`File downloaded successfully from Cloudinary`);
            return buffer;
        } catch (error) {
            console.error('Error downloading file:', error);
            return null;
        }
    }

    /**
     * Delete a file from Cloudinary
     */
    async deleteFile(storagePath: string): Promise<boolean> {
        try {
            console.log(`Deleting file from ${storagePath}`);

            const publicId = `attachments/${storagePath.replace(/\//g, '_')}`;
            const resourceType = storagePath.match(/\.(pdf|doc|docx|xls|xlsx)$/i) ? 'raw' : 'image';

            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
            console.log(`File deleted from Cloudinary`);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    /**
     * Check if a file exists in Cloudinary
     */
    async fileExists(storagePath: string): Promise<boolean> {
        try {
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
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    }

    /**
     * List files in Cloudinary with optional prefix filter
     */
    async listFiles(prefix?: string): Promise<string[]> {
        try {
            console.log(`Listing files${prefix ? ` with prefix: ${prefix}` : ''}`);

            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: prefix ? `attachments/${prefix}` : 'attachments',
                max_results: 500
            });

            return result.resources.map((r: any) =>
                r.public_id.replace('attachments/', '').replace(/_/g, '/')
            );
        } catch (error) {
            console.error('Error listing files:', error);
            return [];
        }
    }

    /**
     * Generate a storage path for a file
     */
    generateStoragePath(category: string, identifier: string, filename: string): string {
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const timestamp = Date.now();
        return `${category}/${identifier}/${timestamp}-${sanitizedFilename}`;
    }
}

// Create and export singleton instance
export const storageService = new StorageService();
