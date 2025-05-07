import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Vehicle from '../models/Vehicle';
import Delivery from '../models/Delivery';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/last-mile-tracking');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Delivery.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const admin = await User.create({
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      phone: '1234567890',
      role: 'admin',
    });
    console.log('Created admin user');

    // Create driver user
    const driver = await User.create({
      email: 'driver@example.com',
      password: 'driver123',
      firstName: 'John',
      lastName: 'Driver',
      phone: '2345678901',
      role: 'driver',
    });
    console.log('Created driver user');

    // Create customer user
    const customer = await User.create({
      email: 'customer@example.com',
      password: 'customer123',
      firstName: 'Jane',
      lastName: 'Customer',
      phone: '3456789012',
      role: 'customer',
    });
    console.log('Created customer user');

    // Create vehicles
    const vehicles = await Vehicle.create([
      {
        vehicleId: 'V001',
        type: 'van',
        capacity: 1000,
        status: 'available',
        currentLocation: {
          type: 'Point',
          coordinates: [-73.935242, 40.730610], // New York City coordinates
        },
        driver: driver._id,
        lastUpdated: new Date(),
      },
      {
        vehicleId: 'V002',
        type: 'truck',
        capacity: 2000,
        status: 'available',
        currentLocation: {
          type: 'Point',
          coordinates: [-74.006015, 40.712776], // New York City coordinates
        },
        driver: driver._id,
        lastUpdated: new Date(),
      },
    ]);
    console.log('Created vehicles');

    // Create deliveries
    const deliveries = await Delivery.create([
      {
        trackingNumber: 'DEL001',
        status: 'pending',
        priority: 'high',
        pickupLocation: {
          address: '123 Pickup St, New York, NY',
          coordinates: [-73.935242, 40.730610],
        },
        dropoffLocation: {
          address: '456 Delivery Ave, New York, NY',
          coordinates: [-74.006015, 40.712776],
        },
        customer: {
          name: 'Jane Customer',
          phone: '3456789012',
          email: 'customer@example.com',
        },
        assignedVehicle: vehicles[0]._id,
        assignedDriver: driver._id,
        estimatedPickupTime: new Date(Date.now() + 3600000), // 1 hour from now
        estimatedDeliveryTime: new Date(Date.now() + 7200000), // 2 hours from now
      },
      {
        trackingNumber: 'DEL002',
        status: 'in-transit',
        priority: 'medium',
        pickupLocation: {
          address: '789 Pickup Blvd, New York, NY',
          coordinates: [-73.985242, 40.750610],
        },
        dropoffLocation: {
          address: '012 Delivery St, New York, NY',
          coordinates: [-74.016015, 40.722776],
        },
        customer: {
          name: 'John Customer',
          phone: '4567890123',
          email: 'john@example.com',
        },
        assignedVehicle: vehicles[1]._id,
        assignedDriver: driver._id,
        estimatedPickupTime: new Date(Date.now() - 3600000), // 1 hour ago
        estimatedDeliveryTime: new Date(Date.now() + 3600000), // 1 hour from now
        actualPickupTime: new Date(Date.now() - 3600000),
      },
    ]);
    console.log('Created deliveries');

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase(); 