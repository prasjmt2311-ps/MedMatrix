const TransferRequest = require('../models/TransferRequest');
const MedicalRecord = require('../models/MedicalRecord');
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
      transferReason, transferReasonDetail, vitals, digilockerDocIds,
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
      transferReason: transferReason || 'other',
      transferReasonDetail: transferReasonDetail || '',
      vitals: vitals || {},
      digilocker: {
        synced: Array.isArray(digilockerDocIds) && digilockerDocIds.length > 0,
        syncedAt: Array.isArray(digilockerDocIds) && digilockerDocIds.length > 0 ? new Date() : null,
        documentIds: digilockerDocIds || [],
      },
      timeline: [{
        status: 'pending',
        message: 'Transfer request created by ' + fromHospital.name + ' and sent to ' + toHospital.hospitalName,
        timestamp: new Date(),
        updatedBy: fromHospital.name,
      }],
    });

    emitEvent(req, 'transfer-request', {
      transferId: transfer._id,
      patientName,
      condition: medicalCondition,
      priority,
      toHospitalId: toHospital._id,
      fromHospital: fromHospital.name,
      transferReason,
    });

    console.log(`🚑 [Transfer] Created: ${patientName} → ${toHospital.hospitalName} (${transferReason})`);
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

// @PUT /api/transfer/:id/request-info — Receiving hospital requests more info
const requestInfo = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Info request message is required' });

    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });

    transfer.status = 'info-requested';
    transfer.infoRequest = {
      message,
      requestedAt: new Date(),
      response: '',
      respondedAt: null,
    };
    addTimeline(transfer, 'info-requested', 'More information requested: ' + message, req.user.hospitalName);
    await transfer.save();

    emitEvent(req, 'transfer-info-requested', {
      transferId: transfer._id,
      patientName: transfer.patientName,
      message,
      hospitalName: req.user.hospitalName,
    });

    console.log(`📋 [Transfer] Info requested for ${transfer.patientName} by ${req.user.hospitalName}`);
    res.json({ message: 'Info request sent', transfer });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @PUT /api/transfer/:id/respond-info — Sender hospital responds with additional info
const respondToInfoRequest = async (req, res) => {
  try {
    const { response } = req.body;
    if (!response) return res.status(400).json({ message: 'Response is required' });

    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });

    transfer.status = 'pending'; // Back to pending for review
    transfer.infoRequest.response = response;
    transfer.infoRequest.respondedAt = new Date();
    addTimeline(transfer, 'pending', 'Additional info provided: ' + response, req.user.hospitalName || req.user.name);
    await transfer.save();

    emitEvent(req, 'transfer-info-responded', {
      transferId: transfer._id,
      patientName: transfer.patientName,
      response,
    });

    res.json({ message: 'Info response sent', transfer });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @POST /api/transfer/:id/sync-digilocker — Simulate DigiLocker document fetch
const syncDigilocker = async (req, res) => {
  try {
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });

    const patientName = transfer.patientName;
    const genDocId = () => 'DL-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Generate simulated DigiLocker medical records
    const docsToCreate = [
      {
        type: 'discharge_summary',
        title: 'Discharge Summary — ' + patientName,
        description: 'Complete discharge summary including treatment details, medications prescribed, and follow-up instructions.',
        issuedBy: transfer.fromHospital.name || 'MedMatrix Hospital',
        metadata: {
          diagnosis: transfer.medicalCondition,
          medications: ['Paracetamol 500mg', 'Amoxicillin 250mg', 'Pantoprazole 40mg'],
          notes: transfer.medicalSummary || 'Patient under observation. Vitals stable.',
        },
      },
      {
        type: 'prescription',
        title: 'Current Prescription — ' + patientName,
        description: 'Active medications and dosage schedule for ongoing treatment.',
        issuedBy: transfer.fromHospital.name || 'MedMatrix Hospital',
        metadata: {
          medications: ['Tab. Clopidogrel 75mg OD', 'Tab. Atorvastatin 20mg HS', 'Inj. Enoxaparin 40mg SC BD'],
          notes: 'Continue for 14 days. Review after completion.',
        },
      },
      {
        type: 'lab_report',
        title: 'Blood Panel Report — ' + patientName,
        description: 'Complete blood count, metabolic panel, and coagulation profile.',
        issuedBy: 'MedMatrix Diagnostics',
        metadata: {
          labValues: {
            hemoglobin: '12.5 g/dL',
            wbc: '8,200 /μL',
            platelets: '2.1 L/μL',
            creatinine: '0.9 mg/dL',
          },
          vitals: transfer.vitals || {},
          notes: 'All parameters within normal range.',
        },
      },
      {
        type: 'insurance',
        title: 'Health Insurance Policy — ' + patientName,
        description: 'Active health insurance coverage details and claim eligibility.',
        issuedBy: 'Star Health Insurance',
        metadata: {
          notes: 'Policy No: SH-2024-' + Math.floor(Math.random() * 900000 + 100000) + ' | Sum Insured: ₹5,00,000 | Status: Active',
        },
      },
      {
        type: 'vitals_report',
        title: 'Vitals Monitoring Report — ' + patientName,
        description: 'Latest vitals recorded before transfer initiation.',
        issuedBy: transfer.fromHospital.name || 'MedMatrix Hospital',
        metadata: {
          vitals: transfer.vitals || { bp: '120/80', heartRate: '78', spo2: '98', temperature: '98.6', respiratoryRate: '16' },
          notes: 'Vitals recorded at time of transfer initiation.',
        },
      },
    ];

    const createdDocs = [];
    for (const doc of docsToCreate) {
      const record = await MedicalRecord.create({
        patientId: transfer.patientId,
        patientName,
        transferId: transfer._id,
        type: doc.type,
        title: doc.title,
        description: doc.description,
        issuedBy: doc.issuedBy,
        issuedDate: new Date(),
        digilockerVerified: true,
        digilockerDocId: genDocId(),
        digilockerSyncedAt: new Date(),
        fileUrl: '/documents/' + doc.type + '-' + transfer._id + '.pdf',
        metadata: doc.metadata,
      });
      createdDocs.push(record);
    }

    // Update transfer with DigiLocker info
    transfer.digilocker = {
      synced: true,
      syncedAt: new Date(),
      documentIds: createdDocs.map(d => d._id),
    };
    addTimeline(transfer, transfer.status, 'DigiLocker documents synced — ' + createdDocs.length + ' records fetched and verified.', 'DigiLocker');
    await transfer.save();

    console.log(`📄 [DigiLocker] Synced ${createdDocs.length} documents for ${patientName}`);
    res.json({
      message: 'DigiLocker documents synced successfully',
      documents: createdDocs,
      count: createdDocs.length,
    });
  } catch (err) {
    console.error('DIGILOCKER SYNC ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @GET /api/transfer/:id/documents — Get all medical records for a transfer
const getTransferDocuments = async (req, res) => {
  try {
    const documents = await MedicalRecord.find({ transferId: req.params.id }).sort({ createdAt: -1 });
    res.json({ documents, count: documents.length });
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
  requestInfo, respondToInfoRequest, syncDigilocker, getTransferDocuments,
};