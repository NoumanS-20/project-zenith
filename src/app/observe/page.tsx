import { Dashboard } from "@/components/dashboard/Dashboard";

// Shareable observatory link, e.g. /observe?lat=13.08&lon=80.27&sat=25544
// The dashboard hydrates from the query string via useUrlSync.
export default function ObservePage() {
  return <Dashboard />;
}
