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

export default function DriversPage({ onSelectDriver, onGoToTeams }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/racers`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch drivers");
        return res.json();
      })
      .then((data) => {
        setDrivers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = drivers.filter((d) => {
    const full = `${d.first_name} ${d.last_name}`.toLowerCase();
    return full.includes(search.toLowerCase()) || d.team_name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div style={styles.page}>
      {/* Background grid lines */}
      <div style={styles.gridOverlay} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoArea}>
            <span style={styles.f1Badge}>F1</span>
            <div>
              <div style={styles.headerTitle}>DRIVER GRID</div>
              <div style={styles.headerSeason}>2024 SEASON</div>
            </div>
          </div>
          <nav style={styles.nav}>
            <button style={styles.navTabActive}>DRIVERS</button>
            <button style={styles.navTabInactive} onClick={onGoToTeams}>TEAMS</button>
          </nav>

          <div style={styles.searchWrap}>
            <svg style={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              style={styles.searchInput}
              placeholder="Search driver or team…"
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
            <p style={styles.stateText}>LOADING GRID…</p>
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
              <span style={styles.countText}>{filtered.length} DRIVERS</span>
              <div style={styles.countLine} />
            </div>

            <div style={styles.grid}>
              {filtered.map((driver, i) => {
                // team_color comes directly from the API as a hex string (with or without #)
                const rawColor = driver.team_color
                  ? `#${driver.team_color.replace("#", "")}`
                  : getTeamColor(driver.team_name);
                const teamColor = rawColor;
                const isHovered = hoveredId === (driver.driver_id || i);
                return (
                  <div
                    key={driver.driver_id || i}
                    style={{
                      ...styles.card,
                      animationDelay: `${i * 40}ms`,
                      ...(isHovered ? styles.cardHover : {}),
                    }}
                    onClick={() => onSelectDriver(driver)}
                    onMouseEnter={() => setHoveredId(driver.driver_id || i)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Top accent line */}
                    <div style={{ ...styles.cardAccent, background: teamColor }} />

                    {/* Number badge — using abbreviation */}
                    <div style={{ ...styles.numberBadge, color: teamColor }}>
                      {driver.abbreviation ?? ""}
                    </div>

                    {/* Driver photo */}
                    <div style={styles.photoWrap}>
                      <div style={{ ...styles.photoBg, background: `${teamColor}18` }} />
                      <img
                        src={driver.headshot_url || `https://ui-avatars.com/api/?name=${driver.first_name}+${driver.last_name}&background=1a1a1a&color=fff&size=200`}
                        alt={`${driver.first_name} ${driver.last_name}`}
                        style={styles.photo}
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${driver.first_name}+${driver.last_name}&background=1a1a1a&color=fff&size=200`;
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div style={styles.cardBody}>
                      <div style={styles.firstName}>{driver.first_name?.toUpperCase()}</div>
                      <div style={styles.lastName}>{driver.last_name?.toUpperCase()}</div>

                      <div style={styles.divider} />

                      <div style={styles.teamRow}>
                        <div style={{ ...styles.teamDot, background: teamColor }} />
                        <span style={styles.teamName}>{driver.team_name ?? "—"}</span>
                      </div>

                      {driver.abbreviation && (
                        <div style={styles.country}>{driver.abbreviation}</div>
                      )}
                    </div>

                    {/* Hover arrow */}
                    <div style={{ ...styles.cardArrow, opacity: isHovered ? 1 : 0 }}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={teamColor} strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div style={styles.stateWrap}>
                <p style={styles.stateText}>NO DRIVERS FOUND</p>
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
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .driver-card-enter {
          animation: fadeUp 0.45s ease both;
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
  searchWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
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
    width: 280,
    outline: "none",
    transition: "border-color 0.2s",
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
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 20,
  },
  card: {
    position: "relative",
    background: "rgba(18,18,18,0.9)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 8,
    cursor: "pointer",
    overflow: "hidden",
    transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
    animation: "fadeUp 0.45s ease both",
  },
  cardHover: {
    transform: "translateY(-4px)",
    borderColor: "rgba(255,255,255,0.18)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
  },
  cardAccent: {
    height: 3,
    width: "100%",
  },
  numberBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 1,
    opacity: 0.7,
  },
  photoWrap: {
    position: "relative",
    height: 180,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoBg: {
    position: "absolute",
    inset: 0,
    opacity: 0.4,
  },
  photo: {
    position: "relative",
    height: "100%",
    width: "100%",
    objectFit: "cover",
    objectPosition: "top center",
  },
  cardBody: {
    padding: "16px 18px 18px",
  },
  firstName: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 2,
    color: "#aaa",
    lineHeight: 1,
  },
  lastName: {
    fontSize: 26,
    fontWeight: 900,
    letterSpacing: 1,
    lineHeight: 1.1,
    marginTop: 2,
  },
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.07)",
    margin: "12px 0",
  },
  teamRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  teamDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  teamName: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.5,
    color: "#ccc",
  },
  country: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 3,
    color: "#555",
  },
  cardArrow: {
    position: "absolute",
    bottom: 16,
    right: 16,
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