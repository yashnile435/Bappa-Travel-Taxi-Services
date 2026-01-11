import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./BookingForm.css";
import logo from "../images/logo.jpg";
import {
  FaCar,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaUser,
  FaEnvelope,
  FaWhatsapp,
  FaArrowsAltV,
} from "react-icons/fa";
import { db, auth } from "../firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import Navbar from "./Navbar";

const BookingForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
    selectedCar: "",
    pickupDate: "",
    pickupTime: "",
    pickupLocation: "",
    dropoffLocation: "",
  });
  // 12-hour time controls
  const [timeHour12, setTimeHour12] = useState("");
  const [timeMinute, setTimeMinute] = useState("");
  const [timePeriod, setTimePeriod] = useState("");

  const to12hDisplay = (h24m) => {
    if (!h24m) return "";
    const [hh, mm = "00"] = String(h24m).split(":");
    let h = parseInt(hh, 10);
    const suf = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${mm} ${suf}`;
  };

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  // Removed WhatsApp dialog and thank you state
  const [lastBookingDetails, setLastBookingDetails] = useState(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [shareStep, setShareStep] = useState("prompt");

  const handleSwapLocations = () => {
    setFormData((prev) => ({
      ...prev,
      pickupLocation: prev.dropoffLocation,
      dropoffLocation: prev.pickupLocation,
    }));
  };

  useEffect(() => {
    // Redirect if not authenticated
    if (!auth.currentUser) {
      navigate("/login", { replace: true, state: { from: "/booking" } });
      return;
    }
    setCheckingAuth(false);
    if (location.state?.selectedCar) {
      setFormData((prevState) => ({
        ...prevState,
        selectedCar: location.state.selectedCar,
      }));
    }
    // Auto-fill user details if logged in
    const fetchUserDetails = async () => {
      if (auth.currentUser) {
        const q = query(
          collection(db, "users"),
          where("uid", "==", auth.currentUser.uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const userData = snap.docs[0].data();
          setFormData((prev) => ({
            ...prev,
            fullName: userData.name || "",
            email: userData.email || "",
            mobileNumber: userData.mobile || "",
          }));
        }
      }
    };
    fetchUserDetails();
  }, [location.state, navigate]);

  if (checkingAuth) {
    return (
      <div style={{ textAlign: "center", marginTop: "3rem" }}>
        Checking authentication...
      </div>
    );
  }

  const cars = [
    "Ertiga",
    "Innova Crysta",
    "Swift Dzire",
    "Tavera",
    "Tempo Traveller",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const to24hFrom12 = (h12, m, period) => {
    if (!h12 || !m || !period) return "";
    let h = parseInt(h12, 10);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const handleTimeSelectChange = (type, val) => {
    if (type === "hour") setTimeHour12(val);
    if (type === "minute") setTimeMinute(val);
    if (type === "period") setTimePeriod(val);
    const newHour = type === "hour" ? val : timeHour12;
    const newMinute = type === "minute" ? val : timeMinute;
    const newPeriod = type === "period" ? val : timePeriod;
    const computed = to24hFrom12(newHour, newMinute, newPeriod);
    setFormData((prev) => ({ ...prev, pickupTime: computed }));
  };

  // When using native <input type="time">, keep both 24h form value and 12h selector states in sync
  const handleTimeNativeChange = (e) => {
    const value = e.target.value; // format HH:MM
    setFormData((prev) => ({ ...prev, pickupTime: value }));
    if (!value) {
      setTimeHour12("");
      setTimeMinute("");
      setTimePeriod("");
      return;
    }
    const [hh, mm] = value.split(":");
    const h24 = parseInt(hh, 10);
    const period = h24 >= 12 ? "PM" : "AM";
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    setTimeHour12(String(h12));
    setTimeMinute(String(mm).padStart(2, "0"));
    setTimePeriod(period);
  };

  // Helper to get today's date in yyyy-mm-dd
  const getToday = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };
  // Helper to get max date (3 months from today) in yyyy-mm-dd
  const getMaxDate = () => {
    const max = new Date();
    max.setMonth(max.getMonth() + 3);
    return max.toISOString().split("T")[0];
  };

  // Location validation helpers
  const normalizeLocation = (value) =>
    (value || "").trim().replace(/\s+/g, " ");
  const isValidLocation = (value) => {
    const v = normalizeLocation(value);
    return v.length >= 3 && /[A-Za-z]/.test(v);
  };

  // Helper: build WhatsApp share text for admin
  const buildWhatsAppMessage = (details) => {
    if (!details) return "";
    const to12h = (t) => {
      if (!t) return "-";
      const [hh, mm = "00"] = String(t).split(":");
      let h = parseInt(hh, 10);
      const suffix = h >= 12 ? "PM" : "AM";
      h = h % 12;
      if (h === 0) h = 12;
      return `${h}:${mm} ${suffix}`;
    };
    return (
      `New Booking\n` +
      `Name: ${details.fullName}\n` +
      `Email: ${details.email}\n` +
      `Mobile: ${details.mobileNumber}\n` +
      `Car: ${details.selectedCar}\n` +
      `Date: ${details.pickupDate}\n` +
      `Time: ${to12h(details.pickupTime)}\n` +
      `Pickup: ${details.pickupLocation}\n` +
      `Drop-off: ${details.dropoffLocation}`
    );
  };

  const handleShareWhatsApp = () => {
    if (!lastBookingDetails) return;
    const adminPhone = "9011333966"; // Admin India number (without country code)
    const msg = buildWhatsAppMessage(lastBookingDetails);
    const url = `https://wa.me/91${adminPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    setShareStep("done");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      fullName,
      email,
      mobileNumber,
      selectedCar,
      pickupDate,
      pickupTime,
      pickupLocation,
      dropoffLocation,
    } = formData;

    // --- Location validation ---
    const pickupNorm = normalizeLocation(pickupLocation);
    const dropoffNorm = normalizeLocation(dropoffLocation);

    if (!isValidLocation(pickupLocation) || !isValidLocation(dropoffLocation)) {
      setErrorMessage(
        "Please enter proper pickup and drop-off locations (at least 3 characters and include letters)."
      );
      setShowErrorDialog(true);
      return;
    }

    if (pickupNorm.toLowerCase() === dropoffNorm.toLowerCase()) {
      setErrorMessage("Pickup and drop-off locations cannot be the same.");
      setShowErrorDialog(true);
      return;
    }
    // --- End location validation ---

    // --- Booking restrictions ---
    const today = new Date();
    const selectedDate = new Date(pickupDate + "T00:00:00");
    const maxDate = new Date(getMaxDate() + "T23:59:59");
    if (selectedDate < new Date(getToday() + "T00:00:00")) {
      setErrorMessage("You cannot book for a past date.");
      setShowErrorDialog(true);
      return;
    }
    if (selectedDate > maxDate) {
      setErrorMessage("You can only book up to 3 months from today.");
      setShowErrorDialog(true);
      return;
    }
    // If booking for today, check time is at least 2 hours from now
    if (pickupDate === getToday()) {
      const [hours, minutes] = pickupTime.split(":").map(Number);
      const bookingTime = new Date();
      bookingTime.setHours(hours, minutes, 0, 0);
      const minBookingTime = new Date();
      minBookingTime.setHours(today.getHours() + 2, today.getMinutes(), 0, 0);
      if (bookingTime < minBookingTime) {
        setErrorMessage(
          "For same-day bookings, pickup time must be at least 2 hours from now."
        );
        setShowErrorDialog(true);
        return;
      }
    }
    // --- End booking restrictions ---

    // Store in Firestore
    try {
      await addDoc(collection(db, "bookings"), {
        fullName,
        email,
        mobileNumber,
        selectedCar,
        pickupDate,
        pickupTime,
        pickupLocation,
        dropoffLocation,
        status: "pending",
        createdAt: new Date(),
        uid: auth.currentUser ? auth.currentUser.uid : null,
      });

      // Save details locally for WhatsApp share and greeting
      setLastBookingDetails({
        fullName: formData.fullName,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        selectedCar: formData.selectedCar,
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        pickupLocation: formData.pickupLocation,
        dropoffLocation: formData.dropoffLocation,
      });

      // Show prompt first, emails in background
      setShareStep("prompt");
      setShowSuccessDialog(true);
      setEmailWarning("");

      // Attempt to send emails (non-blocking)
      try {
        const response = await fetch(
          "https://us-central1-bappatravels-8fa47.cloudfunctions.net/sendEmail",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName,
              email,
              mobileNumber,
              selectedCar,
              pickupDate,
              pickupTime,
              pickupLocation,
              dropoffLocation,
            }),
          }
        );
        if (!response.ok) {
          setEmailWarning(
            "We could not send the confirmation email. Your booking is saved and our team will contact you shortly."
          );
        }
      } catch (err) {
        setEmailWarning(
          "We could not send the confirmation email. Your booking is saved and our team will contact you shortly."
        );
      }
    } catch (err) {
      setErrorMessage("An error occurred while booking. Please try again.");
      setShowErrorDialog(true);
    }
  };

  return (
    <>
      <Navbar />
      <div className="booking-modern-bg">
        <div className="booking-modern-container">
          <div className="booking-modern-card">
            <div className="booking-modern-header">
              <img
                src={logo}
                alt="Bappa travels taxi services Logo"
                className="booking-modern-logo"
              />
              <div>
                <h2>Bappa Travels</h2>
                <p>Your trusted travel partner</p>
              </div>
            </div>
            <form className="booking-modern-form" onSubmit={handleSubmit}>
              <h3>Book Your Ride</h3>
              <div className="booking-modern-fields">
                <div className="booking-modern-field">
                  <label htmlFor="fullName">Full Name</label>
                  <div className="booking-modern-input-icon">
                    <FaUser />
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      placeholder="Enter your name"
                    />
                  </div>
                </div>
                <div className="booking-modern-field">
                  <label htmlFor="email">Email</label>
                  <div className="booking-modern-input-icon">
                    <FaEnvelope />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div className="booking-modern-field">
                  <label htmlFor="mobileNumber">Mobile Number</label>
                  <div className="booking-modern-input-icon">
                    <FaPhoneAlt />
                    <input
                      type="tel"
                      id="mobileNumber"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      required
                      placeholder="Enter your mobile number"
                    />
                  </div>
                </div>
                <div className="booking-modern-field">
                  <label htmlFor="selectedCar">Select Car</label>
                  <select
                    id="selectedCar"
                    name="selectedCar"
                    value={formData.selectedCar}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Choose a car...
                    </option>
                    {cars.map((car) => (
                      <option key={car} value={car}>
                        {car}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="booking-modern-row">
                  <div className="booking-modern-field">
                    <label htmlFor="pickupDate">Pickup Date</label>
                    <input
                      type="date"
                      id="pickupDate"
                      name="pickupDate"
                      value={formData.pickupDate}
                      onChange={handleChange}
                      required
                      min={getToday()}
                      max={getMaxDate()}
                    />
                  </div>
                  <div className="booking-modern-field">
                    <label htmlFor="pickupTime">Pickup Time</label>
                    <input
                      type="time"
                      id="pickupTime"
                      name="pickupTime"
                      value={formData.pickupTime}
                      onChange={handleTimeNativeChange}
                      required
                    />
                  </div>
                </div>
                <div className="booking-location-group">
                  <div className="booking-modern-field">
                    <label htmlFor="pickupLocation">Pickup Location</label>
                    <div className="booking-modern-input-icon booking-location-input">
                      <FaMapMarkerAlt
                        style={{ color: "#e17055", fontSize: "1.2rem" }}
                      />
                      <input
                        type="text"
                        id="pickupLocation"
                        name="pickupLocation"
                        value={formData.pickupLocation}
                        onChange={handleChange}
                        required
                        placeholder="Enter pickup location"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSwapLocations}
                    title="Swap pickup and drop-off locations"
                    aria-label="Swap pickup and drop-off locations"
                    className="swap-locations-button"
                  >
                    <FaArrowsAltV />
                  </button>

                  <div className="booking-modern-field">
                    <label htmlFor="dropoffLocation">Drop-off Location</label>
                    <div className="booking-modern-input-icon booking-location-input">
                      <FaMapMarkerAlt
                        style={{ color: "#00b894", fontSize: "1.2rem" }}
                      />
                      <input
                        type="text"
                        id="dropoffLocation"
                        name="dropoffLocation"
                        value={formData.dropoffLocation}
                        onChange={handleChange}
                        required
                        placeholder="Enter drop-off location"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button type="submit" className="booking-modern-btn">
                <FaCar /> Book Now
              </button>
              {emailWarning && (
                <div className="booking-modern-warning">{emailWarning}</div>
              )}
            </form>
          </div>
        </div>
      </div>
      {/* Success and Error Dialogs (unchanged) */}
      {showSuccessDialog && (
        <div className="booking-modern-dialog-bg">
          <div className="booking-modern-dialog">
            {shareStep === "prompt" ? (
              <>
                <h2 className="booking-modern-success-title">Thank You!</h2>
                <div className="booking-modern-success-msg">
                  Your booking has been received.
                </div>
                {emailWarning && (
                  <div className="booking-modern-warning">{emailWarning}</div>
                )}
                <div className="booking-modern-share-msg">
                  Would you like to share your booking details with us on
                  WhatsApp?
                </div>
                <div className="booking-modern-share-btns">
                  <button
                    onClick={handleShareWhatsApp}
                    className="booking-modern-whatsapp-btn"
                  >
                    <FaWhatsapp /> Share on WhatsApp
                  </button>
                  <button
                    onClick={() => setShareStep("done")}
                    className="booking-modern-secondary-btn"
                  >
                    No, thanks
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="booking-modern-success-title">Thank You!</h2>
                <div className="booking-modern-success-msg">
                  Your booking is sent. We will contact you shortly.
                </div>
                {emailWarning && (
                  <div className="booking-modern-warning">{emailWarning}</div>
                )}
                <button
                  onClick={() => setShowSuccessDialog(false)}
                  className="booking-modern-secondary-btn"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {showErrorDialog && (
        <div className="booking-modern-dialog-bg">
          <div className="booking-modern-dialog booking-modern-error-dialog">
            <h2 className="booking-modern-error-title">Error</h2>
            <div className="booking-modern-error-msg">{errorMessage}</div>
            <button
              onClick={() => setShowErrorDialog(false)}
              className="booking-modern-secondary-btn"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingForm;
