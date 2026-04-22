import { useNavigate, useParams } from "react-router-dom";

export default function ComingSoonPage() {
  const navigate = useNavigate();
  const { lotName } = useParams();

  const formatLotName = (slug) => {
    if (!slug) return "This Parking Lot";
    return slug
      .split("-")
      .map((word) => {
        if (word.length === 1) return word.toUpperCase();
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-[#F2ECE1] text-[#6F4A2E] flex flex-col">
      
      {/* HEADER */}
      <header className="border-b border-[#E6C4B7] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex min-h-[88px] max-w-7xl items-center justify-center px-6 lg:px-10">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer transition hover:scale-[1.03]"
          >
            <img
              src="/adman-logo.png"
              alt="ADMAN Logo"
              className="h-16 w-auto object-contain"
            />
            <div className="flex flex-col justify-center leading-tight text-left">
              <p className="text-base font-semibold tracking-[0.28em] text-[#2F4F4F]">
                ADMAN
              </p>
              <p className="text-sm tracking-[0.2em] text-[#2F4F4F]">
                Technologies
              </p>
            </div>
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 rounded-[2rem] border border-[#E6C4B7] bg-white p-8 shadow-md md:grid-cols-2 md:p-14">

          {/* LEFT SIDE → BIG CIRCLE LOGO */}
          <div className="flex flex-col items-center justify-center text-center">
            
            <div className="flex h-[260px] w-[260px] items-center justify-center rounded-full bg-[#2F5D73]/10 shadow-inner">
              <img
                src="/adman-logo.png"
                alt="ADMAN Logo"
                className="h-[140px] w-auto object-contain"
              />
            </div>

            <p className="mt-6 text-lg font-semibold tracking-[0.25em] text-[#2F4F4F]">
              ADMAN
            </p>
            <p className="text-sm tracking-[0.2em] text-[#2F4F4F]">
              Technologies
            </p>

          </div>

          {/* RIGHT SIDE → TEXT */}
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#003087]">
              University of Memphis
            </p>

            <h1
              className="mt-4 text-6xl leading-[0.9] text-[#2F5D73] sm:text-7xl md:text-8xl"
              style={{ fontFamily: "'Pacifico', cursive" }}
            >
              Coming
              <br />
              Soon
            </h1>

            <p className="mt-6 text-2xl font-semibold text-[#6F4A2E] sm:text-3xl">
              {formatLotName(lotName)}
            </p>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#2F4F4F] sm:text-lg">
              This page is under construction. We are working on adding parking
              availability, navigation guidance, and live lot updates soon.
            </p>

            <p
              className="mt-4 text-sm uppercase tracking-[0.2em] text-[#8A8FBF] sm:text-base"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              This page is under construction
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row md:justify-start">
              <button
                onClick={() => navigate("/select-lot")}
                className="rounded-full border-2 border-[#E6C4B7] bg-[#FCDDD3] px-8 py-3 text-base font-semibold tracking-[0.08em] text-[#6F4A2E] transition hover:bg-[#E6C4B7]"
              >
                Back to Parking Lots
              </button>

              <button
                onClick={() => navigate("/")}
                className="rounded-full border-2 border-[#B7DDDA] bg-[#DFF3F1] px-8 py-3 text-base font-semibold tracking-[0.08em] text-[#2F4F4F] transition hover:bg-[#B7DDDA]"
              >
                Back Home
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}