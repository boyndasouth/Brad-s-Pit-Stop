import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000"; // Change to your FastAPI URL

const teamColors = {
  "Red Bull Racing": "#3671C6",
  "Ferrari": "#E8002D",
  "Mercedes": "#27F4D2",
  "McLaren": "#FF8000",
  "Aston Martin": "#229971",
  "Alpine": "#FF87BC",
  "Williams": "#64C4FF",
  "RB": "#6692FF",
  "Kick Sauber": "#52E252",
  "Haas": "#B6BABD",
};

function getTeamColor(team) {
  for (const [key, color] of Object.entries(teamColors)) {
    if (team?.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return "#E10600";
}

// Graph panel component
function GraphPanel({ title, subtitle, imageSrc, loading, error }) {
  return (
    <div style={graphSt.panel}>
      <div style={graphSt.header}>
        <div>
          <div style={graphSt.title}>{title}</div>
          {subtitle && <div style={graphSt.subtitle}>{subtitle}</div>}
        </div>
      </div>
      <div style={graphSt.body}>
        {loading && (
          <div style={graphSt.state}>
            <div style={graphSt.spinner} />
          </div>
        )}
        {error && (
          <div style={graphSt.state}>
            <div style={graphSt.errorText}>Graph unavailable</div>
          </div>
        )}
        {!loading && !error && imageSrc && (
          <img
            src={imageSrc}
            alt={title}
            style={graphSt.img}
          />
        )}
      </div>
    </div>
  );
}

const graphSt = {
  panel: {
    background: "rgba(14,14,14,0.95)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 8,
    overflow: "hidden",
  },
  header: {
    padding: "20px 24px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#666",
    letterSpacing: 1,
    marginTop: 3,
  },
  body: {
    padding: 20,
    minHeight: 280,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  img: {
    width: "100%",
    height: "auto",
    borderRadius: 4,
    display: "block",
  },
  state: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    opacity: 0.5,
  },
  spinner: {
    width: 32,
    height: 32,
    border: "2px solid rgba(255,255,255,0.1)",
    borderTop: "2px solid #E10600",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  errorText: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 2,
    color: "#888",
  },
};

export default function DriverDetailPage({ driver, onBack }) {
  const [graphs, setGraphs] = useState({ podium: null, avgStats: null, lapTime: null });
  const [loadingGraphs, setLoadingGraphs] = useState({ podium: true, avgStats: true, lapTime: true });
  const [errors, setErrors] = useState({});

  // team_color is stored as a hex string WITHOUT '#' in the CSV (e.g. "E8002D")
  // Fall back to lookup table only if team_color column is missing
  const teamColor = driver.team_color
    ? `#${driver.team_color.replace("#", "")}`
    : getTeamColor(driver.team_name);

  const fullName = `${driver.first_name} ${driver.last_name}`;
  const driverId = driver.driver_id; // must match the {driver_id} path param in FastAPI

  // All three endpoints return StreamingResponse(image/png) — fetch as blob
  useEffect(() => {
    const fetchGraph = (url, key) => {
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error("failed");
          return r.blob();
        })
        .then((blob) => {
          setGraphs((g) => ({ ...g, [key]: URL.createObjectURL(blob) }));
          setLoadingGraphs((g) => ({ ...g, [key]: false }));
        })
        .catch(() => {
          setErrors((e) => ({ ...e, [key]: true }));
          setLoadingGraphs((g) => ({ ...g, [key]: false }));
        });
    };

    // Exactly matching your FastAPI routes:
    // GET /podium/{driver_id}  →  podium_breakdown_by_driver
    // GET /radar/{driver_id}   →  average_stats_per_driver
    // GET /plots/{driver_id}   →  avg_lap_time_per_compound
    fetchGraph(`${API_BASE}/podium/${driverId}`, "podium");
    fetchGraph(`${API_BASE}/radar/${driverId}`, "avgStats");
    fetchGraph(`${API_BASE}/plots/${driverId}`, "lapTime");
  }, [driverId]);

  return (
    <div style={styles.page}>
      <div style={styles.gridOverlay} />

      {/* ── HERO SECTION ── */}
      <div style={{ ...styles.hero, "--team-color": teamColor }}>
        {/* Diagonal color slash */}
        <div style={{ ...styles.heroSlash, background: teamColor }} />

        <div style={styles.heroInner}>
          {/* Back button */}
          <button style={styles.backBtn} onClick={onBack}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            GRID
          </button>

          <div style={styles.heroContent}>
            {/* Left: info */}
            <div style={styles.heroLeft}>
              <div style={styles.heroTeamBadge}>
                <div style={{ ...styles.heroTeamDot, background: teamColor }} />
                {driver.team_name}
              </div>

              {/* Ghost number watermark — uses abbreviation since no number field exists */}
              <div style={styles.heroNumber} aria-hidden>
                {driver.abbreviation ?? ""}
              </div>

              <div style={styles.heroName}>
                <div style={styles.heroFirst}>{driver.first_name?.toUpperCase()}</div>
                <div style={styles.heroLast}>{driver.last_name?.toUpperCase()}</div>
              </div>

              <div style={styles.heroBadgeRow}>
                {/* abbreviation = 3-letter code e.g. "VER" */}
                <span style={{ ...styles.heroBadge, color: teamColor, borderColor: teamColor }}>
                  {driver.abbreviation ?? ""}
                </span>
                {/* rarity is a custom field you added in your POST /racers schema */}
                {driver.rarity && (
                  <span style={styles.heroBadge}>{driver.rarity}</span>
                )}
              </div>
            </div>

            {/* Right: photo — field is "headshot" in your CSV/API */}
            <div style={styles.heroRight}>
              <div style={{ ...styles.heroBgCircle, background: `${teamColor}12` }} />
              <img
                src={driver.headshot_url || `https://ui-avatars.com/api/?name=${driver.first_name}+${driver.last_name}&background=111&color=fff&size=400`}
                alt={fullName}
                style={styles.heroPhoto}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${driver.first_name}+${driver.last_name}&background=111&color=fff&size=400`;
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main style={styles.main}>

        {/* Graph 1: Podium breakdown */}
        <section style={styles.section}>
          <div style={styles.sectionLabel}>
            <div style={{ ...styles.sectionDot, background: teamColor }} />
            PERFORMANCE ANALYSIS
          </div>
          <div style={styles.graphsGrid}>
            <GraphPanel
              title="Podium Breakdown"
              subtitle="Finish position distribution"
              imageSrc={graphs.podium}
              loading={loadingGraphs.podium}
              error={errors.podium}
            />
            <GraphPanel
              title="Average Stats"
              subtitle="Per-race averages across season"
              imageSrc={graphs.avgStats}
              loading={loadingGraphs.avgStats}
              error={errors.avgStats}
            />
          </div>
        </section>

        {/* Graph 3: Lap time by compound */}
        <section style={styles.section}>
          <div style={styles.sectionLabel}>
            <div style={{ ...styles.sectionDot, background: teamColor }} />
            TYRE ANALYSIS
          </div>
          <GraphPanel
            title="Average Lap Time by Compound"
            subtitle="Comparative tyre performance across compounds"
            imageSrc={graphs.lapTime}
            loading={loadingGraphs.lapTime}
            error={errors.lapTime}
          />
        </section>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    fontFamily: "'Barlow Condensed', sans-serif",
    color: "#fff",
    position: "relative",
  },
  gridOverlay: {
    position: "fixed",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
    `,
    backgroundSize: "60px 60px",
    pointerEvents: "none",
    zIndex: 0,
  },

  // HERO
  hero: {
    position: "relative",
    background: "rgba(12,12,12,0.95)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    overflow: "hidden",
    minHeight: 360,
  },
  heroSlash: {
    position: "absolute",
    top: 0,
    right: "28%",
    width: 6,
    bottom: 0,
    opacity: 0.6,
    transform: "skewX(-8deg)",
  },
  heroInner: {
    position: "relative",
    zIndex: 2,
    maxWidth: 1400,
    margin: "0 auto",
    padding: "28px 40px 0",
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#aaa",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 2,
    padding: "8px 16px",
    borderRadius: 4,
    cursor: "pointer",
    transition: "background 0.2s, color 0.2s",
    marginBottom: 24,
  },
  heroContent: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 24,
  },
  heroLeft: {
    flex: 1,
    paddingBottom: 40,
  },
  heroTeamBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 2,
    color: "#aaa",
    marginBottom: 8,
  },
  heroTeamDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  heroNumber: {
    fontSize: "clamp(80px, 12vw, 160px)",
    fontWeight: 900,
    lineHeight: 0.85,
    color: "rgba(255,255,255,0.04)",
    letterSpacing: -4,
    position: "absolute",
    userSelect: "none",
  },
  heroName: {
    position: "relative",
    zIndex: 1,
  },
  heroFirst: {
    fontSize: "clamp(20px, 3vw, 32px)",
    fontWeight: 600,
    letterSpacing: 4,
    color: "#aaa",
    lineHeight: 1,
  },
  heroLast: {
    fontSize: "clamp(48px, 7vw, 88px)",
    fontWeight: 900,
    letterSpacing: 1,
    lineHeight: 0.9,
    color: "#fff",
  },
  heroBadgeRow: {
    display: "flex",
    gap: 10,
    marginTop: 20,
  },
  heroBadge: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 3,
    color: "#888",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 3,
    padding: "4px 10px",
  },
  heroRight: {
    position: "relative",
    width: "clamp(200px, 25vw, 360px)",
    flexShrink: 0,
    alignSelf: "flex-end",
  },
  heroBgCircle: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: "100%",
    aspectRatio: "1",
    borderRadius: "50%",
    filter: "blur(60px)",
  },
  heroPhoto: {
    position: "relative",
    width: "100%",
    height: "auto",
    display: "block",
    objectFit: "cover",
    objectPosition: "top",
    maxHeight: 320,
  },

  // MAIN
  main: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1400,
    margin: "0 auto",
    padding: "48px 40px 80px",
  },
  section: {
    marginBottom: 48,
    animation: "fadeUp 0.5s ease both",
  },
  sectionLabel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 3,
    color: "#666",
    marginBottom: 20,
    textTransform: "uppercase",
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
  },
  statsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  graphsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: 20,
  },
};