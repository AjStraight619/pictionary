import { DoodleElement } from "./doodle-element";

export const DoodleElements = () => (
  <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
    {/* Star doodle with gradient fill - moved to top corner */}
    <DoodleElement
      className="top-[15%] left-[25%] opacity-35"
      style={{ animationDelay: "0.8s" }}
    >
      <svg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M30 5L35 20H50L40 30L45 45L30 35L15 45L20 30L10 20H25L30 5Z"
          stroke="url(#star-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="url(#star-fill-gradient)"
          fillOpacity="0.15"
        />
        <defs>
          <linearGradient
            id="star-gradient"
            x1="10"
            y1="5"
            x2="50"
            y2="45"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FACC15" /> {/* yellow-400 */}
            <stop offset="1" stopColor="#EC4899" /> {/* pink-500 */}
          </linearGradient>
          <linearGradient
            id="star-fill-gradient"
            x1="10"
            y1="5"
            x2="50"
            y2="45"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FACC15" stopOpacity="0.2" /> {/* yellow-400 */}
            <stop offset="1" stopColor="#EC4899" stopOpacity="0.2" />{" "}
            {/* pink-500 */}
          </linearGradient>
        </defs>
      </svg>
    </DoodleElement>

    {/* Dots doodle  */}
    <DoodleElement
      className="top-[12%] right-[10%] opacity-30"
      style={{ animationDelay: "3.5s" }}
    >
      <svg
        width="100"
        height="100"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="20" cy="20" r="5" fill="url(#dot1-gradient)" />
        <circle cx="50" cy="20" r="5" fill="url(#dot2-gradient)" />
        <circle cx="80" cy="20" r="5" fill="url(#dot3-gradient)" />
        <circle cx="20" cy="50" r="5" fill="url(#dot4-gradient)" />
        <circle cx="50" cy="50" r="5" fill="url(#dot5-gradient)" />
        <circle cx="80" cy="50" r="5" fill="url(#dot6-gradient)" />
        <circle cx="20" cy="80" r="5" fill="url(#dot7-gradient)" />
        <circle cx="50" cy="80" r="5" fill="url(#dot8-gradient)" />
        <circle cx="80" cy="80" r="5" fill="url(#dot9-gradient)" />
        <defs>
          <linearGradient
            id="dot1-gradient"
            x1="15"
            y1="15"
            x2="25"
            y2="25"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FACC15" /> {/* yellow-400 */}
            <stop offset="1" stopColor="#EC4899" /> {/* pink-500 */}
          </linearGradient>
          <linearGradient
            id="dot2-gradient"
            x1="45"
            y1="15"
            x2="55"
            y2="25"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#EC4899" /> {/* pink-500 */}
            <stop offset="1" stopColor="#A855F7" /> {/* purple-500 */}
          </linearGradient>
          <linearGradient
            id="dot3-gradient"
            x1="75"
            y1="15"
            x2="85"
            y2="25"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FACC15" /> {/* yellow-400 */}
            <stop offset="1" stopColor="#A855F7" /> {/* purple-500 */}
          </linearGradient>
          <linearGradient
            id="dot4-gradient"
            x1="15"
            y1="45"
            x2="25"
            y2="55"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#A855F7" /> {/* purple-500 */}
            <stop offset="1" stopColor="#EC4899" /> {/* pink-500 */}
          </linearGradient>
          <linearGradient
            id="dot5-gradient"
            x1="45"
            y1="45"
            x2="55"
            y2="55"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FACC15" /> {/* yellow-400 */}
            <stop offset="1" stopColor="#EC4899" /> {/* pink-500 */}
          </linearGradient>
          <linearGradient
            id="dot6-gradient"
            x1="75"
            y1="45"
            x2="85"
            y2="55"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#EC4899" /> {/* pink-500 */}
            <stop offset="1" stopColor="#FACC15" /> {/* yellow-400 */}
          </linearGradient>
          <linearGradient
            id="dot7-gradient"
            x1="15"
            y1="75"
            x2="25"
            y2="85"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FACC15" /> {/* yellow-400 */}
            <stop offset="1" stopColor="#A855F7" /> {/* purple-500 */}
          </linearGradient>
          <linearGradient
            id="dot8-gradient"
            x1="45"
            y1="75"
            x2="55"
            y2="85"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#A855F7" /> {/* purple-500 */}
            <stop offset="1" stopColor="#FACC15" /> {/* yellow-400 */}
          </linearGradient>
          <linearGradient
            id="dot9-gradient"
            x1="75"
            y1="75"
            x2="85"
            y2="85"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#EC4899" /> {/* pink-500 */}
            <stop offset="1" stopColor="#A855F7" /> {/* purple-500 */}
          </linearGradient>
        </defs>
      </svg>
    </DoodleElement>
  </div>
);
