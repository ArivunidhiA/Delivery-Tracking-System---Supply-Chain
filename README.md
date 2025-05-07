# Last-Mile Delivery Tracking System

A comprehensive solution for tracking and managing last-mile deliveries with real-time updates, route optimization, and analytics.

## Features

- Real-time vehicle tracking with GPS integration
- Delivery management and scheduling
- ETA prediction and monitoring
- Route optimization
- Analytics and reporting dashboard
- Admin dashboard
- Driver mobile app
- Customer tracking portal
- Dark theme UI with modern design
- Interactive map with vehicle markers
- Real-time vehicle movement simulation
- Delivery progress tracking
- Vehicle and delivery search functionality
- Analytics cards with key metrics

## Tech Stack

- Frontend: React.js with TypeScript
- Backend: Node.js with Express
- Database: MongoDB
- Real-time updates: Socket.IO
- Maps: Leaflet with OpenStreetMap
- Authentication: JWT
- UI Framework: Material-UI (MUI)
- Data Visualization: Custom analytics components

## Project Structure

```
last-mile-tracking/
├── client/                 # Frontend React application
├── server/                 # Backend Node.js application
├── mobile/                 # Driver mobile application
└── docs/                   # Documentation
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. Set up environment variables:
   - Create `.env` files in both client and server directories
   - Add necessary API keys and configuration

4. Seed the demo data:
   ```bash
   # From the server directory
   npx ts-node src/scripts/seedDemoData.ts
   ```

5. Start the development servers:
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start frontend server
   cd ../client
   npm start
   ```

## Demo Data

The system comes with pre-seeded demo data including:
- 10 drivers with different profiles
- 10 vehicles (mix of vans, trucks, and bikes)
- 20 deliveries with random assignments
- Realistic locations in the NYC area
- Various delivery statuses and priorities

## Features in Detail

### Dashboard
- Dark theme with modern UI components
- Interactive map showing vehicle locations
- Real-time vehicle movement simulation
- Vehicle and delivery search functionality
- Analytics cards showing key metrics
- Tabbed sidebar for vehicles, deliveries, and analytics

### Vehicle Tracking
- Real-time location updates
- Vehicle status monitoring
- Driver assignment tracking
- Current delivery information
- Vehicle type indicators

### Delivery Management
- Delivery status tracking
- Priority levels
- Progress indicators
- Pickup and dropoff locations
- Customer information

## API Documentation

API documentation is available at `/api/docs` when running the server.

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 