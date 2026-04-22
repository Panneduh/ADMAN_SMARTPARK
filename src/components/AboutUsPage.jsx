import { useNavigate } from "react-router-dom";

export default function AboutUsPage() {
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
              onClick={() => navigate("/team")}
              className="rounded-full border border-transparent px-4 py-2 text-sm font-semibold tracking-wide text-[#6F4A2E] transition hover:border-[#E6C4B7] hover:bg-[#FCDDD3]"
            >
              Meet the Team
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
              About Us
            </p>
            <h1 className="font-serif text-5xl leading-tight text-[#6F4A2E] sm:text-6xl">
              Our Senior Design Journey
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#2F4F4F]">
              ADMAN Technologies created the Smart Parking Guidance System as part
              of our senior design experience at the University of Memphis. This
              project brought together design, prototyping, software, testing,
              teamwork, and communication into one complete engineering project.
            </p>
          </div>

          <figure className="rounded-[2rem] border border-[#E6C4B7] bg-white/75 p-4 shadow-sm">
            <div className="overflow-hidden rounded-[1.5rem] border-2 border-dashed border-[#E6C4B7] bg-[#F2ECE1]">
              <img
                src="/about/about-hero.jpeg"
                alt="Our Team During On-Site Project Development"
                className="h-[420px] w-full object-contain object-center"
              />
            </div>
            <figcaption className="mt-3 text-center text-sm italic text-[#6F4A2E]">
                Our Team During On-Site Project Development
            </figcaption>
          </figure>
        </section>

        {/* Senior Design */}
        <section className="mt-12 grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr]">
          <figure className="rounded-[2rem] border border-[#E6C4B7] bg-white/75 p-4 shadow-sm">
            <div className="overflow-hidden rounded-[1.5rem] border-2 border-dashed border-[#E6C4B7] bg-[#F2ECE1]">
              <img
                src="/about/senior-design.jpeg"
                alt="Senior design project work"
                className="h-[420px] w-full object-cover object-center"
              />
            </div>
            <figcaption className="mt-3 text-center text-sm italic text-[#6F4A2E]">
                Camera System Deployment for Real-Time Parking Detection
            </figcaption>
          </figure>

          <div>
            <h2 className="font-serif text-4xl text-[#6F4A2E]">Senior Design</h2>
            <p className="mt-4 text-base leading-8 text-[#2F4F4F]">
              Senior Design is the culminating design experience for electrical
              and computer engineering students. In EECE 4280, teams are expected
              to implement a complete engineering project that applies electrical
              and/or computer engineering concepts while also producing oral and
              written presentations. The course focuses on the full design process,
              including requirements, system design, testing, simulation,
              prototyping, project management, teamwork, and technical
              communication.
            </p>
            <p className="mt-4 text-base leading-8 text-[#2F4F4F]">
              For our team, that meant creating a working prototype, documenting
              our decisions, validating performance, and presenting a solution
              that reflects both technical depth and practical value.
            </p>
          </div>
        </section>

        {/* Abstract */}
        <section className="mt-14 grid items-center gap-10 md:grid-cols-[0.95fr_1.05fr]">
          <div className="order-2 md:order-1">
            <h2 className="font-serif text-4xl text-[#6F4A2E]">
              Project Abstract
            </h2>
            <p className="mt-4 text-base leading-8 text-[#2F4F4F]">
              Our Smart Parking Guidance System is a camera-based solution designed
              to report real-time parking availability to drivers and facility
              staff. Instead of making drivers circle parking lots searching for a
              space, the system detects whether individual spaces are occupied from
              an overhead camera view and publishes clear availability information
              through a dashboard.
            </p>
            <p className="mt-4 text-base leading-8 text-[#2F4F4F]">
              The system uses an edge device to process frames locally, analyzes
              predefined parking-space regions, time-stamps results, and sends
              compact occupancy updates to a lightweight backend service. This
              makes the system more practical, lower bandwidth, and easier to scale
              to new lots. A web interface then displays counts, lot maps, and
              parking availability in a simple and useful format.
            </p>
          </div>

          <figure className="order-1 rounded-[2rem] border border-[#E6C4B7] bg-white/75 p-4 shadow-sm md:order-2">
            <div className="overflow-hidden rounded-[1.5rem] border-2 border-dashed border-[#E6C4B7] bg-[#F2ECE1]">
              <img
                src="/about/project-abstract.png"
                alt="Smart Parking Guidance System overview"
                className="h-[420px] w-full object-contain object-center"
              />
            </div>
            <figcaption className="mt-3 text-center text-sm italic text-[#6F4A2E]">
              Parking Space Detection and Occupancy Visualization
            </figcaption>
          </figure>
        </section>

        {/* Problem Statement */}
        <section className="mt-14 grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr]">
          <figure className="rounded-[2rem] border border-[#E6C4B7] bg-white/75 p-4 shadow-sm">
            <div className="overflow-hidden rounded-[1.5rem] border-2 border-dashed border-[#E6C4B7] bg-[#F2ECE1]">
              <img
                src="/about/problem-statement.jpeg"
                alt="Problem identification and brainstorming process"
                className="h-[420px] w-full object-cover object-top"
              />
            </div>
            <figcaption className="mt-3 text-center text-sm italic text-[#6F4A2E]">
                Hands-On Exploration During the Problem Identification Phase
            </figcaption>
          </figure>

          <div>
            <h2 className="font-serif text-4xl text-[#6F4A2E]">
              Problem Statement
            </h2>
            <p className="mt-4 text-base leading-8 text-[#2F4F4F]">
              At the beginning of senior design, our team spent time trying to
              identify a problem that was both meaningful and realistic to solve.
              We explored different possibilities, but we wanted something that
              would be practical, useful, and capable of becoming a real system.
            </p>
            <p className="mt-4 text-base leading-8 text-[#2F4F4F]">
              During that process, Aryan Prajapati suggested focusing on the
              parking problem. The idea stood out because parking is something
              students and drivers deal with constantly, especially when lots are
              crowded and drivers waste time searching for open spaces. As we
              discussed it more, we realized it had strong technical potential and
              clear real-world value, so we chose it as our project direction.
            </p>
            <p className="mt-4 text-base leading-8 text-[#2F4F4F]">
              From there, the project evolved into a smart parking guidance system
              aimed at reducing congestion, frustration, and wasted time while
              remaining scalable and cost-effective.
            </p>
          </div>
        </section>

        {/* Quick highlights */}
        <section className="mt-16 rounded-[2rem] bg-[#B7DDDA]/25 px-8 py-10">
          <h2 className="text-center font-serif text-4xl text-[#6F4A2E]">
            What This Project Required
          </h2>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-[1.5rem] bg-white/80 p-6 text-center shadow-sm">
              <h3 className="text-xl font-semibold text-[#6F4A2E]">
                Engineering Design
              </h3>
              <p className="mt-3 leading-7 text-[#2F4F4F]">
                Requirements, system behavior, prototyping, testing, and
                evaluation.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/80 p-6 text-center shadow-sm">
              <h3 className="text-xl font-semibold text-[#6F4A2E]">
                Team Collaboration
              </h3>
              <p className="mt-3 leading-7 text-[#2F4F4F]">
                Communication, planning, coordination, and shared technical
                responsibilities.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/80 p-6 text-center shadow-sm">
              <h3 className="text-xl font-semibold text-[#6F4A2E]">
                Real Deployment Thinking
              </h3>
              <p className="mt-3 leading-7 text-[#2F4F4F]">
                Scalability, maintainability, user experience, and practical
                implementation.
              </p>
            </div>
          </div>
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