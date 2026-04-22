import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://18.218.74.121";
const LIVE_IMAGE_URL = `${API_BASE}/latest-lot-image`;
const FALLBACK_LIVE_IMAGE = "/parking/engineering-live-view.png";
const WS_BASE = "ws://18.218.74.121";

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=35.1495&longitude=-90.049&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit&timezone=America%2FChicago";

const LOT_LAYOUT = {
  front: [
    "PS1",
    "PS2",
    "PS3",
    "PS4",
    "PS5",
    "PS6",
    "PS7",
    "PS8",
    "PS9",
    "PS10",
    "PS11",
  ],
  middle: [
    "PS12",
    "PS13",
    "PS14",
    "PS15",
    "PS16",
    "PS17",
    "PS18",
    "PS19",
    "PS20",
    "PS21",
    "PS22",
  ],
  upper: [
    "PS23",
    "PS24",
    "PS25",
    "PS26",
    "PS27",
    "PS28",
    "PS29",
    "PS30",
    "PS31",
    "PS32",
  ],
  backTop: ["PS33", "PS34", "PS35", "PS36", "PS37", "PS38", "PS39", "PS40"],
};

const ACCESSIBLE_SPOTS = new Set(["PS30", "PS31", "PS32", "PS39", "PS40"]);

function CarIcon() {
  return (
    <div className="relative h-4 w-7">
      <div className="absolute inset-x-1 top-0.5 h-3 rounded-[8px] bg-[#D95C59]" />
      <div className="absolute left-1.5 right-1.5 top-1.5 h-1.5 rounded-[5px] bg-[#F5B7B5]" />
      <div className="absolute -top-0.5 left-1.5 h-1.5 w-1.5 rounded-full bg-[#3D3D3D]" />
      <div className="absolute -top-0.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#3D3D3D]" />
      <div className="absolute -bottom-0.5 left-1.5 h-1.5 w-1.5 rounded-full bg-[#3D3D3D]" />
      <div className="absolute -bottom-0.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#3D3D3D]" />
    </div>
  );
}

function computeDirections(selectedSpot) {
  if (!selectedSpot) return [];

  const steps = ["Enter through the gate on the left side of the lot."];
  steps.push("Stay on the bottom driving lane.");

  if (selectedSpot.rowKey === "front") {
    steps.push("Continue straight along the bottom lane.");
    steps.push(`Pull into ${selectedSpot.id}.`);
  } else if (selectedSpot.rowKey === "middle") {
    steps.push("Turn into the vertical aisle between the parking rows.");
    steps.push("Move up to the middle driving lane.");
    steps.push(`Pull into ${selectedSpot.id}.`);
  } else if (selectedSpot.rowKey === "upper") {
    steps.push("Turn into the vertical aisle between the parking rows.");
    steps.push("Move up to the upper driving lane.");
    steps.push(`Pull into ${selectedSpot.id}.`);
  } else {
    steps.push("Turn into the vertical aisle between the parking rows.");
    steps.push("Move up to the upper driving lane.");
    steps.push(`Pull into ${selectedSpot.id}.`);
  }

  steps.push("You have arrived at your destination.");
  return steps;
}


function buildRoutePoints(selectedSpot, selectedPosition) {
  if (!selectedSpot || !selectedPosition) return [];

  // Start around the "T" of the GATE sign
  const gatePoint = { x: 28, y: 332 };

  // Road centerlines
  const bottomRoadY = 332;
  const middleRoadY = 150;
  const topRoadY = 32;
  const leftConnectorX = 58;

  const tileCenterX = selectedPosition.x + selectedPosition.width / 2;

  // Stop on the road in front of the tile, do NOT go into the tile
  if (selectedSpot.rowKey === "front") {
    return [
      gatePoint,
      { x: leftConnectorX, y: bottomRoadY },
      { x: tileCenterX, y: bottomRoadY },
    ];
  }

  if (selectedSpot.rowKey === "middle") {
    return [
      gatePoint,
      { x: leftConnectorX, y: bottomRoadY },
      { x: leftConnectorX, y: middleRoadY },
      { x: tileCenterX, y: middleRoadY },
    ];
  }

  if (selectedSpot.rowKey === "upper") {
    return [
      gatePoint,
      { x: leftConnectorX, y: bottomRoadY },
      { x: leftConnectorX, y: middleRoadY },
      { x: tileCenterX, y: middleRoadY },
    ];
  }

  return [
    gatePoint,
    { x: leftConnectorX, y: bottomRoadY },
    { x: leftConnectorX, y: topRoadY },
    { x: tileCenterX, y: topRoadY },
  ];
}

function buildStructuredRows(statusMap) {
  return Object.entries(LOT_LAYOUT).map(([rowKey, ids]) => ({
    key: rowKey,
    spots: ids.map((id) => ({
      id,
      rowKey,
      status: statusMap.get(id) ?? "unknown",
      accessible: ACCESSIBLE_SPOTS.has(id),
    })),
  }));
}

function getPointAlongRoute(points, progress) {
  if (!points || points.length === 0) return null;
  if (points.length === 1) return points[0];

  const segments = [];
  let totalLength = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const length = Math.sqrt(dx * dx + dy * dy);

    segments.push({
      start: points[i],
      end: points[i + 1],
      length,
    });

    totalLength += length;
  }

  const targetLength = progress * totalLength;
  let walked = 0;

  for (const segment of segments) {
    if (walked + segment.length >= targetLength) {
      const local = (targetLength - walked) / segment.length;

      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * local,
        y: segment.start.y + (segment.end.y - segment.start.y) * local,
      };
    }

    walked += segment.length;
  }

  return points[points.length - 1];
}

function getWeatherInfo(weatherCode, isDay) {
  const day = Number(isDay) === 1;

  const map = {
    0: { label: "Clear", icon: day ? "☀️" : "🌙" },
    1: { label: "Mostly Clear", icon: day ? "🌤️" : "🌙" },
    2: { label: "Partly Cloudy", icon: "⛅" },
    3: { label: "Cloudy", icon: "☁️" },
    45: { label: "Fog", icon: "🌫️" },
    48: { label: "Fog", icon: "🌫️" },
    51: { label: "Light Drizzle", icon: "🌦️" },
    53: { label: "Drizzle", icon: "🌦️" },
    55: { label: "Heavy Drizzle", icon: "🌧️" },
    56: { label: "Freezing Drizzle", icon: "🌧️" },
    57: { label: "Freezing Drizzle", icon: "🌧️" },
    61: { label: "Light Rain", icon: "🌦️" },
    63: { label: "Rain", icon: "🌧️" },
    65: { label: "Heavy Rain", icon: "🌧️" },
    66: { label: "Freezing Rain", icon: "🌧️" },
    67: { label: "Freezing Rain", icon: "🌧️" },
    71: { label: "Light Snow", icon: "🌨️" },
    73: { label: "Snow", icon: "🌨️" },
    75: { label: "Heavy Snow", icon: "❄️" },
    77: { label: "Snow Grains", icon: "❄️" },
    80: { label: "Rain Showers", icon: "🌦️" },
    81: { label: "Rain Showers", icon: "🌧️" },
    82: { label: "Heavy Showers", icon: "⛈️" },
    85: { label: "Snow Showers", icon: "🌨️" },
    86: { label: "Snow Showers", icon: "🌨️" },
    95: { label: "Thunderstorm", icon: "⛈️" },
    96: { label: "Thunderstorm", icon: "⛈️" },
    99: { label: "Thunderstorm", icon: "⛈️" },
  };

  return map[weatherCode] || { label: "Weather", icon: "🌤️" };
}

export default function EngineeringFacultyLotPage() {
  const navigate = useNavigate();
  
  const [viewMode, setViewMode] = useState("map");
  const [selectedSpotId, setSelectedSpotId] = useState(null);
  const [dateTime, setDateTime] = useState(new Date());
  const [apiSpots, setApiSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [liveImageOk, setLiveImageOk] = useState(true);
  const [liveImageTick, setLiveImageTick] = useState(Date.now());

  const [weather, setWeather] = useState({
    temp: null,
    label: "Loading...",
    icon: "🌤️",
  });

  const mapFrameRef = useRef(null);
  const [mapScale, setMapScale] = useState(1);

  const BASE_MAP_WIDTH = 980;
  const BASE_MAP_HEIGHT = 430;



  const [movingCarPoint, setMovingCarPoint] = useState(null);

  useEffect(() => {
    if (viewMode === "live") {
      setLiveImageOk(true);
      setLiveImageTick(Date.now());
    }
  }, [viewMode]);

  


  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function updateMapScale() {
      if (!mapFrameRef.current) return;

      const frameWidth = mapFrameRef.current.clientWidth;
      const frameHeight = mapFrameRef.current.clientHeight;

      const scaleX = frameWidth / BASE_MAP_WIDTH;
      const scaleY = frameHeight / BASE_MAP_HEIGHT;

      setMapScale(Math.min(scaleX, scaleY, 1));
    }

    updateMapScale();
    window.addEventListener("resize", updateMapScale);

    return () => window.removeEventListener("resize", updateMapScale);
  }, []);

  // Initial fetch so the page shows current spot states immediately.
  useEffect(() => {
    let active = true;

    async function loadSpots() {
      try {
        const response = await fetch(`${API_BASE}/spots`);

        if (!response.ok) {
          throw new Error(`Failed to load spots: ${response.status}`);
        }

        const data = await response.json();

        if (!active) return;

        setApiSpots(Array.isArray(data) ? data : []);
        setApiError("");
        setLoading(false);
        setLiveImageTick(Date.now());
      } catch (error) {
        if (!active) return;
        console.error("Error loading spots:", error);
        setApiError("Could not load live parking data.");
        setLoading(false);
      }
    }

    loadSpots();

    return () => {
      active = false;
    };
  }, []);

  // WebSocket for live updates after initial load.
  useEffect(() => {
    let socket = null;
    let reconnectTimer = null;
    let heartbeatTimer = null;
    let isUnmounted = false;

    function connectSocket() {
      socket = new WebSocket(`${WS_BASE}/ws/spots`);

      socket.onopen = () => {
        console.log("WebSocket connected");
        setApiError("");

        heartbeatTimer = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send("ping");
          }
        }, 25000);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "bulk_update" && Array.isArray(message.updates)) {
            setApiSpots((prev) => {
              const prevMap = new Map(prev.map((spot) => [spot.label, spot]));

              for (const update of message.updates) {
                const existing = prevMap.get(update.label);

                if (existing) {
                  prevMap.set(update.label, {
                    ...existing,
                    status: update.status,
                    confidence: update.confidence ?? existing.confidence,
                  });
                }
              }

              setLiveImageTick(Date.now());
              return Array.from(prevMap.values());
            });
          }

          if (message.type === "spot_update" && message.label) {
            setApiSpots((prev) => {
              const prevMap = new Map(prev.map((spot) => [spot.label, spot]));
              const existing = prevMap.get(message.label);

              if (!existing) return prev;

              prevMap.set(message.label, {
                ...existing,
                status: message.status,
                confidence: message.confidence ?? existing.confidence,
              });

              setLiveImageTick(Date.now());
              return Array.from(prevMap.values());
            });
          }

          if (message.type === "snapshot" && Array.isArray(message.spots)) {
            setApiSpots(message.spots);
            setLiveImageTick(Date.now());
            setLoading(false);
            setApiError("");
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      socket.onclose = () => {
        console.log("WebSocket disconnected");
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (!isUnmounted) {
          reconnectTimer = setTimeout(connectSocket, 3000);
        }
      };
    }

    connectSocket();

    return () => {
      isUnmounted = true;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadWeather() {
      try {
        const response = await fetch(WEATHER_URL);
        if (!response.ok) {
          throw new Error(`Failed to load weather: ${response.status}`);
        }

        const data = await response.json();
        if (!active) return;

        const current = data?.current;
        const info = getWeatherInfo(current?.weather_code, current?.is_day);

        setWeather({
          temp:
            typeof current?.temperature_2m === "number"
              ? Math.round(current.temperature_2m)
              : null,
          label: info.label,
          icon: info.icon,
        });
      } catch (error) {
        if (!active) return;
        console.error("Error loading weather:", error);
        setWeather({
          temp: null,
          label: "Unavailable",
          icon: "🌤️",
        });
      }
    }

    loadWeather();
    const interval = setInterval(loadWeather, 600000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);



  const statusMap = useMemo(() => {
    const map = new Map();

    for (const spot of apiSpots) {
      map.set(
        spot.label,
        spot.status === "occupied" ? "occupied" : "empty"
      );
    }

    return map;
  }, [apiSpots]);

  const structuredRows = useMemo(() => {
    return buildStructuredRows(statusMap);
  }, [statusMap]);

  const allStructuredSpots = useMemo(
    () =>
      structuredRows.flatMap((row) =>
        row.spots.map((spot) => ({
          ...spot,
          rowTitle: row.key,
        }))
      ),
    [structuredRows]
  );

  const selectedSpot =
    allStructuredSpots.find((spot) => spot.id === selectedSpotId) || null;

  const directions = useMemo(
    () => computeDirections(selectedSpot),
    [selectedSpot]
  );

  const stats = useMemo(() => {
    const free = allStructuredSpots.filter((s) => s.status === "empty").length;
    const occupied = allStructuredSpots.filter((s) => s.status === "occupied").length;
    const total = allStructuredSpots.length;
    const accessibility = allStructuredSpots.filter((s) => s.accessible).length;

    return { free, occupied, total, accessibility };
  }, [allStructuredSpots]);

  const freeSpots = allStructuredSpots.filter((s) => s.status === "empty");

  const formattedTime = dateTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedDate = dateTime.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const rowYMap = {
    backTop: 35,
    upper: 86,
    middle: 163,
    front: 225,
  };

  const rowStartMap = {
    backTop: 300,
    upper: 205,
    middle: 130,
    front: 95,
  };

  const rowGapMap = {
    backTop: 8,
    upper: 8,
    middle: 15,
    front: 21,
  };

  const selectedPosition = useMemo(() => {
    if (!selectedSpot) return null;

    const row = structuredRows.find((r) => r.key === selectedSpot.rowKey);
    if (!row) return null;

    const index = row.spots.findIndex((s) => s.id === selectedSpot.id);
    if (index < 0) return null;

    const width =
      selectedSpot.rowKey === "backTop" ? 34 : selectedSpot.rowKey === "upper" ? 40 : 42;

    const height =
      selectedSpot.rowKey === "backTop" ? 48 : selectedSpot.rowKey === "upper" ? 56 : 60;

    const gap = rowGapMap[selectedSpot.rowKey];
    const startX = rowStartMap[selectedSpot.rowKey];
    const y = rowYMap[selectedSpot.rowKey];
    const x = startX + index * (width + gap);

    return { x, y, width, height };
  }, [selectedSpot, structuredRows]);

  const routePoints = useMemo(
    () => buildRoutePoints(selectedSpot, selectedPosition),
    [selectedSpot, selectedPosition]
  );


  useEffect(() => {
    if (!selectedSpotId || viewMode !== "map" || routePoints.length < 2) {
      setMovingCarPoint(null);
      return;
    }

    const totalRunTime = 5000;
    const cycleTime = 2500;
    const startTime = performance.now();

    let frameId;

    function animate(now) {
      const elapsed = now - startTime;

      if (elapsed >= totalRunTime) {
        setMovingCarPoint(null);
        return;
      }

      const cycleProgress = (elapsed % cycleTime) / cycleTime;

      const routeProgress =
        cycleProgress <= 0.5
          ? cycleProgress * 2
          : (1 - cycleProgress) * 2;

      const point = getPointAlongRoute(routePoints, routeProgress);
      setMovingCarPoint(point);

      frameId = requestAnimationFrame(animate);
    }

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [selectedSpotId, viewMode, routePoints]);

  return (
    <div className="min-h-screen bg-[#F2ECE1] text-[#6F4A2E]">
      <header className="border-b border-[#E6C4B7] bg-white/85 backdrop-blur-sm">
        <div className="mx-auto flex min-h-[88px] max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <img
                src="/uofm-logo.jpg"
                alt="University of Memphis Logo"
                className="h-16 w-auto object-contain"
              />

            <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 rounded-xl transition hover:scale-[1.02] cursor-pointer"
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

          <div className="text-right">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#003087]">
              University of Memphis
            </p>
            <p className="font-serif text-2xl text-[#6F4A2E]">S.P.G.S</p>
            <p className="text-sm tracking-[0.14em] text-[#2F4F4F]">
              Smart Parking Guidance System
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-5 py-6">
        <div className="grid grid-cols-[220px_minmax(0,1fr)_250px] gap-5">
          <aside className="flex flex-col gap-5">
            <div className="rounded-[2rem] bg-[#F7F2EB] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <p className="text-4xl font-light leading-tight text-[#1F5E95]">
                Live Time
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#1F5E95]">
                {formattedTime}
              </p>
              <p className="mt-5 text-3xl font-light leading-tight text-[#1F5E95]">
                Current Date
              </p>
              <p className="mt-2 text-base font-medium text-[#2F4F4F]">
                {formattedDate}
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#F7F2EB] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1F5E95]">
                # Available Spots
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {freeSpots.map((spot) => (
                  <button
                    key={spot.id}
                    onClick={() => setSelectedSpotId(spot.id)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      selectedSpotId === spot.id
                        ? "border-[#003087] bg-[#003087] text-white"
                        : "border-[#A8D5B4] bg-[#E8F7EC] text-[#2E8B57]"
                    }`}
                  >
                    {spot.id}
                  </button>
                ))}
              </div>

              <p className="mt-6 text-center text-lg font-medium text-[#4D88B3]">
                Available Parking
              </p>
            </div>
          </aside>

          <section className="rounded-[2.25rem] bg-[#F7F2EB] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-5xl font-bold text-[#1F5E95]">
                  Smart Parking Guidance System
                </h1>
                <p className="mt-3 text-2xl text-[#4D88B3]">
                  Engineering Faculty Lot
                </p>
                {loading && (
                  <p className="mt-2 text-sm text-[#6A7C87]">Loading live status…</p>
                )}
                {apiError && (
                  <p className="mt-2 text-sm text-[#C65B57]">{apiError}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("map")}
                  className={`rounded-md px-3 py-2 text-xs font-semibold ${
                    viewMode === "map"
                      ? "bg-[#1F5E95] text-white"
                      : "border border-[#A7C5DF] bg-white text-[#1F5E95]"
                  }`}
                >
                  Map View
                </button>
                <button
                  onClick={() => setViewMode("live")}
                  className={`rounded-md px-3 py-2 text-xs font-semibold ${
                    viewMode === "live"
                      ? "bg-[#1F5E95] text-white"
                      : "border border-[#A7C5DF] bg-white text-[#1F5E95]"
                  }`}
                >
                  Live View
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] border-4 border-[#2C6DA4] bg-[#ECE8EA] p-4">
              <div
                ref={mapFrameRef}
                className="relative w-full overflow-hidden rounded-[1.5rem] bg-[#5E5B5B]"
                style={{ height: "min(430px, 55vw)" }}
              >
                {viewMode === "map" ? (
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    <div
                      className="relative w-full h-full"
                      >
                      
                      <img
                        src="/parking/real-lot.png"
                        className="absolute inset-0 h-full w-full object-cover rounded-[1.5rem]"
                      />

                      
                      

                      
                      
                      <div className="absolute left-[5px] top-[270px]">
                      
                        <div className="flex h-[95px] w-[23px] flex-col items-center justify-center rounded-[28px] bg-[#1A318A] text-lg font-bold text-white leading-none">
                          <span>G</span>
                          <span>A</span>
                          <span>T</span>
                          <span>E</span>  
                        </div>
                      </div>

                      
                      

                      {movingCarPoint && (
                        <div
                          className="pointer-events-none absolute z-30"
                          style={{
                            left: movingCarPoint.x,
                            top: movingCarPoint.y,
                            transform: "translate(-50%, -50%)",

                          }}
                        >
                          <CarIcon />
                        </div>
                        
                      )}                      

                      <div className="absolute inset-0">
                        {structuredRows.map((row) => {
                          const rowY = rowYMap[row.key] ?? 170;
                          const startX = rowStartMap[row.key] ?? 100;
                          const gap = rowGapMap[row.key] ?? 10;

                          return row.spots.map((spot, index) => {
                            const isFree = spot.status === "empty";
                            const isSelected = selectedSpotId === spot.id;

                            const width =
                              row.key === "backTop"
                                ? 30
                                : row.key === "upper"
                                ? 36
                                : 38;

                            const height =
                              row.key === "backTop"
                                ? 42
                                : row.key === "upper"
                                ? 50
                                : 52;

                            const x = startX + index * (width + gap);

                            return (
                              <button
                                key={spot.id}
                                onClick={() => isFree && setSelectedSpotId(spot.id)}
                                className={`absolute flex flex-col items-center justify-center gap-[2px] rounded-[12px] border-2 transition ${
                                  isSelected
                                    ? "border-[#1A318A] ring-4 ring-[#1A318A]/20"
                                    : "border-white/80"
                                } ${
                                  isFree
                                    ? "bg-[#A9CDAE] hover:scale-105"
                                    : "bg-[#E6C9C9]"
                                } ${isFree ? "cursor-pointer" : "cursor-default"}`}
                                style={{
                                  left: x,
                                  top: rowY,
                                  width,
                                  height,
                                }}
                              >
                                {spot.accessible && (
                                  <span className="absolute -top-1 right-0.5 rounded-full bg-[#1A318A] px-1.5 py-[1px] text-[8px] font-bold text-white">
                                    A
                                  </span>
                                )}

                                {isFree ? (
                                  <>  
                                      
                                    <span className="text-[9px] font-semibold text-[#2E7B50] leading-none">
                                      FREE
                                    </span>
                                    <span className="mt-[2px] text-[9px] font-medium text-[#2F4F4F] leading-none">
                                    
                                      {spot.id}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <CarIcon />
                                    <span className="mt-1 text-[9px] font-medium text-[#6F4A2E]">
                                      {spot.id}
                                    </span>
                                  </>
                                )}
                              </button>
                            );
                          });
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    key={liveImageOk ? `live-${liveImageTick}` : "fallback"}
                    src={
                      liveImageOk
                        ? `${LIVE_IMAGE_URL}?t=${liveImageTick}`
                        : FALLBACK_LIVE_IMAGE
                    }
                    onLoad={() => setLiveImageOk(true)}
                    onError={() => setLiveImageOk(false)}
                    alt="Engineering Faculty Lot Live View"
                    className="h-full w-full rounded-[1.5rem] object-cover"
                  />
                )}
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-5">
            <div className="rounded-[2rem] bg-[#F7F2EB] p-5 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-[#F8EAB7] text-4xl">
                {weather.icon}
              </div>
              <p className="text-2xl font-medium text-[#3D88B9]">Memphis Weather</p>
              <p className="mt-2 text-base text-[#2F4F4F]">
                {weather.label}
                {weather.temp !== null ? ` • ${weather.temp}°F` : ""}
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#F7F2EB] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <p className="text-center text-2xl font-medium text-[#3D88B9]">
                Directions
              </p>

              <div className="mt-4 min-h-[210px] rounded-[1.75rem] border-2 border-[#9CC0E0] bg-white p-4">
                {selectedSpot ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#1A318A]">
                      Destination: {selectedSpot.id}
                    </p>

                    {directions.map((step, index) => (
                      <div
                        key={index}
                        className="rounded-xl bg-[#F6F2EC] px-3 py-2 text-sm text-[#2F4F4F]"
                      >
                        <span className="mr-2 font-bold text-[#1A318A]">
                          {index + 1}.
                        </span>
                        {step}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full min-h-[180px] items-center justify-center text-center text-sm text-[#5D6F7B]">
                    Select an available space to see directions.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] bg-[#F7F2EB] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1A318A]">
                Lot Summary
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-[#E8F7EC] px-4 py-3">
                  <span>Free</span>
                  <span className="font-bold text-[#2E8B57]">{stats.free}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#FDEAEA] px-4 py-3">
                  <span>Occupied</span>
                  <span className="font-bold text-[#D9534F]">{stats.occupied}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#EEF3FA] px-4 py-3">
                  <span>Total</span>
                  <span className="font-bold text-[#1A318A]">{stats.total}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#F6F1EB] px-4 py-3">
                  <span>Accessibility</span>
                  <span className="font-bold text-[#6F4A2E]">
                    {stats.accessibility}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => navigate("/select-lot")}
            className="rounded-full border-2 border-[#E6C4B7] bg-[#FCDDD3] px-8 py-3 text-base font-semibold tracking-[0.14em] text-[#6F4A2E] transition hover:bg-[#E6C4B7]"
          >
            Back to Lots
          </button>
        </div>
      </main>
    </div>
  );
}