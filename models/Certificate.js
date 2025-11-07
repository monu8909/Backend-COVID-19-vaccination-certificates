import mongoose from 'mongoose';

// Certificate schema definition
const certificateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to User model
      required: [true, 'User ID is required'],
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    fileType: {
      type: String,
      enum: ['pdf', 'image'],
      required: [true, 'File type is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending', // Default status is pending review
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin who verified the certificate
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Populate user information when querying
certificateSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'userId',
    select: 'email name', // Only select email and name fields
  });
  next();
});

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;

