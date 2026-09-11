import { useState } from 'react';
import {
  Search,
  UserRound,
  MapPin,
  Phone,
  Mail,
  HeartPulse,
  ShieldAlert
} from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

export default function PatientSearch() {
  const [patientId, setPatientId] = useState('');
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!patientId.trim()) {
      toast.error('Please enter a Patient ID');
      return;
    }

    setLoading(true);
    setPatient(null);

    try {
      const { data } = await api.get(
        `/patients/id/${patientId.trim()}`
      );

      setPatient(data);
      toast.success('Patient found');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Patient not found'
      );
    } finally {
      setLoading(false);
    }
  };

  const displayArray = (items) => {
    if (!items || items.length === 0) return 'None provided';
    return items.join(', ');
  };

  return (
    <div className="space-y-6">

      {/* Search */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Search size={20} className="text-violet-400" />
          <h2 className="text-xl font-semibold text-white">
            Search Patient
          </h2>
        </div>

        <p className="text-sm text-slate-500 mb-5">
          Search a registered patient using their MedMatrix Patient ID.
        </p>

        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Enter Patient ID e.g. MM-PR98N8N"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/60"
          />

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 font-medium text-sm hover:bg-violet-500/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Patient Result */}
      {patient && (
        <div className="space-y-6">

          {/* ID */}
          <div className="bg-gradient-to-r from-violet-500/10 to-teal-500/10 border border-violet-500/20 rounded-2xl p-6">
            <p className="text-xs text-slate-500 mb-2">
              MedMatrix Patient ID
            </p>

            <p className="text-2xl font-bold text-white tracking-wider">
              {patient.patientId}
            </p>
          </div>

          {/* Personal Information */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <UserRound size={19} className="text-violet-400" />
              <h2 className="text-lg font-semibold text-white">
                Personal Information
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <Info label="Full Name" value={patient.name} />
              <Info label="Email" value={patient.email} />
              <Info label="Phone" value={patient.phone} />

              <Info
                label="Date of Birth"
                value={
                  patient.dateOfBirth
                    ? new Date(patient.dateOfBirth).toLocaleDateString()
                    : 'Not provided'
                }
              />

              <Info label="Gender" value={patient.gender} />
              <Info label="Blood Group" value={patient.bloodGroup} />
            </div>
          </div>

          {/* Address */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <MapPin size={19} className="text-teal-400" />
              <h2 className="text-lg font-semibold text-white">
                Address
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <Info label="Address" value={patient.address} />
              <Info label="City" value={patient.city} />
              <Info label="State" value={patient.state} />
              <Info label="Pincode" value={patient.pincode} />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <ShieldAlert size={19} className="text-orange-400" />
              <h2 className="text-lg font-semibold text-white">
                Emergency Contact
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <Info
                label="Name"
                value={patient.emergencyContact?.name}
              />

              <Info
                label="Phone"
                value={patient.emergencyContact?.phone}
              />

              <Info
                label="Relationship"
                value={patient.emergencyContact?.relationship}
              />
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <HeartPulse size={19} className="text-red-400" />
              <h2 className="text-lg font-semibold text-white">
                Medical Information
              </h2>
            </div>

            <div className="space-y-4">
              <MedicalRow
                label="Allergies"
                value={displayArray(patient.allergies)}
              />

              <MedicalRow
                label="Medical Conditions"
                value={displayArray(patient.medicalConditions)}
              />

              <MedicalRow
                label="Current Medications"
                value={displayArray(patient.currentMedications)}
              />

              <MedicalRow
                label="Previous Surgeries"
                value={displayArray(patient.previousSurgeries)}
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">
        {label}
      </p>

      <p className="text-sm text-white">
        {value || 'Not provided'}
      </p>
    </div>
  );
}

function MedicalRow({ label, value }) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1">
        {label}
      </p>

      <p className="text-sm text-slate-200">
        {value}
      </p>
    </div>
  );
}