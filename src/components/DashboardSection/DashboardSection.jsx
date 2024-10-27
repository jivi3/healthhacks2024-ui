/* eslint-disable react/prop-types */
import "./DashboardSection.css";
const DashboardSection = ({ title, children }) => {
	if (title === "Card Details") {
		return (
			<div className="cutoff-section">
				<h4 className="section-title">{title}</h4>
				<div className="section-content">{children}</div>
			</div>
		);
	} else {
		return (
			<div className="dashboard-section">
				<h4 className="section-title">{title}</h4>
				<div className="section-content-cutoff">{children}</div>
			</div>
		);
	}
};

export default DashboardSection;
