'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Check,
  Camera,
  Upload,
  RefreshCw,
  AlertCircle,
  X,
  Lock,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Eye,
  Trash2,
} from 'lucide-react';

interface GateStatus {
  faceCheck: {
    status: 'not_started' | 'pending' | 'verified' | 'failed';
    verified: boolean;
    verifiedAt: string | null;
    provider?: string;
  };
  coverImage: {
    uploaded: boolean;
    coverUrl: string | null;
  };
  wealthLevel: {
    current: number;
    required: number;
    passed: boolean;
  };
}

export default function GoLiveGatesScreen() {
  const router = useRouter();

  // Gates state
  const [gates, setGates] = useState<GateStatus>({
    faceCheck: { status: 'not_started', verified: false, verifiedAt: null },
    coverImage: { uploaded: false, coverUrl: null },
    wealthLevel: { current: 1, required: 5, passed: false },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id?: string; nickname?: string; poppoId?: string } | null>(null);

  // Modals state
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showWealthModal, setShowWealthModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Face Check Camera state
  const [cameraPermission, setCameraPermission] = useState<'idle' | 'prompting' | 'granted' | 'denied'>('idle');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [faceError, setFaceError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cover Image Upload state
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Verification in progress
  const [isSubmittingEligibility, setIsSubmittingEligibility] = useState(false);

  // 1. Fetch initial status from server
  const fetchGateStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/live/gates/status');
      const data = await res.json();

      if (data.success) {
        setGates(data.gates);
        setUser(data.user);
        if (data.gates.coverImage.coverUrl) {
          setCoverPreviewUrl(data.gates.coverImage.coverUrl);
        }
      } else if (res.status === 401) {
        // Fallback for demo preview
        const demoRes = await fetch('/api/live/gates/status?preview=demo');
        const demoData = await demoRes.json();
        if (demoData.success) {
          setGates(demoData.gates);
          setUser(demoData.user);
        }
      } else {
        setError(data.error || 'Failed to load Go-Live requirements.');
      }
    } catch (err: any) {
      console.error('Error fetching gates:', err);
      setError('Network error while checking Go-Live gates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateStatus();
  }, []);

  // Compute eligibility
  const isFaceVerified = gates.faceCheck.verified;
  const isCoverUploaded = gates.coverImage.uploaded && !!gates.coverImage.coverUrl;
  const isWealthPassed = gates.wealthLevel.passed;
  const canContinue = isFaceVerified && isCoverUploaded && isWealthPassed;

  // -------------------------------------------------------------
  // Camera & Face Verification handlers
  // -------------------------------------------------------------
  const startCamera = async () => {
    setFaceError(null);
    setCameraPermission('prompting');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraPermission('granted');
    } catch (err: any) {
      console.warn('Camera permission denied or unavailable:', err);
      setCameraPermission('denied');
      setFaceError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Please allow camera access in browser settings to complete real face verification.'
          : 'Unable to access camera. Please ensure no other application is using your camera.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setScanProgress(0);
  };

  const handleOpenFaceModal = () => {
    setFaceError(null);
    setCameraPermission('idle');
    setShowFaceModal(true);
  };

  const handleCloseFaceModal = () => {
    stopCamera();
    setShowFaceModal(false);
  };

  const runBiometricScan = async (simulateFailure = false) => {
    setIsScanning(true);
    setFaceError(null);
    setScanProgress(10);

    // Realistic scanning progress animation
    for (let p = 20; p <= 90; p += 20) {
      await new Promise((r) => setTimeout(r, 300));
      setScanProgress(p);
    }

    try {
      const res = await fetch('/api/live/gates/face-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulateFailure,
          reason: simulateFailure ? 'Face position shifted or insufficient lighting. Please keep head steady.' : undefined,
        }),
      });

      const data = await res.json();
      setScanProgress(100);

      if (res.ok && data.success) {
        setGates((prev) => ({
          ...prev,
          faceCheck: {
            status: 'verified',
            verified: true,
            verifiedAt: data.verifiedAt,
            provider: data.provider,
          },
        }));
        setTimeout(() => {
          handleCloseFaceModal();
        }, 600);
      } else {
        setFaceError(data.message || 'Face verification failed. Please try again.');
        setGates((prev) => ({
          ...prev,
          faceCheck: {
            ...prev.faceCheck,
            status: 'failed',
            verified: false,
          },
        }));
      }
    } catch (err: any) {
      setFaceError('Network error while processing verification.');
    } finally {
      setIsScanning(false);
    }
  };

  // -------------------------------------------------------------
  // Cover Image handlers
  // -------------------------------------------------------------
  const handleOpenCoverModal = () => {
    setCoverError(null);
    setShowCoverModal(true);
  };

  const handleCoverFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setCoverError('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCoverError('Image size exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

    setSelectedCoverFile(file);
    setCoverError(null);

    // Local preview
    const reader = new FileReader();
    reader.onload = () => {
      setCoverPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadCover = async () => {
    if (!selectedCoverFile && !coverPreviewUrl) {
      setCoverError('Please choose an image file first.');
      return;
    }

    setIsUploadingCover(true);
    setCoverError(null);
    setUploadProgress(25);

    try {
      let res;
      if (selectedCoverFile) {
        const formData = new FormData();
        formData.append('file', selectedCoverFile);
        setUploadProgress(60);

        res = await fetch('/api/live/gates/cover-upload', {
          method: 'POST',
          body: formData,
        });
      } else if (coverPreviewUrl) {
        setUploadProgress(60);
        res = await fetch('/api/live/gates/cover-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: coverPreviewUrl }),
        });
      }

      setUploadProgress(90);
      const data = await res?.json();

      if (res?.ok && data.success) {
        setUploadProgress(100);
        setGates((prev) => ({
          ...prev,
          coverImage: {
            uploaded: true,
            coverUrl: data.coverUrl,
          },
        }));
        setTimeout(() => {
          setShowCoverModal(false);
        }, 500);
      } else {
        setCoverError(data?.error || 'Failed to upload cover image.');
      }
    } catch (err: any) {
      setCoverError('Network error while uploading cover image.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleRemoveCover = async () => {
    try {
      const res = await fetch('/api/live/gates/cover-upload', { method: 'DELETE' });
      if (res.ok) {
        setSelectedCoverFile(null);
        setCoverPreviewUrl(null);
        setGates((prev) => ({
          ...prev,
          coverImage: { uploaded: false, coverUrl: null },
        }));
        setShowCoverModal(false);
      }
    } catch (err) {
      console.error('Error removing cover:', err);
    }
  };

  // -------------------------------------------------------------
  // Wealth Level helper (testing tool for dev / reviewers)
  // -------------------------------------------------------------
  const handleUpdateTestWealthLevel = async (targetLevel: number) => {
    try {
      const res = await fetch('/api/live/gates/verify-eligibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wealthLevel: targetLevel }),
      });
      const data = await res.json();
      if (data.success) {
        setGates((prev) => ({
          ...prev,
          wealthLevel: {
            ...prev.wealthLevel,
            current: targetLevel,
            passed: targetLevel >= 5,
          },
        }));
        setShowWealthModal(false);
      }
    } catch (err) {
      console.error('Failed to update wealth level:', err);
    }
  };

  // -------------------------------------------------------------
  // Final Continue Action (Strict Backend Verification)
  // -------------------------------------------------------------
  const handleContinue = async () => {
    if (!canContinue) return;

    setIsSubmittingEligibility(true);
    try {
      const res = await fetch('/api/live/gates/verify-eligibility', {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setShowSuccessModal(true);
      } else {
        setError(data.reasons ? data.reasons.join(' ') : data.error || 'Eligibility verification failed on server.');
        // Refresh local status to ensure synchronization
        fetchGateStatus();
      }
    } catch (err: any) {
      setError('Network error during eligibility verification.');
    } finally {
      setIsSubmittingEligibility(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080915] text-white flex flex-col justify-between selection:bg-[#ff2465] selection:text-white relative overflow-hidden font-sans">
      {/* Ambient background glow (matching 04_01 reference) */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main container constrained for mobile reference parity */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-between px-5 pt-4 pb-6 z-10">
        {/* Top Header */}
        <div className="w-full flex flex-col items-center">
          {/* Popo Live Logo */}
          <div className="flex items-center gap-2 mb-4">
            {/* Colorful app icon */}
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-400 via-pink-500 to-yellow-400 p-[1.5px] shadow-[0_0_12px_rgba(255,46,116,0.3)]">
              <div className="w-full h-full bg-[#121324] rounded-[6px] flex items-center justify-center">
                <span className="text-[10px] font-black tracking-tighter bg-gradient-to-r from-pink-400 to-cyan-300 bg-clip-text text-transparent">
                  LIVE
                </span>
              </div>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]">
              poppo <span className="text-white font-normal">Live</span>
            </span>
          </div>

          {/* Navigation & Screen Heading */}
          <div className="w-full flex items-center justify-between relative py-2">
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <h1 className="text-xl font-bold text-white tracking-tight text-center">
              Go Live Setup
            </h1>

            {/* Spacer for symmetrical centering */}
            <div className="w-10 h-10" />
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="my-2 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Three Verification Cards (1:1 with 04_01_go_live_gates.png) */}
        <div className="w-full flex flex-col gap-3.5 my-auto py-4">
          {/* Card 1: Face Check */}
          <div
            onClick={handleOpenFaceModal}
            role="button"
            tabIndex={0}
            className={`w-full p-4 rounded-[22px] bg-[#141630]/90 border transition-all cursor-pointer flex items-center justify-between ${
              isFaceVerified
                ? 'border-white/[0.08] hover:border-white/20'
                : 'border-white/[0.08] hover:border-pink-500/30 hover:bg-[#181a38]'
            } shadow-[0_4px_20px_rgba(0,0,0,0.25)]`}
          >
            <div className="flex items-center gap-3.5">
              {/* Face Check Icon */}
              <div className="w-12 h-12 rounded-2xl bg-[#1e2042] border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src="/assets/go-live/icon_face_check.png"
                  alt="Face Check"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback icon if asset fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[16px] font-bold text-white tracking-tight">
                  Face Check
                </span>
                <span className="text-xs text-zinc-400 mt-0.5 font-normal">
                  Verify your real face
                </span>
              </div>
            </div>

            {/* Indicator on right */}
            <div>
              {isFaceVerified ? (
                <div className="w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center shadow-[0_0_12px_rgba(34,197,94,0.4)]">
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                </div>
              ) : gates.faceCheck.status === 'failed' ? (
                <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                  Failed • Retry
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-zinc-300 bg-white/10 hover:bg-white/15 px-3 py-1 rounded-full transition-colors">
                  Verify
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Cover Image */}
          <div
            onClick={handleOpenCoverModal}
            role="button"
            tabIndex={0}
            className={`w-full p-4 rounded-[22px] bg-[#141630]/90 border transition-all cursor-pointer flex items-center justify-between ${
              isCoverUploaded
                ? 'border-white/[0.08] hover:border-white/20'
                : 'border-white/[0.08] hover:border-pink-500/30 hover:bg-[#181a38]'
            } shadow-[0_4px_20px_rgba(0,0,0,0.25)]`}
          >
            <div className="flex items-center gap-3.5">
              {/* Cover Image Icon */}
              <div className="w-12 h-12 rounded-2xl bg-[#1e2042] border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                <img
                  src="/assets/go-live/icon_cover_image.png"
                  alt="Cover Image"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[16px] font-bold text-white tracking-tight">
                  Cover Image
                </span>
                <span className="text-xs text-zinc-400 mt-0.5 font-normal">
                  Add a live cover
                </span>
              </div>
            </div>

            {/* Indicator on right */}
            <div>
              {isCoverUploaded ? (
                <div className="w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center shadow-[0_0_12px_rgba(34,197,94,0.4)]">
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                </div>
              ) : (
                <span className="text-[11px] font-semibold text-zinc-300 bg-white/10 hover:bg-white/15 px-3 py-1 rounded-full transition-colors flex items-center gap-1">
                  <Upload className="w-3 h-3" /> Upload
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Wealth Level */}
          <div
            onClick={() => setShowWealthModal(true)}
            role="button"
            tabIndex={0}
            className={`w-full p-4 rounded-[22px] bg-[#141630]/90 border transition-all cursor-pointer flex items-center justify-between ${
              isWealthPassed
                ? 'border-white/[0.08] hover:border-white/20'
                : 'border-white/[0.08] hover:border-pink-500/30 hover:bg-[#181a38]'
            } shadow-[0_4px_20px_rgba(0,0,0,0.25)]`}
          >
            <div className="flex items-center gap-3.5">
              {/* Wealth Level Crown Icon */}
              <div className="w-12 h-12 rounded-2xl bg-[#1e2042] border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src="/assets/go-live/icon_wealth_level.png"
                  alt="Wealth Level"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[16px] font-bold text-white tracking-tight">
                  Wealth Level
                </span>
                <span className="text-xs text-zinc-400 mt-0.5 font-normal">
                  Level 5 or above to go live
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5">
                  Current Level: <strong className={isWealthPassed ? 'text-green-400' : 'text-amber-400'}>{gates.wealthLevel.current}</strong> (Min: 5)
                </span>
              </div>
            </div>

            {/* Indicator on right */}
            <div>
              {isWealthPassed ? (
                <div className="w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center shadow-[0_0_12px_rgba(34,197,94,0.4)]">
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                </div>
              ) : (
                <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" /> Lv. {gates.wealthLevel.current} / 5
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action: Pink Pill Button (1:1 with 04_01_go_live_gates.png) */}
        <div className="w-full pt-4 pb-2 flex flex-col items-center">
          <button
            onClick={handleContinue}
            disabled={!canContinue || isSubmittingEligibility}
            className={`w-full py-3.5 px-6 rounded-full text-center font-bold text-[16px] tracking-wide transition-all ${
              canContinue && !isSubmittingEligibility
                ? 'bg-gradient-to-r from-[#e91e63] via-[#ff2d55] to-[#f06292] text-white shadow-[0_4px_25px_rgba(255,45,85,0.45)] active:scale-[0.98]'
                : 'bg-white/[0.08] text-white/30 border border-white/5 cursor-not-allowed'
            }`}
          >
            {isSubmittingEligibility ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Eligibility...
              </span>
            ) : (
              'Continue'
            )}
          </button>

          {!canContinue && (
            <p className="text-[11px] text-zinc-500 text-center mt-2.5">
              Complete all 3 verification requirements to continue.
            </p>
          )}

          {/* Reference footer slide title */}
          <div className="mt-4 pt-2 text-[12px] font-bold text-zinc-500 tracking-wider">
            4.1 Go-Live Gates
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: Face Check (Biometric KYC Camera Interface)      */}
      {/* ========================================================= */}
      {showFaceModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121326] border border-white/10 rounded-[28px] p-5 flex flex-col items-center text-center relative shadow-2xl">
            <button
              onClick={handleCloseFaceModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-3 text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              Real Face Verification
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
              To ensure authentic broadcaster identity and prevent deepfakes, please center your face in the oval guide.
            </p>

            {/* Error banner inside modal */}
            {faceError && (
              <div className="w-full my-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-left text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{faceError}</span>
              </div>
            )}

            {/* Camera Viewport with Face Oval */}
            <div className="relative w-56 h-56 rounded-full overflow-hidden bg-black/60 border-2 border-purple-500/40 my-4 flex items-center justify-center shadow-inner">
              {cameraPermission === 'granted' ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  {/* Face Guide Overlay */}
                  <div className="absolute inset-4 rounded-full border-2 border-dashed border-cyan-400/70 pointer-events-none" />

                  {/* Scanning Animation */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/25 to-transparent animate-pulse pointer-events-none" />
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-400 p-4">
                  <Camera className="w-12 h-12 text-zinc-600 mb-2" />
                  <span className="text-[11px] text-zinc-500">
                    {cameraPermission === 'prompting'
                      ? 'Requesting camera access...'
                      : cameraPermission === 'denied'
                      ? 'Camera permission denied'
                      : 'Camera not active'}
                  </span>
                </div>
              )}
            </div>

            {/* Progress Bar when scanning */}
            {isScanning && (
              <div className="w-full my-2">
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-pink-500 h-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  Analyzing facial symmetry & liveness... {scanProgress}%
                </span>
              </div>
            )}

            {/* Camera Action Buttons */}
            <div className="w-full flex flex-col gap-2 mt-2">
              {cameraPermission !== 'granted' ? (
                <button
                  onClick={startCamera}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-[#e91e63] to-[#ff2d55] text-white font-bold text-sm shadow-lg shadow-pink-500/30 hover:brightness-110 active:scale-95 transition-all"
                >
                  Enable Camera
                </button>
              ) : (
                <>
                  <button
                    onClick={() => runBiometricScan(false)}
                    disabled={isScanning}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-bold text-sm shadow-lg shadow-green-500/30 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isScanning ? 'Verifying...' : 'Capture & Verify Face'}
                  </button>

                  {/* Test Failure Simulation Option for verification testing */}
                  <button
                    onClick={() => runBiometricScan(true)}
                    disabled={isScanning}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 underline mt-1"
                  >
                    Simulate Verification Failure (Test Mode)
                  </button>
                </>
              )}

              <button
                onClick={handleCloseFaceModal}
                className="w-full py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs transition-colors mt-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: Cover Image Upload                                */}
      {/* ========================================================= */}
      {showCoverModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121326] border border-white/10 rounded-[28px] p-5 flex flex-col items-center text-center relative shadow-2xl">
            <button
              onClick={() => setShowCoverModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center mb-3 text-pink-400">
              <Camera className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              Live Broadcast Cover
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
              Select an attractive, clear portrait or landscape image representing your stream. Max size: 5MB.
            </p>

            {/* Error banner inside modal */}
            {coverError && (
              <div className="w-full my-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-left text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{coverError}</span>
              </div>
            )}

            {/* Cover Image Preview Window */}
            <div className="relative w-48 h-48 rounded-2xl overflow-hidden bg-black/50 border border-white/10 my-4 flex items-center justify-center group shadow-inner">
              {coverPreviewUrl ? (
                <>
                  <img
                    src={coverPreviewUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold hover:bg-white/30"
                    >
                      Change
                    </button>
                    <button
                      onClick={handleRemoveCover}
                      className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Upload className="w-8 h-8 mb-2 text-zinc-500" />
                  <span className="text-xs font-semibold">Tap to select photo</span>
                  <span className="text-[10px] text-zinc-600 mt-1">JPG, PNG, WebP</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverFileSelected}
              className="hidden"
            />

            {/* Upload progress */}
            {isUploadingCover && (
              <div className="w-full my-2">
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  Uploading image... {uploadProgress}%
                </span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="w-full flex flex-col gap-2 mt-2">
              <button
                onClick={handleUploadCover}
                disabled={isUploadingCover || (!selectedCoverFile && !coverPreviewUrl)}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#e91e63] to-[#ff2d55] text-white font-bold text-sm shadow-lg shadow-pink-500/30 hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isUploadingCover ? 'Saving Cover...' : 'Confirm Cover Image'}
              </button>

              <button
                onClick={() => setShowCoverModal(false)}
                className="w-full py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: Wealth Level Information & Test Switcher        */}
      {/* ========================================================= */}
      {showWealthModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121326] border border-white/10 rounded-[28px] p-5 flex flex-col items-center text-center relative shadow-2xl">
            <button
              onClick={() => setShowWealthModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-3 text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              Wealth Level Rule
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
              Popo Live platform guidelines require broadcasters to attain <strong className="text-white">Level 5</strong> or above before hosting solo live streams.
            </p>

            <div className="w-full p-3.5 my-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Your Current Level:</span>
              <span className={`font-bold text-sm ${isWealthPassed ? 'text-green-400' : 'text-amber-400'}`}>
                Level {gates.wealthLevel.current}
              </span>
            </div>

            <div className="w-full p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs mb-4">
              <span className="text-zinc-400">Required Level:</span>
              <span className="font-bold text-sm text-white">Level 5</span>
            </div>

            {/* Staging / Dev Helper to toggle wealth level for QA and testing */}
            <div className="w-full pt-3 border-t border-white/10 flex flex-col gap-2">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                Testing Switcher (Dev / QA Evaluation)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUpdateTestWealthLevel(1)}
                  className="py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 active:scale-95 transition-all"
                >
                  Set Level 1 (Fails)
                </button>
                <button
                  onClick={() => handleUpdateTestWealthLevel(5)}
                  className="py-2 px-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-semibold hover:bg-green-500/20 active:scale-95 transition-all"
                >
                  Set Level 5 (Passes)
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowWealthModal(false)}
              className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors mt-4"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: Success / Gate Cleared Confirmation             */}
      {/* ========================================================= */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121326] border border-green-500/30 rounded-[28px] p-6 flex flex-col items-center text-center relative shadow-[0_0_50px_rgba(34,197,94,0.2)]">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-4 text-green-400 animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <h3 className="text-xl font-extrabold text-white tracking-tight">
              All Gates Cleared!
            </h3>
            <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
              Your real face check, live cover photo, and Wealth Level requirements have been verified by the server.
            </p>

            <div className="w-full my-4 p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-1.5 text-xs text-left">
              <div className="flex items-center gap-2 text-green-400 font-semibold">
                <Check className="w-3.5 h-3.5" /> Face verification confirmed
              </div>
              <div className="flex items-center gap-2 text-green-400 font-semibold">
                <Check className="w-3.5 h-3.5" /> Cover image verified and saved
              </div>
              <div className="flex items-center gap-2 text-green-400 font-semibold">
                <Check className="w-3.5 h-3.5" /> Wealth Level {gates.wealthLevel.current} ≥ 5 verified
              </div>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/live/explore');
                }}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#e91e63] to-[#ff2d55] text-white font-bold text-sm shadow-lg shadow-pink-500/40 hover:brightness-110 active:scale-95 transition-all"
              >
                Proceed to Pre-Live Setup (Module 4.2)
              </button>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs transition-colors"
              >
                Stay on Gates Screen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
