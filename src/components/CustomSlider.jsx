import React from "react";
import ReactSlider from "react-slider";

const CustomSlider = ({ min, max, value, onChange, minDistance }) => {
  return (
    <div style={{ padding: "10px 0" }}>
      <ReactSlider
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        pearling
        minDistance={minDistance}
        renderTrack={(props, state) => {
          const { key, ...restProps } = props;
          return (
            <div
              key={`track-${state.index}`}
              {...restProps}
              style={{
                ...restProps.style,
                height: "8px",
                background: state.index === 1 ? "#007bff" : "#ddd",
                borderRadius: "4px",
              }}
            />
          );
        }}
        renderThumb={(props, state) => {
          const { key, ...restProps } = props;
          return (
            <div
              key={`thumb-${state.index}`}
              {...restProps}
              style={{
                ...restProps.style,
                height: "20px",
                width: "20px",
                backgroundColor: "#007bff",
                borderRadius: "50%",
                cursor: "grab",
                top: "-6px",
              }}
            />
          );
        }}
      />
    </div>
  );
};

export default CustomSlider;