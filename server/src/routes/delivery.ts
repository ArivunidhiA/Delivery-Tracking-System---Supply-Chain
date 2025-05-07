import express, { Request, Response } from 'express';
import { auth, checkRole } from '../middleware/auth';
import Delivery from '../models/Delivery';
import Vehicle from '../models/Vehicle';

const router = express.Router();

interface AuthRequest extends Request {
  user?: any;
  app: any;
}

// Create new delivery
router.post('/', auth, checkRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const delivery = new Delivery(req.body);
    await delivery.save();

    // Emit new delivery through Socket.IO
    req.app.get('io').emit('newDelivery', delivery);

    res.status(201).json(delivery);
  } catch (error) {
    res.status(400).json({ message: 'Error creating delivery' });
  }
});

// Get all deliveries
router.get('/', async (req: Request, res: Response) => {
  try {
    const query: any = {};
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    const deliveries = await Delivery.find(query)
      .populate('assignedVehicle', 'vehicleId type')
      .populate('assignedDriver', 'firstName lastName phone');
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching deliveries' });
  }
});

// Get delivery by ID
router.get('/:id', auth, checkRole(['admin', 'driver', 'customer']), async (req: AuthRequest, res: Response) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('assignedVehicle', 'vehicleId type')
      .populate('assignedDriver', 'firstName lastName phone');
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Check if user has permission to view this delivery
    if (req.user.role === 'driver' && delivery.assignedDriver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this delivery' });
    }
    
    res.json(delivery);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching delivery' });
  }
});

// Update delivery status
router.patch('/:id/status', auth, checkRole(['admin', 'driver']), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'picked-up', 'in-transit', 'delivered', 'failed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const delivery = await Delivery.findById(req.params.id);
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Check if user has permission to update this delivery
    if (req.user.role === 'driver' && delivery.assignedDriver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this delivery' });
    }

    delivery.status = status;
    
    // Update timestamps based on status
    if (status === 'picked-up') {
      delivery.actualPickupTime = new Date();
    } else if (status === 'delivered') {
      delivery.actualDeliveryTime = new Date();
    }
    
    await delivery.save();

    // Update vehicle status if needed
    if (status === 'delivered' || status === 'failed') {
      const vehicle = await Vehicle.findById(delivery.assignedVehicle);
      if (vehicle) {
        vehicle.status = 'available';
        vehicle.currentDelivery = null;
        await vehicle.save();
      }
    }

    // Emit status update through Socket.IO
    req.app.get('io').emit('deliveryStatusUpdate', {
      deliveryId: delivery._id,
      status: delivery.status,
      timestamp: new Date(),
    });

    res.json(delivery);
  } catch (error) {
    res.status(500).json({ message: 'Error updating delivery status' });
  }
});

// Add proof of delivery
router.post('/:id/proof', auth, checkRole(['driver']), async (req: AuthRequest, res: Response) => {
  try {
    const { photo, signature } = req.body;
    
    const delivery = await Delivery.findById(req.params.id);
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Check if the delivery is assigned to the requesting driver
    if (delivery.assignedDriver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this delivery' });
    }

    delivery.proofOfDelivery = {
      photo,
      signature,
      timestamp: new Date(),
    };
    
    await delivery.save();

    // Emit proof of delivery through Socket.IO
    req.app.get('io').emit('proofOfDelivery', {
      deliveryId: delivery._id,
      proof: delivery.proofOfDelivery,
    });

    res.json(delivery);
  } catch (error) {
    res.status(500).json({ message: 'Error adding proof of delivery' });
  }
});

export default router; 