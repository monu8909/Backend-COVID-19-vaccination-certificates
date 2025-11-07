import express from 'express';
import Certificate from '../models/Certificate.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import path from 'path';

const router = express.Router();

// Upload certificate (protected route - requires authentication)
router.post('/upload', authenticate, upload.single('certificate'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Determine file type
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const fileType = fileExt === '.pdf' ? 'pdf' : 'image';

    // Create certificate record in database
    const certificate = new Certificate({
      userId: req.user._id,
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileType: fileType,
      status: 'pending', // Default status is pending review
    });

    await certificate.save();

    res.status(201).json({
      message: 'Certificate uploaded successfully',
      certificate: {
        id: certificate._id,
        fileName: certificate.fileName,
        fileType: certificate.fileType,
        status: certificate.status,
        uploadedAt: certificate.createdAt,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading certificate', error: error.message });
  }
});

// Get user's own certificates (protected route)
router.get('/my-certificates', authenticate, async (req, res) => {
  try {
    const certificates = await Certificate.find({ userId: req.user._id })
      .sort({ createdAt: -1 }) // Sort by newest first
      .select('-filePath'); // Don't send file path in response

    // Calculate and update reward points based on verified certificates
    const verifiedCount = certificates.filter((cert) => cert.status === 'verified').length;
    const expectedPoints = verifiedCount * 100;
    
    // Update user's reward points if they don't match
    const user = await User.findById(req.user._id);
    if (user) {
      // Ensure rewardPoints field exists
      if (user.rewardPoints === undefined || user.rewardPoints === null) {
        user.rewardPoints = 0;
      }
      
      const currentPoints = user.rewardPoints || 0;
      if (currentPoints !== expectedPoints) {
        user.rewardPoints = expectedPoints;
        await user.save();
      }
    }

    res.json({
      certificates,
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ message: 'Error fetching certificates', error: error.message });
  }
});

// Get certificate file (protected route - user can only access their own)
router.get('/:id/file', authenticate, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Check if user owns this certificate or is admin
    if (certificate.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Send file
    res.sendFile(path.resolve(certificate.filePath));
  } catch (error) {
    console.error('Error fetching certificate file:', error);
    res.status(500).json({ message: 'Error fetching certificate file', error: error.message });
  }
});

export default router;

