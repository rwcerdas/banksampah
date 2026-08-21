import mongoose from 'mongoose';

const auditTrailSchema = new mongoose.Schema(
  {
    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    username: { 
      type: String, 
      required: true 
    },
    user_role: { 
      type: String, 
      required: true 
    },
    action: { 
      type: String, 
      required: true 
    },
    resource: { 
      type: String, 
      required: true 
    },
    resource_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: false 
    },
    description: { 
      type: String, 
      required: true 
    },
    ip_address: { 
      type: String, 
      required: false 
    },
    user_agent: { 
      type: String, 
      required: false 
    },
    metadata: { 
      type: mongoose.Schema.Types.Mixed, 
      required: false 
    },
    status: { 
      type: String, 
      enum: ['success', 'failed', 'warning'], 
      default: 'success' 
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  },
  { 
    collection: 'audit_trails',
    timestamps: true 
  }
);

// Indexes untuk performa query
auditTrailSchema.index({ user_id: 1, timestamp: -1 });
auditTrailSchema.index({ action: 1, timestamp: -1 });
auditTrailSchema.index({ resource: 1, timestamp: -1 });
auditTrailSchema.index({ timestamp: -1 });
auditTrailSchema.index({ user_role: 1, timestamp: -1 });

// Debug: Log when model is accessed
const AuditTrail = mongoose.model('AuditTrail', auditTrailSchema);

// Temporarily disable pre-save hook to isolate crash
// auditTrailSchema.pre('save', function(next) {
//   console.log('🔍 [DEBUG] AuditTrail pre-save hook:', {
//     _id: this._id,
//     username: this.username,
//     action: this.action,
//     resource: this.resource,
//     description: this.description,
//     timestamp: this.timestamp
//   });
//   next();
// });

export default AuditTrail;
