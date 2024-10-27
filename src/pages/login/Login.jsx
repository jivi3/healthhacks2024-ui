import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("Login submitted:", { email, password });
    // Assume login is successful
    navigate("/dashboard");
  };

  const handleSignUpClick = () => {
    navigate("/signup"); // Assume you have a route set up for signup
  };

  return (
    <div className="main">
      <div className="login-container">
        <h1 className="login-title">KicNic</h1>
        <div className="form-container">
          <form className="login-form" onSubmit={handleSubmit}>
            <input
              type="email"
              id="email"
              value={email}
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              id="password"
              value={password}
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="login-button">
              Login
            </button>
            <button
              type="button"
              className="signup-button"
              onClick={handleSignUpClick}
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
