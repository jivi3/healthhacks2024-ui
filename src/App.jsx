import "./App.css";
import DashboardSection from "./components/DashboardSection/DashboardSection";
// import CircleProgressBar from "./components/RadialProgress/RadialProgress";

function App() {
	return (
		<div className="dashboard">
			<div className="latest-puff">
				<h3>You&apos;re on a 4 day streak of cutting down usage!</h3>
				<p className="secondary">3 days left to hit a new milestone</p>
			</div>
			<div className="dashboard-sections">
				<DashboardSection title="You’ve Been Vape Free For"></DashboardSection>
				<DashboardSection title="Activity for October 26"></DashboardSection>
				<DashboardSection title="Health Insights"></DashboardSection>
			</div>
		</div>
	);
}

export default App;
