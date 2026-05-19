import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { Video, VideoOff, Mic, MicOff, Phone, Copy, CheckCircle, Users } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function DoctorCall() {
  const { user } = useAuth();
  const [stage, setStage] = useState('lobby');
  const [roomId, setRoomId] = useState('');
  const [inputRoom, setInputRoom] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [patientName, setPatientName] = useState('');
  const [copied, setCopied] = useState(false);
  const [remoteStream, setRemoteStream] = useState(false);

  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const timerRef = useRef(null);
  const iceCandidateBuffer = useRef([]);

  const generateRoomId = () => 'UC-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  // Re-attach local stream to video element whenever stage changes (waiting/call use different video refs)
  useEffect(() => {
    if (localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [stage]);

  const startLocalStream = async () => {
    try {
      console.log('[DoctorCall] Requesting camera/mic access...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      console.log('[DoctorCall] ✅ Local stream acquired:', stream.getTracks().map(t => t.kind + ':' + t.label));
      return stream;
    } catch (err) {
      console.error('[DoctorCall] ❌ getUserMedia failed:', err);
      toast.error('Camera/mic access denied. Please allow permissions.');
      throw err;
    }
  };

  const createPeerConnection = useCallback((targetSocketId) => {
    console.log('[DoctorCall] Creating PeerConnection for target:', targetSocketId);

    // Close any existing peer connection
    if (peerConnectionRef.current) {
      console.log('[DoctorCall] Closing existing PeerConnection');
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;
    iceCandidateBuffer.current = [];

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
        console.log('[DoctorCall] Added local track:', track.kind);
      });
    } else {
      console.warn('[DoctorCall] ⚠️ No local stream when creating peer connection!');
    }

    pc.ontrack = (event) => {
      console.log('[DoctorCall] ✅ ontrack fired - remote stream received!', event.streams[0]?.id);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteStream(true);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log('[DoctorCall] 🧊 Sending ICE candidate to:', targetSocketId);
        socketRef.current.emit('ice-candidate', { to: targetSocketId, candidate: event.candidate });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[DoctorCall] ICE connection state:', pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      console.log('[DoctorCall] Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        toast.success('Call connected!');
      } else if (pc.connectionState === 'failed') {
        console.error('[DoctorCall] ❌ Peer connection failed');
        toast.error('Connection failed. Please try again.');
      }
    };

    pc.onsignalingstatechange = () => {
      console.log('[DoctorCall] Signaling state:', pc.signalingState);
    };

    return pc;
  }, []);

  const flushIceCandidates = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) return;
    console.log(`[DoctorCall] Flushing ${iceCandidateBuffer.current.length} buffered ICE candidates`);
    for (const candidate of iceCandidateBuffer.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[DoctorCall] Failed to add buffered ICE candidate:', e);
      }
    }
    iceCandidateBuffer.current = [];
  };

  const setupSignaling = (socket) => {
    socket.on('offer', async ({ from, offer }) => {
      console.log('[DoctorCall] 📩 Received offer from:', from);
      try {
        const pc = createPeerConnection(from);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('[DoctorCall] Remote description set (offer)');
        await flushIceCandidates();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('[DoctorCall] 📤 Sending answer to:', from);
        socket.emit('answer', { to: from, answer });
        setStage('call');
        startTimer();
      } catch (err) {
        console.error('[DoctorCall] ❌ Error handling offer:', err);
      }
    });

    socket.on('answer', async ({ from, answer }) => {
      console.log('[DoctorCall] 📩 Received answer from:', from);
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          console.log('[DoctorCall] Remote description set (answer)');
          await flushIceCandidates();
        } catch (err) {
          console.error('[DoctorCall] ❌ Error setting answer:', err);
        }
      }
    });

    socket.on('ice-candidate', async ({ from, candidate }) => {
      console.log('[DoctorCall] 🧊 Received ICE candidate from:', from);
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[DoctorCall] Failed to add ICE candidate:', e);
        }
      } else {
        console.log('[DoctorCall] Buffering ICE candidate (no remote description yet)');
        iceCandidateBuffer.current.push(candidate);
      }
    });

    socket.on('call-ended', () => {
      toast('Patient ended the call.');
      endCall();
    });

    socket.on('user-left', () => {
      toast('Patient left.');
      setRemoteStream(false);
    });
  };

  const startRoom = async () => {
    const rid = generateRoomId();
    setRoomId(rid);
    try {
      await startLocalStream();
      setStage('waiting');

      const socket = io(SOCKET_URL);
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[DoctorCall] ✅ Socket connected:', socket.id);
        socket.emit('join-room', {
          roomId: rid, userId: user?.id,
          userName: user?.name || 'Doctor', role: 'hospital',
        });
        console.log('[DoctorCall] Emitted join-room for:', rid);
      });

      socket.on('connect_error', (err) => {
        console.error('[DoctorCall] ❌ Socket connection error:', err.message);
        toast.error('Failed to connect to server. Is it running?');
      });

      socket.on('user-joined', async ({ socketId, userName }) => {
        console.log('[DoctorCall] 👤 User joined:', userName, '| socketId:', socketId);
        setPatientName(userName);
        setStage('call');
        startTimer();
        try {
          const pc = createPeerConnection(socketId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log('[DoctorCall] 📤 Sending offer to:', socketId);
          socket.emit('offer', { to: socketId, offer });
        } catch (err) {
          console.error('[DoctorCall] ❌ Error creating offer:', err);
        }
      });

      socket.on('existing-users', (users) => {
        console.log('[DoctorCall] Existing users in room:', users);
      });

      setupSignaling(socket);
    } catch (err) {
      console.error('[DoctorCall] ❌ startRoom failed:', err);
      setStage('lobby');
    }
  };

  const joinRoom = async () => {
    if (!inputRoom.trim()) { toast.error('Enter room code'); return; }
    const rid = inputRoom.trim().toUpperCase();
    setRoomId(rid);
    try {
      await startLocalStream();
      setStage('call');
      startTimer();

      const socket = io(SOCKET_URL);
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[DoctorCall] ✅ Socket connected:', socket.id);
        socket.emit('join-room', {
          roomId: rid, userId: user?.id,
          userName: user?.name || 'Doctor', role: 'hospital',
        });
        console.log('[DoctorCall] Emitted join-room for:', rid);
      });

      socket.on('connect_error', (err) => {
        console.error('[DoctorCall] ❌ Socket connection error:', err.message);
        toast.error('Failed to connect to server. Is it running?');
      });

      socket.on('existing-users', async (users) => {
        console.log('[DoctorCall] Existing users in room:', users);
        if (users.length > 0) {
          const target = users[0];
          setPatientName(target.userName);
          try {
            const pc = createPeerConnection(target.socketId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.log('[DoctorCall] 📤 Sending offer to existing user:', target.socketId);
            socket.emit('offer', { to: target.socketId, offer });
          } catch (err) {
            console.error('[DoctorCall] ❌ Error creating offer for existing user:', err);
          }
        }
      });

      socket.on('user-joined', async ({ socketId, userName }) => {
        console.log('[DoctorCall] 👤 User joined:', userName, '| socketId:', socketId);
        setPatientName(userName);
      });

      setupSignaling(socket);
    } catch (err) {
      console.error('[DoctorCall] ❌ joinRoom failed:', err);
      setStage('lobby');
    }
  };

  const startTimer = () => {
    setCallDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCallDuration(prev => prev + 1), 1000);
  };

  const endCall = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
    if (socketRef.current) { socketRef.current.emit('end-call', { roomId }); socketRef.current.disconnect(); }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    peerConnectionRef.current = null;
    localStreamRef.current = null;
    socketRef.current = null;
    setStage('lobby'); setRemoteStream(false); setCallDuration(0); setRoomId('');
  }, [roomId]);

  const toggleMic = () => {
    const audio = localStreamRef.current?.getAudioTracks()[0];
    if (audio) { audio.enabled = !audio.enabled; setMicOn(audio.enabled); }
  };

  const toggleCam = () => {
    const video = localStreamRef.current?.getVideoTracks()[0];
    if (video) { video.enabled = !video.enabled; setCamOn(video.enabled); }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    toast.success('Room code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    return m + ':' + (s % 60).toString().padStart(2, '0');
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      if (peerConnectionRef.current) peerConnectionRef.current.close();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  if (stage === 'lobby') {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-2">Start Patient Consultation</h3>
          <p className="text-slate-400 text-sm mb-4">Create a room and share the code with your patient.</p>
          <button onClick={startRoom}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-teal-500 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <Video size={18} /> Start Video Room
          </button>
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-2">Join Patient's Room</h3>
          <p className="text-slate-400 text-sm mb-4">Enter the room code from the patient.</p>
          <div className="flex gap-3">
            <input value={inputRoom} onChange={e => setInputRoom(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinRoom()}
              placeholder="Enter room code"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 uppercase" />
            <button onClick={joinRoom}
              className="px-5 py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400 font-semibold text-sm hover:bg-violet-500/25 transition-all">
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'waiting') {
    return (
      <div className="max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-violet-500/20 border-2 border-violet-500/40 flex items-center justify-center mx-auto mb-6">
            <Users size={32} className="text-violet-400" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Waiting for Patient</h2>
          <p className="text-slate-400 text-sm mb-6">Share this room code with your patient.</p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
            <div className="text-slate-400 text-xs mb-2 uppercase tracking-wider">Room Code</div>
            <div className="text-3xl font-bold text-violet-400 tracking-widest mb-3">{roomId}</div>
            <button onClick={copyRoomId}
              className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400 text-sm hover:bg-violet-500/25 transition-all">
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <div className="relative bg-slate-900 rounded-2xl overflow-hidden mb-4" style={{ height: '140px' }}>
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          </div>
          <button onClick={endCall}
            className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-all">
            Cancel
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="relative bg-slate-900 border border-white/10 rounded-3xl overflow-hidden" style={{ height: '420px' }}>
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        {!remoteStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
            <div className="w-20 h-20 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-2xl mb-3">
              {patientName ? patientName.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="text-white font-semibold">{patientName || 'Patient'}</div>
            <div className="text-slate-400 text-sm mt-1">Connecting...</div>
          </div>
        )}
        <div className="absolute bottom-4 right-4 w-32 h-24 bg-slate-800 border-2 border-white/20 rounded-xl overflow-hidden shadow-xl">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        </div>
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur rounded-full">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-xs font-mono">{formatTime(callDuration)}</span>
        </div>
      </div>
      <div className="glass rounded-2xl p-4 flex items-center justify-center gap-4">
        <button onClick={toggleMic}
          className={'p-3.5 rounded-xl transition-all ' + (micOn ? 'bg-white/10 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30')}>
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button onClick={toggleCam}
          className={'p-3.5 rounded-xl transition-all ' + (camOn ? 'bg-white/10 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30')}>
          {camOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button onClick={copyRoomId}
          className="p-3.5 rounded-xl bg-white/10 text-white hover:bg-white/15 transition-all">
          {copied ? <CheckCircle size={20} className="text-teal-400" /> : <Copy size={20} />}
        </button>
        <button onClick={endCall}
          className="p-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all">
          <Phone size={20} className="rotate-[135deg]" />
        </button>
      </div>
    </motion.div>
  );
}