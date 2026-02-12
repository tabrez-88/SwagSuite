import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
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

// Create storage for generated documents (quotes, POs)
const generatedDocsStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'swagsuite/generated-documents',
      allowed_formats: ['pdf'],
      resource_type: 'raw' as const,
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
    };
  },
});

// Configure multer for generated documents
export const generatedDocsUpload = multer({
  storage: generatedDocsStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'));
    }
  }
});

// Create storage for user avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'swagsuite/avatars',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      resource_type: 'image' as const,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' }
      ],
      public_id: `user-${(req.user as any)?.claims?.sub || Date.now()}`,
    };
  },
});

// Configure multer for avatar uploads
export const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  }
});

// Create storage for system logo
const logoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'swagsuite/branding',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
      resource_type: 'image' as const,
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto' }
      ],
      public_id: `system-logo-${Date.now()}`,
    };
  },
});

// Configure multer for logo uploads
export const logoUpload = multer({
  storage: logoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG images are allowed.'));
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

// Helper function to generate inline preview URL (for viewing PDFs in browser)
export function getPreviewUrl(publicId: string): string {
  // For raw resources (PDFs), we need to explicitly add the extension
  // and ensure the URL is formatted correctly for inline display
  const pdfPublicId = publicId.endsWith('.pdf') ? publicId : `${publicId}.pdf`;

  return cloudinary.url(pdfPublicId, {
    resource_type: 'raw',
    type: 'upload',
    secure: true,
    // Don't include attachment flag to allow inline display
  });
}

export { cloudinary };
