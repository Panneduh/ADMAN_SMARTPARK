import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SPGSLandingPage() {
  const navigate = useNavigate();
  const [aboutOpen, setAboutOpen] = useState(false);

  const aboutMenuItems = [
    { label: "Meet the Team", href: "/team" },
    { label: "Senior Design", href: "/about#senior-design" },
    { label: "Abstract", href: "/about#abstract" },
    { label: "Problem Statement", href: "/about#problem-statement" },
  ];

  const navItems = [
    { label: "Acknowledgements", href: "/acknowledgements" },
    { label: "Future Implementation", href: "/future" },
    { label: "Gallery", href: "/gallery" },
  ];

  const handleNav = (target) => {
    setAboutOpen(false);

    if (target.includes("#")) {
      window.location.href = target;
    } else {
      navigate(target);
    }
  };

  const clouds = [
    "top-24 left-12",
    "top-40 right-24",
    "bottom-24 left-24",
    "bottom-16 right-16",
    "top-1/2 left-1/2 -translate-x-1/2",
  ];

  const balloons = [
    "top-36 left-1/4",
    "bottom-32 right-1/4",
  ];

  const birds = [
    "top-1/3 left-16",
    "top-1/4 right-28",
    "bottom-1/4 right-1/3",
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#B7DDDA] text-[#6F4A2E]">
      <header className="relative z-20 border-b border-[#E6C4B7] bg-[#F2ECE1]/90 backdrop-blur-sm">
        <div className="mx-auto flex min-h-[88px] max-w-7xl items-center justify-between px-6 lg:px-10">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-xl transition hover:scale-[1.02]"
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

          <nav className="hidden items-center gap-3 md:flex">
            <div
              className="relative group"
            >
              <button
                onClick={() => setAboutOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-sm font-semibold tracking-wide text-[#6F4A2E] transition hover:border-[#E6C4B7] hover:bg-[#FCDDD3]"
              >
                About Us
                <span
                  className={`transition-transform duration-200 ${
                    aboutOpen ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </button>

              {aboutOpen && (
                <div className="absolute left-0 top-full z-30 mt-2 pt-2 w-64">
                  <div className="overflow-hidden rounded-2xl border border-[#E6C4B7] bg-white shadow-lg">
                  {aboutMenuItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleNav(item.href)}
                      className="block w-full border-b border-[#E6C4B7] px-5 py-4 text-left text-sm font-medium text-[#2F4F4F] transition last:border-b-0 hover:bg-[#FCDDD3]/35"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              )}
            </div>

            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.href)}
                className="rounded-full border border-transparent px-4 py-2 text-sm font-semibold tracking-wide text-[#6F4A2E] transition hover:border-[#E6C4B7] hover:bg-[#FCDDD3]"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative isolate flex min-h-[calc(100vh-88px)] flex-col items-center justify-center px-6 py-12 text-center">
        <div className="absolute inset-0 overflow-hidden">
          {clouds.map((pos, index) => (
            <div
              key={`cloud-${index}`}
              className={`absolute ${pos} h-16 w-32 rounded-full bg-white/40 blur-[1px]`}
            >
              <div className="absolute left-4 top-2 h-12 w-12 rounded-full bg-white/40" />
              <div className="absolute left-10 top-0 h-14 w-14 rounded-full bg-white/40" />
              <div className="absolute left-20 top-3 h-10 w-10 rounded-full bg-white/40" />
            </div>
          ))}

          {balloons.map((pos, index) => (
            <div
              key={`balloon-${index}`}
              className={`absolute ${pos} flex flex-col items-center`}
            >
              <div className="h-24 w-16 rounded-full border-4 border-[#E6C4B7] bg-[#FCDDD3] relative">
                <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-[#B7DDDA]" />
              </div>
              <div className="h-16 w-[2px] bg-[#E6C4B7]" />
              <div className="h-8 w-6 rounded-md bg-white/80" />
            </div>
          ))}

          {birds.map((pos, index) => (
            <div key={`bird-${index}`} className={`absolute ${pos}`}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-12 rounded-full bg-[#75B9BF]/80" />
                <div className="h-8 w-12 rounded-full bg-[#75B9BF]/80 -ml-4" />
                <div className="h-2 w-6 bg-[#FCDDD3]" />
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.42em] text-[#75B9BF] sm:text-base">
            Welcome To
          </p>

          <div className="mt-3 flex items-center justify-center gap-6 text-[#E6C4B7]">
            <span className="h-[2px] w-16 bg-[#E6C4B7]" />
            <span className="text-xl text-[#6F4A2E]">A</span>
            <span className="h-[2px] w-16 bg-[#E6C4B7]" />
          </div>

          <h1 className="mt-6 font-serif text-6xl text-[#6F4A2E] sm:text-7xl md:text-8xl">
            S.P.G.S
          </h1>

          <p className="mt-6 text-2xl font-medium tracking-[0.16em] text-[#6F4A2E] sm:text-3xl">
            Smart Parking Guidance System
          </p>

          <p className="mt-6 text-lg tracking-[0.22em] text-[#2F4F4F] sm:text-2xl">
            ADMAN Technologies
          </p>

          <button
            onClick={() => navigate("/select-lot")}
            className="mt-10 rounded-full border-2 border-[#E6C4B7] bg-[#FCDDD3] px-12 py-4 text-xl font-semibold tracking-[0.12em] text-[#6F4A2E] transition hover:scale-[1.03] hover:bg-[#E6C4B7]"
          >
            Start
          </button>
        </div>

        <div className="relative z-10 mt-16 grid w-full max-w-3xl grid-cols-1 gap-4 md:hidden">
          <div className="rounded-2xl border border-[#E6C4B7] bg-[#F2ECE1]/80 p-4 text-left">
            <p className="mb-3 text-sm font-semibold tracking-wide text-[#6F4A2E]">
              About Us
            </p>
            <div className="grid gap-2">
              {aboutMenuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.href)}
                  className="rounded-xl border border-[#E6C4B7] bg-white px-4 py-3 text-left text-sm font-medium text-[#2F4F4F]"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.href)}
              className="rounded-2xl border border-[#E6C4B7] bg-[#F2ECE1]/80 px-5 py-4 text-sm font-semibold tracking-wide text-[#6F4A2E]"
            >
              {item.label}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}