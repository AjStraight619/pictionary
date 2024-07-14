import { useEffect, useState } from 'react';
import { useTimer } from './useTimer';
import { toast } from 'sonner';

export const useActivePlayerListener = () => {
  const [isInactive, setIsInactive] = useState(false);
  const { time, startTimer, stopTimer } = useTimer({
    messageType: 'inactive_user',
    onTimerStart: () => {
      console.log('Timer started...');
    },
    onShouldTimerStop: time => time === 0 || !isInactive,
    onTimerStop: () => {
      toast('You have been inactive for too long.');
    },
  });

  // Detect user activity and reset inactivity timer
  useEffect(() => {
    const handleActivity = () => {
      if (isInactive) {
        setIsInactive(false);
        console.log('User is active again, timer stopped.');
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [isInactive]);

  // Listen to beforeunload event to handle page unload
  useEffect(() => {
    const handleBeforeUnload = (ev: BeforeUnloadEvent) => {
      if (isInactive) {
        // Optionally prevent the user from leaving
        ev.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isInactive]);

  // Monitor inactivity state to start or stop the timer
  useEffect(() => {
    if (isInactive) {
      startTimer({
        type: 'countdown',
        data: {
          time: 30,
          timerType: 'inactive_user',
        },
      });
    } else {
      stopTimer({
        data: {
          timerType: 'inactive_user',
        },
      });
    }
  }, [isInactive, startTimer, stopTimer]);

  return { time, isInactive, setIsInactive };
};
