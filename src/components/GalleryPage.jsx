import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function getFileType(path) {
  const lower = path.toLowerCase();

  if (lower.match(/\.(jpg|jpeg|png|webp)$/)) return "image";
  if (lower.match(/\.(mp4|mov|webm)$/)) return "video";

  return "unknown";
}

function formatTitle(filename, index, type) {
    return type === "video"
      ? `Project Video ${index + 1}`
      : `Project Image ${index + 1}`;
  }

export default function GalleryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/gallery/gallery.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load gallery.json");
        }
        return res.json();
      })
      .then((files) => {
        const mapped = files
          .map((file, index) => {
            const type = getFileType(file);
            return {
              id: index + 1,
              file,
              src: `/gallery/${file}`,
              type,
              title: formatTitle(file, index, type),
            };
          })
          .filter((item) => item.type !== "unknown");

        setItems(mapped);
      })
      .catch((error) => {
        console.error("Gallery load error:", error);
        setItems([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredItems = useMemo(() => {
    if (activeFilter === "images") {
      return items.filter((item) => item.type === "image");
    }
    if (activeFilter === "videos") {
      return items.filter((item) => item.type === "video");
    }
    return items;
  }, [items, activeFilter]);

  const imageCount = items.filter((item) => item.type === "image").length;
  const videoCount = items.filter((item) => item.type === "video").length;

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
              onClick={() => navigate("/future-implementation")}
              className="rounded-full border border-transparent px-4 py-2 text-sm font-semibold tracking-wide text-[#6F4A2E] transition hover:border-[#E6C4B7] hover:bg-[#FCDDD3]"
            >
              Future Implementation
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <section className="grid items-center gap-8 rounded-[2rem] bg-[#B7DDDA]/35 px-8 py-10 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#75B9BF]">
              Project Gallery
            </p>
            <h1 className="font-serif text-5xl leading-tight text-[#6F4A2E] sm:text-6xl">
              Images and Videos from the Project
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#2F4F4F]">
              Explore visual highlights from the Smart Parking Guidance System,
              including captured parking-lot images, demo media, and project
              progress content collected throughout development.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#E6C4B7] bg-white/80 p-8 shadow-sm">
            <h2 className="font-serif text-3xl text-[#6F4A2E]">
              Gallery Overview
            </h2>
            <div className="mt-5 grid grid-cols-3 gap-4">
              <div className="rounded-[1.4rem] border border-[#E6C4B7] bg-[#FCDDD3]/60 px-5 py-4 text-center">
                <p className="text-3xl font-semibold text-[#6F4A2E]">{items.length}</p>
                <p className="mt-1 text-sm font-medium text-[#2F4F4F]">Total Media</p>
              </div>
              <div className="rounded-[1.4rem] border border-[#E6C4B7] bg-white px-5 py-4 text-center">
                <p className="text-3xl font-semibold text-[#6F4A2E]">{imageCount}</p>
                <p className="mt-1 text-sm font-medium text-[#2F4F4F]">Images</p>
              </div>
              <div className="rounded-[1.4rem] border border-[#E6C4B7] bg-white px-5 py-4 text-center">
                <p className="text-3xl font-semibold text-[#6F4A2E]">{videoCount}</p>
                <p className="mt-1 text-sm font-medium text-[#2F4F4F]">Videos</p>
              </div>
            </div>
            <p className="mt-5 text-base leading-8 text-[#2F4F4F]">
              Use the filters below to view all media, only still images, or
              only video clips.
            </p>
          </div>
        </section>

        <section className="mt-14">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-serif text-4xl text-[#6F4A2E]">
                Media Collection
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-[#2F4F4F]">
                This gallery brings together the visual side of the project,
                making it easier to present system development, demonstrations,
                testing progress, and the overall impact of the Smart Parking
                Guidance System.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveFilter("all")}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold tracking-wide transition ${
                  activeFilter === "all"
                    ? "border-[#E6C4B7] bg-[#FCDDD3] text-[#6F4A2E]"
                    : "border-[#E6C4B7] bg-white text-[#6F4A2E] hover:bg-[#FCDDD3]/60"
                }`}
              >
                All Media
              </button>
              <button
                onClick={() => setActiveFilter("images")}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold tracking-wide transition ${
                  activeFilter === "images"
                    ? "border-[#E6C4B7] bg-[#FCDDD3] text-[#6F4A2E]"
                    : "border-[#E6C4B7] bg-white text-[#6F4A2E] hover:bg-[#FCDDD3]/60"
                }`}
              >
                Images
              </button>
              <button
                onClick={() => setActiveFilter("videos")}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold tracking-wide transition ${
                  activeFilter === "videos"
                    ? "border-[#E6C4B7] bg-[#FCDDD3] text-[#6F4A2E]"
                    : "border-[#E6C4B7] bg-white text-[#6F4A2E] hover:bg-[#FCDDD3]/60"
                }`}
              >
                Videos
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-[2rem] border border-[#E6C4B7] bg-white/80 p-6 shadow-sm sm:p-8">
            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-[1.5rem] border-2 border-dashed border-[#E6C4B7] bg-[#F2ECE1]">
                <p className="text-lg font-medium text-[#6F4A2E]">
                  Loading gallery...
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-[1.5rem] border-2 border-dashed border-[#E6C4B7] bg-[#F2ECE1] px-6 text-center">
                <div>
                  <h3 className="font-serif text-3xl text-[#6F4A2E]">
                    No media found
                  </h3>
                  <p className="mt-4 text-base leading-8 text-[#2F4F4F]">
                    Make sure your files are listed inside
                    {" "}
                    <span className="font-semibold">public/gallery/gallery.json</span>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="overflow-hidden rounded-[1.75rem] border border-[#E6C4B7] bg-[#F2ECE1] text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="relative h-[280px] overflow-hidden border-b border-[#E6C4B7] bg-[#EED9C9]">
                      {item.type === "image" ? (
                        <img
                          src={item.src}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
                        />
                      ) : (
                        <>
                          <video
                            src={item.src}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                          <div className="absolute inset-0 bg-[#2F4F4F]/20" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="rounded-full border border-[#E6C4B7] bg-white/90 px-5 py-2 text-sm font-semibold text-[#6F4A2E] shadow-sm">
                              ▶ Play Video
                            </div>
                          </div>
                        </>
                      )}

                      <div className="absolute left-4 top-4 rounded-full border border-[#E6C4B7] bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6F4A2E]">
                        {item.type}
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="line-clamp-2 text-2xl font-semibold text-[#6F4A2E]">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-[#2F4F4F]">
                        {item.type === "video"
                          ? "Click to open and play this project video."
                          : "Click to preview this project image in full view."}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-16 rounded-[2rem] bg-[#B7DDDA]/25 px-8 py-10 text-center">
          <h2 className="font-serif text-4xl text-[#6F4A2E]">
            Visualizing the Smart Parking Project
          </h2>
          <p className="mx-auto mt-4 max-w-4xl text-base leading-8 text-[#2F4F4F]">
            The gallery helps communicate the progress and practical value of the
            Smart Parking Guidance System by showing real media from development,
            testing, and presentation stages in a cleaner and more engaging way.
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

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2F4F4F]/70 px-4 py-6 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[#E6C4B7] bg-[#F2ECE1] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E6C4B7] bg-white/80 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#75B9BF]">
                  {selectedItem.type}
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-[#6F4A2E]">
                  {selectedItem.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-full border border-[#E6C4B7] bg-[#FCDDD3] px-4 py-2 text-sm font-semibold text-[#6F4A2E] transition hover:bg-[#E6C4B7]"
              >
                Close
              </button>
            </div>

            <div className="flex max-h-[80vh] items-center justify-center bg-[#F2ECE1] p-4 sm:p-6">
              {selectedItem.type === "image" ? (
                <img
                  src={selectedItem.src}
                  alt={selectedItem.title}
                  className="max-h-[72vh] w-auto max-w-full rounded-[1.5rem] border border-[#E6C4B7] object-contain shadow-sm"
                />
              ) : (
                <video
                  src={selectedItem.src}
                  controls
                  autoPlay
                  className="max-h-[72vh] w-full rounded-[1.5rem] border border-[#E6C4B7] bg-black object-contain shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}