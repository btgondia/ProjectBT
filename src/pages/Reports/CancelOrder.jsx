import axios from "axios";
import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import { OrderDetails } from "../../components/OrderDetails";
import Sidebar from "../../components/Sidebar";
import Select from "react-select";
const CancelOrders = () => {
  const [searchData, setSearchData] = useState({
    startDate: "",
    endDate: "",
    counter_uuid: "",
  });
  const [popupOrder, setPopupOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [counter, setCounter] = useState([]);
  const [invoiceNumberFilter, setInvoiceNumberFilter] = useState("");
  const [initial, setInitial] = useState(false);

  const getCounter = async () => {
    const response = await axios({
      method: "get",
      url: "/counters/GetCounterList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setCounter(response.data.result);
  };
  const getCompleteOrders = async () => {

    const response = await axios({
      method: "get",
      url: "/cancelOrders/GetCancelOrdersList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("activity", response);
    if (response.data.success) setItems(response.data.result);
    else setItems([]);
  };

  useEffect(() => {
    getCompleteOrders()
    getCounter();
  }, []);


  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading">
          <h2>Canceled Order</h2>
        </div>
       
        <div className="table-container-user item-sales-container">
          <Table
            itemsDetails={items.filter(
              (a) =>
                !invoiceNumberFilter ||
                a.invoice_number
                  .toString()
                  .toLocaleLowerCase()
                  .includes(invoiceNumberFilter.toLocaleLowerCase())
            )}
            setPopupOrder={setPopupOrder}
            counter={counter}
          />
        </div>
      </div>
      {popupOrder ? (
        <OrderDetails
          onSave={() => {
            setPopupOrder(null);
            getCompleteOrders();
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

export default CancelOrders;

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
          <th colSpan={2}>Order Date</th>
          <th colSpan={2}>Cancel Date</th>
          <th colSpan={3}>Counter</th>
          <th colSpan={2}>Invoice</th>
         
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
            >
              <td>{i + 1}</td>
              <td colSpan={2}>
                {new Date(+item?.status[0]?.time).toDateString()} -{" "}
                {formatAMPM(new Date(+item?.status[0]?.time))}
              </td>
              {console.log(item.status)}
              <td colSpan={2}>
                {+item?.status.filter(a=>+a.stage===5).length
                  ? new Date(+item?.status.find(a=>+a.stage===5)?.time).toDateString() +
                    " - " +
                    formatAMPM(new Date(+item?.status.find(a=>+a.stage===5)?.time))
                  : ""}
              </td>
              <td colSpan={3}>
                {counter.find((a) => a.counter_uuid === item.counter_uuid)
                  ?.counter_title || ""}
              </td>
              <td colSpan={2}>{item.invoice_number || ""}</td>
             
            </tr>
          ))}
      </tbody>
    </table>
  );
}
