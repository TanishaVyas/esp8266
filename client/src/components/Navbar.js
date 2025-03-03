import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleSignout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("deviceId");
    navigate("/auth/login");
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.navbarContainer}>
        {/* Logo */}
        <div style={styles.logo}>Nilima ka Dabba</div>

        {/* Navigation Links (Only if logged in) */}
        <div style={styles.navLinks}>
          {token && (
            <Link to="/storage/images" style={styles.link}>
              Storage
            </Link>
          )}
          {token && (
            <Link to="/storage/realtime" style={styles.link}>
              Realtime
            </Link>
          )}
        </div>

        {/* Auth Buttons */}
        <div style={styles.authButtons}>
          {!token && (
            <Link
              to="/auth/signup"
              style={{ ...styles.authBtn, ...styles.signupBtn }}
            >
              Sign Up
            </Link>
          )}
          {!token && (
            <Link
              to="/auth/login"
              style={{ ...styles.authBtn, ...styles.loginBtn }}
            >
              Login
            </Link>
          )}
          {token && (
            <button onClick={handleSignout} style={styles.signoutButton}>
              Sign Out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: "#000",
    padding: "15px 20px",
    borderBottom: "1px solid #262626",
    display: "flex",
    justifyContent: "center",
    position: "sticky",
    top: "0",
    width: "100%",
    zIndex: "1000",
  },
  navbarContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "80%",
    maxWidth: "1200px",
  },
  logo: {
    fontSize: "22px",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontFamily: "'Pacifico', cursive",
  },
  navLinks: {
    display: "flex",
    gap: "20px",
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontSize: "16px",
    transition: "color 0.2s",
  },
  authButtons: {
    display: "flex",
    gap: "15px",
  },
  authBtn: {
    textDecoration: "none",
    padding: "8px 15px",
    borderRadius: "5px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background 0.3s",
  },
  signupBtn: {
    backgroundColor: "#0095f6",
    color: "white",
  },
  loginBtn: {
    backgroundColor: "transparent",
    color: "#0095f6",
    border: "1px solid #0095f6",
  },
  signoutButton: {
    backgroundColor: "#ff3b30",
    color: "white",
    border: "none",
    padding: "8px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "background 0.3s",
  },
};

export default Navbar;
