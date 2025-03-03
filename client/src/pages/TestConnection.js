import { useEffect, useState } from "react";

const TestConnection = () => {
  const [message, setMessage] = useState("Checking connection...");

  useEffect(() => {
    fetch("http://localhost:3000/test-connection")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage("Connection failed: " + err.message));
  }, []);

  return <h3>{message}</h3>;
};

export default TestConnection;
