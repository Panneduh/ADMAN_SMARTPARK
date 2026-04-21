import { useNavigate } from "react-router-dom";

const futurePlans = [
  {
    title: "Improve Detection Accuracy",
    text: "Future work can improve parking-space detection by refining the computer vision model, increasing the training dataset, and making the system more reliable under changing lighting, weather, and camera conditions.",
  },
  {
    title: "Expand to Multiple Parking Lots",
    text: "Although the current system is designed as a prototype for one parking area, the same architecture can be extended to support multiple lots across campus through a scalable backend and centralized dashboard.",
  },
  {
    title: "Real-Time Driver Guidance",
    text: "A future version of the project could actively guide drivers toward available parking spaces in real time, helping reduce search time, congestion, and unnecessary driving within lots.",
  },
  {
    title: "Mobile App Integration",
    text: "The system can be expanded beyond a web dashboard by integrating with mobile applications so users can quickly check availability, view parking maps, and receive guidance from their phones.",
  },
];

export default function FutureImplementationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F2ECE1] text-[#2F4F4F]">
      <header className="border-b border-[#E6C4B7] bg-[#F2ECE1]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-2">
            <img
              src="/adman-logo.png"
              alt="ADMAN Logo"
              className="h-16 w-auto object-contain"
            />
            <div className="flex flex-col justify-center leading-tight">
              <p className="text-base font-semibold tracking-[0.28em] text-[#2F4F4F]">
                ADMAN
              </p>
              <p className="text-sm tracking-[0.2em] text-[#2F4F4F]">
                Technologies
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-3 md:flex">
            <button
              onClick={() => navigate("/")}
              className="rounded-full border border-transparent px-4 py-2 text-sm font-semibold tracking-wide text-[#6F4A2E] transition hover:border-[#E6C4B7] hover:bg-[#FCDDD3]"
            >
              Home
            </button>
            <button
              onClick={() => navigate("/about")}
              className="rounded-full border border-transparent px-4 py-2 text-sm font-semibold tracking-wide text-[#6F4A2E] transition hover:border-[#E6C4B7] hover:bg-[#FCDDD3]"
            >
              About Us
            </button>
            <button
              onClick={() => navigate("/team")}
              className="rounded-full border border-transparent px-4 py-2 text-sm font-semibold tracking-wide text-[#6F4A2E] transition hover:border-[#E6C4B7] hover:bg-[#FCDDD3]"
            >
              Meet the Team
            </button>
            <button
              onClick={() => navigate("/gallery")}
              className="rounded-full border border-transparent px-4 py-2 text-sm font-semibold tracking-wide text-[#6F4A2E] transition hover:border-[#E6C4B7] hover:bg-[#FCDDD3]"
            >
              Gallery
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        {/* Hero */}
        <section className="grid items-center gap-8 rounded-[2rem] bg-[#B7DDDA]/35 px-8 py-10 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#75B9BF]">
              Future Implementation
            </p>
            <h1 className="font-serif text-5xl leading-tight text-[#6F4A2E] sm:text-6xl">
              Where the Project Can Go Next
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#2F4F4F]">
              Our Smart Parking Guidance System has reached the stage of a working
              prototype, but there are many opportunities to improve, expand, and
              strengthen the system in future development phases.
            </p>
          </div>

          <figure className="rounded-[2rem] border border-[#E6C4B7] bg-white/75 p-4 shadow-sm">
            <div className="overflow-hidden rounded-[1.5rem] border-2 border-dashed border-[#E6C4B7] bg-[#F2ECE1]">
              <img
                src="/future/IlI3NbaBaDIyCNzil-j-B_8DQP07daLv4MmWKgT6faHB1r-exX-miwoZCIrbzZml7dfAKGHITc7eb5Kjlk-aUwsfwJxZHS7oEINDRvdLUdPZe8xoBylXpefu3YsYftfcUfZZJzyGmQMbSmUgMcsajpqKa-KInvzQGFD_gf57Axwg1uPF-43XIJAJf7EICD5b.jpeg"
                alt="Real-time parking navigation"
                className="h-[420px] w-full object-cover object-center"
              />
            </div>
            <figcaption className="mt-3 text-center text-sm italic text-[#6F4A2E]">
              Future real-time navigation support for drivers
            </figcaption>
          </figure>
        </section>

        {/* Intro */}
        <section className="mt-14 grid items-center gap-10 md:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="font-serif text-4xl text-[#6F4A2E]">
              Future Development Goals
            </h2>
            <p className="mt-4 text-base leading-8 text-[#2F4F4F]">
              Although the project currently demonstrates the main functions of
              parking-space monitoring and occupancy visualization, future work
              can make the system more intelligent, more scalable, and more
              practical for everyday use.
            </p>
            <p className="mt-4 text-base leading-8 text-[#2F4F4F]">
              These next steps focus on improving technical performance while
              also preparing the system for broader deployment and stronger user
              interaction.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#E6C4B7] bg-white/80 p-8 shadow-sm">
            <h3 className="font-serif text-3xl text-[#6F4A2E]">
              Main Direction
            </h3>
            <p className="mt-4 text-base leading-8 text-[#2F4F4F]">
              The long-term vision is to evolve the current prototype into a
              smarter parking platform that supports real-time guidance, broader
              coverage, and smoother integration with modern campus or city
              systems.
            </p>
          </div>
        </section>

        {/* Multi-lot expansion */}
        <section className="mt-14 grid items-center gap-10 md:grid-cols-[1fr_1fr]">
          <figure className="rounded-[2rem] border border-[#E6C4B7] bg-white/75 p-4 shadow-sm">
            <div className="overflow-hidden rounded-[1.5rem] border-2 border-dashed border-[#E6C4B7] bg-[#F2ECE1]">
              <img
                src="/future/1Bflld5kiXJXMzahcmPh2a6iTPYSTrK2_3nLou-2d1s3O-yige7xgV3u2CBkQlsV2Zumx1A_vFgCfXunJ1HVI__LO0F4dalWbKFeDCzmkhDLYjNXwvnsG8AA_uUEeKHyHAWcJGI2HNV38FP2_dvRIJs4Y1iGlKLyZ_xOpAokLXGCPwnK4jKJ6jtWmdwkNCk7.jpeg"
                alt="Multi-lot parking system expansion"
                className="h-[420px] w-full object-cover object-center"
              />
            </div>
            <figcaption className="mt-3 text-center text-sm italic text-[#6F4A2E]">
              Expansion to multiple parking lots and broader campus coverage
            </figcaption>
          </figure>

          <div>
            <h2 className="font-serif text-4xl text-[#6F4A2E]">
              Scalable Deployment
            </h2>
            <p className="mt-4 text-base leading-8 text-[#2F4F4F]">
              The system can be expanded to support multiple parking lots across
              campus, using a centralized backend to manage and display
              real-time occupancy data from different locations.
            </p>
            <p className="mt-4 text-base leading-8 text-[#2F4F4F]">
              This would allow the project to grow beyond a single-lot prototype
              and move closer to a full campus parking solution.
            </p>
          </div>
        </section>

        {/* Mobile app integration */}
        <section className="mt-14 grid items-center gap-10 md:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="font-serif text-4xl text-[#6F4A2E]">
              Mobile Integration
            </h2>
            <p className="mt-4 text-base leading-8 text-[#2F4F4F]">
              Future versions of the system can be integrated into mobile
              applications, allowing users to check parking availability and
              navigate directly to open spaces in real time.
            </p>
            <p className="mt-4 text-base leading-8 text-[#2F4F4F]">
              This would make the parking information more accessible and more
              useful for students, staff, and visitors who rely on their phones
              while traveling across campus.
            </p>
          </div>

          <figure className="rounded-[2rem] border border-[#E6C4B7] bg-white/75 p-4 shadow-sm">
            <div className="overflow-hidden rounded-[1.5rem] border-2 border-dashed border-[#E6C4B7] bg-[#F2ECE1]">
              <img
                src="/future/MLb9-bn8pfJWElH4SeKQXtXGrZmCUh6fWtncnlXcC7GvLvCLANFI3LglpmtusiwWdcMSokITFe9hA3RgfkIsaY2aQ_X_berUu_zLr0301O7fEK0XzI3vhUZ8aTDzl8ERaM0dgrsdC-yUdRHG4TX6x1CaNT0LV15r_Z8lSYqGFD0.jpeg"
                alt="Mobile parking application integration"
                className="h-[420px] w-full object-cover object-center"
              />
            </div>
            <figcaption className="mt-3 text-center text-sm italic text-[#6F4A2E]">
              Mobile app access for parking availability and guidance
            </figcaption>
          </figure>
        </section>

        {/* Key areas */}
        <section className="mt-16">
          <h2 className="text-center font-serif text-4xl text-[#6F4A2E]">
            Key Areas for Improvement
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {futurePlans.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.75rem] border border-[#E6C4B7] bg-white/80 p-7 shadow-sm"
              >
                <h3 className="text-2xl font-semibold text-[#6F4A2E]">
                  {item.title}
                </h3>
                <p className="mt-4 text-base leading-8 text-[#2F4F4F]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing */}
        <section className="mt-16 rounded-[2rem] bg-[#B7DDDA]/25 px-8 py-10 text-center">
          <h2 className="font-serif text-4xl text-[#6F4A2E]">
            Building Beyond the Prototype
          </h2>
          <p className="mx-auto mt-4 max-w-4xl text-base leading-8 text-[#2F4F4F]">
            This project already demonstrates a practical smart parking concept,
            but future implementation can make it more accurate, more connected,
            and more valuable in real-world environments. With continued
            development, the system can grow from a senior design prototype into
            a stronger smart infrastructure solution.
          </p>
        </section>

        <div className="mt-12 flex justify-center">
          <button
            onClick={() => navigate("/")}
            className="rounded-full border-2 border-[#E6C4B7] bg-[#FCDDD3] px-8 py-3 text-base font-semibold tracking-[0.14em] text-[#6F4A2E] transition hover:bg-[#E6C4B7]"
          >
            Back Home
          </button>
        </div>
      </main>
    </div>
  );
}