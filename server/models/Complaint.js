const mongoose = require('mongoose');

const timelineItemSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: [
      'CREATED',
      'STATUS_CHANGED',
      'IN_PROGRESS',
      'ACTION_SUBMITTED',
      'REJECTED',
      'CLOSED',
      'COMMENT_ADDED',
    ],
    required: true,
  },
  performedBy: {
    name: { type: String, required: true },
    role: { type: String, required: true },
    employeeId: { type: String, required: true },
  },
  notes: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Defect category is required'],
      enum: [
        'Stitching Fault',
        'Fabric Defect',
        'Oil / Stain',
        'Measurement / Fit',
        'Trims / Accessories',
        'Finishing / Pressing',
        'Other Defect',
      ],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Specific machine or line location is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    description: {
      type: String,
      required: [true, 'Defect description is required'],
      trim: true,
    },
    beforePhoto: {
      type: String,
      required: [true, 'Before Photo proof is mandatory for audit complaints'],
    },
    afterPhoto: {
      type: String,
      default: null,
    },
    assignedTo: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      employeeId: { type: String, required: true },
      name: { type: String, required: true },
      department: { type: String, required: true },
      designation: { type: String, required: true },
      mobileNumber: { type: String, required: true },
    },
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      employeeId: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    deadlineHours: {
      type: Number,
      required: [true, 'Resolution SLA deadline in hours is mandatory'],
      min: [12, 'SLA deadline must be at least 12 hours'],
      max: [24, 'SLA deadline cannot exceed 24 hours'],
    },
    deadlineTimestamp: {
      type: Date,
      required: true,
    },
    actualCompletedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: [
        'Assigned',
        'In Progress',
        'Under Verification',
        'Rejected / Sent Back',
        'Overdue',
        'Closed',
      ],
      default: 'Assigned',
      index: true,
    },
    actionNotes: {
      type: String,
      default: '',
    },
    feedbackRemarks: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    timeline: [timelineItemSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property: dynamic calculation whether currently overdue
complaintSchema.virtual('isCurrentlyOverdue').get(function () {
  if (this.status === 'Closed') return false;
  return new Date() > this.deadlineTimestamp;
});

// Pre-save hook: auto-generate complaintId (CMP-XXXXX) if not present and compute SLA deadlineTimestamp
complaintSchema.pre('save', async function (next) {
  // Generate CMP-XXXXX if new
  if (this.isNew && !this.complaintId) {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    this.complaintId = `CMP-${randomSuffix}`;
  }

  // Calculate deadlineTimestamp based on creation time + deadlineHours
  if (this.isNew || this.isModified('deadlineHours')) {
    const baseTime = this.createdAt || new Date();
    const durationMs = this.deadlineHours * 60 * 60 * 1000;
    this.deadlineTimestamp = new Date(baseTime.getTime() + durationMs);
  }

  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
