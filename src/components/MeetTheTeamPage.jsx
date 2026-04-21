import { useNavigate } from "react-router-dom";

const teamMembers = [
  {
    name: "Oluwakanyinsola David Wole-Adetayo",
    role: "Project Manager",
    description:
      "Managed timeline, ensured deadlines were met, and coordinated team progress and external communications.",
  },
  {
    name: "Aryan Prajapati",
    role: "Computer Vision & Embedded AI Engineer",
    description:
      "Designed and implemented real-time parking occupancy detection using YOLO, optimized edge inference, and contributed to system UI.",
  },
  {
    name: "Noah T. McDaniel",
    role: "Computer Vision & Networking Engineer",
    description:
      "Designed system architecture, device communication (server, Raspberry Pi, gate), backend development, and external coordination.",
  },
  {
    name: "Amairani Solis",
    role: "Algorithm Developer & Front-End",
    description:
      "Developed the model for determining parking occupancy, designed the front-end, and managed external communications.",
  },
  {
    name: "Matthew Anderson Kelly",
    role: "Research & Logistics Coordinator",
    description:
      "Researched materials and components, managed project budget, and handled procurement and setup of physical infrastructure.",
  },
];

export default function MeetTheTeamPage() {
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
              onClick={() => navigate("/future")}
              className="rounded-full border border-transparent px-4 py-2 text-sm font-semibold tracking-wide text-[#6F4A2E] transition hover:border-[#E6C4B7] hover:bg-[#FCDDD3]"
            >
              Future Implementation
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
              Meet the Team
            </p>
            <h1 className="font-serif text-5xl leading-tight text-[#6F4A2E] sm:text-6xl">
              The People Behind ADMAN Technologies
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#2F4F4F]">
              Our senior design team brought together strengths in computer vision,
              embedded systems, backend development, front-end design, research,
              logistics, and project coordination to build the Smart Parking
              Guidance System.
            </p>
          </div>

          <figure className="rounded-[2rem] border border-[#E6C4B7] bg-white/75 p-4 shadow-sm">
            <div className="overflow-hidden rounded-[1.5rem] border-2 border-dashed border-[#E6C4B7] bg-[#F2ECE1]">
              <img
                src="/team/1U2A0028.jpg"
                alt="ADMAN Technologies team"
                className="h-[420px] w-full object-cover object-center"
              />
            </div>
            <figcaption className="mt-3 text-center text-sm italic text-[#6F4A2E]">
              ADMAN Technologies Senior Design Team
            </figcaption>
          </figure>
        </section>

        {/* Team Members */}
        <section className="mt-14">
          <div className="mb-8 text-center">
            <h2 className="font-serif text-4xl text-[#6F4A2E]">Team Roles</h2>
            <p className="mt-3 text-base leading-8 text-[#2F4F4F]">
              Each member contributed a key part of the project, helping turn the
              idea into a working smart parking system.
            </p>
          </div>

          <div className="grid gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="rounded-[1.75rem] border border-[#E6C4B7] bg-white/80 p-6 shadow-sm"
              >
                <h3 className="font-serif text-3xl text-[#2F4F4F]">
                  {member.name}
                </h3>
                <p className="mt-2 text-xl font-semibold text-[#6F4A2E]">
                  {member.role}
                </p>
                <p className="mt-3 max-w-5xl text-base leading-8 text-[#2F4F4F]">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing section */}
        <section className="mt-16 rounded-[2rem] bg-[#B7DDDA]/25 px-8 py-10 text-center">
          <h2 className="font-serif text-4xl text-[#6F4A2E]">
            Built Through Collaboration
          </h2>
          <p className="mx-auto mt-4 max-w-4xl text-base leading-8 text-[#2F4F4F]">
            This project was made possible through teamwork, shared responsibility,
            and the combination of technical and organizational skills across the
            group. Each person played an important role in moving the Smart Parking
            Guidance System from concept to implementation.
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