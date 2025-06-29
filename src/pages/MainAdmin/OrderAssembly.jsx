import React from "react";
import { useLocation } from "react-router-dom";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

const OrderAssembly = () => {
  const { state } = useLocation();
  const orders = state?.orders || [];

  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading" className="flex items-center justify-between">
          <h2>Order Assembly</h2>
          <div className="flex space-x-2">
            {orders.map((order) => (
              <div
                key={order.order_uuid || order.invoice_number}
                className="px-3 py-1 text-sm text-gray-700 bg-white border rounded-md shadow-sm hover:bg-gray-50 transition"
              >
                {order.counter_title}
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 text-gray-500 text-center">
          {orders.length ? "" : "No orders selected"}
        </div>
      </div>
    </>
  );
};

export default OrderAssembly;
