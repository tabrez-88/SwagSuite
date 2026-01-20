import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define allowed file formats
const ALLOWED_FORMATS = [
  'jpg', 'jpeg', 'png', 'gif', 'webp', // Images
  'pdf', // PDF
  'ai', 'eps', 'svg', // Vector/Design files
  'xlsx', 'xls', 'csv', // Spreadsheets
  'docx', 'doc', // Documents
  'psd', // Photoshop
];

// Create storage for general file uploads
const generalStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder based on file type
    let folder = 'general';
    const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      folder = 'images';
    } else if (['pdf'].includes(ext)) {
      folder = 'documents';
    } else if (['ai', 'eps', 'svg', 'psd'].includes(ext)) {
      folder = 'design-files';
    } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
      folder = 'spreadsheets';
    } else if (['docx', 'doc'].includes(ext)) {
      folder = 'documents';
    }

    return {
      folder: `swagsuite/${folder}`,
      allowed_formats: ALLOWED_FORMATS,
      resource_type: ext === 'pdf' ? 'raw' as const : 'auto' as const,
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
    };
  },
});

// Create storage for presentation/artwork files
const presentationStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
    
    return {
      folder: 'swagsuite/presentations',
      allowed_formats: ['ai', 'eps', 'jpg', 'jpeg', 'png', 'pdf', 'psd', 'svg'],
      resource_type: 'auto' as const,
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
    };
  },
});

// Configure multer for general file uploads
export const upload = multer({
  storage: generalStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
    
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/postscript', // .ai, .eps
      'image/svg+xml',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword' // .doc
    ];

    if (allowedTypes.includes(file.mimetype) || ALLOWED_FORMATS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDF, AI, EPS, Excel, CSV, and Word files are allowed.'));
    }
  }
});

// Configure multer for presentation files
export const presentationUpload = multer({
  storage: presentationStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.ai', '.eps', '.jpeg', '.jpg', '.png', '.pdf', '.psd', '.svg'];
    const ext = ('.' + (file.originalname.split('.').pop()?.toLowerCase() || '')).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only AI, EPS, JPEG, PNG, PDF, PSD, and SVG files are allowed.'));
    }
  }
});

// Helper function to delete file from Cloudinary
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
}

// Helper function to get file URL from Cloudinary
export function getCloudinaryUrl(publicId: string, options?: any): string {
  return cloudinary.url(publicId, options);
}

// Helper function to get optimized image URL
export function getOptimizedImageUrl(publicId: string, width?: number, height?: number): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  });
}

// Helper function to generate download URL
export function getDownloadUrl(publicId: string, filename: string): string {
  return cloudinary.url(publicId, {
    flags: 'attachment',
    resource_type: 'raw',
  });
}

export { cloudinary };
