/* eslint-disable react/prop-types */
import "./RadialProgress.css";
const CircleProgressBar = ({ current }) => {
	const percentage = current * 100;
	return (
		<div
			className="radialProgress"
			style={{
				backgroundImage: `conic-gradient(
				#eb5757 ${percentage}%,
				rgba(235, 87, 87, 25%) ${percentage}%,
				rgba(235, 87, 87, 25%) 100%
			)`
			}}
		>
			<div className="progressLabel">
				<h3>{`${current}`}</h3>
				<span>puffs today</span>
			</div>
		</div>
	);
};
export default CircleProgressBar;
