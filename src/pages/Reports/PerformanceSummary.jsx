import axios from "axios";
import React, { useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import {
  TiArrowSortedUp,
  TiArrowSortedDown,
  TiArrowUnsorted,
} from "react-icons/ti";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/solid";
import { formatAMPM } from "../../utils/helperFunctions";
const today = new Date().getTime();

const formatDate = (_date) => {
  const date = new Date(_date);
  return [
    date?.getFullYear().toString().padStart(4, "0"),
    (date?.getMonth() + 1).toString().padStart(2, "0"),
    date?.getDate().toString().padStart(2, "0"),
  ].join("-");
};

const PerformanceSummary = () => {
  const [data, setData] = useState();
  const [popupData, setPopupData] = useState();
  const [dateValues, setDateValues] = useState({
    from_date: today,
    to_date: today,
  });

  const search = async () => {
    let startDate = new Date(
      new Date(dateValues.from_date).setHours(0, 0, 0, 0)
    ).getTime();
    let endDate = new Date().setDate(
      new Date(dateValues.to_date).getDate() + 1
    );
    endDate = new Date(new Date(endDate).setHours(0, 0, 0, 0)).getTime();

   
    const response = await axios("users/performance-summary",{
      method: "post",
      data: {
        from_date: startDate,
        to_date: endDate,
        from:new Date(dateValues.from_date).getDate(),
        to:new Date(dateValues.to_date).getDate(),
      },
    });
    if (response.status === 200) {
      setData(response.data.result);
    }
  };

  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading">
          <h2>Performance Summary</h2>
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
              gap: "20px",
            }}
          >
            <input
              type="date"
              onChange={(e) =>
                setDateValues((prev) => ({
                  ...prev,
                  from_date: e.target.valueAsNumber,
                }))
              }
              max={formatDate(today)}
              value={formatDate(dateValues.from_date)}
              className="searchInput"
              style={{ width: "250px" }}
            />
            <input
              type="date"
              onChange={(e) =>
                setDateValues((prev) => ({
                  ...prev,
                  to_date: e.target.valueAsNumber,
                }))
              }
              max={formatDate(today)}
              value={formatDate(dateValues.to_date)}
              className="searchInput"
              style={{ width: "250px" }}
            />
            <button
              style={{ width: "100px", justifyContent: "center" }}
              className="theme-btn"
              onClick={search}
            >
              Search
            </button>
          </div>
        </div>
        <div className="table-container-user item-sales-container">
          <Table data={data} setPopupData={setPopupData} />
        </div>
      </div>
      {popupData ? (
        <PerformancePopup
          onSave={() => {
            setPopupData(null);
          }}
          itemDetails={popupData}
        />
      ) : (
        ""
      )}
    </>
  );
};

function Table({ data = [],setPopupData }) {
  const columns = ["Placed", "Processed", "Checked", "Delivered", "Completed"];

  return (
    <table
      className="user-table"
      style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}
    >
      <thead>
        <tr>
          <th>S.N</th>
          <th colSpan={2}>
            <div className="t-head-element">
              <span>Users</span>
              <div className="sort-buttons-container"></div>
            </div>
          </th>

          {columns.map((a) => (
            <th colSpan={2}>
              <div className="t-head-element">
                <span>{a}</span>
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="tbody">
        {data?.map((item, i, array) => (
          <tr key={Math.random()} style={{ height: "30px" }}>
            <td className="flex" style={{ justifyContent: "space-between" }}>
              {i + 1}
            </td>

            <td colSpan={2}>{item.user_title || ""}</td>
            {columns.map((a) => {
              let value = item[a.toLowerCase()];
              return (
                <>
                  <td
                    style={{
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    ₹{value?.amount || 0}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      cursor: "pointer",
                    }}
                    onClick={() => setPopupData(value?.orders)}
                  >
                    {value?.count || 0}
                  </td>
                </>
              );
            })}
          </tr>
        ))}

        <tr style={{ fontWeight: "bolder" }}>
          <td colSpan={3} style={{ textAlign: "center" }}>
            Total
            {/* <ChevronDownIcon className="sort-down sort-button" /> */}
          </td>
          {columns?.map((a) => {
            let totalAmount = 0;
            let totalQty = 0;
            data.forEach((item) => {
              totalAmount += item[a.toLowerCase()]?.amount || 0;
              totalQty += item[a.toLowerCase()]?.count || 0;
            });
            return (
              <>
                <td style={{ textAlign: "left" }}>₹{totalAmount}</td>
                <td style={{ textAlign: "right" }}>{totalQty}</td>
              </>
            );
          })}
        </tr>
      </tbody>
    </table>
  );
}
function PerformancePopup({ onSave, itemDetails }) {
  return (
    <div className="overlay">
      <div
        className="modal"
        style={{
          height: "fit-content",
          width: "90vw",
          padding: "50px",
          zIndex: "999999999",
          border: "2px solid #000",
        }}
      >
        <div className="inventory">
          <div
            className="accountGroup"
            id="voucherForm"
            action=""
            style={{
              height: "400px",
              maxHeight: "500px",
              overflow: "scroll",
            }}
          >
            <div className="table-container-user item-sales-container">
              <table
                className="user-table"
                style={{
                  maxWidth: "100vw",
                  height: "fit-content",
                  overflowX: "scroll",
                }}
              >
                <thead>
                  <tr>
                    <th>S.N</th>
                    <th colSpan={2}>Date</th>
                    <th colSpan={2}>Counter Title</th>
                    <th colSpan={2}>Invoice Number</th>
                    <th colSpan={2}>Amount</th>
                  </tr>
                </thead>
                <tbody className="tbody">
                  {itemDetails?.map((item, i, array) => {
                    return (
                      <tr key={Math.random()} style={{ height: "30px" }}>
                        <td>{i + 1}</td>
                        <td colSpan={2}>
                          {formatAMPM(new Date(item.date))} {new Date(item.date)?.toDateString() || ""}
                        </td>
                        <td colSpan={2}>{item.counter_title || ""}</td>
                        <td colSpan={2}>{item.invoice_number || ""}</td>
                        <td colSpan={2}>{item.order_grandtotal || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <button onClick={onSave} className="closeButton">
            x
          </button>
        </div>
      </div>
    </div>
  );
}

export default PerformanceSummary;
