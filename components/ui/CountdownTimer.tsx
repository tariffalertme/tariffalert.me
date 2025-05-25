import React, { useEffect, useState } from 'react';
import { differenceInDays, format, isValid } from 'date-fns';

interface CountdownTimerProps {
  effectiveDate: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ effectiveDate }) => {
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [isEffective, setIsEffective] = useState<boolean>(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const effective = new Date(effectiveDate);
      if (!isValid(effective)) return;
      const days = differenceInDays(effective, now);
      setDaysRemaining(Math.max(0, days));
      setIsEffective(now >= effective);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000 * 60 * 60);
    return () => clearInterval(timer);
  }, [effectiveDate]);

  if (isEffective) {
    return <span className="text-green-600 font-semibold">Currently in effect</span>;
  }

  // Add urgency: red and animated for <= 7 days
  const urgent = daysRemaining <= 7;
  const warning = daysRemaining <= 30 && daysRemaining > 7;

  return (
    <span
      className={
        urgent
          ? 'text-red-600 font-bold animate-pulse'
          : warning
          ? 'text-yellow-600 font-semibold'
          : 'text-gray-900 font-medium'
      }
    >
      {daysRemaining} days left
    </span>
  );
};

export default CountdownTimer; 