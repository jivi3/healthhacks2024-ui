import { useEffect, useState } from "react";
import "./App.css";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import duration from "dayjs/plugin/duration";
import timezone from "dayjs/plugin/timezone"; // Import timezone plugin
import minMax from "dayjs/plugin/minMax"; // Import minMax plugin
import DashboardSection from "./components/DashboardSection/DashboardSection";
import { Bar } from "react-chartjs-2";

import { DateCalendar, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import FavoriteIcon from "@mui/icons-material/Favorite";
import BedtimeIcon from "@mui/icons-material/Bedtime";

import { db } from "../firebase-config";
import { doc, onSnapshot } from "firebase/firestore"; // Import onSnapshot

import {
  Chart as ChartJS,
  Title,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
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

// Extend Day.js with necessary plugins
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone); // Extend with timezone plugin
dayjs.extend(duration);
dayjs.extend(minMax); // Extend with minMax plugin

const yesterday = dayjs().subtract(1, "day");

function App() {
  const [heartRate, setHeartRate] = useState(0); // Initializing with 0 or a default value
  const [selectedDate, setSelectedDate] = useState(dayjs().startOf("day")); // Default to today at start of day
  const [vapeFreeDuration, setVapeFreeDuration] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
  }); // State to store vape-free duration

  const generateTimeLabels = () => {
    const labels = [];
    for (let hour = 0; hour < 24; hour++) {
      const amPm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      labels.push(`${displayHour}:00 ${amPm}`);
    }
    return labels;
  };

  // State for today's data
  const [todayBardata, setTodayBardata] = useState({
    labels: generateTimeLabels(), // Use generated time labels
    datasets: [
      {
        label: "Hits",
        data: new Array(24).fill(0), // Adjusted to match 24 labels (0 to 23 hours)
        backgroundColor: ["#7692FF"],
        borderWidth: 1,
        borderRadius: 7,
      },
    ],
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
        borderRadius: 7,
      },
    ],
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
              data: counts,
            },
          ],
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
        const targetDate = selectedDate
          .tz("America/New_York")
          .startOf("day");

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
              data: counts,
            },
          ],
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
            minutes,
          });
        } else {
          // If no events, set duration to zero
          setVapeFreeDuration({
            days: 0,
            hours: 0,
            minutes: 0,
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

  const baroptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        position: "top", // Position of the legend
      },
      title: {
        display: false,
        text: "Daily Activity", // Title of the chart
      },
    },
    scales: {
      y: {
        beginAtZero: true, // Y-axis starts at 0
        grid: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false, // This hides the grid lines on the x-axis
        },
      },
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="dashboard">
        <div className="latest-puff">
          <h1>You&apos;re on a 0 day streak of cutting down usage!</h1>
          <h5 className="secondary">3 days left to hit a new milestone</h5>
          <div className="bar-progress">
            <div className="bar-fill"></div>
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
            title={`Activity for today`}
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
                  className="heart-icon"
                  sx={{ fontSize: "60px" }}
                />
                <div className="metric-container">
                  <h2>{parseInt(heartRate)}&nbsp;BPM</h2>
                  <span>Avg.&nbsp;Heart&nbsp;Rate</span>
                </div>
              </div>
              <div className="sleep-vitals">
                <BedtimeIcon
                  className="bed-icon"
                  sx={{ fontSize: "60px" }}
                />
                <div className="metric-container">
                  <h2>5&nbsp;hours</h2>
                  <span>Avg&nbsp;Sleep&nbsp;Time</span>
                </div>
              </div>
            </div>
          </DashboardSection>
          <DashboardSection
            className="spending-stats fade-in"
            title="Spending Stats"
          ></DashboardSection>
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
                        color: "#ffffff", // Selected day text color
                      },
                    },
                    "& .MuiPickersCalendarHeader-root": {
                      color: "#ffffff", // Header text (month and year)
                      "& .MuiPickersArrowSwitcher-button": {
                        color: "#ffffff",
                      }, // Arrows specifically
                    },
                  }}
                  slotProps={{
                    day: {
                      style: {
                        color: "#ffffff",
                      },
                    },
                  }}
                />
              </div>

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
                      {/* Calculate longest zero sequence in bardata */}
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
          </DashboardSection>
        </div>
      </div>
    </LocalizationProvider>
  );
}

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

export default App;
