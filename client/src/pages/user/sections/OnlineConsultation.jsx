import React, { useState } from 'react';
import {
  Stethoscope,
  Upload,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Search,
} from 'lucide-react';

const OnlineConsultation = () => {
  const [problem, setProblem] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyzeCase = async () => {
    if (!problem.trim() || !symptoms.trim()) {
      alert('Please describe your problem and symptoms first.');
      return;
    }

    setLoading(true);
try {
  const response = await fetch(
    'http://localhost:5000/api/ai/analyze-consultation',
    {
      method: 'POST',
     headers: {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('uc_token')}`,
},
      body: JSON.stringify({
        problem,
        symptoms,
        reportText: report
          ? `Previous report uploaded: ${report.name}`
          : '',
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Unable to analyze consultation');
  }

  const data = await response.json();
  setResult(data);

} catch (error) {
  console.error('CONSULTATION ERROR:', error);

  alert(
    error.message ||
    'Unable to analyze your consultation. Please try again.'
  );

} finally {
  setLoading(false);
}
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 text-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center">
            <Stethoscope size={23} />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Online Consultation
            </h1>

            <p className="text-slate-400 text-sm mt-1">
              Describe your health concern and get a preliminary AI-assisted
              assessment.
            </p>
          </div>
        </div>
      </div>

      {/* Consultation Form */}
      {!result && (
        <div className="max-w-4xl space-y-5">
          {/* Problem */}
          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5">
            <label className="block text-lg font-semibold mb-2">
              1. Add Your Problem
            </label>

            <p className="text-sm text-slate-400 mb-3">
              What health problem are you experiencing?
            </p>

            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Example: I have been experiencing frequent headaches for the last few days..."
              className="w-full min-h-[130px] bg-slate-950/70 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-teal-400 resize-none"
            />
          </div>

          {/* Symptoms */}
          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5">
            <label className="block text-lg font-semibold mb-2">
              2. Write Your Symptoms
            </label>

            <p className="text-sm text-slate-400 mb-3">
              Mention your symptoms, duration and anything unusual you have
              noticed.
            </p>

            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Example: Headache, mild fever, weakness, nausea..."
              className="w-full min-h-[130px] bg-slate-950/70 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-teal-400 resize-none"
            />
          </div>

          {/* Report */}
          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5">
            <label className="block text-lg font-semibold mb-2">
              3. Upload Consultation Report
              <span className="text-slate-500 text-sm font-normal ml-2">
                (Optional)
              </span>
            </label>

            <p className="text-sm text-slate-400 mb-4">
              Already consulted a doctor? Upload your previous report for
              additional context.
            </p>

            <label className="flex flex-col items-center justify-center min-h-[150px] border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-teal-400 transition">
              <Upload className="text-teal-400 mb-3" size={30} />

              {report ? (
                <div className="flex items-center gap-2 text-sm">
                  <FileText size={18} />
                  {report.name}
                </div>
              ) : (
                <>
                  <span className="font-medium">
                    Click to upload your report
                  </span>

                  <span className="text-xs text-slate-500 mt-1">
                    PDF, JPG or PNG
                  </span>
                </>
              )}

              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setReport(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {/* Analyze */}
          <button
            onClick={analyzeCase}
            disabled={loading}
            className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-teal-400 to-violet-500 text-slate-950 font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="animate-spin">◌</span>
                Analyzing your case...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Analyze My Case
              </>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="max-w-5xl space-y-5">
          <div className="bg-gradient-to-r from-teal-500/10 to-violet-500/10 border border-teal-400/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="text-teal-400" />
              <h2 className="text-2xl font-bold">
                Your Preliminary Assessment
              </h2>
            </div>

            <p className="text-slate-400 text-sm">
              Based on the information you provided.
            </p>
          </div>

          {/* Conditions */}
          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="text-violet-400" />
              Possible Conditions
            </h3>

            <div className="space-y-3">
              {result.possibleConditions?.map((condition, index) => (
                <div
                  key={index}
                  className="bg-slate-950/70 rounded-xl p-4 text-slate-300"
                >
                  {typeof condition === 'string'
                    ? condition
                    : condition.name}
                </div>
              ))}
            </div>
          </div>

          {/* Tests */}
          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="text-teal-400" />
              Recommended Tests
            </h3>

            <div className="grid md:grid-cols-2 gap-3">
              {result.recommendedTests?.map((test, index) => (
                <div
                  key={index}
                  className="bg-slate-950/70 rounded-xl p-4 text-slate-300"
                >
                  {test}
                </div>
              ))}
            </div>
          </div>

          {/* Medication */}
          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4">
              Recommended Medication Guidance
            </h3>

            <div className="space-y-3">
              {result.medicationGuidance?.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-950/70 rounded-xl p-4 text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="border border-yellow-400/20 bg-yellow-400/5 rounded-2xl p-5">
            <p className="text-sm text-yellow-200">
              ⚠️ {result.warning}
            </p>
          </div>

          {/* Not satisfied */}
          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">
              Not satisfied with this assessment?
            </h3>

            <p className="text-slate-400 mb-5">
              Find doctors near you who can review your symptoms personally.
            </p>

            <button
              className="px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 font-semibold flex items-center gap-2 mx-auto"
              onClick={() => alert('Nearby doctor search will be connected next.')}
            >
              <Search size={19} />
              Find Doctors Near Me
            </button>
          </div>

          {/* New consultation */}
          <button
            onClick={() => setResult(null)}
            className="text-teal-400 hover:text-teal-300 text-sm"
          >
            ← Start a new consultation
          </button>
        </div>
      )}
    </div>
  );
};

export default OnlineConsultation;