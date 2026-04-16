// frontend/src/components/common/CountdownTimer.jsx
import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

const CountdownTimer = ({ expiresAt, isExpired, size = 'sm' }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (isExpired || !expiresAt) {
      setTimeLeft('Expired');
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      // Urgent: less than 24 hours
      setIsUrgent(diff < 24 * 60 * 60 * 1000);
      // Warning: less than 3 days
      setIsWarning(diff < 3 * 24 * 60 * 60 * 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [expiresAt, isExpired]);

  if (!expiresAt) return null;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-1',
    md: 'text-xs px-3 py-1.5',
    lg: 'text-sm px-4 py-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <div className={`flex items-center gap-1 font-bold rounded-full whitespace-nowrap ${sizeClasses[size]} ${
      isExpired 
        ? 'bg-red-100 text-red-600' 
        : isUrgent 
          ? 'bg-red-50 text-red-600 animate-pulse border border-red-200' 
          : isWarning
            ? 'bg-amber-50 text-amber-600 border border-amber-200'
            : 'bg-emerald-50 text-emerald-600'
    }`}>
      {isUrgent || isExpired ? (
        <AlertCircle className={`${iconSizes[size]} flex-shrink-0`} />
      ) : (
        <Clock className={`${iconSizes[size]} flex-shrink-0`} />
      )}
      <span>{isExpired ? 'Expired' : `${timeLeft} left`}</span>
    </div>
  );
};

export default CountdownTimer;