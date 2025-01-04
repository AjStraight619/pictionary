import { Button } from '@/components/ui/button';
import { useTimer } from '@/hooks/useTimer';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import Timer from '../timer/timer';

const modalVariants = {
  hidden: {
    opacity: 0,
    y: '-100vh',
  },
  visible: {
    opacity: 1,
    y: '0',
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    y: '100vh',
    transition: {
      type: 'tween',
      ease: 'easeInOut',
      duration: 1,
    },
  },
};

const backgroundVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.5 } },
};

const WordSelect = () => {
  const [open, setOpen] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false); // Track if the timer has started
  const modalRef = useRef<HTMLDivElement>(null);

  const { timeRemaining, startTimer, stopTimer } = useTimer('word-select', [
    'word-select-timer-update',
    'word-select-timer-end',
  ]);

  const openModal = () => {
    setOpen(true);
    setTimerStarted(false);
  };

  const closeModal = () => {
    setOpen(false);
    stopTimer();
  };

  const handleAnimationComplete = () => {
    if (!timerStarted) {
      startTimer(); // Start the timer only once
      setTimerStarted(true); // Ensure the timer doesn't restart during exit
    }
  };

  return (
    <div>
      <Button onClick={openModal}>Open</Button>
      <Button onClick={closeModal} className="ml-4">
        Force Close Modal
      </Button>

      <AnimatePresence
        onExitComplete={() => {
          stopTimer();
        }}
      >
        {open && (
          <>
            {/* Background Overlay */}
            <motion.div
              key="modal-bg"
              variants={backgroundVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/80 z-40"
              onClick={closeModal}
            />

            {/* Modal Content */}
            <motion.div
              key="dialog-content"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 flex items-center justify-center z-50"
              onAnimationComplete={handleAnimationComplete} // Distinguish between entry/exit
            >
              <div
                ref={modalRef}
                className="bg-background rounded-md p-4 relative"
              >
                <Timer
                  timeRemaining={timeRemaining}
                  className="absolute top-2 right-2"
                />
                <h3 className="text-xl font-bold mb-4">Word Selection</h3>
                <p className="mb-4">Choose your word from the options below:</p>
                <button onClick={closeModal} className="btn-secondary">
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WordSelect;
