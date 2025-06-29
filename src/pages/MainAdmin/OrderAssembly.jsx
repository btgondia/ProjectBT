import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

const OrderAssembly = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (location.state?.orders) {
      setOrders(location.state.orders);
      sessionStorage.setItem(
        "orderAssemblySelectedOrders",
        JSON.stringify(location.state.orders)
      );
    } else {
      const stored = sessionStorage.getItem("orderAssemblySelectedOrders");
      if (stored) setOrders(JSON.parse(stored));
    }
  }, [location.state]);

  const counterTitles = [...new Set(orders.map((o) => o.counter_title).filter(Boolean))];

  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div
          id="heading"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <h2>Order Assembly</h2>
          {counterTitles.length ? (
            <ul style={{ listStyle: "none", margin: 0, paddingRight: "10px" }}>
              {counterTitles.map((title) => (
                <li key={title}>{title}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <div style={{ padding: "20px", textAlign: "center", fontSize: "4em" }}>
          Coming Soon...
        </div>
      </div>
    </>
  );
};

export default OrderAssembly;
