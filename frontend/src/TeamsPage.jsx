import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000";

export default function TeamsPage({ onSelectTeam, onGoToDrivers }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    // Derive teams from the /racers endpoint — group drivers by team_name
    fetch(`${API_BASE}/racers`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch racers");
        return r.json();
      })
      .then((racers) => {
        // Your CSV has duplicate rows for the same driver across rounds.
        // Deduplicate by driver_id first, keeping the first occurrence of each.
        const seenDriverIds = new Set();
        const uniqueDrivers = racers.filter((driver) => {
          if (seenDriverIds.has(driver.driver_id)) return false;
          seenDriverIds.add(driver.driver_id);
          return true;
        });

        // Now group unique drivers by team_name
        const teamMap = {};
        uniqueDrivers.forEach((driver) => {
          const key = driver.team_name;
          if (!key) return;
          if (!teamMap[key]) {
            teamMap[key] = {
              team_name: key,
              team_color: driver.team_color
                ? `#${driver.team_color.replace("#", "")}`
                : "#E10600",
              drivers: [],
            };
          }
          teamMap[key].drivers.push(driver);
        });
        setTeams(Object.values(teamMap));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = teams.filter((t) =>
    t.team_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <div style={styles.gridOverlay} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoArea}>
            <span style={styles.f1Badge}>F1</span>
            <div>
              <div style={styles.headerTitle}>CONSTRUCTORS</div>
              <div style={styles.headerSeason}>2024 SEASON</div>
            </div>
          </div>

          {/* Nav tabs */}
          <nav style={styles.nav}>
            <button style={styles.navTabInactive} onClick={onGoToDrivers}>
              DRIVERS
            </button>
            <button style={styles.navTabActive}>
              TEAMS
            </button>
          </nav>

          <div style={styles.searchWrap}>
            <svg style={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              style={styles.searchInput}
              placeholder="Search team…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {loading && (
          <div style={styles.stateWrap}>
            <div style={styles.spinner} />
            <p style={styles.stateText}>LOADING CONSTRUCTORS…</p>
          </div>
        )}

        {error && (
          <div style={styles.stateWrap}>
            <div style={styles.errorIcon}>!</div>
            <p style={styles.stateText}>CONNECTION FAILED</p>
            <p style={styles.stateSubText}>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div style={styles.countBar}>
              <span style={styles.countText}>{filtered.length} CONSTRUCTORS</span>
              <div style={styles.countLine} />
            </div>

            <div style={styles.grid}>
              {filtered.map((team, i) => {
                const color = team.team_color;
                const isHovered = hoveredId === team.team_name;
                const [d1, d2] = team.drivers;

                return (
                  <div
                    key={team.team_name}
                    style={{
                      ...styles.card,
                      animationDelay: `${i * 60}ms`,
                      ...(isHovered ? { ...styles.cardHover, borderColor: `${color}55` } : {}),
                    }}
                    onClick={() => onSelectTeam(team)}
                    onMouseEnter={() => setHoveredId(team.team_name)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Colour bar left edge */}
                    <div style={{ ...styles.colorEdge, background: color }} />

                    {/* Glow on hover */}
                    <div style={{
                      ...styles.cardGlow,
                      background: `radial-gradient(ellipse at top left, ${color}18 0%, transparent 70%)`,
                      opacity: isHovered ? 1 : 0,
                    }} />

                    <div style={styles.cardInner}>
                      {/* Team name */}
                      <div style={styles.teamNameWrap}>
                        <div style={{ ...styles.teamColorDot, background: color }} />
                        <div style={styles.teamNameText}>{team.team_name.toUpperCase()}</div>
                      </div>

                      {/* Driver duo headshots */}
                      <div style={styles.driverDuo}>
                        {[d1, d2].map((driver, di) =>
                          driver ? (
                            <div key={di} style={styles.driverThumb}>
                              <img
                                src={driver.headshot_url || `https://ui-avatars.com/api/?name=${driver.first_name}+${driver.last_name}&background=111&color=fff&size=120`}
                                alt={`${driver.first_name} ${driver.last_name}`}
                                style={styles.driverThumbImg}
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${driver.first_name}+${driver.last_name}&background=111&color=fff&size=120`;
                                }}
                              />
                              <div style={styles.driverThumbName}>
                                {driver.last_name?.toUpperCase()}
                              </div>
                            </div>
                          ) : null
                        )}
                      </div>

                      {/* Driver count chip */}
                      <div style={styles.bottomRow}>
                        <div style={{ ...styles.chip, borderColor: `${color}44`, color }}>
                          {team.drivers.length} DRIVER{team.drivers.length !== 1 ? "S" : ""}
                        </div>
                        <div style={{ ...styles.arrowBtn, opacity: isHovered ? 1 : 0 }}>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={color} strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div style={styles.stateWrap}>
                <p style={styles.stateText}>NO TEAMS FOUND</p>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
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
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
    `,
    backgroundSize: "60px 60px",
    pointerEvents: "none",
    zIndex: 0,
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(10,10,10,0.92)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  headerInner: {
    maxWidth: 1400,
    margin: "0 auto",
    padding: "18px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexShrink: 0,
  },
  f1Badge: {
    background: "#E10600",
    color: "#fff",
    fontWeight: 900,
    fontSize: 22,
    padding: "4px 10px",
    letterSpacing: 1,
    clipPath: "polygon(0 0, 92% 0, 100% 100%, 8% 100%)",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: 4,
    lineHeight: 1,
  },
  headerSeason: {
    fontSize: 12,
    fontWeight: 600,
    color: "#E10600",
    letterSpacing: 3,
    marginTop: 2,
  },
  nav: {
    display: "flex",
    gap: 4,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6,
    padding: 4,
  },
  navTabActive: {
    background: "#E10600",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 2,
    padding: "7px 18px",
    cursor: "pointer",
  },
  navTabInactive: {
    background: "transparent",
    color: "#888",
    border: "none",
    borderRadius: 4,
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 2,
    padding: "7px 18px",
    cursor: "pointer",
    transition: "color 0.2s",
  },
  searchWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    width: 16,
    height: 16,
    color: "#888",
    pointerEvents: "none",
  },
  searchInput: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 4,
    color: "#fff",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 15,
    letterSpacing: 1,
    padding: "10px 16px 10px 38px",
    width: 240,
    outline: "none",
  },
  main: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1400,
    margin: "0 auto",
    padding: "48px 32px 80px",
  },
  countBar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 36,
  },
  countText: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 3,
    color: "#888",
    whiteSpace: "nowrap",
  },
  countLine: {
    flex: 1,
    height: 1,
    background: "rgba(255,255,255,0.07)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 20,
  },
  card: {
    position: "relative",
    background: "rgba(16,16,16,0.95)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 8,
    cursor: "pointer",
    overflow: "hidden",
    transition: "transform 0.2s ease, border-color 0.25s ease, box-shadow 0.25s ease",
    animation: "fadeUp 0.45s ease both",
  },
  cardHover: {
    transform: "translateY(-4px)",
    boxShadow: "0 20px 48px rgba(0,0,0,0.6)",
  },
  colorEdge: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
  },
  cardGlow: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    transition: "opacity 0.3s",
  },
  cardInner: {
    padding: "24px 24px 20px 28px",
    position: "relative",
    zIndex: 1,
  },
  teamNameWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  teamColorDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
  },
  teamNameText: {
    fontSize: 20,
    fontWeight: 900,
    letterSpacing: 2,
    lineHeight: 1,
  },
  driverDuo: {
    display: "flex",
    gap: 12,
    marginBottom: 20,
  },
  driverThumb: {
    flex: 1,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 6,
    overflow: "hidden",
    textAlign: "center",
  },
  driverThumbImg: {
    width: "100%",
    height: 120,
    objectFit: "cover",
    objectPosition: "top center",
    display: "block",
  },
  driverThumbName: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    color: "#aaa",
    padding: "6px 4px",
  },
  bottomRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chip: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    border: "1px solid",
    borderRadius: 3,
    padding: "4px 10px",
  },
  arrowBtn: {
    transition: "opacity 0.2s",
  },
  stateWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "40vh",
    gap: 16,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid rgba(255,255,255,0.1)",
    borderTop: "3px solid #E10600",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#E10600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    fontWeight: 900,
  },
  stateText: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 4,
    color: "#888",
  },
  stateSubText: {
    fontSize: 13,
    color: "#555",
    letterSpacing: 1,
  },
};