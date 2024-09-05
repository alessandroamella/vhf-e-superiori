import { useState, useEffect, useRef } from "react";
import { MapContainer as LeafletMapContainer, TileLayer } from "react-leaflet";

const CustomMapContainer = ({ children, ...props }) => {
  const [height, setHeight] = useState(400);
  const mapRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const newHeight = window.innerWidth >= 992 ? window.innerHeight : 400;
      setHeight(newHeight);
    };

    handleResize(); // Set initial height

    const observer = new ResizeObserver(handleResize);
    observer.observe(mapRef.current?.container || window.document.body);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={mapRef} style={{ height: `${height}px`, width: "100%" }}>
      <LeafletMapContainer style={{ height: "100%", width: "100%" }} {...props}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {children}
      </LeafletMapContainer>
    </div>
  );
};

export default CustomMapContainer;
