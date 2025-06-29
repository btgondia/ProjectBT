import React from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

const OrderAssembly = () => (
  <>
    <Sidebar />
    <Header />
    <div className="item-sales-container orders-report-container">
      <div id="heading">
        <h2>Order Assembly</h2>
      </div>
      <div style={{ padding: "20px", textAlign: "center" }}>Coming Soon...</div>
    </div>
  </>
);

export default OrderAssembly;
