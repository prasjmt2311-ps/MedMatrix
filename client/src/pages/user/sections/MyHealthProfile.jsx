import { useEffect, useState } from 'react';
import { UserRound, MapPin, ShieldAlert, HeartPulse } from 'lucide-react';
import api from '../../../services/api';

export default function MyHealthProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/patients/me');
        setProfile(data);
      } catch (err) {
        console.error('PROFILE FETCH ERROR:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="text-slate-400">
        Loading your health profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-red-400">
        Unable to load your health profile.
      </div>
    );
  }

  const displayArray = (items) => {
    if (!items || items.length === 0) return 'None provided';
    return items.join(', ');
  };

  return (
    <div className="space-y-6">

      {/* Patient ID */}
      <div className="bg-gradient-to-r from-teal-500/10 to-violet-500/10 border border-teal-500/20 rounded-2xl p-6">
        <p className="text-xs text-slate-400 mb-2">
          MedMatrix Patient ID
        </p>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white tracking-wider">
            {profile.patientId}
          </h2>

          <button
            onClick={() => navigator.clipboard.writeText(profile.patientId)}
            className="px-4 py-2 rounded-xl bg-teal-500/15 border border-teal-500/20 text-teal-400 text-sm hover:bg-teal-500/25"
          >
            Copy ID
          </button>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <UserRound size={19} className="text-teal-400" />
          <h2 className="text-lg font-semibold text-white">
            Personal Information
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Info label="Full Name" value={profile.name} />
          <Info label="Email" value={profile.email} />
          <Info label="Phone" value={profile.phone} />
          <Info
            label="Date of Birth"
            value={
              profile.dateOfBirth
                ? new Date(profile.dateOfBirth).toLocaleDateString()
                : 'Not provided'
            }
          />
          <Info label="Gender" value={profile.gender} />
          <Info label="Blood Group" value={profile.bloodGroup} />
        </div>
      </div>

      {/* Address */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <MapPin size={19} className="text-violet-400" />
          <h2 className="text-lg font-semibold text-white">
            Address
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Info label="Address" value={profile.address} />
          <Info label="City" value={profile.city} />
          <Info label="State" value={profile.state} />
          <Info label="Pincode" value={profile.pincode} />
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
            value={profile.emergencyContact?.name}
          />
          <Info
            label="Phone"
            value={profile.emergencyContact?.phone}
          />
          <Info
            label="Relationship"
            value={profile.emergencyContact?.relationship}
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
            value={displayArray(profile.allergies)}
          />

          <MedicalRow
            label="Medical Conditions"
            value={displayArray(profile.medicalConditions)}
          />

          <MedicalRow
            label="Current Medications"
            value={displayArray(profile.currentMedications)}
          />

          <MedicalRow
            label="Previous Surgeries"
            value={displayArray(profile.previousSurgeries)}
          />
        </div>
      </div>

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