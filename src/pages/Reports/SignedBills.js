import axios from "axios";
import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

const PendingsEntry = () => {
  const [orders, setOrders] = useState([]);


  const getOrders = async () => {
    const response = await axios({
      method: "get",
      url: "/orders/getSignedBills",

      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("users", response);
    if (response.data.success) setOrders(response.data.result);
  };

  useEffect(() => {
    getOrders();
  }, []);
  const putOrder = async (order_uuid) => {
    const response = await axios({
      method: "put",
      url: "/orders/putCompleteSignedBills",
      data: { status: 1, order_uuid },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      return;
    }
  };

  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading" className="flex">
          <h2 style={{ width: "70%" }}>Signed Bills</h2>
        </div>

        <div className="table-container-user item-sales-container">
          <Table
            itemsDetails={orders}
            putOrder={putOrder}
            getOrders={getOrders}
          />
        </div>
      </div>
    </>
  );
};

function Table({
  itemsDetails,

  putOrder,

  getOrders,
}) {
  return (
    <table
      className="user-table"
      style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}
    >
      <thead>
        <tr>
          <th>S.N</th>
          <th colSpan={2}>Counter</th>
          <th colSpan={2}>Invoice Number</th>
          <th colSpan={2}>Time</th>
          <th colSpan={2}>User</th>
          <th colSpan={2}>Amount</th>
          <th colSpan={2}>Unpaid</th>
          <th colSpan={2}>Action</th>
        </tr>
      </thead>
      <tbody className="tbody">
        {itemsDetails
          ?.sort((a, b) => +a.invoice_number - +b.invoice_number)
          ?.map((item, i, array) => (
            <tr key={Math.random()} style={{ height: "30px" }}>
              <td className="flex" style={{ justifyContent: "space-between" }}>
                {i + 1}
              </td>

              <td colSpan={2}>{item.counter_title || ""}</td>
              <td colSpan={2}>{item.invoice_number || ""}</td>
              <td colSpan={2}>{item.time_stamp || ""}</td>
              <td colSpan={2}>{item.user_title || ""}</td>
              <td colSpan={2}>{item.order_grandtotal || ""}</td>

              <td colSpan={2}>{item.amount || 0}</td>
              <td colSpan={2}>
                <button
                  className="item-sales-search"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await putOrder(item.order_uuid);
                    getOrders();
                  }}
                >
                  Done
                </button>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

export default PendingsEntry;