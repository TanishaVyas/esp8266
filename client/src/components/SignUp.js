import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword || !deviceId) {
      setError("All fields are required!");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, deviceId }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/auth/login");
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (error) {
      setError("Server error. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.signupBox}>
        <h1 style={styles.logo}>Nilima Ka Dabba</h1>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.inputBox}
        />

        <input
          type="text"
          placeholder="Phone number, username, or email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.inputBox}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.inputBox}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={styles.inputBox}
        />

        <input
          type="text"
          placeholder="Device ID"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          style={styles.inputBox}
        />

        {error && <p style={styles.errorText}>{error}</p>}

        <button onClick={handleSignUp} style={styles.signupButton}>
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      </div>

      <div style={styles.loginBox}>
        Already have an account?{" "}
        <span onClick={() => navigate("/auth/login")} style={styles.loginLink}>
          Log in
        </span>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    backgroundColor: "#000",
  },
  signupBox: {
    backgroundColor: "#111",
    padding: "40px",
    borderRadius: "10px",
    textAlign: "center",
    width: "350px",
    border: "1px solid #262626",
  },
  logo: {
    fontFamily: "'Pacifico', cursive",
    fontSize: "36px",
    color: "white",
    marginBottom: "10px",
  },
  text: {
    color: "#ccc",
    fontSize: "14px",
    marginBottom: "20px",
  },
  inputBox: {
    width: "100%",
    padding: "12px",
    margin: "8px 0",
    border: "1px solid #262626",
    backgroundColor: "#222",
    color: "white",
    borderRadius: "5px",
  },
  signupButton: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#0095f6",
    border: "none",
    color: "white",
    fontSize: "16px",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "10px",
  },
  orDivider: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "15px 0",
  },
  line: {
    height: "1px",
    width: "40%",
    backgroundColor: "#262626",
  },
  orText: {
    color: "#888",
    margin: "0 10px",
  },
  fbButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    color: "#0095f6",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    width: "100%",
    marginTop: "10px",
  },
  fbLogo: {
    width: "20px",
    marginRight: "8px",
  },
  loginBox: {
    color: "white",
    textAlign: "center",
    marginTop: "15px",
    padding: "15px",
    backgroundColor: "#111",
    border: "1px solid #262626",
    width: "350px",
    borderRadius: "5px",
  },
  loginLink: {
    color: "#0095f6",
    cursor: "pointer",
  },
  errorText: {
    color: "red",
    fontSize: "14px",
    marginBottom: "10px",
  },
};

export default SignUp;
