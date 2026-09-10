const SOSAlert = require('../models/SOSAlert');
const Hospital = require('../models/Hospital');
const axios = require('axios');

// ── Haversine helper ──
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// @POST /api/sos/send
const sendSOS = async (req, res) => {
  try {
    const { lat, lng, address, message, userName, phone } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Location is required for SOS' });
    }

    // Create SOS alert
    const alert = await SOSAlert.create({
      userId: req.user?._id || null,
      userName: userName || req.user?.name || 'Anonymous',
      phone: phone || req.user?.phone || '',
      location: { lat, lng, address: address || 'Unknown' },
      message: message || 'Emergency! Need immediate help.',
    });

    // Find nearby registered hospitals (within 20km)
    let nearbyHospitals = [];
    try {
      nearbyHospitals = await Hospital.find({
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: 20000,
          }
        }
      }).select('hospitalName email phone city location').limit(10);
    } catch {
      // Fallback if no geo index — get all hospitals
      nearbyHospitals = await Hospital.find({}).select('hospitalName email phone city').limit(10);
    }

    // Emit socket event to all connected hospitals
    const io = req.app.get('io');
    if (io) {
      io.emit('sos-alert', {
        alertId: alert._id,
        userName: alert.userName,
        phone: alert.phone,
        location: alert.location,
        message: alert.message,
        timestamp: alert.createdAt,
        nearbyHospitals: nearbyHospitals.length,
      });
      console.log(`🚨 [SOS] Alert broadcast to all sockets. ${nearbyHospitals.length} registered hospitals nearby.`);
    }

    res.status(201).json({
      message: 'SOS alert sent successfully',
      alertId: alert._id,
      notifiedHospitals: nearbyHospitals.length,
      nearbyHospitals: nearbyHospitals.map(h => ({
        id: h._id,
        name: h.hospitalName,
        city: h.city,
        phone: h.phone,
      })),
    });
  } catch (err) {
    console.error('SOS ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @GET /api/sos/active — Hospital sees active alerts
const getActiveAlerts = async (req, res) => {
  try {
    const alerts = await SOSAlert.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @PUT /api/sos/:id/acknowledge
const acknowledgeAlert = async (req, res) => {
  try {
    const alert = await SOSAlert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'acknowledged',
        acknowledgedBy: req.user._id,
      },
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    if (req.app.get('io')) {
      req.app.get('io').emit('sos-acknowledged', {
        alertId: alert._id,
        hospitalName: req.user.hospitalName,
      });
    }

    res.json({ message: 'Alert acknowledged', alert });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @PUT /api/sos/:id/resolve
const resolveAlert = async (req, res) => {
  try {
    const alert = await SOSAlert.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json({ message: 'Alert resolved', alert });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @GET /api/sos/my-alerts — User sees their own alerts
const getMyAlerts = async (req, res) => {
  try {
    const alerts = await SOSAlert.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Overpass API fetch with retry ──
async function fetchOverpass(query, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        'https://overpass-api.de/api/interpreter',
        query,
        {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          timeout: 35000,
        }
      );
      return response.data;
    } catch (err) {
      console.error(`❌ Overpass attempt ${attempt + 1} failed:`, err.message);
      if (attempt === retries) throw err;
      // Wait 1s before retry
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// @GET /api/sos/nearby-hospitals?lat=xx&lng=yy
const getNearbyHospitals = async (req, res) => {
  try {
    const { lat, lng, radius = 7000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'lat and lng required' });
    }

    console.log('🔍 Fetching hospitals via Overpass API near:', lat, lng);

    const overpassQuery = `
      [out:json][timeout:30];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lng});
        way["amenity"="hospital"](around:${radius},${lat},${lng});
        relation["amenity"="hospital"](around:${radius},${lat},${lng});
        node["amenity"="clinic"](around:${radius},${lat},${lng});
        node["healthcare"="hospital"](around:${radius},${lat},${lng});
      );
      out center;
    `;

    const data = await fetchOverpass(overpassQuery);
    const elements = data.elements || [];
    console.log('✅ Overpass results:', elements.length);

    const hospitals = elements
      .filter(el => el.tags && el.tags.name && (el.lat || el.center?.lat))
      .map(el => {
        const placeLat = el.lat || el.center?.lat;
        const placeLng = el.lon || el.center?.lon;
        const distanceKm = haversineKm(parseFloat(lat), parseFloat(lng), placeLat, placeLng);
        const tags = el.tags;

        return {
          placeId: 'osm-' + el.id,
          name: tags.name || 'Hospital',
          address: [
            tags['addr:housenumber'],
            tags['addr:street'],
            tags['addr:city'] || tags['addr:suburb'],
            tags['addr:state'],
          ].filter(Boolean).join(', ') || 'See on map',
          phone: tags['contact:phone'] || tags['phone'] || tags['contact:mobile'] || null,
          website: tags['website'] || tags['contact:website'] || null,
          rating: null,
          totalRatings: 0,
          isOpen: null,
          emergency: tags['emergency'] === 'yes' || tags['amenity'] === 'hospital',
          distanceKm: parseFloat(distanceKm.toFixed(2)),
          distanceText: distanceKm < 1
            ? Math.round(distanceKm * 1000) + ' m'
            : distanceKm.toFixed(1) + ' km',
          location: { lat: placeLat, lng: placeLng },
          googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=' + placeLat + ',' + placeLng,
          source: 'OpenStreetMap',
        };
      })
      .filter(h => h.location.lat && h.location.lng)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 10);

    console.log('✅ Returning', hospitals.length, 'hospitals');
    res.json({ hospitals, count: hospitals.length });

  } catch (err) {
    console.error('❌ NEARBY HOSPITALS ERROR:', err.message);
    res.status(500).json({ message: 'Failed to fetch nearby hospitals', error: err.message });
  }
};

// @GET /api/sos/registered-hospitals?lat=xx&lng=yy
const getRegisteredHospitals = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    let hospitals;

    // Try geo query first if coords provided
    if (lat && lng) {
      try {
        hospitals = await Hospital.find({
          location: {
            $near: {
              $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
              $maxDistance: 50000, // 50km radius for registered hospitals
            }
          }
        }).select('-password').limit(20);
      } catch {
        // Fallback if geo index doesn't work
        hospitals = await Hospital.find({}).select('-password').limit(20);
      }
    } else {
      hospitals = await Hospital.find({}).select('-password').limit(20);
    }

    const result = hospitals.map(h => {
      const hLat = h.location?.coordinates?.[1];
      const hLng = h.location?.coordinates?.[0];
      let distanceKm = null;
      let distanceText = 'Unknown';

      if (lat && lng && hLat && hLng && (hLat !== 0 || hLng !== 0)) {
        distanceKm = haversineKm(parseFloat(lat), parseFloat(lng), hLat, hLng);
        distanceKm = parseFloat(distanceKm.toFixed(2));
        distanceText = distanceKm < 1
          ? Math.round(distanceKm * 1000) + ' m'
          : distanceKm.toFixed(1) + ' km';
      }

      return {
        id: h._id,
        name: h.hospitalName,
        city: h.city,
        state: h.state,
        address: h.address,
        phone: h.phone,
        email: h.email,
        location: h.location,
        resources: h.resources,
        distanceKm,
        distanceText,
        source: 'MedMatrix',
      };
    });

    // Sort by distance if available
    result.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    console.log(`🏥 [registered-hospitals] Returning ${result.length} hospitals`);
    res.json({ hospitals: result, count: result.length });
  } catch (err) {
    console.error('❌ REGISTERED HOSPITALS ERROR:', err.message);
    res.status(500).json({ message: 'Failed to fetch registered hospitals', error: err.message });
  }
};

module.exports = {
  sendSOS, getActiveAlerts, acknowledgeAlert,
  resolveAlert, getMyAlerts, getNearbyHospitals,
  getRegisteredHospitals,
};