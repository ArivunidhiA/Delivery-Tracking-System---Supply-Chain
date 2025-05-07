export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'driver' | 'customer';
  phone: string;
}

export interface Vehicle {
  id: string;
  vehicleId: string;
  type: 'car' | 'van' | 'truck' | 'motorcycle';
  capacity: number;
  status: 'available' | 'assigned' | 'en-route' | 'delivering' | 'returning';
  currentLocation: {
    type: 'Point';
    coordinates: [number, number];
  };
  driver: User;
  currentDelivery: Delivery | null;
  lastUpdated: Date;
}

export interface Delivery {
  id: string;
  trackingNumber: string;
  status: 'pending' | 'picked-up' | 'in-transit' | 'delivered' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  pickupLocation: {
    address: string;
    coordinates: [number, number];
  };
  dropoffLocation: {
    address: string;
    coordinates: [number, number];
  };
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  assignedVehicle: Vehicle;
  assignedDriver: User;
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

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
} 