import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicle extends Document {
  vehicleId: string;
  type: string;
  capacity: number;
  status: 'available' | 'assigned' | 'en-route' | 'delivering' | 'returning';
  currentLocation: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  driver: mongoose.Types.ObjectId;
  currentDelivery: mongoose.Types.ObjectId | null;
  lastUpdated: Date;
  isActive: boolean;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    vehicleId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['car', 'van', 'truck', 'motorcycle', 'bike'],
    },
    capacity: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['available', 'assigned', 'en-route', 'delivering', 'returning'],
      default: 'available',
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    currentDelivery: {
      type: Schema.Types.ObjectId,
      ref: 'Delivery',
      default: null,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location queries
VehicleSchema.index({ currentLocation: '2dsphere' });

export default mongoose.model<IVehicle>('Vehicle', VehicleSchema); 