import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000";

// Graph panel — same as DriverDetailPage
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
        {loading && <div style={graphSt.state}><div style={graphSt.spinner} /></div>}
        {error   && <div style={graphSt.state}><div style={graphSt.errorText}>Graph unavailable</div></div>}
        {!loading && !error && imageSrc && (
          <img src={imageSrc} alt={title} style={graphSt.img} />
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
  img: { width: "100%", height: "auto", borderRadius: 4, display: "block" },
  state: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: 0.5 },
  spinner: {
    width: 32,
    height: 32,
    border: "2px solid rgba(255,255,255,0.1)",
    borderTop: "2px solid #E10600",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  errorText: { fontSize: 13, fontWeight: 600, letterSpacing: 2, color: "#888" },
};

export default function TeamsDetailPage({ team, onBack, onSelectDriver }) {
  const [graphs, setGraphs] = useState({ points: null, positions: null, compounds: null });
  const [loadingGraphs, setLoadingGraphs] = useState({ points: true, positions: true, compounds: true });
  const [errors, setErrors] = useState({});

  const color = team.team_color;
  // URL-encode the team name for use in path params (e.g. "Red Bull Racing" → "Red%20Bull%20Racing")
  const encodedTeam = encodeURIComponent(team.team_name);

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

    // Matching the three new FastAPI team routes
    fetchGraph(`${API_BASE}/team/points/${encodedTeam}`, "points");
    fetchGraph(`${API_BASE}/team/positions/${encodedTeam}`, "positions");
    fetchGraph(`${API_BASE}/team/compounds/${encodedTeam}`, "compounds");
  }, [encodedTeam]);

  return (
    <div style={styles.page}>
      <div style={styles.gridOverlay} />

      {/* ── HERO ── */}
      <div style={styles.hero}>
        {/* Full-width colour band at top */}
        <div style={{ ...styles.heroBand, background: color }} />
        {/* Subtle diagonal fill */}
        <div style={{ ...styles.heroDiag, background: `linear-gradient(135deg, ${color}22 0%, transparent 60%)` }} />

        <div style={styles.heroInner}>
          <button style={styles.backBtn} onClick={onBack}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            CONSTRUCTORS
          </button>

          <div style={styles.heroContent}>
            {/* Left */}
            <div style={styles.heroLeft}>
              <div style={{ ...styles.heroColorBar, background: color }} />
              <div style={styles.heroTeamName}>{team.team_name.toUpperCase()}</div>
              <div style={styles.heroMeta}>
                <span style={{ ...styles.heroPill, color, borderColor: `${color}66` }}>
                  {team.drivers.length} DRIVER{team.drivers.length !== 1 ? "S" : ""}
                </span>
                <span style={styles.heroPill}>2024 SEASON</span>
              </div>
            </div>

            {/* Right: driver cards */}
            <div style={styles.driverRoster}>
              {team.drivers.map((driver, i) => (
                <div
                  key={driver.driver_id || i}
                  style={styles.rosterCard}
                  onClick={() => onSelectDriver && onSelectDriver(driver)}
                  title={`View ${driver.first_name} ${driver.last_name}`}
                >
                  <div style={{ ...styles.rosterAccent, background: color }} />
                  <img
                    src={driver.headshot_url || `https://ui-avatars.com/api/?name=${driver.first_name}+${driver.last_name}&background=111&color=fff&size=200`}
                    alt={`${driver.first_name} ${driver.last_name}`}
                    style={styles.rosterPhoto}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${driver.first_name}+${driver.last_name}&background=111&color=fff&size=200`;
                    }}
                  />
                  <div style={styles.rosterInfo}>
                    <div style={styles.rosterFirst}>{driver.first_name?.toUpperCase()}</div>
                    <div style={styles.rosterLast}>{driver.last_name?.toUpperCase()}</div>
                    {driver.abbreviation && (
                      <div style={{ ...styles.rosterAbbr, color }}>{driver.abbreviation}</div>
                    )}
                    {onSelectDriver && (
                      <div style={styles.rosterCta}>VIEW DRIVER →</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── GRAPHS ── */}
      <main style={styles.main}>

        {/* Points over season */}
        <section style={styles.section}>
          <div style={styles.sectionLabel}>
            <div style={{ ...styles.sectionDot, background: color }} />
            CHAMPIONSHIP PROGRESS
          </div>
          <GraphPanel
            title="Cumulative Points"
            subtitle="Combined team points + per-driver breakdown by round"
            imageSrc={graphs.points}
            loading={loadingGraphs.points}
            error={errors.points}
          />
        </section>

        {/* Finishing positions + Lap times side by side */}
        <section style={styles.section}>
          <div style={styles.sectionLabel}>
            <div style={{ ...styles.sectionDot, background: color }} />
            RACE PERFORMANCE
          </div>
          <div style={styles.graphsGrid}>
            <GraphPanel
              title="Finishing Positions"
              subtitle="Both drivers across every round"
              imageSrc={graphs.positions}
              loading={loadingGraphs.positions}
              error={errors.positions}
            />
            <GraphPanel
              title="Avg Lap Time by Compound"
              subtitle="Side-by-side tyre comparison per driver"
              imageSrc={graphs.compounds}
              loading={loadingGraphs.compounds}
              error={errors.compounds}
            />
          </div>
        </section>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
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
    background: "rgba(12,12,12,0.98)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    overflow: "hidden",
    paddingBottom: 0,
  },
  heroBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  heroDiag: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
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
    marginBottom: 32,
  },
  heroContent: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 40,
  },
  heroLeft: {
    flex: 1,
    paddingBottom: 48,
  },
  heroColorBar: {
    width: 48,
    height: 5,
    borderRadius: 2,
    marginBottom: 16,
  },
  heroTeamName: {
    fontSize: "clamp(36px, 6vw, 80px)",
    fontWeight: 900,
    letterSpacing: 2,
    lineHeight: 0.95,
    color: "#fff",
    marginBottom: 20,
  },
  heroMeta: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  heroPill: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 3,
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 3,
    padding: "5px 12px",
    color: "#888",
  },

  // Driver roster
  driverRoster: {
    display: "flex",
    gap: 16,
    alignItems: "flex-end",
    flexShrink: 0,
  },
  rosterCard: {
    position: "relative",
    width: 180,
    background: "rgba(22,22,22,0.9)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 8,
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.2s, border-color 0.2s",
  },
  rosterAccent: {
    height: 3,
    width: "100%",
  },
  rosterPhoto: {
    width: "100%",
    height: 200,
    objectFit: "cover",
    objectPosition: "top center",
    display: "block",
  },
  rosterInfo: {
    padding: "12px 14px 16px",
  },
  rosterFirst: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 2,
    color: "#888",
    lineHeight: 1,
  },
  rosterLast: {
    fontSize: 20,
    fontWeight: 900,
    letterSpacing: 1,
    lineHeight: 1.1,
    marginTop: 2,
  },
  rosterAbbr: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 3,
    marginTop: 6,
  },
  rosterCta: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 2,
    color: "#555",
    marginTop: 8,
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
  graphsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: 20,
  },
};