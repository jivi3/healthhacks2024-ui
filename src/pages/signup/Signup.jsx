import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css"; // Ensure you have CSS for styling

function Signup() {
    const [formData, setFormData] = useState({
        name: "",
        age: "",
        gender: "",
        vapingDuration: "",
        chronicConditions: "",
        medications: "",
        physicalActivityDays: "",
        stressLevel: ""
    });

    const navigate = useNavigate();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("Form Data Submitted:", formData);
        navigate("/dashboard"); // Redirect after form submission
    };

    return (
        <div className="signup-container">
            <h1>Sign Up</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
                <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} required />
                <select name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>
                <input type="text" name="vapingDuration" placeholder="How long have you been vaping?" value={formData.vapingDuration} onChange={handleChange} required />
                <input type="text" name="chronicConditions" placeholder="Do you have any chronic health conditions?" value={formData.chronicConditions} onChange={handleChange} required />
                <input type="text" name="medications" placeholder="Are you currently taking any medications?" value={formData.medications} onChange={handleChange} required />
                <input type="number" name="physicalActivityDays" placeholder="Days per week of physical activity" value={formData.physicalActivityDays} onChange={handleChange} required />
                <input type="number" name="stressLevel" placeholder="Overall stress level (1-10)" value={formData.stressLevel} onChange={handleChange} required />
                <button type="submit" className="submit-button">Submit</button>
            </form>
        </div>
    );
}

export default Signup;
