import React from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { useLocation } from "react-router-dom";

const OrderAssembly = () => {
  const location = useLocation();
  const orders = location.state?.orders || [];

  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container order-assembly-container">
        <div id="heading">
          <h2>Order Assembly</h2>
        </div>
        <div className="order-assembly-boxes">
          {orders.map((item, idx) => (
            <div key={idx} className="order-assembly-box">
              {item?.counter_title}
            </div>
          ))}
        </div>
        <div style={{ padding: "20px", textAlign: "center" }}>Coming Soon...</div>
      </div>
    </>
  );
};

export default OrderAssembly;
