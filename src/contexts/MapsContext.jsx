import { createContext, useContext } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const MapsContext = createContext({ isLoaded: false });

export function useMaps() {
  return useContext(MapsContext);
}

/* Carga Google Maps UNA SOLA VEZ para toda la app */
export function MapsProvider({ children }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  return (
    <MapsContext.Provider value={{ isLoaded }}>
      {children}
    </MapsContext.Provider>
  );
}
