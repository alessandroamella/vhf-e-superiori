import L from "leaflet";
import "leaflet-easyprint";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

function MapPrint(props) {
  const map = useMap();
  useEffect(() => {
    const control = L.easyPrint({
      ...props,
    });
    map.addControl(control);
    return () => {
      map.removeControl(control);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, props]);

  return null;
}

export default MapPrint;
