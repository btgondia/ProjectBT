import axios from "axios";
import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import { OrderDetails } from "../../components/OrderDetails";
import Sidebar from "../../components/Sidebar";
import Headers from "../../components/Header";
import * as XLSX from "xlsx";
import * as FileSaver from "file-saver";
import Select from "react-select";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid";

import MenuItem from "@mui/material/MenuItem";
import Selected from "@mui/material/Select";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};
const StockTrack = () => {
  const [searchData, setSearchData] = useState({
    startDate: "",
    endDate: "",
    counter_uuid: "",
  });
  const [item, setItem] = useState("");
  const [itemEditPopup, setItemEditPopup] = useState("");
  const [popupOrder, setPopupOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [invoiceNumberFilter, setInvoiceNumberFilter] = useState("");
  const [initial, setInitial] = useState(false);
  const [warehouseData, setWarehouseData] = useState([]);
  const GetWarehouseList = async () => {
    const response = await axios({
      method: "get",
      url: "/warehouse/GetWarehouseList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success)
      setWarehouseData(
        response.data.result
          .filter((a) => a.warehouse_title)
          .map((a) => ({
            ...a,
            id: a.warehouse_uuid,
            name: a.warehouse_title,
            slug: a.warehouse_title,
            type: "Main",
            locale: "en",
            created_at: "2021-11-15T08:27:23.000Z",
            updated_at: "2021-11-15T08:27:23.000Z",
            cover: null,
          }))
      );
  };
  const getCompleteOrders = async () => {
    let startDate = new Date(searchData.startDate + " 00:00:00 AM");
    startDate = startDate.getTime();
    let endDate = new Date(searchData.endDate + " 00:00:00 AM");
    endDate = endDate.getTime();
    const response = await axios({
      method: "post",
      url: "/stockTracker/getStockTracking",
      data: { startDate, endDate },
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
      .replace("mm", ("00" + (time?.getMonth() + 1)?.toString()).slice(-2))
      .replace("yy", ("0000" + time?.getFullYear()?.toString()).slice(-4))
      .replace("dd", ("00" + (time?.getDate() - 7)?.toString()).slice(-2));
    setSearchData((prev) => ({
      ...prev,
      startDate: sTime,
      endDate: curTime,
    }));
  }, []);
  useEffect(() => {
    if (initial) getCompleteOrders();
    else setInitial(true);
  }, [popupOrder]);
  useEffect(() => {
    GetWarehouseList();
  }, []);

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
              justifyContent: "space-between",
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

            <button className="theme-btn" onClick={() => getCompleteOrders()}>
              Search
            </button>
          </div>
        </div>
        <div className="table-container-user item-sales-container">
          <Table
            itemsDetails={items}
            setPopupOrder={setPopupOrder}
            warehouseData={warehouseData}
            setItemData={setItem}
            setItemEditPopup={setItemEditPopup}
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
      {itemEditPopup ? (
        <QuantityChanged
          popupInfo={itemEditPopup}
          item={item}
          onSave={() => {
            setItemEditPopup("");
          }}
        />
      ) : (
        ""
      )}
    </>
  );
};

export default StockTrack;

const CovertedQty = (qty, conversion) => {
  let b = qty / +conversion;

  b = Math.sign(b) * Math.floor(Math.sign(b) * b);

  let p = Math.floor(qty % +conversion);

  return b + ":" + p;
};
function Table({ itemsDetails, warehouseData, setItemEditPopup, setItemData }) {
  const [items, setItems] = useState("sort_order");
  const [order, setOrder] = useState(null);
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
              <span>Item Name</span>
              <div className="sort-buttons-container">
                <button
                  onClick={() => {
                    setItems("item_title");
                    setOrder("asc");
                  }}
                >
                  <ChevronUpIcon className="sort-up sort-button" />
                </button>
                <button
                  onClick={() => {
                    setItems("item_title");
                    setOrder("desc");
                  }}
                >
                  <ChevronDownIcon className="sort-down sort-button" />
                </button>
              </div>
            </div>
          </th>

          {warehouseData?.map((a) => (
            <th colSpan={2}>
              <div className="t-head-element">
                <span>{a.warehouse_title}</span>
                <div className="sort-buttons-container">
                  <button
                    onClick={() => {
                      setItems(a);
                      setOrder("asc");
                    }}
                  >
                    <ChevronUpIcon className="sort-up sort-button" />
                  </button>
                  <button
                    onClick={() => {
                      setItems(a);
                      setOrder("desc");
                    }}
                  >
                    <ChevronDownIcon className="sort-down sort-button" />
                  </button>
                </div>
              </div>
            </th>
          ))}
          <th>Total</th>
        </tr>
      </thead>
      <tbody className="tbody">
        {itemsDetails
          .sort((a, b) =>
            order == null
              ? 0
              : items?.warehouse_uuid
              ? order === "asc"
                ? (a?.stock?.find(
                    (c) => items.warehouse_uuid === c.warehouse_uuid
                  )?.qty || 0) -
                  (b?.stock?.find(
                    (c) => items.warehouse_uuid === c.warehouse_uuid
                  )?.qty || 0)
                : (b?.stock?.find(
                    (c) => items.warehouse_uuid === c.warehouse_uuid
                  )?.qty || 0) -
                  (a?.stock?.find(
                    (c) => items.warehouse_uuid === c.warehouse_uuid
                  )?.qty || 0)
              : order === "asc"
              ? typeof a[items] === "string"
                ? a[items].localeCompare(b[items])
                : a[items] - b[items]
              : typeof a[items] === "string"
              ? b[items].localeCompare(a[items])
              : b[items] - a[items]
          )
          ?.map((item, i, array) => (
            <tr key={Math.random()} style={{ height: "30px" }}>
              <td className="flex" style={{ justifyContent: "space-between" }}>
                {i + 1}
              </td>

              <td colSpan={2}>{item.item_title || ""}</td>
              {warehouseData?.map((a) => {
                let data = item?.warehouseStocks?.find(
                  (b) => b.warehouse_uuid === a.warehouse_uuid
                );
                return (
                  <>
                    <td
                      style={{
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      {CovertedQty(data?.warehouseStock || 0, item.conversion)}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        cursor: "pointer",
                      }}
                      className="hoverLink"
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemEditPopup({ ...a, type: "min_level" });
                        setItemData(item);
                      }}
                    >
                      ({data?.stockOrder?.length || 0})
                    </td>
                  </>
                );
              })}
              <td>
                {CovertedQty(
                  item?.stock?.length > 1
                    ? item?.stock
                        ?.map((a) => +a.qty || 0)
                        .reduce((a, b) => a + b)
                    : item?.stock?.length
                    ? item.stock[0]?.qty
                    : 0,
                  item.conversion
                )}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
function QuantityChanged({ onSave, popupInfo, item }) {
	const [itemDetails, setItemDetails] = useState([]);
  useEffect(() => {
    setItemDetails(
        item.warehouseStocks.find(
          (a) => a.warehouse_uuid === popupInfo.warehouse_uuid
        )?.stockOrder || [],
    );
  }, [item.warehouseStocks, popupInfo.warehouse_uuid]);

  const dateConverter = () => {
    let dateIn = new Date();

    dateIn.setHours(12);
    let dateFor10days = new Date(dateIn.setDate(dateIn.getDate() - 10));

    let strFor10Days =
      dateFor10days.getFullYear() +
      "-" +
      ("0" + (dateFor10days.getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + dateFor10days.getDate()).slice(-2);
    strFor10Days = new Date(strFor10Days);

    return strFor10Days;
  };

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
            <div className="inventory_header">
              <h2>
                {item.item_title}{" "}
                {CovertedQty(
                  item.stock?.find(
                    (a) => a.warehouse_uuid === popupInfo.warehouse_uuid
                  )?.qty || 0,
                  item.conversion
                )}
              </h2>
            </div>

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
                    <th colSpan={2}>Invoice Number</th>
                    <th colSpan={2}>Qty</th>
                   
                  </tr>
                </thead>
                <tbody className="tbody">
                  {itemDetails?.map((item, i, array) => {
                    return (
                      <tr key={Math.random()} style={{ height: "30px" }}>
                        <td>{i + 1}</td>
                        <td colSpan={2}>
                          {new Date(item.timestamp)?.toDateString() || ""}
                        </td>

                        <td colSpan={2}>N{item.invoice_number || ""}</td>
                        <td colSpan={2}>{item.qty || 0}</td>
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
