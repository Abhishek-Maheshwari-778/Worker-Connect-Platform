/**
 * useProfileGate
 * Returns the current user's profile completeness and verification status.
 * Used to show banners and block actions on the frontend.
 */
import { useAuth } from '@/context/AuthContext';

export const useProfileGate = () => {
  const { user } = useAuth();
  if (!user) return { canAct: false, gateType: 'not_logged_in' };

  const role    = user.role;
  const profile = role === 'labour' ? user.labourProfile : user.clientProfile;

  if (role === 'labour') {
    const hasSkills  = (profile?.skills?.length || 0) > 0;
    const hasWage    = (profile?.dailyWageMin || 0) > 0;
    const verifStatus = profile?.verificationStatus || 'not_submitted';
    const isVerified = verifStatus === 'approved';
    const isPending  = verifStatus === 'pending';

    const profileComplete = hasSkills && hasWage;

    if (!profileComplete) return {
      canAct:   false,
      gateType: 'incomplete_profile',
      message:  'Complete your profile (add skills & wage) to apply for jobs.',
      subtext:  !hasSkills ? 'Add at least one skill.' : 'Set your daily wage range.',
      cta:      'Complete Profile',
      href:     '/labour/settings',
    };

    if (isPending) return {
      canAct:   false,
      gateType: 'verification_pending',
      message:  'Your Aadhaar is under review.',
      subtext:  'Admin verification usually takes 24 hours. You can apply once approved.',
      cta:      null,
      href:     null,
    };

    if (!isVerified) return {
      canAct:   false,
      gateType: 'not_verified',
      message:  'Upload your Aadhaar to unlock job applications.',
      subtext:  'Verified workers get 3× more job offers and build client trust.',
      cta:      'Upload Aadhaar',
      href:     '/labour/settings',
    };

    return { canAct: true, gateType: null };
  }

  if (role === 'client') {
    const verifStatus = profile?.verificationStatus || 'not_submitted';
    const isVerified  = verifStatus === 'approved';
    const isPending   = verifStatus === 'pending';

    if (isPending) return {
      canAct:   false,
      gateType: 'verification_pending',
      message:  'Your Aadhaar is under review.',
      subtext:  'You can post jobs and chat with workers once verified.',
      cta:      null,
      href:     null,
    };

    if (!isVerified) return {
      canAct:   false,
      gateType: 'not_verified',
      message:  'Verify your Aadhaar to post jobs and contact workers.',
      subtext:  'This protects workers from unverified clients.',
      cta:      'Verify Identity',
      href:     '/client/settings',
    };

    return { canAct: true, gateType: null };
  }

  return { canAct: true, gateType: null };
};