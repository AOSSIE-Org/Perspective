"use client";

interface ArrowPointerProps {
  className?: string;
}

export function ArrowPointer({ className = "w-5 h-5" }: ArrowPointerProps) {
  return (
    <svg
      viewBox="19 13 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M36.0756 26.6565C34.7086 27.1842 33.628 28.2648 33.1003 29.6318L30.5686 36.1896C30.135 37.3128 28.5387 37.2924 28.1339 36.1584L21.024 16.2399C20.6557 15.2081 21.6519 14.2119 22.6837 14.5802L42.6022 21.6902C43.7361 22.0949 43.7566 23.6912 42.6333 24.1248L36.0756 26.6565Z"
        fill="currentColor"
      />
      <path
        d="M20.2651 16.5108C19.6684 14.839 21.2828 13.2246 22.9546 13.8214L42.8726 20.9317C44.7098 21.5875 44.7432 24.1735 42.9233 24.876L36.3657 27.4083C35.2107 27.8542 34.298 28.7669 33.8521 29.9219L31.3198 36.4796C30.6173 38.2994 28.0313 38.266 27.3755 36.4288L20.2651 16.5108Z"
        stroke="var(--background)"
        strokeWidth="1.61"
      />
    </svg>
  );
}

export default ArrowPointer;
