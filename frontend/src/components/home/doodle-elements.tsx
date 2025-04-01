import { DoodleElement } from "./doodle-element";

export const DoodleElements = () => (
  <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
    {/* Keep one cloud doodle */}
    <DoodleElement
      className="-top-10 -left-20 opacity-20 animate-float"
      style={{ animationDelay: "0s" }}
    >
      <svg
        width="250"
        height="120"
        viewBox="0 0 250 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M54.5 78.5C25.7 78.5 2 61.3 2 40C2 18.7 25.7 1.5 54.5 1.5C67.9 1.5 80.2 6.2 89 14C97.9 5.8 110.6 1 124.5 1C152.4 1 175 17.9 175 38.5C175 40.3 174.8 42 174.5 43.7C210.4 46.1 239 66.2 239 90.5C239 116.1 206.8 137 167 137C141.9 137 119.8 128.5 107 115.3C98.9 120.3 88.8 123.5 78 123.5C49.2 123.5 25.5 106.3 25.5 85C25.5 83.9 25.6 82.8 25.7 81.7C16.9 80.5 9.1 77.8 3 73.9"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </DoodleElement>

    {/* Balloon doodle */}
    <DoodleElement
      className="top-20 right-10 opacity-15 animate-float"
      style={{ animationDelay: "1.5s" }}
    >
      <svg
        width="100"
        height="120"
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M50 10C50 10 60 0 70 0C80 0 90 10 90 20C90 30 80 40 70 40C60 40 50 30 50 20C50 10 50 10 50 10Z"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M50 40L50 60"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </DoodleElement>

    {/* Heart doodle */}
    <DoodleElement
      className="bottom-40 left-10 opacity-20 animate-float"
      style={{ animationDelay: "2.2s" }}
    >
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M40 70C40 70 60 50 60 30C60 20 50 10 40 10C30 10 20 20 20 30C20 50 40 70 40 70Z"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </DoodleElement>

    {/* Pencil doodle */}
    <DoodleElement
      className="bottom-20 right-5 opacity-15 animate-float"
      style={{ animationDelay: "3s" }}
    >
      <svg
        width="100"
        height="30"
        viewBox="0 0 100 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 15C5 15 20 5 35 10C50 15 45 25 60 25C75 25 80 15 95 20"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </DoodleElement>

    {/* Star doodle */}
    <DoodleElement
      className="top-1/2 left-5 opacity-20 animate-float"
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
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </DoodleElement>

    {/* Circle doodle */}
    <DoodleElement
      className="top-2/3 right-20 opacity-15 animate-float"
      style={{ animationDelay: "2.5s" }}
    >
      <svg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="30"
          cy="30"
          r="25"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </svg>
    </DoodleElement>

    {/* Triangle doodle */}
    <DoodleElement
      className="top-32 left-1/4 opacity-20 animate-float"
      style={{ animationDelay: "1.2s" }}
    >
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M40 10L70 70H10L40 10Z"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </DoodleElement>

    {/* Square with dots doodle */}
    <DoodleElement
      className="bottom-1/4 right-1/4 opacity-15 animate-float"
      style={{ animationDelay: "3.5s" }}
    >
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="10"
          y="10"
          width="60"
          height="60"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <circle cx="30" cy="30" r="2" fill="white" />
        <circle cx="50" cy="30" r="2" fill="white" />
        <circle cx="30" cy="50" r="2" fill="white" />
        <circle cx="50" cy="50" r="2" fill="white" />
      </svg>
    </DoodleElement>

    {/* Lightning bolt doodle */}
    <DoodleElement
      className="top-3/4 left-1/3 opacity-20 animate-float"
      style={{ animationDelay: "2.8s" }}
    >
      <svg
        width="60"
        height="80"
        viewBox="0 0 60 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M30 5L20 40H35L25 75L40 40H25L30 5Z"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </DoodleElement>

    {/* Moon doodle */}
    <DoodleElement
      className="top-1/4 right-1/3 opacity-15 animate-float"
      style={{ animationDelay: "1.8s" }}
    >
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M40 10C50 10 60 20 60 30C60 40 50 50 40 50C30 50 20 40 20 30C20 20 30 10 40 10Z"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </DoodleElement>
  </div>
);
