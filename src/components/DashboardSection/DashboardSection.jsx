/* eslint-disable react/prop-types */
import "./DashboardSection.css";

const DashboardSection = ({ title, children, style, className }) => {
	return (
		<div className={`dashboard-section ${className}`} style={{ style }}>
			<h4 className="section-title">{title}</h4>
			<div className="section-content-cutoff">{children}</div>
		</div>
	);
};

export default DashboardSection;
