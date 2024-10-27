import { useEffect, useState } from "react";
import "./App.css";
import dayjs from "dayjs";
import DashboardSection from "./components/DashboardSection/DashboardSection";
import { Bar } from "react-chartjs-2";

import { DateCalendar, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import FavoriteIcon from "@mui/icons-material/Favorite";
import BedtimeIcon from "@mui/icons-material/Bedtime";

import {db} from "../firebase-config"
import { doc, getDoc } from 'firebase/firestore';


import {
	Chart as ChartJS,
	Title,
	BarElement,
	CategoryScale,
	LinearScale,
	ArcElement,
	Tooltip,
	Legend
} from "chart.js";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	ArcElement,
	Tooltip,
	Legend
);

const yesterday = dayjs().subtract(1, "day");

function App() {

	const [heartRate, setHeartRate] = useState(0); // Initializing with 0 or a default value


	const generateTimeLabels = () => {
		const labels = [];
		for (let hour = 8; hour <= 24 + 1; hour++) {
			const amPm = hour >= 12 && hour < 24 ? "PM" : "AM";
			const displayHour = hour % 12 === 0 ? 12 : hour % 12;
			labels.push(`${displayHour}:00 ${amPm}`);
		}
		return labels;
	};

	useEffect(() => {
        const fetchAverageHeartRate = async () => {
            const docRef = doc(db, 'healthData', 'healthdata'); // Specify the correct document ID
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const samples = docSnap.data().samples; // Assuming the data structure includes an array of samples
                const heartRateSamples = samples.filter(sample => sample.type === "HKQuantityTypeIdentifierHeartRate");
                
                if (heartRateSamples.length > 0) {
                    const total = heartRateSamples.reduce((acc, sample) => acc + sample.value, 0);
                    const average = total / heartRateSamples.length;
                    setHeartRate(average.toFixed(2)); // Set the calculated average, rounded to two decimal places
                } else {
                    console.log("No heart rate samples found.");
                }
            } else {
                console.log("No such document!");
            }
        };

        fetchAverageHeartRate();
    }, []);
	

	const [bardata, setBardata] = useState({
		labels: generateTimeLabels(), // Use generated time labels
		datasets: [
			{
				label: "Hits",
				data: new Array(18).fill(0), // Adjusted to match 18 labels (8 AM to 1 AM)
				backgroundColor: ["#7692FF"],
				borderWidth: 1,
				borderRadius: 7
			}
		]
	});

	useEffect(() => {
		const sampleData = Array.from({ length: 18 }, () =>
			Math.floor(Math.random() * 20)
		);

		setBardata((prevData) => ({
			...prevData,
			datasets: [
				{
					...prevData.datasets[0],
					data: sampleData // Set the generated sample data
				}
			]
		}));
	}, []);

	const baroptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false,
				position: "top" // Position of the legend
			},
			title: {
				display: false,
				text: "Monthly Sales for 2023" // Title of the chart
			}
		},
		scales: {
			y: {
				beginAtZero: true, // Y-axis starts at 0
				grid: {
					display: false
				}
			},
			x: {
				grid: {
					display: false // This hides the grid lines on the x-axis
				}
			}
		}
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<div className="dashboard">
				<div className="latest-puff">
					<h1>You&apos;re on a 4 day streak of cutting down usage!</h1>
					<h5 className="secondary">3 days left to hit a new milestone</h5>
					<div className="bar-progress">
						<div className="bar-fill"></div>
					</div>
				</div>
				<div className="dashboard-sections">
					<DashboardSection
						className="streak"
						title="You've Been Vape Free For"
					>
						<div className="streak-content">
							<div className="streak-stats">
								<p>
									<b>0</b> days,
								</p>
								<p>
									<b>2</b> hours,
								</p>
								<p>
									and <b>34</b> minutes.
								</p>
							</div>

							<div className="record-bar">
								<div className="record-bar-fill">
									<span className="personal-record">
										Personal Record&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;
									</span>
								</div>
							</div>
						</div>
					</DashboardSection>
					<DashboardSection
						className="daily-activity"
						title="Activity for October 26"
					>
						<div className="bar-chart">
							<Bar
								className="bar"
								data={bardata}
								options={baroptions}
								sx={{ flex: 1 }}
							/>
						</div>
					</DashboardSection>
					<DashboardSection className="health-insights" title="Health Insights">
						<div className="health-insights-content">
							<div className="heart-vitals">
								<FavoriteIcon
									className="heart-icon"
									sx={{ fontSize: "60px" }}
								/>
								<div className="metric-container">
								<h2>{parseInt(heartRate)}&nbsp;BPM</h2>
								<span>Avg.&nbsp;Heart&nbsp;Rate</span>
								</div>
								
							</div>
							<div className="sleep-vitals">
								<BedtimeIcon className="bed-icon" sx={{ fontSize: "60px" }} />
								<div className="metric-container">
								<h2>5&nbsp;hours</h2>
								<span>Avg&nbsp;Sleep&nbsp;Time</span>
								</div>
							</div>
						</div>
					</DashboardSection>
					<DashboardSection
						className="goals"
						title="Your Goals"
					>
						<div className="goals-content">

						</div>
					</DashboardSection>
					<DashboardSection
						className="spending-stats"
						title="Spending Stats"
					></DashboardSection>
					<DashboardSection className="usage-history" title="Usage History">
						<div className="usage-history-content">
							<div className="calendar-container">
								<DateCalendar
									showDaysOutsideCurrentMonth
									disableFuture={true}
									maxDate={yesterday}
									className="calendar"
									sx={{
										// color: "#ffffff",
										"& .Mui-disabled": { color: "#000000" },
										"& .MuiTypography-root": { color: "#ffffff" }, // General text color
										"& .MuiIconButton-root": { color: "#ffffff" }, // Arrows and other icons
										"& .MuiPickersDay-root": {
											color: "#ffffff", // Default day color
											"&.Mui-selected": {
												backgroundColor: "#7692FF", // Selected day background
												color: "#ffffff" // Selected day text color
											}
											// "&.Mui-disabled": {
											// 	color: "#a9a9a9" // Gray color for disabled future dates
											// }
										},
										"& .MuiPickersCalendarHeader-root": {
											color: "#ffffff", // Header text (month and year)
											"& .MuiPickersArrowSwitcher-button": { color: "#ffffff" } // Arrows specifically
										}
									}}
									slotProps={{
										day: {
											style: {
												color: "#ffffff"
											}
										}
									}}
								/>
							</div>

							<div className="day-stats">
								<div className="day-metrics">
									<div className="total">
										<p>Total Puffs</p>
										<h3>354</h3>
									</div>
									<div className="total">
										<p>Avg. Hits Per Hour</p>
										<h3>8</h3>
									</div>
									<div className="total">
										<p>Longest Vape Free Streak</p>
										<h3>4 hours</h3>
									</div>
									
								</div>

								<div className="bar-chart">
									<Bar className="bar" data={bardata} options={baroptions} />
								</div>
							</div>
						</div>
					</DashboardSection>
				</div>
			</div>
		</LocalizationProvider>
	);
}

export default App;
