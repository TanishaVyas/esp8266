import { useState, useEffect } from "react";
//import "./Storage.css";

const Storage = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchImages = async () => {
      try {
        if (!token) {
          console.error("No token found");
          return;
        }

        const response = await fetch("http://localhost:3000/storage/images", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok) {
          setImages(data);
        } else {
          console.error("Error fetching images:", data.message);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchImages();
  }, [token]);

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Stored Images</h2>
      <div style={styles.imageGrid}>
        {images.length > 0 ? (
          images.map((imgObj, index) => (
            <div key={index} style={styles.imageCard}>
              <img
                src={`data:image/jpeg;base64,${imgObj.image}`}
                alt={`Image ${index}`}
                style={styles.storedImage}
                onClick={() => setSelectedImage(imgObj.image)}
              />
              <p style={styles.timestamp}>
                Captured on: {new Date(imgObj.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p style={styles.noImages}>No images found</p>
        )}
      </div>

      {/* Modal for enlarged image */}
      {selectedImage && (
        <div style={styles.modal} onClick={() => setSelectedImage(null)}>
          <div style={styles.modalContent}>
            <img
              src={`data:image/jpeg;base64,${selectedImage}`}
              alt="Enlarged"
              style={styles.modalImage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "#000",
    minHeight: "100%",
    padding: "20px",
    color: "white",
    textAlign: "center",
  },
  heading: {
    color: "#fff",
    fontSize: "24px",
    marginBottom: "20px",
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    justifyContent: "center",
  },
  imageCard: {
    backgroundColor: "#121212",
    padding: "10px",
    borderRadius: "10px",
    textAlign: "center",
  },
  storedImage: {
    width: "100%",
    height: "auto",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "transform 0.3s",
  },
  timestamp: {
    fontSize: "12px",
    color: "#aaa",
    marginTop: "5px",
  },
  noImages: {
    color: "#888",
    fontSize: "18px",
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    maxWidth: "90%",
    maxHeight: "90%",
  },
  modalImage: {
    width: "100%",
    height: "auto",
    borderRadius: "10px",
  },
};

export default Storage;
