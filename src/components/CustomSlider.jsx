import React from "react";
import { Range } from "react-range";

const CustomSlider = ({ min, max, value, onChange, minDistance }) => {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : 100000;
  const safeValue = Array.isArray(value) && value.length === 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])
    ? [Math.max(safeMin, Math.min(safeMax, value[0])), Math.max(safeMin, Math.min(safeMax, value[1]))]
    : [safeMin, safeMax];

  // Debugging
  console.log("CustomSlider props:", { min, max, value, safeMin, safeMax, safeValue });

  return (
    <div style={{ padding: "10px 0", minHeight: "40px" }}>
      <Range
        min={safeMin}
        max={safeMax}
        values={safeValue}
        onChange={(values) => onChange(values)}
        step={1} 
        minDistance={minDistance || 10} 
        renderTrack={({ props, children }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: "8px",
              width: "100%",
              background: "linear-gradient(to right, #ddd 0%, #ddd 50%, #007bff 50%, #007bff 100%)",
              borderRadius: "4px",
            }}
          >
            {children}
          </div>
        )}
        renderThumb={({ props, index }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: "20px",
              width: "20px",
              backgroundColor: "#007bff",
              borderRadius: "50%",
              cursor: "grab",
              outline: "none", // Remove focus outline
            }}
          />
        )}
      />
    </div>
  );
};

export default CustomSlider;