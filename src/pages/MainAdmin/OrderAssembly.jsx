import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

const CarateContainer = ({ titles }) => (
  <div
    className="w-full md:w-1/4 max-h-[30vh] md:max-h-none md:h-1/2 bg-white shadow rounded p-2 overflow-y-auto"
  >
    <div className="flex flex-wrap">
      {titles.map((title) => (
        <span
          key={title}
          className="bg-gray-100 rounded-full px-2 py-1 text-sm m-1 truncate"
        >
          {title}
        </span>
      ))}
    </div>
  </div>
);

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

  const counterTitles = [
    ...new Set(orders.map((o) => o.counter_title).filter(Boolean)),
  ];

  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading" className="flex justify-between items-center">
          <h2>Order Assembly</h2>
        </div>
        <div className="flex flex-col md:flex-row-reverse flex-1 h-full items-start">
          <CarateContainer titles={counterTitles} />
          <div className="flex items-center justify-center w-full md:w-3/4 h-full">
            <div className="p-20 text-center text-4xl">Coming Soon...</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderAssembly;
