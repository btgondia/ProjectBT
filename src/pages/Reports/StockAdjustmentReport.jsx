import React, { useContext, useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Select from "react-select";
import axios from "axios";
import context from "../../context/context";
const StockAdjustmentReport = () => {
  const [searchData, setSearchData] = useState({
    startDate: "",
    endDate: "",
    counter_uuid: 0,
  });
  const [warehouse, setWarehouse] = useState([]);

  const [items, setItems] = useState([]);

  const { setNotification } = useContext(context);
  const GetWarehouseList = async () => {
    const response = await axios({
      method: "get",
      url: "/warehouse/GetWarehouseList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success)
      setWarehouse(response.data.result.filter((a) => a.warehouse_title));
  };
  const getCounterStockReport = async () => {
    // if (!searchData?.warehouse_uuid) {
    //   setNotification({
    //     message: "Please select a warehouse first",
    //     success: false,
    //   });
    //   setTimeout(() => {
    //     setNotification(null);
    //   }, 3000);

    //   return;
    // }
    let startDate = new Date(
      new Date(searchData.startDate).setHours(0, 0, 0, 0)
    ).getTime();
    let endDate = new Date().setDate(
      new Date(searchData.endDate).getDate() + 1
    );
    endDate = new Date(new Date(endDate).setHours(0, 0, 0, 0)).getTime();

    const response = await axios({
      method: "post",
      url: "/vouchers/GetStockReportSummary",
      data: {
        warehouse_uuid: searchData.warehouse_uuid,
        startDate: startDate,
        endDate: endDate,
        type: searchData.type,
        visibility: searchData.visibility,
      },
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
    let sTime = "yy-mm-dd"
      .replace("mm", ("00" + time?.getMonth()?.toString()).slice(-2))
      .replace("yy", ("0000" + time?.getFullYear()?.toString()).slice(-4))
      .replace("dd", ("00" + time?.getDate()?.toString()).slice(-2));
    setSearchData((prev) => ({
      ...prev,
      startDate: sTime,
      endDate: curTime,
      visibility: "1",
    }));
    GetWarehouseList();
  }, []);

  const typeOptions = [
    { value: 0, label: "All" },
    { value: "+", label: "Added (+)" },
    { value: "-", label: "Reduced (-)" },
  ];
  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading">
          <h2>Stock Adjustment Summary</h2>
        </div>
        <div id="item-sales-top">
          <div
            id="date-input-container"
            style={{
              overflow: "visible",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div className="inputGroup" style={{ width: "15%" }}>
              <label htmlFor="warehouse_uuid">From Date</label>
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
            </div>
            <div className="inputGroup" style={{ width: "15%" }}>
              <label htmlFor="warehouse_uuid">To Date</label>
              <input
                type="date"
                onChange={(e) =>
                  setSearchData((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
                value={searchData.endDate}
                placeholder="Search Route Title..."
                className="searchInput"
                pattern="\d{4}-\d{2}-\d{2}"
              />
            </div>
            <div className="inputGroup" style={{ width: "30%" }}>
              <label htmlFor="warehouse_uuid">Warehouse</label>
              <Select
                options={[
                  { value: 0, label: "All" },
                  ...warehouse?.map((a) => ({
                    value: a.warehouse_uuid,
                    label: a.warehouse_title,
                  })),
                ]}
                onChange={(doc) =>
                  setSearchData((prev) => ({
                    ...prev,
                    warehouse_uuid: doc.value,
                  }))
                }
                value={
                  searchData?.warehouse_uuid
                    ? {
                        value: searchData?.warehouse_uuid,
                        label: warehouse?.find(
                          (j) => j.warehouse_uuid === searchData.warehouse_uuid
                        )?.warehouse_title,
                      }
                    : { value: 0, label: "All"}
                }
                openMenuOnFocus={true}
                menuPosition="fixed"
                menuPlacement="auto"
                placeholder="Select warehouse"
              />
            </div>
            <div className="inputGroup" style={{ width: "15%" }}>
              <label htmlFor="type">Type</label>
              <Select
                options={typeOptions}
                onChange={(doc) =>
                  setSearchData((prev) => ({
                    ...prev,
                    type: doc.value,
                  }))
                }
                value={
                  searchData?.type
                    ? {
                        value: searchData?.type,
                        label: typeOptions?.find(
                          (j) => j.value === searchData.type
                        )?.label,
                      }
                    : { value: 0, label: "All" }
                }
                openMenuOnFocus={true}
                menuPosition="fixed"
                menuPlacement="auto"
                placeholder="Select type"
              />
            </div>
            <div className="inputGroup" style={{ width: "15%" }}>
              <label htmlFor="visibility">Visibility</label>
              <Select
                options={[
                  { value: "1", label: "Yes" },
                  { value: "0", label: "No" },
                ]}
                onChange={(doc) =>
                  setSearchData((prev) => ({
                    ...prev,
                    visibility: doc.value,
                  }))
                }
                value={
                  +searchData?.visibility
                    ? { value: "1", label: "Yes" }
                    : { value: "0", label: "No" }
                }
                openMenuOnFocus={true}
                menuPosition="fixed"
                menuPlacement="auto"
                placeholder="Select visibility"
              />
            </div>
            <button
              className="theme-btn"
              onClick={() => getCounterStockReport()}
            >
              Search
            </button>
          </div>
        </div>
        <div className="table-container-user item-sales-container">
          <Table itemsDetails={items} />
        </div>
      </div>
    </>
  );
};

export default StockAdjustmentReport;

function Table({ itemsDetails }) {
  const CovertedQty = (qty, conversion) => {
    let b = +qty / +conversion;
    b = Math.sign(b) * Math.floor(Math.sign(b) * b);
    let p = Math.floor(+qty % +conversion);
    return b + ":" + p;
  };
  return (
    <table
      className="user-table"
      style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}
    >
      <thead>
        <tr>
          <th>S.N</th>
          <th colSpan={3}>Item Name</th>

          <th colSpan={2}>Qty</th>
          <th colSpan={2}>Est. Value</th>
        </tr>
      </thead>
      <tbody className="tbody">
        {itemsDetails
          ?.sort((a, b) => a.timestamp - b.timestamp)
          ?.map((item, i, array) => (
            <tr key={Math.random()} style={{ height: "30px" }}>
              <td>{i + 1}</td>
              <td colSpan={3}>{item.item_title}</td>

              <td colSpan={2}>{item?.qty || 0}</td>
              <td colSpan={2}>{item?.estValue || 0}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
