import express from 'express';
import Certificate from '../models/Certificate.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// Get all certificates with pagination (admin only)
router.get('/certificates', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status; // Optional filter by status

    // Build query
    const query = status ? { status } : {};

    // Get total count for pagination
    const total = await Certificate.countDocuments(query);

    // Get certificates with pagination
    const certificates = await Certificate.find(query)
      .populate('userId', 'email name') // Populate user info
      .populate('verifiedBy', 'email name') // Populate admin who verified
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-filePath'); // Don't send file path in list

    res.json({
      certificates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ message: 'Error fetching certificates', error: error.message });
  }
});

// Get single certificate details (admin only)
router.get('/certificates/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('userId', 'email name')
      .populate('verifiedBy', 'email name');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.json({ certificate });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ message: 'Error fetching certificate', error: error.message });
  }
});

// Verify certificate (admin only)
router.patch('/certificates/:id/verify', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Update certificate status to verified
    certificate.status = 'verified';
    certificate.verifiedBy = req.user._id;
    certificate.verifiedAt = new Date();
    certificate.rejectionReason = undefined; // Clear rejection reason if any

    await certificate.save();

    res.json({
      message: 'Certificate verified successfully',
      certificate: {
        id: certificate._id,
        status: certificate.status,
        verifiedBy: certificate.verifiedBy,
        verifiedAt: certificate.verifiedAt,
      },
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ message: 'Error verifying certificate', error: error.message });
  }
});

// Reject certificate (admin only)
router.patch('/certificates/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;

    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Update certificate status to rejected
    certificate.status = 'rejected';
    certificate.verifiedBy = req.user._id;
    certificate.verifiedAt = new Date();
    certificate.rejectionReason = reason || 'Certificate rejected by admin';

    await certificate.save();

    res.json({
      message: 'Certificate rejected',
      certificate: {
        id: certificate._id,
        status: certificate.status,
        rejectionReason: certificate.rejectionReason,
      },
    });
  } catch (error) {
    console.error('Error rejecting certificate:', error);
    res.status(500).json({ message: 'Error rejecting certificate', error: error.message });
  }
});

// Get statistics (admin only)
router.get('/stats', async (req, res) => {
  try {
    const total = await Certificate.countDocuments();
    const pending = await Certificate.countDocuments({ status: 'pending' });
    const verified = await Certificate.countDocuments({ status: 'verified' });
    const rejected = await Certificate.countDocuments({ status: 'rejected' });

    res.json({
      stats: {
        total,
        pending,
        verified,
        rejected,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

export default router;

