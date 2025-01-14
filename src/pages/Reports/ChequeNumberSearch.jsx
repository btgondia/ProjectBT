import axios from "axios";
import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import { OrderDetails } from "../../components/OrderDetails";
import Sidebar from "../../components/Sidebar";
import Select from "react-select";
import { getLastMonthDate } from "../../utils/helperFunctions";
const ChequeNumberSearch = () => {
  const [searchData, setSearchData] = useState();
  const [popupOrder, setPopupOrder] = useState(null);
  const [items, setItems] = useState([]);

  const [invoiceNumberFilter, setInvoiceNumberFilter] = useState("");
  const [initial, setInitial] = useState(false);

  const getOrders = async () => {
    const response = await axios({
      method: "post",
      url: "/orders/getOrderListByChequeNumber",
      data: { cheque_number: searchData },
      headers: {
        "Content-Type": "application/json",
      },
    });
   
    if (response.data.success) setItems(response.data.result);
    else setItems([]);
  };

  useEffect(() => {
    if (initial) getOrders();
    else setInitial(true);
  }, [popupOrder]);

  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading">
          <h2>Cheque Number Search</h2>
        </div>
        <div id="item-sales-top">
          <div
            id="date-input-container"
            style={{
              overflow: "visible",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              width: "100%",
            }}
          >
            <input
              type="text"
              onChange={(e) => setSearchData(e.target.value)}
              value={searchData}
              placeholder="Search Cheque Number..."
              className="searchInput"
            />

            <input
              type="number"
              onChange={(e) => setInvoiceNumberFilter(e.target.value)}
              value={invoiceNumberFilter}
              placeholder="Search Invoice Number..."
              className="searchInput"
              onWheel={(e) => e.preventDefault()}
            />

            <button className="theme-btn" onClick={() => getOrders()}>
              Search
            </button>
          </div>
        </div>
        <div className="table-container-user item-sales-container">
          <Table
            itemsDetails={items.filter(
              (a) =>
                !invoiceNumberFilter ||
                a.invoice_number
                  ?.toString()
                  .toLocaleLowerCase()
                  .includes(invoiceNumberFilter.toLocaleLowerCase())
            )}
            setPopupOrder={setPopupOrder}
          />
        </div>
      </div>
      {popupOrder ? (
        <OrderDetails
          onSave={() => {
            setPopupOrder(null);
            getOrders();
          }}
          order_uuid={popupOrder.order_uuid}
          orderStatus="edit"
        />
      ) : (
        ""
      )}
    </>
  );
};

export default ChequeNumberSearch;

function Table({ itemsDetails, setPopupOrder, counter }) {
  function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var strTime = hours + ":" + minutes + " " + ampm;
    return strTime;
  }

  return (
    <table
      className="user-table"
      style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}
    >
      <thead>
        <tr>
          <th>S.N</th>
    
          <th colSpan={3}>Counter</th>
          <th colSpan={2}>Invoice</th>

          <th colSpan={2}>Amount</th>
        </tr>
      </thead>
      <tbody className="tbody">
        {itemsDetails
          ?.sort((a, b) => a.order_date - b.order_date)
          ?.map((item, i, array) => (
            <tr
              key={Math.random()}
              style={{ height: "30px" }}
              onClick={() => setPopupOrder(item)}
              className={
                item?.status?.find((_i) => +_i.stage === 5)
                  ? "cancelled-order-row"
                  : ""
              }
            >
              <td>{i + 1}</td>
            
              <td colSpan={3}>{item?.counter_title || ""}</td>
              <td colSpan={2}>{item.invoice_number || ""}</td>
         
              <td colSpan={2}>{item.amt || ""}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
