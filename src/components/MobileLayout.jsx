import React from "react";

const MobileLayout = ({ children }) => {
  return (
    <div className="flex" style={{ width: "100vw" }}>
      <div
        style={{
          width: "100vw",
          maxWidth: "500px",
          position: "relative",
          height: "100vh",
          // height:"calc(100vh-300px)",
          minHeight: '-webkit-fill-available'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default MobileLayout;
