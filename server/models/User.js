import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name must be under 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Soft delete — queries automatically exclude deleted accounts so a deleted
// user can no longer log in or be returned by any lookup.
function excludeSoftDeleted() {
  this.where({ isDeleted: false });
}

userSchema.pre('find', excludeSoftDeleted);
userSchema.pre('findOne', excludeSoftDeleted);
userSchema.pre('findOneAndUpdate', excludeSoftDeleted);
userSchema.pre('countDocuments', excludeSoftDeleted);

// Uniqueness applies only to live accounts: a soft-deleted account's email
// can be reused when a new account is registered. Live accounts (isDeleted:
// false) must still have unique emails, so the unique index is partial.
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    isDemo: this.isDemo,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
