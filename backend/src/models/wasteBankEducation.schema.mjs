import mongoose from 'mongoose';

const wasteBankEducationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String, // Can contain HTML or Markdown
        required: true
    },
    imageUrl: {
        type: String,
        required: false
    },
    backgroundImageUrl: {
        type: String,
        required: false
    },
    themeColor: {
        type: String,
        required: false,
        default: 'blue' // blue, green, purple, orange, red
    },
    author: {
        type: String,
        required: false,
        default: 'Admin'
    },
    category: {
        type: String,
        enum: ['NEWS', 'TIPS', 'ANNOUNCEMENT'],
        default: 'NEWS'
    },
    status: {
        type: String,
        enum: ['PUBLISHED', 'DRAFT', 'ARCHIVED'],
        default: 'PUBLISHED'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
wasteBankEducationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('WasteBankEducation', wasteBankEducationSchema);
