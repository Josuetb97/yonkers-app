// src/hooks/useGeolocation.js
import { useEffect, useState } from "react";

export default function useGeolocation() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // fallback SPS
        setLocation({ lat: 15.5042, lng: -88.025 });
      }
    );
  }, []);

  return location;
}
