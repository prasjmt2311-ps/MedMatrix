const TransferRequest = require('../models/TransferRequest');
const Hospital = require('../models/Hospital');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Helper: Add timeline event ───
const addTimeline = (transfer, status, message, updatedBy) => {
  transfer.timeline.push({ status, message, timestamp: new Date(), updatedBy });
};

// ─── Helper: Emit socket event ───
const emitEvent = (req, event, data) => {
  const io = req.app.get('io');
  if (io) io.emit(event, data);
};

// @POST /api/transfer/create — User or Hospital creates transfer
const createTransfer = async (req, res) => {
  try {
    const {
      patientName, patientAge, patientPhone, bloodGroup,
      medicalCondition, medicalSummary, toHospitalId,
      priority, requiresICU, requiresAmbulance, specialistNeeded,
    } = req.body;

    if (!patientName || !medicalCondition || !toHospitalId) {
      return res.status(400).json({ message: 'Patient name, condition and target hospital are required' });
    }

    const toHospital = await Hospital.findById(toHospitalId);
    if (!toHospital) return res.status(404).json({ message: 'Target hospital not found' });

    // Build fromHospital info
    let fromHospital = { name: 'Self/Family Request', city: '', phone: '', id: null };
    if (req.user.role === 'hospital') {
      fromHospital = {
        id: req.user._id,
        name: req.user.hospitalName,
        city: req.user.city,
        phone: req.user.phone,
      };
    }

    const transfer = await TransferRequest.create({
      patientId: req.user.role === 'user' ? req.user._id : null,
      patientName,
      patientAge: patientAge || 0,
      patientPhone: patientPhone || req.user.phone || '',
      bloodGroup: bloodGroup || 'O+',
      medicalCondition,
      medicalSummary: medicalSummary || '',
      fromHospital,
      toHospital: {
        id: toHospital._id,
        name: toHospital.hospitalName,
        city: toHospital.city,
        phone: toHospital.phone,
      },
      priority: priority || 'medium',
      requiresICU: requiresICU || false,
      requiresAmbulance: requiresAmbulance !== false,
      specialistNeeded: specialistNeeded || '',
      timeline: [{
        status: 'pending',
        message: 'Transfer request created and sent to ' + toHospital.hospitalName,
        timestamp: new Date(),
        updatedBy: patientName,
      }],
    });

    emitEvent(req, 'transfer-request', {
      transferId: transfer._id,
      patientName,
      condition: medicalCondition,
      priority,
      toHospitalId: toHospital._id,
    });

    res.status(201).json({ message: 'Transfer request sent', transfer });
  } catch (err) {
    console.error('CREATE TRANSFER ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @GET /api/transfer/hospital — Hospital gets all transfer requests
const getHospitalTransfers = async (req, res) => {
  try {
    const hospitalId = req.user._id;
    const { type = 'incoming', status } = req.query;

    let query = {};
    if (type === 'incoming') {
      query['toHospital.id'] = hospitalId;
    } else {
      query['fromHospital.id'] = hospitalId;
    }
    if (status) query.status = status;

    const transfers = await TransferRequest.find(query).sort({ createdAt: -1 }).limit(50);
    res.json({ transfers, count: transfers.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @GET /api/transfer/user — User gets their transfer requests
const getUserTransfers = async (req, res) => {
  try {
    const transfers = await TransferRequest.find({ patientId: req.user._id })
      .sort({ createdAt: -1 }).limit(20);
    res.json({ transfers });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @PUT /api/transfer/:id/approve
const approveTransfer = async (req, res) => {
  try {
    const { hospitalNotes, ambulanceDriver, vehicleNumber, ambulancePhone, eta } = req.body;
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });

    transfer.status = 'approved';
    transfer.approvedAt = new Date();
    transfer.hospitalNotes = hospitalNotes || '';
    transfer.ambulance = {
      isAssigned: true,
      driverName: ambulanceDriver || 'TBD',
      vehicleNumber: vehicleNumber || 'TBD',
      phone: ambulancePhone || req.user.phone,
      eta: eta || '30 minutes',
    };
    addTimeline(transfer, 'approved', 'Transfer approved by ' + req.user.hospitalName + '. Ambulance being dispatched.', req.user.hospitalName);

    await transfer.save();

    emitEvent(req, 'transfer-approved', {
      transferId: transfer._id,
      patientName: transfer.patientName,
      hospitalName: req.user.hospitalName,
      eta: transfer.ambulance.eta,
    });

    res.json({ message: 'Transfer approved', transfer });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @PUT /api/transfer/:id/reject
const rejectTransfer = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });

    transfer.status = 'rejected';
    transfer.rejectionReason = rejectionReason || 'No reason provided';
    addTimeline(transfer, 'rejected', 'Transfer rejected: ' + (rejectionReason || 'No beds available'), req.user.hospitalName);

    await transfer.save();

    emitEvent(req, 'transfer-rejected', {
      transferId: transfer._id,
      patientName: transfer.patientName,
      reason: rejectionReason,
    });

    res.json({ message: 'Transfer rejected', transfer });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @PUT /api/transfer/:id/status — Update transfer status
const updateTransferStatus = async (req, res) => {
  try {
    const { status, message } = req.body;
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });

    transfer.status = status;
    if (status === 'completed') transfer.completedAt = new Date();

    const statusMessages = {
      'in-transit': 'Ambulance dispatched. Patient in transit.',
      'completed': 'Patient successfully transferred and admitted.',
      'cancelled': 'Transfer cancelled.',
    };

    addTimeline(transfer, status, message || statusMessages[status] || 'Status updated', req.user.hospitalName || req.user.name);
    await transfer.save();

    emitEvent(req, 'transfer-status-update', {
      transferId: transfer._id,
      status,
      patientName: transfer.patientName,
    });

    res.json({ message: 'Status updated', transfer });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @GET /api/transfer/recommendations — AI-powered hospital recommendations
const getRecommendations = async (req, res) => {
  try {
    const { condition, requiresICU, specialistNeeded, lat, lng } = req.query;

    // Get all hospitals with resources
    const hospitals = await Hospital.find({}).select('-password');

    // Score hospitals
    const scored = hospitals.map(h => {
      let score = 0;
      const r = h.resources;

      if (r.availableBeds > 0) score += 20;
      if (r.availableBeds > 5) score += 10;
      if (r.availableIcuBeds > 0) score += 25;
      if (r.availableIcuBeds > 2) score += 15;
      if (r.availableAmbulances > 0) score += 15;
      if (r.availableDoctors > 0) score += 15;

      // Distance scoring (if location provided)
      let distanceKm = null;
      if (lat && lng && h.location?.coordinates?.[0]) {
        const dLat = parseFloat(lat) - h.location.coordinates[1];
        const dLng = parseFloat(lng) - h.location.coordinates[0];
        distanceKm = Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 111);
        if (distanceKm < 5) score += 20;
        else if (distanceKm < 10) score += 10;
        else if (distanceKm < 20) score += 5;
      }

      const reasons = [];
      if (r.availableIcuBeds > 0) reasons.push(r.availableIcuBeds + ' ICU beds available');
      if (r.availableBeds > 0) reasons.push(r.availableBeds + ' general beds available');
      if (r.availableAmbulances > 0) reasons.push(r.availableAmbulances + ' ambulances ready');
      if (r.availableDoctors > 0) reasons.push(r.availableDoctors + ' doctors on duty');
      if (distanceKm !== null) reasons.push(distanceKm + ' km away');

      const eta = distanceKm ? Math.round(distanceKm * 2 + 10) + ' minutes' : '15-30 minutes';

      return {
        hospital: {
          id: h._id,
          name: h.hospitalName,
          city: h.city,
          address: h.address,
          phone: h.phone,
          resources: r,
          location: h.location,
        },
        score,
        reasons,
        estimatedArrival: eta,
        distanceKm,
        priority: score > 70 ? 'Highly Recommended' : score > 40 ? 'Recommended' : 'Available',
      };
    });

    // Filter out hospitals with no beds
    const available = scored
      .filter(s => s.hospital.resources.availableBeds > 0 || s.hospital.resources.availableIcuBeds > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    // AI Summary using Groq
    let aiSummary = '';
    if (available.length > 0 && process.env.GROQ_API_KEY) {
      try {
        const prompt = 'You are a medical transfer coordinator AI. Based on these hospital options for a patient with ' +
          (condition || 'unknown condition') + ', provide a 2-sentence transfer recommendation. ' +
          'Hospitals: ' + available.slice(0, 3).map(h => h.hospital.name + ' (score: ' + h.score + ')').join(', ') +
          '. Be concise and clinical.';

        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.1-8b-instant',
          max_tokens: 150,
        });
        aiSummary = completion.choices[0]?.message?.content || '';
      } catch {}
    }

    res.json({ recommendations: available, aiSummary, total: available.length });
  } catch (err) {
    console.error('RECOMMENDATIONS ERROR:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @PUT /api/transfer/:id/ambulance — Update ambulance location
const updateAmbulanceLocation = async (req, res) => {
  try {
    const { lat, lng, eta } = req.body;
    const transfer = await TransferRequest.findByIdAndUpdate(
      req.params.id,
      {
        'ambulance.currentLat': lat,
        'ambulance.currentLng': lng,
        'ambulance.eta': eta || '',
      },
      { new: true }
    );

    emitEvent(req, 'ambulance-location', {
      transferId: req.params.id,
      lat, lng, eta,
    });

    res.json({ message: 'Location updated', transfer });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @GET /api/transfer/:id — Get single transfer
const getTransfer = async (req, res) => {
  try {
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    res.json({ transfer });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createTransfer, getHospitalTransfers, getUserTransfers,
  approveTransfer, rejectTransfer, updateTransferStatus,
  getRecommendations, updateAmbulanceLocation, getTransfer,
};