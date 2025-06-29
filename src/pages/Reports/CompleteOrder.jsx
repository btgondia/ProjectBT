import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import Header from "../../components/Header";
import { OrderDetails } from "../../components/OrderDetails";
import Sidebar from "../../components/Sidebar";
import Select from "react-select";
import { getLastMonthDate } from "../../utils/helperFunctions";
import Context from "../../context/context"
const CompleteOrder = () => {
  const [searchData, setSearchData] = useState({
    startDate: "",
    endDate: "",
    counter_uuid: "",
  });
  let { setNotification } = useContext(Context);
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
    if (!searchData?.counter_uuid)
      return setNotification({message:"Please select a counter first",success:false});
    let startDate = new Date(searchData.startDate + " 00:00:00 AM");
    startDate = startDate.getTime();
    let endDate = new Date(searchData.endDate + " 00:00:00 AM");
    endDate = endDate.getTime();
    const response = await axios({
      method: "post",
      url: "/orders/getCompleteOrderList",
      data: { startDate, endDate, counter_uuid: searchData.counter_uuid },
      headers: {
        "Content-Type": "application/json",
      },
    });
   
    if (response.data.success) setItems(response.data.result);
    else setItems([]);
  };

  useEffect(() => {
    let time = new Date();
    let curTime = "yy-mm-dd"
      .replace("mm", ("00" + (time?.getMonth() + 1)?.toString()).slice(-2))
      .replace("yy", ("0000" + time?.getFullYear()?.toString()).slice(-4))
      .replace("dd", ("00" + time?.getDate()?.toString()).slice(-2));
    let sTime = getLastMonthDate();
    sTime = "yy-mm-dd"
      .replace("mm", ("00" + (sTime?.getMonth() + 1)?.toString()).slice(-2))
      .replace("yy", ("0000" + sTime?.getFullYear()?.toString()).slice(-4))
      .replace("dd", ("00" + sTime?.getDate()?.toString()).slice(-2));
   
    setSearchData((prev) => ({
      ...prev,
      startDate: sTime,
      endDate: curTime,
    }));
    getCounter();
  }, []);
  useEffect(() => {
    if (initial) getCompleteOrders();
    else setInitial(true);
  }, [popupOrder]);

  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading">
          <h2>Completed Order</h2>
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
              type="date"
              onChange={(e) =>
                setSearchData((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              value={searchData.startDate}
              placeholder="Search Counter Title..."
              className="searchInput"
              pattern="\d{4}-\d{2}-\d{2}"
            />
            <input
              type="date"
              onChange={(e) =>
                setSearchData((prev) => ({ ...prev, endDate: e.target.value }))
              }
              value={searchData.endDate}
              placeholder="Search Route Title..."
              className="searchInput"
              pattern="\d{4}-\d{2}-\d{2}"
            />
            <input
              type="number"
              onChange={(e) => setInvoiceNumberFilter(e.target.value)}
              value={invoiceNumberFilter}
              placeholder="Search Invoice Number..."
              className="searchInput"
              onWheel={(e) => e.preventDefault()}
            />
            <div className="inputGroup" style={{ width: "50%" }}>
              <Select
                options={[
                  ...counter.map((a) => ({
                    value: a.counter_uuid,
                    label: a.counter_title + " , " + a.route_title,
                  })),
                ]}
                onChange={(doc) =>
                  setSearchData((prev) => ({
                    ...prev,
                    counter_uuid: doc.value,
                  }))
                }
                value={
                  searchData?.counter_uuid
                    ? {
                        value: searchData?.counter_uuid,
                        label: counter?.find(
                          (j) => j.counter_uuid === searchData.counter_uuid
                        )?.counter_title,
                      }
                    : null
                }
                openMenuOnFocus={true}
                menuPosition="fixed"
                menuPlacement="auto"
                placeholder="Select counter"
              />
            </div>
            <button className="theme-btn" onClick={() => getCompleteOrders()}>
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
            counter={counter}
          />
        </div>
      </div>
      {popupOrder ? (
        <OrderDetails
          onSave={() => {
            setPopupOrder(null);
            setTimeout(() => {
              getCompleteOrders();
            }, 2000);
          }}
          order_uuid={popupOrder.order_uuid}
          orderStatus="edit"
          counter={counter}
        />
      ) : (
        ""
      )}
    </>
  );
};

export default CompleteOrder;

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
          <th colSpan={2}>Delivery Date</th>
          <th colSpan={3}>Counter</th>
          <th colSpan={2}>Invoice</th>
          <th colSpan={2}>Qty</th>
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
              <td colSpan={2}>
                {new Date(+item.order_date).toDateString()} -{" "}
                {formatAMPM(new Date(+item.order_date))}
              </td>
              <td colSpan={2}>
                {item.delivery_date
                  ? new Date(item.delivery_date).toDateString() +
                    " - " +
                    formatAMPM(new Date(item.delivery_date))
                  : ""}
              </td>
              <td colSpan={3}>
                {counter.find((a) => a.counter_uuid === item.counter_uuid)
                  ?.counter_title || ""}
              </td>
              <td colSpan={2}>{item.invoice_number || ""}</td>
              <td colSpan={2}>{item.qty || ""}</td>
              <td colSpan={2}>{item.amt || ""}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
