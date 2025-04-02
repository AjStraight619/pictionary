import { motion } from "framer-motion";

// Animation variants for continuous path drawing
const pathDrawingVariants = {
  drawing: (i: number) => ({
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      pathLength: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: i * 1.5,
        repeatDelay: 2,
      },
      opacity: {
        duration: 0.5,
        repeat: Infinity,
        repeatDelay: 7.5,
        ease: "easeInOut",
        delay: i * 1.5,
      },
    },
  }),
};

// Subtle position shifts for container elements
const containerVariants = {
  floating: (i: number) => ({
    x: [0, 10, -5, 0],
    y: [0, -5, 10, 0],
    transition: {
      x: {
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut",
        delay: i * 2,
        repeatType: "loop",
      },
      y: {
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut",
        delay: i * 2,
        repeatType: "loop",
      },
    },
  }),
};

export const AnimatedSvgElements = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      {/* =============== ANIMATED PATH DRAWING ELEMENTS =============== */}

      {/* Squiggly Line - animated path drawing */}
      <motion.div
        className="absolute top-[30%] left-[30%] opacity-70"
        variants={containerVariants}
        animate="floating"
        custom={2}
      >
        <motion.svg width="200" height="100" viewBox="0 0 200 100">
          <motion.path
            d="M10,50 C30,20 50,80 70,50 C90,20 110,80 130,50 C150,20 170,80 190,50"
            fill="none"
            stroke="url(#squiggly-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={pathDrawingVariants}
            initial={{ pathLength: 0, opacity: 0 }}
            animate="drawing"
            custom={2}
          />
          <defs>
            <linearGradient
              id="squiggly-gradient"
              x1="10"
              y1="50"
              x2="190"
              y2="50"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--pictionary-yellow))" />
              <stop offset="0.5" stopColor="hsl(var(--pictionary-pink))" />
              <stop offset="1" stopColor="hsl(var(--pictionary-purple))" />
            </linearGradient>
          </defs>
        </motion.svg>
      </motion.div>

      {/* Spiral - animated path drawing */}
      <motion.div
        className="absolute bottom-[30%] left-[20%] opacity-70"
        variants={containerVariants}
        animate="floating"
        custom={5}
      >
        <motion.svg width="120" height="120" viewBox="0 0 120 120">
          <motion.path
            d="M60,60 m-40,0 a40,40 0 1,1 80,0 a32,32 0 1,0 -64,0 a24,24 0 1,1 48,0 a16,16 0 1,0 -32,0 a8,8 0 1,1 16,0 a4,4 0 1,0 -8,0"
            fill="none"
            stroke="url(#spiral-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={pathDrawingVariants}
            initial={{ pathLength: 0, opacity: 0 }}
            animate="drawing"
            custom={5}
          />
          <defs>
            <linearGradient
              id="spiral-gradient"
              x1="20"
              y1="20"
              x2="100"
              y2="100"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--pictionary-yellow))" />
              <stop offset="0.5" stopColor="hsl(var(--pictionary-pink))" />
              <stop offset="1" stopColor="hsl(var(--pictionary-purple))" />
            </linearGradient>
          </defs>
        </motion.svg>
      </motion.div>

      {/* Star - animated path drawing (bottom right) */}
      <motion.div
        className="absolute bottom-[15%] right-[15%] opacity-70"
        variants={containerVariants}
        animate="floating"
        custom={3}
      >
        <motion.svg width="120" height="120" viewBox="0 0 120 120">
          <motion.path
            d="M60,10 L70,40 L100,40 L75,60 L85,90 L60,75 L35,90 L45,60 L20,40 L50,40 Z"
            fill="url(#star-fill-gradient)"
            fillOpacity="0.08"
            stroke="url(#star-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={pathDrawingVariants}
            initial={{ pathLength: 0, opacity: 0 }}
            animate="drawing"
            custom={3}
          />
          <defs>
            <linearGradient
              id="star-gradient"
              x1="20"
              y1="10"
              x2="100"
              y2="90"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--pictionary-pink))" />
              <stop offset="1" stopColor="hsl(var(--pictionary-yellow))" />
            </linearGradient>
            <linearGradient
              id="star-fill-gradient"
              x1="20"
              y1="10"
              x2="100"
              y2="90"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                stopColor="hsl(var(--pictionary-pink))"
                stopOpacity="0.15"
              />
              <stop
                offset="1"
                stopColor="hsl(var(--pictionary-yellow))"
                stopOpacity="0.15"
              />
            </linearGradient>
          </defs>
        </motion.svg>
      </motion.div>
    </div>
  );
};
