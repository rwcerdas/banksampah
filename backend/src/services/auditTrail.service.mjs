import AuditTrail from '../models/auditTrail.model.mjs';

class AuditTrailService {
  static async logActivity({
    user_id,
    username,
    user_role,
    action,
    resource,
    resource_id = null,
    description,
    ip_address = null,
    user_agent = null,
    metadata = {},
    status = 'success'
  }) {
    try {
      console.log('🔍 [AUDIT] Starting audit log for:', action, resource);
      
      // Skip audit logging if user_id is not provided (required field)
      if (!user_id) {
        console.log('🔍 [AUDIT] Skipping audit log - user_id is required but not provided');
        return null;
      }
      
      // Ensure all required fields have values
      const auditData = {
        user_id: user_id, // Must be provided and valid
        username: username || 'unknown',
        user_role: user_role || 'unknown',
        action: action || 'UNKNOWN',
        resource: resource || 'Unknown',
        resource_id: resource_id || null,
        description: description || 'No description provided',
        ip_address: ip_address || null,
        user_agent: user_agent || null,
        metadata: metadata || {},
        status: status || 'success',
        timestamp: new Date()
      };

      console.log('🔍 [AUDIT] Creating audit document...');
      const auditLog = new AuditTrail(auditData);
      
      console.log('🔍 [AUDIT] Saving to database...');
      const result = await auditLog.save();
      
      console.log('✅ [AUDIT] Audit log saved successfully:', result._id);
      return result;
      
    } catch (error) {
      console.error('❌ [AUDIT] Failed to save audit log:', error.message);
      // Don't crash the app, just return null
      return null;
    }
  }

  static async getAuditTrail({
    page = 1,
    limit = 50,
    user_id = null,
    action = null,
    resource = null,
    user_role = null,
    start_date = null,
    end_date = null,
    status = null
  }) {
    try {
      console.log('🔍 [DEBUG] getAuditTrail called with params:', {
        page, limit, user_id, action, resource, user_role, start_date, end_date, status
      });

      const query = {};
      
      if (user_id) query.user_id = user_id;
      if (action) query.action = action;
      if (resource) query.resource = resource;
      if (user_role) query.user_role = user_role;
      if (status) query.status = status;
      
      if (start_date || end_date) {
        query.timestamp = {};
        if (start_date) {
          query.timestamp.$gte = new Date(start_date);
          console.log('🔍 [DEBUG] Start date set to:', query.timestamp.$gte);
        }
        if (end_date) {
          // Add 23:59:59.999 to end_date to include full day
          const endDate = new Date(end_date);
          endDate.setHours(23, 59, 59, 999);
          query.timestamp.$lte = endDate;
          console.log('🔍 [DEBUG] End date set to:', query.timestamp.$lte);
        }
      }

      console.log('🔍 [DEBUG] Built query:', query);

      const skip = (page - 1) * limit;
      
      console.log('🔍 [DEBUG] Executing AuditTrail.find...');
      const [logs, total] = await Promise.all([
        AuditTrail.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .populate('user_id', 'username nama_lengkap')
          .lean(),
        AuditTrail.countDocuments(query)
      ]);

      console.log('🔍 [DEBUG] Query result:', {
        logsCount: logs.length,
        total,
        firstLog: logs[0] ? {
          username: logs[0].username,
          action: logs[0].action,
          resource: logs[0].resource,
          timestamp: logs[0].timestamp
        } : null
      });

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Failed to get audit trail:', error);
      throw error;
    }
  }

  static async getAuditStatistics({
    start_date = null,
    end_date = null
  }) {
    try {
      const matchStage = {};
      if (start_date || end_date) {
        matchStage.timestamp = {};
        if (start_date) matchStage.timestamp.$gte = new Date(start_date);
        if (end_date) matchStage.timestamp.$lte = new Date(end_date);
      }

      const statistics = await AuditTrail.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalActions: { $sum: 1 },
            successActions: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
            },
            failedActions: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            uniqueUsers: { $addToSet: '$user_id' },
            actionCounts: {
              $push: {
                action: '$action',
                count: 1
              }
            },
            resourceCounts: {
              $push: {
                resource: '$resource',
                count: 1
              }
            }
          }
        },
        {
          $project: {
            totalActions: 1,
            successActions: 1,
            failedActions: 1,
            uniqueUsersCount: { $size: '$uniqueUsers' },
            actionCounts: 1,
            resourceCounts: 1
          }
        }
      ]);

      const result = statistics[0] || {
        totalActions: 0,
        successActions: 0,
        failedActions: 0,
        uniqueUsersCount: 0,
        actionCounts: [],
        resourceCounts: []
      };

      // Group action counts
      const actionStats = result.actionCounts.reduce((acc, item) => {
        acc[item.action] = (acc[item.action] || 0) + 1;
        return acc;
      }, {});

      const resourceStats = result.resourceCounts.reduce((acc, item) => {
        acc[item.resource] = (acc[item.resource] || 0) + 1;
        return acc;
      }, {});

      return {
        ...result,
        actionStats,
        resourceStats
      };
    } catch (error) {
      console.error('Failed to get audit statistics:', error);
      throw error;
    }
  }
}

export default AuditTrailService;
