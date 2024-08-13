import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { getDDMMYYDate } from "../../utils/helperFunctions";
import { CopyAll } from "@mui/icons-material";
import context from "../../context/context";

const GSTReturnsReport = () => {
  const [searchData, setSearchData] = useState();
  const [popupOrder, setPopupOrder] = useState(null);
  const [items, setItems] = useState([]);
  const { setNotification } = useContext(context);

  const getOrders = async () => {
    const response = await axios({
      method: "get",
      url: "/gstReturns/getGSTReturns",
      headers: {
        "Content-Type": "application/json",
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("activity", response);
    if (response.data.success) setItems(response.data.result);
    else setItems([]);
  };

  useEffect(() => {
    getOrders();
  }, [popupOrder]);

  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading">
          <h2>GST Returns Report</h2>
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
              placeholder="Search Title..."
              className="searchInput"
            />
          </div>
        </div>
        <div className="table-container-user item-sales-container">
          <Table
            itemsDetails={items.filter(
              (a) =>
                !searchData ||
                a?.title?.toLowerCase().includes(searchData.toLowerCase())
            )}
            setNotification={setNotification}
          />
        </div>
      </div>
    </>
  );
};

export default GSTReturnsReport;

function Table({ itemsDetails, setNotification }) {
  return (
    <table
      className="user-table"
      style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}
    >
      <thead>
        <tr>
          <th>S.N</th>

          <th>Type</th>
          <th colSpan={3}>Return Period</th>

          <th>Title</th>
          <th>Created At</th>
          <th>Created By</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody className="tbody">
        {itemsDetails
          ?.sort((a, b) => a.created_at - b.created_at)
          ?.map((item, i, array) => (
            <tr key={Math.random()} style={{ height: "30px" }}>
              <td>{i + 1}</td>

              <td>{item.type || ""}</td>
              <td colSpan={3}>
                {(item.from_date ? getDDMMYYDate(item.from_date,"/") : "")} -
                  {(item.to_date ? getDDMMYYDate(item.to_date,"/") : "")}
              </td>
              <td>{item.title || ""}</td>
              <td>{item.created_at ? getDDMMYYDate(item.created_at,"/") : ""}</td>
              <td>{item.user_title || ""}</td>
              <td>{item.status || ""}</td>
              <td
                onClick={() => {
                  navigator.clipboard.writeText(JSON.parse(item.json_data));
                  setNotification({
                    success: true,
                    message: "Copied to clipboard",
                  });
                }}
              >
                <CopyAll />
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
