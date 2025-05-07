import React, { useState, useEffect, useRef, ReactNode } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  TextField,
  Tabs,
  Tab,
  Fab,
  Modal,
  LinearProgress,
  useTheme,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../contexts/AuthContext';
import { vehicleApi, deliveryApi } from '../services/api';
import { Vehicle, Delivery } from '../types';
import SearchIcon from '@mui/icons-material/Search';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

const vehicleIcons: Record<string, L.Icon> = {
  van: new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854894.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
  truck: new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/743/743131.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
  bike: new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/3068/3068774.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
  default: new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854894.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] }),
};

const getVehicleIcon = (type: string) => vehicleIcons[type] || vehicleIcons.default;

const getStatusColor = (status: string) => {
  const colors: { [key: string]: string } = {
    available: 'success',
    assigned: 'info',
    'en-route': 'warning',
    delivering: 'primary',
    returning: 'secondary',
  };
  return colors[status] || 'default';
};

const getTypeIcon = (type: string) => {
  if (type === 'van') return <DirectionsCarIcon fontSize="small" sx={{ mr: 1 }} />;
  if (type === 'truck') return <LocalShippingIcon fontSize="small" sx={{ mr: 1 }} />;
  if (type === 'bike') return <TwoWheelerIcon fontSize="small" sx={{ mr: 1 }} />;
  return <DirectionsCarIcon fontSize="small" sx={{ mr: 1 }} />;
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [tab, setTab] = useState(0);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [deliverySearch, setDeliverySearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
    // Simulate live vehicle movement
    intervalRef.current = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (!v.currentLocation) return v;
          // Randomly move vehicle slightly
          const [lng, lat] = v.currentLocation.coordinates;
          return {
            ...v,
            currentLocation: {
              ...v.currentLocation,
              coordinates: [lng + (Math.random() - 0.5) * 0.001, lat + (Math.random() - 0.5) * 0.001],
            },
          };
        })
      );
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const loadData = async () => {
    try {
      const [vehiclesData, deliveriesData] = await Promise.all([
        vehicleApi.getAll(),
        deliveryApi.getAll(),
      ]);
      // Normalize vehicles
      setVehicles(
        vehiclesData.map((v: any) => ({
          ...v,
          id: v._id,
          driver: v.driver && typeof v.driver === 'object' ? v.driver : { firstName: 'Unknown', lastName: '', phone: '' },
          currentDelivery: v.currentDelivery && typeof v.currentDelivery === 'object' ? v.currentDelivery : null,
        }))
      );
      // Normalize deliveries
      setDeliveries(
        deliveriesData.map((d: any) => ({
          ...d,
          id: d._id,
          assignedVehicle: d.assignedVehicle && typeof d.assignedVehicle === 'object' ? d.assignedVehicle._id || d.assignedVehicle.id : d.assignedVehicle,
          assignedDriver: d.assignedDriver && typeof d.assignedDriver === 'object' ? d.assignedDriver._id || d.assignedDriver.id : d.assignedDriver,
        }))
      );
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  // Filtering
  const filteredVehicles = vehicles.filter(v =>
    v.vehicleId.toLowerCase().includes(vehicleSearch.toLowerCase())
  );
  const filteredDeliveries = deliveries.filter(d =>
    d.trackingNumber.toLowerCase().includes(deliverySearch.toLowerCase())
  );

  // Analytics
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status !== 'available').length;
  const totalDeliveries = deliveries.length;
  const inProgressDeliveries = deliveries.filter(d => d.status === 'in-transit' || d.status === 'picked-up').length;
  const deliveredDeliveries = deliveries.filter(d => d.status === 'delivered').length;
  const failedDeliveries = deliveries.filter(d => d.status === 'failed').length;
  const vehicleUtilization = totalVehicles ? Math.round((activeVehicles / totalVehicles) * 100) : 0;
  const deliveryCompletion = totalDeliveries ? Math.round((deliveredDeliveries / totalDeliveries) * 100) : 0;

  // Map tile for minimal look
  const minimalTile = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  // Sidebar tab content
  const renderSidebar = () => {
    if (tab === 0) {
      // Vehicles
      return (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <SearchIcon sx={{ mr: 1 }} />
            <TextField
              variant="standard"
              placeholder="Search vehicles..."
              value={vehicleSearch}
              onChange={e => setVehicleSearch(e.target.value)}
              fullWidth
              sx={{ input: { color: '#fff' } }}
            />
          </Box>
          <List>
            {filteredVehicles.map((vehicle) => (
              <ListItem key={vehicle.id} disablePadding sx={{ bgcolor: selectedVehicle?.id === vehicle.id ? 'rgba(25, 118, 210, 0.15)' : 'transparent', borderRadius: 2, mb: 1, transition: 'background 0.2s' }}>
                <ListItemButton
                  selected={selectedVehicle?.id === vehicle.id}
                  onClick={() => {
                    setSelectedVehicle(vehicle);
                    setSelectedDelivery(null);
                  }}
                >
                  {getTypeIcon(vehicle.type)}
                  <ListItemText
                    primary={<span style={{ color: '#fff' }}>{vehicle.vehicleId}</span>}
                    secondary={<span style={{ color: '#90caf9' }}>Driver: {vehicle.driver?.firstName || 'Unknown'} {vehicle.driver?.lastName || ''}</span>}
                  />
                  <Chip
                    label={vehicle.status}
                    color={getStatusColor(vehicle.status) as any}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      );
    }
    if (tab === 1) {
      // Deliveries
      return (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <SearchIcon sx={{ mr: 1 }} />
            <TextField
              variant="standard"
              placeholder="Search deliveries..."
              value={deliverySearch}
              onChange={e => setDeliverySearch(e.target.value)}
              fullWidth
              sx={{ input: { color: '#fff' } }}
            />
          </Box>
          <List>
            {filteredDeliveries.map((delivery) => (
              <ListItem key={delivery.id} disablePadding sx={{ bgcolor: selectedDelivery?.id === delivery.id ? 'rgba(255, 152, 0, 0.15)' : 'transparent', borderRadius: 2, mb: 1, transition: 'background 0.2s' }}>
                <ListItemButton
                  selected={selectedDelivery?.id === delivery.id}
                  onClick={() => {
                    setSelectedDelivery(delivery);
                    const v = vehicles.find(v => String(v.id) === String(delivery.assignedVehicle));
                    if (v) setSelectedVehicle(v);
                  }}
                >
                  <ListItemText
                    primary={<span style={{ color: '#fff' }}>{delivery.trackingNumber}</span>}
                    secondary={<span style={{ color: '#ffe082' }}>Status: {delivery.status}</span>}
                  />
                  <Chip
                    label={delivery.priority}
                    color={
                      delivery.priority === 'urgent'
                        ? 'error'
                        : delivery.priority === 'high'
                        ? 'warning'
                        : 'default'
                    }
                    size="small"
                    sx={{ ml: 1 }}
                  />
                  <Box sx={{ width: 60, ml: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={
                        delivery.status === 'pending' ? 10 :
                        delivery.status === 'picked-up' ? 50 :
                        delivery.status === 'in-transit' ? 80 :
                        delivery.status === 'delivered' ? 100 : 0
                      }
                      sx={{ height: 6, borderRadius: 3, bgcolor: '#222', '& .MuiLinearProgress-bar': { bgcolor: '#1976d2' } }}
                    />
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      );
    }
    // Analytics
    return (
      <Box sx={{ color: '#fff', p: 2 }}>
        <Typography variant="h6" gutterBottom>Analytics</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper sx={{ p: 2, bgcolor: 'rgba(30,30,60,0.7)', borderRadius: 3, color: '#fff', display: 'flex', alignItems: 'center', gap: 2 }}>
            <DirectionsCarIcon color="primary" />
            <Box>
              <Typography variant="subtitle2">Total Vehicles</Typography>
              <Typography variant="h5">{totalVehicles}</Typography>
            </Box>
          </Paper>
          <Paper sx={{ p: 2, bgcolor: 'rgba(30,30,60,0.7)', borderRadius: 3, color: '#fff', display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocalShippingIcon color="info" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2">Active Vehicles</Typography>
              <Typography variant="h5">{activeVehicles}</Typography>
              <LinearProgress variant="determinate" value={vehicleUtilization} sx={{ height: 8, borderRadius: 3, mt: 1, bgcolor: '#222', '& .MuiLinearProgress-bar': { bgcolor: '#1976d2' } }} />
              <Typography variant="caption" color="#90caf9">Utilization: {vehicleUtilization}%</Typography>
            </Box>
          </Paper>
          <Paper sx={{ p: 2, bgcolor: 'rgba(30,30,60,0.7)', borderRadius: 3, color: '#fff', display: 'flex', alignItems: 'center', gap: 2 }}>
            <AnalyticsIcon color="secondary" />
            <Box>
              <Typography variant="subtitle2">Total Deliveries</Typography>
              <Typography variant="h5">{totalDeliveries}</Typography>
            </Box>
          </Paper>
          <Paper sx={{ p: 2, bgcolor: 'rgba(30,30,60,0.7)', borderRadius: 3, color: '#fff', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip label="In Progress" color="info" />
            <Box>
              <Typography variant="subtitle2">In Progress</Typography>
              <Typography variant="h5">{inProgressDeliveries}</Typography>
            </Box>
          </Paper>
          <Paper sx={{ p: 2, bgcolor: 'rgba(30,30,60,0.7)', borderRadius: 3, color: '#fff', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip label="Delivered" color="success" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2">Delivered</Typography>
              <Typography variant="h5">{deliveredDeliveries}</Typography>
              <LinearProgress variant="determinate" value={deliveryCompletion} sx={{ height: 8, borderRadius: 3, mt: 1, bgcolor: '#222', '& .MuiLinearProgress-bar': { bgcolor: '#43a047' } }} />
              <Typography variant="caption" color="#90caf9">Completion: {deliveryCompletion}%</Typography>
            </Box>
          </Paper>
          <Paper sx={{ p: 2, bgcolor: 'rgba(30,30,60,0.7)', borderRadius: 3, color: '#fff', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip label="Failed" color="error" />
            <Box>
              <Typography variant="subtitle2">Failed</Typography>
              <Typography variant="h5">{failedDeliveries}</Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  };

  // Modal for details
  const openModal = (content: ReactNode) => {
    setModalContent(content);
    setModalOpen(true);
  };

  return (
    <Box sx={{ bgcolor: 'linear-gradient(135deg, #232526 0%, #414345 100%)', minHeight: '100vh', p: 0, display: 'flex', flexDirection: 'row', height: '100vh' }}>
      {/* Sidebar: Tabs, Vehicles, Deliveries, Analytics */}
      <Box sx={{ width: 350, minWidth: 300, maxWidth: 400, height: '100vh', display: 'flex', flexDirection: 'column', boxShadow: 6, bgcolor: 'rgba(30,30,60,0.85)', zIndex: 10 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'rgba(30,30,60,0.95)',
            '& .MuiTab-root': { color: '#90caf9', fontWeight: 700 },
            '& .Mui-selected': { color: '#fff', bgcolor: 'rgba(25,118,210,0.2)' },
          }}
        >
          <Tab label="Vehicles" />
          <Tab label="Deliveries" />
          <Tab icon={<AnalyticsIcon />} aria-label="analytics" />
        </Tabs>
        <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>{renderSidebar()}</Box>
      </Box>
      {/* Map View */}
      <Box sx={{ flex: 1, height: '100vh', position: 'relative' }}>
        <Paper sx={{ p: 0, height: '100vh', borderRadius: 0, boxShadow: 0, overflow: 'hidden', bgcolor: 'rgba(30,30,60,0.7)' }}>
          <MapContainer
            center={[40.712776, -74.006015]}
            zoom={12}
            style={{ height: '100vh', width: '100%' }}
          >
            <TileLayer
              url={minimalTile}
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {vehicles.map((vehicle) => (
              <Marker
                key={vehicle.id}
                position={[
                  vehicle.currentLocation.coordinates[1],
                  vehicle.currentLocation.coordinates[0],
                ]}
                icon={getVehicleIcon(vehicle.type)}
                eventHandlers={{
                  click: () => {
                    setSelectedVehicle(vehicle);
                    setTab(0);
                  },
                }}
              >
                <Popup>
                  <Typography variant="subtitle1">
                    Vehicle: {vehicle.vehicleId}
                  </Typography>
                  <Typography variant="body2">
                    Status: {vehicle.status}
                  </Typography>
                  {vehicle.currentDelivery && (
                    <Typography variant="body2">
                      Delivery: {vehicle.currentDelivery.trackingNumber}
                    </Typography>
                  )}
                </Popup>
              </Marker>
            ))}
            {/* Highlight route for selected vehicle */}
            {selectedVehicle && deliveries.length > 0 && (
              deliveries
                .filter(d => String(d.assignedVehicle) === String(selectedVehicle.id))
                .map((delivery, idx) => (
                  <React.Fragment key={delivery.id}>
                    <Marker
                      position={[
                        delivery.pickupLocation.coordinates[1],
                        delivery.pickupLocation.coordinates[0],
                      ]}
                      icon={L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', iconSize: [24, 24] })}
                    >
                      <Popup>Pickup: {delivery.pickupLocation.address}</Popup>
                    </Marker>
                    <Marker
                      position={[
                        delivery.dropoffLocation.coordinates[1],
                        delivery.dropoffLocation.coordinates[0],
                      ]}
                      icon={L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', iconSize: [24, 24] })}
                    >
                      <Popup>Dropoff: {delivery.dropoffLocation.address}</Popup>
                    </Marker>
                    <Polyline
                      positions={[
                        [delivery.pickupLocation.coordinates[1], delivery.pickupLocation.coordinates[0]],
                        [delivery.dropoffLocation.coordinates[1], delivery.dropoffLocation.coordinates[0]],
                      ]}
                      color="#00e5ff"
                      weight={4}
                      opacity={0.8}
                    />
                  </React.Fragment>
                ))
            )}
          </MapContainer>
        </Paper>
      </Box>
      {/* Floating Action Button for Add (future use) */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 32, right: 32, boxShadow: 6, zIndex: 2000 }}
        onClick={() => openModal(
          <Box sx={{ p: 3, minWidth: 320, color: '#fff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Quick Action</Typography>
              <CloseIcon sx={{ cursor: 'pointer' }} onClick={() => setModalOpen(false)} />
            </Box>
            <Typography sx={{ mt: 2 }}>This is a placeholder for quick actions (add vehicle/delivery, etc.).</Typography>
          </Box>
        )}
      >
        <AddIcon />
      </Fab>
      {/* Modal for details/quick actions */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'rgba(30,30,60,0.95)', borderRadius: 4, boxShadow: 24, p: 0, minWidth: 350 }}>
          {modalContent}
        </Box>
      </Modal>
    </Box>
  );
};

export default Dashboard; 