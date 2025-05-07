import express, { Request, Response, NextFunction } from 'express';
import { auth, checkRole } from '../middleware/auth';
import Vehicle from '../models/Vehicle';

const router = express.Router();

interface AuthRequest extends Request {
  user?: any;
  app: any;
}

// Get all vehicles
router.get('/', async (req: Request, res: Response) => {
  try {
    const vehicles = await Vehicle.find({ isActive: true })
      .populate('driver', 'firstName lastName phone')
      .populate('currentDelivery', 'trackingNumber status');
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicles' });
  }
});

// Get vehicle by ID
router.get('/:id', auth, checkRole(['admin', 'driver']), async (req: AuthRequest, res: Response) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('driver', 'firstName lastName phone')
      .populate('currentDelivery', 'trackingNumber status');
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicle' });
  }
});

// Update vehicle location
router.patch('/:id/location', auth, checkRole(['driver']), async (req: AuthRequest, res: Response) => {
  try {
    const { coordinates } = req.body;
    
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Check if the vehicle is assigned to the requesting driver
    if (vehicle.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this vehicle' });
    }

    vehicle.currentLocation = {
      type: 'Point',
      coordinates: coordinates as [number, number],
    };
    vehicle.lastUpdated = new Date();
    
    await vehicle.save();
    
    // Emit location update through Socket.IO
    req.app.get('io').emit('vehicleLocationUpdate', {
      vehicleId: vehicle._id,
      location: vehicle.currentLocation,
      timestamp: vehicle.lastUpdated,
    });

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Error updating vehicle location' });
  }
});

// Update vehicle status
router.patch('/:id/status', auth, checkRole(['admin', 'driver']), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    
    if (!['available', 'assigned', 'en-route', 'delivering', 'returning'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Only allow drivers to update their assigned vehicles
    if (req.user.role === 'driver' && vehicle.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this vehicle' });
    }

    vehicle.status = status;
    vehicle.lastUpdated = new Date();
    
    await vehicle.save();
    
    // Emit status update through Socket.IO
    req.app.get('io').emit('vehicleStatusUpdate', {
      vehicleId: vehicle._id,
      status: vehicle.status,
      timestamp: vehicle.lastUpdated,
    });

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Error updating vehicle status' });
  }
});

export default router; 