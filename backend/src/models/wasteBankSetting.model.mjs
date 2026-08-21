import mongoose from 'mongoose';

const wasteBankSettingSchema = new mongoose.Schema({
    settingKey: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    description: {
        type: String,
    },
    updatedBy: {
        type: String,
    },
}, {
    timestamps: true,
    collection: 'waste_bank_settings',
});

// Index
wasteBankSettingSchema.index({ settingKey: 1 });

// Static method untuk get setting
wasteBankSettingSchema.statics.getSetting = async function (key) {
    const setting = await this.findOne({ settingKey: key.toUpperCase() });
    return setting ? setting.value : null;
};

// Static method untuk set setting
wasteBankSettingSchema.statics.setSetting = async function (key, value, updatedBy) {
    const result = await this.findOneAndUpdate(
        { settingKey: key.toUpperCase() },
        {
            value,
            updatedBy,
            updatedAt: new Date(),
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        }
    );
    return result;
};

export default mongoose.model('WasteBankSetting', wasteBankSettingSchema);
