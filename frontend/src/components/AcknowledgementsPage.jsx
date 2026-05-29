import { useNavigate } from "react-router-dom";

const acknowledgements = [
  {
    name: "Dr. Kevin Berisso",
    role: "Faculty Advisor",
    image: "/acknowledgements/kevin-berisso.jpg",
    imageAlt: "Dr. Kevin Berisso",
    links: [
      { label: "University Profile", href: "https://www.memphis.edu/et/faculty/berisso.php" },
      { label: "CAESER Profile", href: "https://caeser.memphis.edu/kevin-berisso-3/" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/kevinberisso/" },
    ],
    description:
      "We would like to extend our sincere gratitude to Dr. Kevin Berisso for his outstanding guidance and support throughout the development of this project. From the very beginning, he played a crucial role in shaping our direction by providing thoughtful feedback, technical insight, and consistent encouragement. Dr. Berisso not only offered invaluable advice but also ensured we had access to the resources and workspace needed to bring our ideas to life. He was always willing to assist, whether it was helping us navigate challenges, connecting us with the right people, or supporting our communication and project development efforts. His dedication, mentorship, and belief in our team made a lasting impact on our success. We are truly grateful for his support and proud to have worked under his guidance.",
  },
  {
    name: "Swazoo Claybon Jr.",
    role: "Facilities & Access Support",
    image: "/acknowledgements/swazoo-claybon.jpg",
    imageAlt: "Swazoo Claybon Jr.",
    links: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/swazoo-claybon-jr-1020a286/" },
    ],
    description:
      "We would like to express our sincere appreciation to Swazoo Claybon Jr. for his invaluable support in providing access to key project locations. Thanks to his flexibility and willingness to accommodate our schedule, we were able to explore multiple rooftops across the Engineering buildings and carefully evaluate the best setup for our system. His assistance played a critical role in helping us ultimately select the Eric Building as our project site. Whether it was coordinating access or meeting with us on short notice, Swazoo consistently went out of his way to support our team. We are truly grateful for his time, effort, and continued support throughout our project.",
  },
  {
    name: "David Greganti",
    role: "Project Support & Coordination",
    image: "/acknowledgements/david-greganti.png",
    imageAlt: "David Greganti",
    links: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/david-greganti-39763912/" },
    ],
    description:
      "We would like to thank David Greganti for his support during the early stages of our project. He played a key role in helping us get connected with the right resources, particularly by introducing us to Swazoo and assisting us in securing access to necessary project locations. David was one of the first individuals we reached out to, and his responsiveness and willingness to help made a significant difference as we began navigating the logistics of our project. His guidance and support helped set a strong foundation for our team’s progress. We truly appreciate his assistance and the impact he had on getting our project off the ground.",
  },
  {
    name: "Brad Lentz",
    role: "Gate Systems & Technical Support",
    image: null,
    imageAlt: "Brad Lentz placeholder profile",
    links: [
      { label: "Email", href: "mailto:Brad.lentz@amanomcgann.com" },
    ],
    description:
      "We would like to sincerely thank Brad Lentz for his support and expertise in assisting with the parking gate system. As an on-site gate technician working closely with parking services, Brad played a key role in helping us understand and work with the gate modulation aspects of our project. He was incredibly reliable and always willing to step in whenever we needed assistance. His responsiveness and hands-on support made a significant difference, especially when navigating technical challenges related to the gate system. We truly appreciate his time, effort, and dedication in helping us move our project forward.",
  },
];

function PlaceholderProfile() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#B7DDDA]/25">
      <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-[#E6C4B7] bg-white shadow-sm">
        <svg
          viewBox="0 0 24 24"
          className="h-16 w-16 text-[#6F4A2E]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    </div>
  );
}

export default function AcknowledgementsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F2ECE1] text-[#2F4F4F]">
      <header className="border-b border-[#E6C4B7] bg-[#F2ECE1]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
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
        <section className="rounded-[2rem] bg-[#B7DDDA]/35 px-8 py-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#75B9BF]">
            Acknowledgements
          </p>
          <h1 className="font-serif text-5xl leading-tight text-[#6F4A2E] sm:text-6xl">
            With Gratitude
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[#2F4F4F]">
            We would like to recognize the individuals who supported our team throughout
            the development of the Smart Parking Guidance System. Their guidance,
            coordination, technical support, and willingness to help made a meaningful
            difference in bringing this project to life.
          </p>
        </section>

        <section className="mt-14">
          <div className="mb-8 text-center">
            <h2 className="font-serif text-4xl text-[#6F4A2E]">
              Project Supporters
            </h2>
            <p className="mt-3 text-base leading-8 text-[#2F4F4F]">
              The following individuals played important roles in advising, supporting,
              and strengthening our project from concept to implementation.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {acknowledgements?.map((person) => (
              <article
                key={person.name}
                className="overflow-hidden rounded-[1.9rem] border border-[#E6C4B7] bg-white/85 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative h-[360px] overflow-hidden bg-[#F2ECE1]">
                  {person.image ? (
                    <img
                      src={person.image}
                      alt={person.imageAlt}
                      className={`h-full w-full object-cover ${
                        person.name === "Dr. Kevin Berisso"
                            ? "object-[center_%]"
                            : person.name === "Swazoo Claybon Jr."
                            ? "object-[center_15%]"
                            : person.name === "David Greganti"
                            ? "object-[center_25%]"
                            : "object-center"
                        }`}
                    />
                  ) : (
                    <PlaceholderProfile />
                  )}

                </div>

                <div className="px-6 pb-7 pt-16 text-center">
                  <h3 className="font-serif text-3xl text-[#6F4A2E]">
                    {person.name}
                  </h3>
                  <p className="mt-2 text-lg font-semibold text-[#2F5D73]">
                    {person.role}
                  </p>

                  <p className="mt-5 text-base leading-8 text-[#2F4F4F]">
                    {person.description}
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {person.links?.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                        rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"}
                        className="rounded-full border border-[#E6C4B7] bg-[#FCDDD3]/55 px-4 py-2 text-sm font-semibold tracking-wide text-[#6F4A2E] transition hover:bg-[#E6C4B7]"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-[2rem] bg-[#B7DDDA]/25 px-8 py-10 text-center">
          <h2 className="font-serif text-4xl text-[#6F4A2E]">
            Thank You for Your Support
          </h2>
          <p className="mx-auto mt-4 max-w-4xl text-base leading-8 text-[#2F4F4F]">
            This project was shaped not only by the effort of our team, but also by the
            generosity, mentorship, and support of the people around us. We are truly
            grateful for the time, guidance, and opportunities they provided along the way.
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