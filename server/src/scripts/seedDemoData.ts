import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
dotenv.config({ path: '../.env' });

import User from '../models/User';
import Vehicle from '../models/Vehicle';
import Delivery from '../models/Delivery';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/supply-chain';

const randomCoords = () => {
  // NYC area
  const lat = 40.7 + Math.random() * 0.1;
  const lng = -74.0 + Math.random() * 0.1;
  return [lng, lat];
};

const statuses = ['available', 'assigned', 'en-route', 'delivering', 'returning'];
const priorities = ['normal', 'high', 'urgent'];
const deliveryStatuses = ['pending', 'assigned', 'picked-up', 'delivering', 'delivered', 'failed'];

async function seedDemoData() {
  await mongoose.connect(MONGODB_URI);
  await User.deleteMany({});
  await Vehicle.deleteMany({});
  await Delivery.deleteMany({});

  // Create more drivers
  const driverPw = await bcrypt.hash('driver123', 10);
  const drivers = await User.insertMany([
    { firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', phone: '1111111111', password: driverPw, role: 'driver' },
    { firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com', phone: '2222222222', password: driverPw, role: 'driver' },
    { firstName: 'Carol', lastName: 'Lee', email: 'carol@example.com', phone: '3333333333', password: driverPw, role: 'driver' },
    { firstName: 'David', lastName: 'Kim', email: 'david@example.com', phone: '4444444444', password: driverPw, role: 'driver' },
    { firstName: 'Eva', lastName: 'Brown', email: 'eva@example.com', phone: '5555555555', password: driverPw, role: 'driver' },
    { firstName: 'Frank', lastName: 'Wong', email: 'frank@example.com', phone: '6666666666', password: driverPw, role: 'driver' },
    { firstName: 'Grace', lastName: 'Patel', email: 'grace@example.com', phone: '7777777777', password: driverPw, role: 'driver' },
    { firstName: 'Hank', lastName: 'Nguyen', email: 'hank@example.com', phone: '8888888888', password: driverPw, role: 'driver' },
    { firstName: 'Ivy', lastName: 'Garcia', email: 'ivy@example.com', phone: '9999999999', password: driverPw, role: 'driver' },
    { firstName: 'Jack', lastName: 'Wilson', email: 'jack@example.com', phone: '1010101010', password: driverPw, role: 'driver' },
  ]);

  // Create 10 vehicles
  const vehicleTypes = ['van', 'truck', 'bike'];
  const vehicleStatus = ['available', 'en-route', 'delivering', 'returning'];
  const vehicles = await Vehicle.insertMany(
    Array.from({ length: 10 }).map((_, i) => {
      const type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
      const status = vehicleStatus[Math.floor(Math.random() * vehicleStatus.length)];
      const driver = drivers[i % drivers.length]._id;
      return {
        vehicleId: `VEH-${100 + i}`,
        type,
        capacity: type === 'truck' ? 200 : type === 'van' ? 100 : 20,
        status,
        currentLocation: { type: 'Point', coordinates: randomCoords() },
        driver,
        lastUpdated: new Date(),
        isActive: true,
      };
    })
  );

  // Create 20 deliveries
  const deliveryStatus = ['pending', 'picked-up', 'in-transit', 'delivered', 'failed'];
  const deliveryPriority = ['low', 'medium', 'high', 'urgent'];
  const deliveries = await Delivery.insertMany(
    Array.from({ length: 20 }).map((_, i) => {
      const assignedVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
      const assignedDriver = assignedVehicle.driver;
      const status = deliveryStatus[Math.floor(Math.random() * deliveryStatus.length)];
      const priority = deliveryPriority[Math.floor(Math.random() * deliveryPriority.length)];
      return {
        trackingNumber: `DEL-${2000 + i}`,
        status,
        priority,
        pickupLocation: { address: faker.location.streetAddress(), coordinates: randomCoords() },
        dropoffLocation: { address: faker.location.streetAddress(), coordinates: randomCoords() },
        customer: { 
          name: faker.person.fullName(), 
          phone: faker.phone.number(), 
          email: faker.internet.email(), 
          address: faker.location.streetAddress() 
        },
        assignedVehicle: assignedVehicle._id,
        assignedDriver,
        estimatedPickupTime: new Date(Date.now() + Math.random() * 2 * 60 * 60 * 1000),
        estimatedDeliveryTime: new Date(Date.now() + (2 + Math.random() * 2) * 60 * 60 * 1000),
        notes: '',
      };
    })
  );

  // Assign currentDelivery to some vehicles
  await Promise.all(
    vehicles.map((v, idx) => {
      const delivery = deliveries.find(d => String(d.assignedVehicle) === String(v._id) && ['in-transit', 'picked-up', 'delivering'].includes(d.status));
      return Vehicle.findByIdAndUpdate(v._id, { currentDelivery: delivery ? delivery._id : null });
    })
  );

  console.log('Seeded demo data!');
  process.exit(0);
}

seedDemoData().catch((err) => {
  console.error(err);
  process.exit(1);
}); 