import mongoose, { Document, Schema } from 'mongoose';

export interface IDelivery extends Document {
  trackingNumber: string;
  status: 'pending' | 'picked-up' | 'in-transit' | 'delivered' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  pickupLocation: {
    address: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  dropoffLocation: {
    address: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  assignedVehicle: mongoose.Types.ObjectId;
  assignedDriver: mongoose.Types.ObjectId;
  estimatedPickupTime: Date;
  estimatedDeliveryTime: Date;
  actualPickupTime: Date | null;
  actualDeliveryTime: Date | null;
  notes: string;
  proofOfDelivery: {
    photo: string;
    signature: string;
    timestamp: Date;
  } | null;
}

const DeliverySchema = new Schema<IDelivery>(
  {
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'picked-up', 'in-transit', 'delivered', 'failed'],
      default: 'pending',
    },
    priority: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    pickupLocation: {
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    dropoffLocation: {
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    customer: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
    assignedVehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    assignedDriver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    estimatedPickupTime: {
      type: Date,
      required: true,
    },
    estimatedDeliveryTime: {
      type: Date,
      required: true,
    },
    actualPickupTime: {
      type: Date,
      default: null,
    },
    actualDeliveryTime: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    proofOfDelivery: {
      photo: String,
      signature: String,
      timestamp: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial indexes for location queries
DeliverySchema.index({ 'pickupLocation.coordinates': '2dsphere' });
DeliverySchema.index({ 'dropoffLocation.coordinates': '2dsphere' });

export default mongoose.model<IDelivery>('Delivery', DeliverySchema); 