// App.jsx

import { useEffect, useState, useRef } from "react";
import "./App.css";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import duration from "dayjs/plugin/duration";
import timezone from "dayjs/plugin/timezone";
import minMax from "dayjs/plugin/minMax";
import DashboardSection from "./components/DashboardSection/DashboardSection";
import { Bar } from "react-chartjs-2";

import { DateCalendar, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import ReactMarkdown from "react-markdown";

import FavoriteIcon from "@mui/icons-material/Favorite";
import BedtimeIcon from "@mui/icons-material/Bedtime";
import SendIcon from "@mui/icons-material/Send";

import { db } from "../firebase-config";
import { doc, onSnapshot } from "firebase/firestore";

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

import axios from "axios";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	ArcElement,
	Tooltip,
	Legend
);

// Extend Day.js with necessary plugins
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(minMax);

const yesterday = dayjs().subtract(1, "day");

// const renderMarkdown = (text) => {
// 	// Replace `**bold text**` with HTML <b> tags
// 	return text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
//   };

function App() {
	const [heartRate, setHeartRate] = useState(0); // Initializing with 0 or a default value
	const [selectedDate, setSelectedDate] = useState(dayjs().startOf("day")); // Default to today at start of day
	const [vapeFreeDuration, setVapeFreeDuration] = useState({
		days: 0,
		hours: 0,
		minutes: 0
	}); // State to store vape-free duration

	const [barWidth, setBarWidth] = useState(0); // Initial width is 0%

	const [chatInput, setChatInput] = useState(""); // State for chatbot input
	const [chatMessages, setChatMessages] = useState([]); // State for chatbot messages
	const [timeLeftText, setTimeLeftText] = useState("");
	const [loading, setLoading] = useState(false); // State for loading indicator

	useEffect(() => {
		const scrollPosition = { y: 0 }; // Variable to store scroll position

		// Function to handle input focus and store the current scroll position
		const handleFocus = () => {
			scrollPosition.y = window.scrollY;
		};

		// Function to handle form submit, blur the input, and reset scroll position
		const handleFormSubmit = () => {
			// Blur the currently focused input to close the keyboard
			const activeElement = document.activeElement;
			if (
				activeElement &&
				(activeElement.tagName === "INPUT" ||
					activeElement.tagName === "TEXTAREA")
			) {
				activeElement.blur();
			}

			// Scroll back to stored position after keyboard is closed
			window.scrollTo(0, scrollPosition.y);
		};

		// Attach the focus event listeners to all inputs
		const inputs = document.querySelectorAll("input, textarea");
		inputs.forEach((input) => {
			input.addEventListener("focus", handleFocus);
		});

		// Find the form element and attach the submit event listener
		const form = document.querySelector("form");
		form?.addEventListener("submit", handleFormSubmit);

		// Cleanup event listeners on component unmount
		return () => {
			inputs.forEach((input) => {
				input.removeEventListener("focus", handleFocus);
			});
			form?.removeEventListener("submit", handleFormSubmit);
		};
	}, []);

	useEffect(() => {
		const { hours, days } = vapeFreeDuration;
		let timeLeft;
		let timeLabel;

		// Determine time left based on current hours and days
		if (days < 1) {
			// If less than a day, show hours left until reaching 24 hours
			timeLeft = 24 - hours;
			timeLabel = "hours";
		} else if (days < 7) {
			// If less than 7 days, show days left until reaching 7 days
			timeLeft = 7 - days;
			timeLabel = "days";
		} else {
			// If 7 days or more, show weeks (starting from 2 weeks)
			timeLeft = Math.ceil((days + 1) / 7); // Round up to the next week count
			timeLabel = "weeks";
		}

		setTimeLeftText(`${timeLeft} ${timeLabel} left to hit a new milestone`);
	}, [vapeFreeDuration]);

	const [userData, setUserData] = useState(null); // State to store user's vaping data

	const chatMessagesRef = useRef(null); // Ref to scroll to bottom of chat

	const generateTimeLabels = () => {
		const labels = [];
		for (let hour = 0; hour < 24; hour++) {
			const amPm = hour >= 12 ? "PM" : "AM";
			const displayHour = hour % 12 === 0 ? 12 : hour % 12;
			labels.push(`${displayHour}:00 ${amPm}`);
		}
		return labels;
	};

	useEffect(() => {
		// Calculate target width based on the current milestone
		const { hours, days } = vapeFreeDuration;
		let milestoneHours; // Total hours for the next milestone

		// Determine milestone based on current duration
		if (days < 1) {
			milestoneHours = 24; // Next milestone is 24 hours for the first day
		} else if (days < 7) {
			milestoneHours = 7 * 24; // Next milestone is 7 days
		} else {
			milestoneHours = 2 * 7 * 24; // Next milestone is 2 weeks
		}

		// Calculate total hours passed
		const totalHours = days * 24 + hours;

		// Calculate target width as a percentage of progress toward the next milestone
		const targetWidth = (totalHours * 100) / milestoneHours;

		// Set the width after a brief delay to trigger the transition
		const timer = setTimeout(() => {
			setBarWidth(targetWidth);
		}, 100); // Delay in milliseconds

		// Cleanup the timeout if the component unmounts or vapeFreeDuration changes
		return () => clearTimeout(timer);
	}, [vapeFreeDuration]);

	// State for today's data
	const [todayBardata, setTodayBardata] = useState({
		labels: generateTimeLabels(), // Use generated time labels
		datasets: [
			{
				label: "Hits",
				data: new Array(24).fill(0), // Adjusted to match 24 labels (0 to 23 hours)
				backgroundColor: ["#7692FF"],
				borderWidth: 1,
				borderRadius: 7
			}
		]
	});

	// State for usage history data based on selectedDate
	const [bardata, setBardata] = useState({
		labels: generateTimeLabels(), // Use generated time labels
		datasets: [
			{
				label: "Hits",
				data: new Array(24).fill(0), // Adjusted to match 24 labels (0 to 23 hours)
				backgroundColor: ["#7692FF"],
				borderWidth: 1,
				borderRadius: 7
			}
		]
	});

	// Fetch data for today's activity
	useEffect(() => {
		const userId = "c7ULL0V1SMQOhACx2Ja1eU5utCw1"; // Ensure this userId is correct
		const docRef = doc(db, "users", userId);

		// Set up the listener
		const unsubscribe = onSnapshot(docRef, (docSnap) => {
			if (docSnap.exists()) {
				const data = docSnap.data();
				console.log("Real-time update for today's data:", data);
				const events = data.events;

				// Process events to create data for the bar chart
				const counts = new Array(24).fill(0); // Initialize counts array for 24 hours

				// For today
				const todayDate = dayjs().tz("America/New_York").startOf("day");

				// Process each event
				events.forEach((event) => {
					const eventTimestamp = event.timestamp;

					// Check if eventTimestamp is a Firebase Timestamp object
					if (eventTimestamp && typeof eventTimestamp.toDate === "function") {
						// Convert to dayjs object in local time zone
						const eventDate = dayjs(eventTimestamp.toDate()).tz(
							"America/New_York"
						);

						if (eventDate.isValid()) {
							// Check if the event is on today
							if (eventDate.isSame(todayDate, "day")) {
								const hour = eventDate.hour(); // Get hour of event in local time

								// Map the hour to the index in counts array (0 to 23 hours)
								const index = hour;

								if (index >= 0 && index < counts.length) {
									counts[index]++;
								}
							}
						}
					}
				});

				// Update todayBardata with counts
				setTodayBardata((prevData) => ({
					...prevData,
					datasets: [
						{
							...prevData.datasets[0],
							data: counts
						}
					]
				}));

				// Store user data for chatbot
				setUserData((prevData) => ({
					...prevData,
					events
				}));
			} else {
				console.log("No such document for today's data!");
			}
		});

		// Cleanup listener on unmount
		return () => unsubscribe();
	}, []); // Empty dependency array, runs once on mount

	// Fetch data for selected date in usage history
	useEffect(() => {
		const userId = "c7ULL0V1SMQOhACx2Ja1eU5utCw1"; // Ensure this userId is correct
		const docRef = doc(db, "users", userId);

		// Set up the listener
		const unsubscribe = onSnapshot(docRef, (docSnap) => {
			if (docSnap.exists()) {
				const data = docSnap.data();
				console.log("Real-time update for usage history:", data);
				const events = data.events;

				// Process events to create data for the bar chart
				const counts = new Array(24).fill(0); // Initialize counts array for 24 hours

				// For the day we're interested in (selected date)
				const targetDate = selectedDate.tz("America/New_York").startOf("day");

				// Process each event
				events.forEach((event) => {
					const eventTimestamp = event.timestamp;

					// Check if eventTimestamp is a Firebase Timestamp object
					if (eventTimestamp && typeof eventTimestamp.toDate === "function") {
						// Convert to dayjs object in local time zone
						const eventDate = dayjs(eventTimestamp.toDate()).tz(
							"America/New_York"
						);

						if (eventDate.isValid()) {
							// Check if the event is on the target date
							if (eventDate.isSame(targetDate, "day")) {
								const hour = eventDate.hour(); // Get hour of event in local time

								// Map the hour to the index in counts array (0 to 23 hours)
								const index = hour;

								if (index >= 0 && index < counts.length) {
									counts[index]++;
								}
							}
						}
					}
				});

				// Update bardata with counts
				setBardata((prevData) => ({
					...prevData,
					datasets: [
						{
							...prevData.datasets[0],
							data: counts
						}
					]
				}));

				// Update vape-free duration
				// Array to store event dates
				const eventDates = [];

				events.forEach((event) => {
					const eventTimestamp = event.timestamp;
					if (eventTimestamp && typeof eventTimestamp.toDate === "function") {
						const eventDate = dayjs(eventTimestamp.toDate()).tz(
							"America/New_York"
						);
						eventDates.push(eventDate);
					}
				});

				if (eventDates.length > 0) {
					// Find the most recent event date
					const mostRecentDate = dayjs.max(eventDates);

					// Calculate duration since most recent event
					const now = dayjs().tz("America/New_York");
					const diffMilliseconds = now.diff(mostRecentDate);

					const duration = dayjs.duration(diffMilliseconds);

					const days = Math.floor(duration.asDays());
					const hours = duration.hours();
					const minutes = duration.minutes();

					setVapeFreeDuration({
						days,
						hours,
						minutes
					});
				} else {
					// If no events, set duration to zero
					setVapeFreeDuration({
						days: 0,
						hours: 0,
						minutes: 0
					});
				}
			} else {
				console.log("No such document for usage history!");
			}
		});

		// Cleanup listener on unmount or when selectedDate changes
		return () => unsubscribe();
	}, [selectedDate]);

	// Fetch real-time heart rate data
	useEffect(() => {
		const docRef = doc(db, "healthData", "healthdata"); // Specify the correct document ID

		const unsubscribe = onSnapshot(docRef, (docSnap) => {
			if (docSnap.exists()) {
				const samples = docSnap.data().samples; // Assuming the data structure includes an array of samples
				const heartRateSamples = samples.filter(
					(sample) => sample.type === "HKQuantityTypeIdentifierHeartRate"
				);

				if (heartRateSamples.length > 0) {
					const total = heartRateSamples.reduce(
						(acc, sample) => acc + sample.value,
						0
					);
					const average = total / heartRateSamples.length;
					setHeartRate(average.toFixed(2)); // Set the calculated average, rounded to two decimal places

					// Store heart rate data for chatbot
					setUserData((prevData) => ({
						...prevData,
						heartRate: average.toFixed(2)
					}));
				} else {
					console.log("No heart rate samples found.");
				}
			} else {
				console.log("No such document for heart rate data!");
			}
		});

		// Cleanup listener on unmount
		return () => unsubscribe();
	}, []);

	// Scroll to bottom of chat when new message arrives
	useEffect(() => {
		if (chatMessagesRef.current) {
			chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
		}
	}, [chatMessages]);

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
				text: "Daily Activity" // Title of the chart
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

	// Function to handle chat input submission
	const handleChatSubmit = async (e) => {
		e.preventDefault();

		if (!chatInput.trim()) return;

		// Add user's message to chat
		setChatMessages((prevMessages) => [
			...prevMessages,
			{ sender: "user", text: chatInput }
		]);

		setChatInput("");
		setLoading(true); // Start loading

		// Prepare data for OpenAI API
		const prompt = `
You are a health assistant. The user has provided the following data:

- Recent vape usage events: ${
			userData?.events
				?.map((event) => {
					const eventDate = dayjs(event.timestamp.toDate()).format(
						"YYYY-MM-DD HH:mm"
					);
					return `\n  - ${eventDate}`;
				})
				.join("") || "No events"
		}

- Average heart rate: ${userData?.heartRate || "No data"}

- Timestamp of this query: ${dayjs().format("YYYY-MM-DD HH:mm")}

Using this information, answer the user's question in a simple and readable way:

"${chatInput}"
    `;

		// Call OpenAI API
		try {
			const response = await axios.post(
				"https://api.openai.com/v1/chat/completions",
				{
					model: "gpt-4o-mini",
					messages: [{ role: "user", content: prompt }],
					max_tokens: 300,
					n: 1,
					stop: null,
					temperature: 0.7
				},
				{
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
					}
				}
			);

			const assistantMessage = response.data.choices[0].message.content.trim();

			// Add assistant's response to chat
			setChatMessages((prevMessages) => [
				...prevMessages,
				{ sender: "bot", text: assistantMessage }
			]);
		} catch (error) {
			console.error("Error calling OpenAI API:", error);
			setChatMessages((prevMessages) => [
				...prevMessages,
				{
					sender: "bot",
					text: "Sorry, I couldn't process your request at this time."
				}
			]);
		} finally {
			setLoading(false); // Stop loading once response is received
		}
	};

	// Helper function to calculate the longest streak of zero hits
	function calculateLongestStreak(dataArray) {
		let maxStreak = 0;
		let currentStreak = 0;

		dataArray.forEach((value) => {
			if (value === 0) {
				currentStreak++;
				if (currentStreak > maxStreak) {
					maxStreak = currentStreak;
				}
			} else {
				currentStreak = 0;
			}
		});

		return maxStreak;
	}

	// console.log(vapeFreeDuration.days);

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<div className="dashboard">
				<div className="latest-puff">
					<h1 className="title-text">KicNic</h1>
					<h5 className="secondary">{timeLeftText}</h5>
					<div className="bar-progress">
						<div
							className="bar-fill"
							style={{
								width: `${barWidth}%` // Add inline style to set width
							}}
						></div>
					</div>
				</div>
				<div className="dashboard-sections">
					<DashboardSection
						className="streak fade-in"
						title="You've Been Vape Free For"
					>
						<div className="streak-content">
							<div className="streak-stats">
								<p>
									<b>{vapeFreeDuration.days}</b> days,
								</p>
								<p>
									<b>{vapeFreeDuration.hours}</b> hours,
								</p>
								<p>
									and <b>{vapeFreeDuration.minutes}</b> minutes.
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
						className="daily-activity fade-in"
						title={`Activity For Today`}
					>
						<div className="bar-chart">
							<Bar
								className="bar"
								data={todayBardata} // Use today's data
								options={baroptions}
								sx={{ flex: 1 }}
							/>
						</div>
					</DashboardSection>
					<DashboardSection
						className="health-insights fade-in"
						title="Health Insights"
					>
						<div className="health-insights-content">
							<div className="heart-vitals">
								<FavoriteIcon
									className="heart-icon" // Add class for animation
									sx={{ fontSize: "60px" }}
								/>
								<div className="metric-container">
									<h2>{parseInt(heartRate)}&nbsp;BPM</h2>
									<span>Avg.&nbsp;Heart&nbsp;Rate</span>
								</div>
							</div>
							<div className="sleep-vitals">
								<BedtimeIcon
									className="bed-icon" // Add class for animation
									sx={{ fontSize: "60px" }}
								/>
								<div className="metric-container">
									<h2>5&nbsp;hours</h2>
									<span>Avg.&nbsp;Sleep&nbsp;Time</span>
								</div>
							</div>
						</div>
					</DashboardSection>
					<DashboardSection
						className="chat-bot fade-in"
						title="Ask About Your Health"
					>
						<div className="chat-bot-content">
							<div className="chat-messages" ref={chatMessagesRef}>
								{chatMessages.map((message, index) => (
									<div
										key={index}
										className={`chat-message ${
											message.sender === "user" ? "user" : "bot"
										}`}
									>
										<div className="message-bubble">
											<ReactMarkdown
												components={{
													h1: ({ ...props }) => (
														<span
															style={{ fontSize: "24px", fontWeight: "bold" }}
															{...props}
														/>
													),
													h2: ({ ...props }) => (
														<span
															style={{ fontSize: "17px", fontWeight: "bold" }}
															{...props}
														/>
													),
													h3: ({ ...props }) => (
														<span
															style={{ fontSize: "17px", fontWeight: "bold" }}
															{...props}
														/>
													),
													p: ({ ...props }) => (
														<p style={{ fontSize: "17px" }} {...props} />
													)
												}}
											>
												{message.text}
											</ReactMarkdown>
										</div>
									</div>
								))}
								{loading && (
									<div className="chat-message bot">
										<div className="message-bubble">
											<span>Typing...</span> {/* Loader text */}
										</div>
									</div>
								)}
							</div>
							<form className="chat-input" onSubmit={handleChatSubmit}>
								<input
									type="text"
									value={chatInput}
									onSubmit={handleChatSubmit}
									onChange={(e) => setChatInput(e.target.value)}
									placeholder="Ask a health question..."
								/>
								<button type="submit">
									<SendIcon />
								</button>
							</form>
						</div>
					</DashboardSection>
					<DashboardSection
						className="usage-history fade-in"
						title="Usage History"
					>
						<div className="usage-history-content">
							<div className="calendar-container">
								<DateCalendar
									showDaysOutsideCurrentMonth
									disableFuture={true}
									maxDate={yesterday}
									className="calendar"
									value={selectedDate}
									onChange={(newDate) =>
										setSelectedDate(newDate.startOf("day"))
									}
									sx={{
										"& .Mui-disabled": { color: "#000000" },
										"& .MuiTypography-root": { color: "#ffffff" }, // General text color
										"& .MuiIconButton-root": { color: "#ffffff" }, // Arrows and other icons
										"& .MuiPickersDay-root": {
											color: "#ffffff", // Default day color
											"&.Mui-selected": {
												backgroundColor: "#7692FF", // Selected day background
												color: "#ffffff" // Selected day text color
											}
										},
										"& .MuiPickersCalendarHeader-root": {
											color: "#ffffff", // Header text (month and year)
											"& .MuiPickersArrowSwitcher-button": {
												color: "#ffffff"
											} // Arrows specifically
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
							<div className="day-stats-container">
								<div className="day-stats">
									<div className="day-metrics">
										<div className="total">
											<p>Total Puffs</p>
											<h3>
												{bardata.datasets[0].data.reduce(
													(acc, val) => acc + val,
													0
												)}
											</h3>
										</div>
										<div className="total">
											<p>Avg. Hits Per Hour</p>
											<h3>
												{(
													bardata.datasets[0].data.reduce(
														(acc, val) => acc + val,
														0
													) / 24
												).toFixed(2)}
											</h3>
										</div>
										<div className="total">
											<p>Longest Vape Free Streak</p>
											<h3>
												{calculateLongestStreak(bardata.datasets[0].data)} hours
											</h3>
										</div>
									</div>

									<div className="bar-chart">
										<Bar
											className="bar"
											data={bardata} // Use bardata for usage history
											options={baroptions}
										/>
									</div>
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
