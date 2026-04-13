import { useState } from "react";
import DriversPage from "./DriversPage";
import DriverDetailPage from "./DriverDetailPage";
import TeamsPage from "./TeamsPage";
import TeamsDetailPage from "./TeamsDetailPage";

// Four possible views:
//   { page: "drivers" }
//   { page: "driverDetail", driver: {...} }
//   { page: "teams" }
//   { page: "teamDetail", team: {...} }

export default function App() {
  const [view, setView] = useState({ page: "drivers" });

  if (view.page === "driverDetail") {
    return (
      <DriverDetailPage
        driver={view.driver}
        onBack={() => setView({ page: "drivers" })}
      />
    );
  }

  if (view.page === "teamDetail") {
    return (
      <TeamsDetailPage
        team={view.team}
        onBack={() => setView({ page: "teams" })}
        onSelectDriver={(driver) => setView({ page: "driverDetail", driver })}
      />
    );
  }

  if (view.page === "teams") {
    return (
      <TeamsPage
        onSelectTeam={(team) => setView({ page: "teamDetail", team })}
        onGoToDrivers={() => setView({ page: "drivers" })}
      />
    );
  }

  return (
    <DriversPage
      onSelectDriver={(driver) => setView({ page: "driverDetail", driver })}
      onGoToTeams={() => setView({ page: "teams" })}
    />
  );
}