import { useState, useEffect } from "react";
import "./Realtime.css";

const Realtime = () => {
  const [latestImage, setLatestImage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestImage = async () => {
      try {
        setError(null); // Reset error on new request
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Unauthorized access. Please log in.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          "http://localhost:3000/storage/latest-image",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch latest image");
        }

        setLatestImage(data);
      } catch (err) {
        console.error("Error fetching latest image:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestImage();
    const interval = setInterval(fetchLatestImage, 5000); // Refresh every 5 sec

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Latest Image</h2>

      {loading && <p style={styles.loadingText}>Fetching latest image...</p>}
      {error && <p style={styles.errorText}>{error}</p>}

      {latestImage ? (
        <div style={styles.imageContainer}>
          <img
            src={`data:image/jpeg;base64,${latestImage.image}`}
            alt="Latest"
            style={styles.latestImage}
          />
          <p style={styles.timestamp}>
            Captured on: {new Date(latestImage.timestamp).toLocaleString()}
          </p>
        </div>
      ) : (
        !loading && <p style={styles.noImageText}>No recent images available</p>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "#000",
    minHeight: "100vh",
    padding: "20px",
    color: "white",
    textAlign: "center",
  },
  heading: {
    color: "#fff",
    fontSize: "24px",
    marginBottom: "20px",
  },
  loadingText: {
    color: "#888",
    fontSize: "16px",
  },
  errorText: {
    color: "red",
    fontSize: "16px",
  },
  imageContainer: {
    backgroundColor: "#121212",
    padding: "15px",
    borderRadius: "10px",
    display: "inline-block",
  },
  latestImage: {
    width: "100%",
    maxWidth: "500px",
    height: "auto",
    borderRadius: "8px",
  },
  timestamp: {
    fontSize: "12px",
    color: "#aaa",
    marginTop: "5px",
  },
  noImageText: {
    color: "#888",
    fontSize: "18px",
  },
};

export default Realtime;
