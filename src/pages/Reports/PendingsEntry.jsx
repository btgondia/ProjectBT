import axios from "axios";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Header from "../../components/Header";
import { OrderDetails } from "../../components/OrderDetails";
import Sidebar from "../../components/Sidebar";
import * as XLSX from "xlsx";
import * as FileSaver from "file-saver";
import { CheckCircle, Close, Download } from "@mui/icons-material";
const fileExtension = ".xlsx";
const fileType =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";

const PendingsEntry = () => {
  const [orders, setOrders] = useState([]);
  const [itemsData, setItemsData] = useState([]);
  const [warningCodes, setWarningCodes] = useState(false);
  const [popupOrder, setPopupOrder] = useState(false);
  const [allDoneConfimation, setAllDoneConfimation] = useState(false);
  const [doneDisabled, setDoneDisabled] = useState(false);
  const [excelDownloadPopup, setExcelDownloadPopup] = useState(false);
  const [loading, setLoading] = useState(false); 
  const [counters, setCounters] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);

  useEffect(() => {
    if (allDoneConfimation) {
      setDoneDisabled(true);
      setTimeout(() => setDoneDisabled(false), 5000);
    }
  }, [allDoneConfimation]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();

  const getOrders = async (page = 1) => {
    setLoading(true);
    const response = await axios.get(
      `/orders/getPendingEntry?page=${page}&limit=300`
    );
    if (response.data.success) {
      setOrders((prevOrders) => [...prevOrders, ...response.data.result]);
      console.log(response.data.result.length);
      if (response.data.result.length < 300) {
        setHasMore(false); // No more data if returned less than limit
      }
    }
    setLoading(false);
  };
  const getCounter = async (controller = new AbortController()) => {
    const response = await axios({
      method: "get",
      url: "/counters/GetCounterList",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setCounters(response.data.result);
  };

  const getItemsData = async (controller = new AbortController()) => {
    const cachedData = localStorage.getItem("itemsData");
    if (cachedData) {
      setItemsData(JSON.parse(cachedData));
    } else {
      const response = await axios({
        method: "get",
        url: "/items/GetItemList",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        localStorage.setItem("itemsData", JSON.stringify(response.data.result));
        setItemsData(response.data.result);
      }
    }
  };
  useEffect(() => {
    let controller = new AbortController();

    getItemsData(controller);
    getCounter(controller);
    return () => {
      controller.abort();
    };
  }, []);
  useEffect(() => {
    getOrders(page);
  }, [page]);
  const putOrder = async (invoice_number) => {
    const response = await axios({
      method: "put",
      url: "/orders/putCompleteOrder",
      data: { entry: 1, invoice_number },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      setOrders((prev) =>
        prev.filter((a) => a.invoice_number !== invoice_number)
      );
      return;
    }
  };
  const downloadHandler = async () => {
    let sheetData = [];
    // console.log(sheetData)
    for (let order of selectedOrders?.sort(
      (a, b) => +a.invoice_number - +b.invoice_number
    )) {
      for (let item of order?.item_details?.filter(
        (a) => a.status !== 3 && (a.b || a.p || a.free)
      )) {
        let date = new Date(+order.status[0]?.time);
        let itemData = itemsData.find((a) => a.item_uuid === item.item_uuid);
        sheetData.push({
          "Party Code":
            counters.find((b) => b.counter_uuid === order.counter_uuid)
              ?.counter_code || "",
          "Invoice Number": order.invoice_number,
          "Invoice Date": "dd/mm/yy"
            .replace("mm", ("00" + (date?.getMonth() + 1).toString()).slice(-2))
            .replace("yy", ("0000" + date?.getFullYear().toString()).slice(-4))
            .replace("dd", ("00" + date?.getDate().toString()).slice(-2)),
          "Item Code": itemData.item_code || "",
          Box: item.b || 0,
          Pcs: item.p || 0,
          Free: item.free || 0,
          "Item Price":
            +(item.edit_price || item.price || itemData?.item_price || 0) *
            +(itemData?.conversion || 1),
          "Cash Credit":
            order.modes.filter(
              (a) =>
                a.amt && a.mode_uuid !== "c67b54ba-d2b6-11ec-9d64-0242ac120002"
            ).length || order.unpaid
              ? "Credit"
              : "Cash",
          "Discount 1": item.charges_discount?.length
            ? item.charges_discount[0]?.value
            : 0,
          "Discount 2": item.charges_discount?.length
            ? item.charges_discount[1]?.value
            : 0,
        });
      }
    }

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(data, "Book" + fileExtension);
    // setSelectedOrders([]);
  };
  const downloadHandlerTwo = async () => {
    let sheetData = [];
    // console.log(sheetData)
    for (let order of selectedOrders
      .filter((a) => a.replacement)
      ?.sort((a, b) => +a.invoice_number - +b.invoice_number)) {
      let date = new Date(+order.status[0]?.time);
      console.log(order);
      sheetData.push({
        "Party Code":
          counters.find((b) => b.counter_uuid === order.counter_uuid)
            ?.counter_code || "",
        "Invoice Number": "SR" + order.invoice_number,
        "Invoice Date": "dd/mm/yy"
          .replace("mm", ("00" + (date?.getMonth() + 1).toString()).slice(-2))
          .replace("yy", ("0000" + date?.getFullYear().toString()).slice(-4))
          .replace("dd", ("00" + date?.getDate().toString()).slice(-2)),
        "Item Code": order.item_code || "",
        Box: 0,
        Pcs: 1,
        Free: 0,
        "Item Price": order.conversion * order.replacement,
        "Cash Credit":
          order.modes.filter(
            (a) =>
              a.amt && a.mode_uuid !== "c67b54ba-d2b6-11ec-9d64-0242ac120002"
          ).length || order.unpaid
            ? "Credit"
            : "Cash",
        "Discount 1": 0,
        "Discount 2": 0,
      });
    }
    for (let order of selectedOrders
      .filter((a) => a.adjustment)
      ?.sort((a, b) => +a.invoice_number - +b.invoice_number)) {
      let date = new Date(+order.status[0]?.time);
      console.log(order);
      sheetData.push({
        "Party Code":
          counters.find((b) => b.counter_uuid === order.counter_uuid)
            ?.counter_code || "",
        "Invoice Number": "SR" + order.invoice_number,
        "Invoice Date": "dd/mm/yy"
          .replace("mm", ("00" + (date?.getMonth() + 1).toString()).slice(-2))
          .replace("yy", ("0000" + date?.getFullYear().toString()).slice(-4))
          .replace("dd", ("00" + date?.getDate().toString()).slice(-2)),
        "Item Code": order.item_code || "",
        Box: 0,
        Pcs: 1,
        Free: 0,
        "Item Price": order.conversion * order.adjustment,
        "Cash Credit":
          order.modes.filter(
            (a) =>
              a.amt && a.mode_uuid !== "c67b54ba-d2b6-11ec-9d64-0242ac120002"
          ).length || order.unpaid
            ? "Credit"
            : "Cash",
        "Discount 1": 0,
        "Discount 2": 0,
      });
    }
    for (let order of selectedOrders
      .filter((a) => a.shortage)
      ?.sort((a, b) => +a.invoice_number - +b.invoice_number)) {
      let date = new Date(+order.status[0]?.time);
      console.log(order);
      sheetData.push({
        "Party Code":
          counters.find((b) => b.counter_uuid === order.counter_uuid)
            ?.counter_code || "",
        "Invoice Number": "SR" + order.invoice_number,
        "Invoice Date": "dd/mm/yy"
          .replace("mm", ("00" + (date?.getMonth() + 1).toString()).slice(-2))
          .replace("yy", ("0000" + date?.getFullYear().toString()).slice(-4))
          .replace("dd", ("00" + date?.getDate().toString()).slice(-2)),
        "Item Code": order.item_code || "",
        Box: 0,
        Pcs: 1,
        Free: 0,
        "Item Price": order.conversion * order.shortage,
        "Cash Credit":
          order.modes.filter(
            (a) =>
              a.amt && a.mode_uuid !== "c67b54ba-d2b6-11ec-9d64-0242ac120002"
          ).length || order.unpaid
            ? "Credit"
            : "Cash",
        "Discount 1": 0,
        "Discount 2": 0,
      });
    }

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(data, "CN" + fileExtension);
    // setSelectedOrders([]);
  };
  const recipts = useMemo(
    () =>
      orders.map((a) => ({
        ...a,
        ...counters.find((b) => b.counter_uuid === a.counter_uuid),
        status: a.status,
      })),
    [counters, orders]
  );
  const lastOrderElementRef = useRef();

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage((prevPage) => prevPage + 1);
      }
    });

    if (lastOrderElementRef.current) {
      observer.current.observe(lastOrderElementRef.current);
    }

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [hasMore, loading]);
  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading" className="flex">
          <h2 style={{ width: "70%" }}>Pending Order Entry</h2>
          <button
            type="button"
            className="submit flex"
            style={{
              margin: "0",
              padding: "1px 10px",
              fontSize: "15px",
              height: "30px",
            }}
            onClick={() =>
              setSelectedOrders((prev) =>
                prev.length === orders.length ? [] : orders
              )
            }
          >
            <input
              type="checkbox"
              checked={orders.length === selectedOrders.length}
              style={{ marginRight: "5px" }}
            />
            Select All
          </button>
        </div>

        <div className="table-container-user item-sales-container">
          <Table
            itemsDetails={recipts}
            setPopupOrder={setPopupOrder}
            putOrder={putOrder}
            selectedOrders={selectedOrders}
            setSelectedOrders={setSelectedOrders}
            getOrders={getOrders}
          />
          {orders.length ? (
            <div
              ref={lastOrderElementRef}
              style={{ height: 20, backgroundColor: "transparent" }}
            ></div>
          ) : (
            ""
          )}
        </div>
        {selectedOrders.length ? (
          <div className="flex" style={{ justifyContent: "start" }}>
            <button
              className="theme-btn"
              // onClick={async (e) => {
              //   e.stopPropagation();
              //   for (let order of selectedOrders)
              //     await putOrder(order.invoice_number);
              //   setSelectedOrders([]);
              //   getOrders();
              // }}
              onClick={() => {
                setAllDoneConfimation(true);
              }}
              style={{ margin: "20px" }}
            >
              All Done
            </button>
            <button
              className="theme-btn"
              onClick={(e) => {
                e.stopPropagation();
                let countersCodes = selectedOrders
                  .filter(
                    (a) =>
                      !counters.find((b) => b.counter_uuid === a.counter_uuid)
                        ?.counter_code && a.counter_uuid
                  )
                  .filter(
                    (value, index, self) =>
                      index ===
                      self.findIndex(
                        (t) => t.counter_uuid === value.counter_uuid
                      )
                  );
                let itemCodes = [].concat
                  .apply(
                    [],
                    selectedOrders?.map((a) => a?.item_details || [])
                  )
                  .filter(
                    (value, index, self) =>
                      index ===
                      self.findIndex((t) => t.item_uuid === value.item_uuid)
                  )

                  .map((a) =>
                    itemsData.find((b) => b.item_uuid === a.item_uuid)
                  )
                  .filter((a) => !a.item_code);

                if (countersCodes.length || itemCodes.length) {
                  setWarningCodes({ countersCodes, itemCodes });
                } else if (selectedOrders.find((a) => a.replacement)) {
                  setExcelDownloadPopup(true);
                } else {
                  downloadHandler();
                }
              }}
              style={{ margin: "20px" }}
            >
              Excel
            </button>
          </div>
        ) : (
          ""
        )}
      </div>
      {popupOrder ? (
        <OrderDetails
          onSave={() => {
            setPopupOrder(null);
          }}
          setOrders={setOrders}
          order_uuid={popupOrder.order_uuid}
          orderStatus="edit"
        />
      ) : (
        ""
      )}
      {warningCodes ? (
        <div className="overlay">
          <div
            className="modal"
            style={{ maxHeight: "70vh", width: "fit-content" }}
          >
            <div
              className="content"
              style={{
                height: "fit-content",
                padding: "20px",
                width: "fit-content",
              }}
            >
              <div style={{ overflowY: "scroll" }}>
                <form
                  className="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (
                      selectedOrders.find(
                        (a) => a.replacement || a.adjustment || a.shortage
                      )
                    ) {
                      setExcelDownloadPopup(true);
                    } else {
                      downloadHandler();
                    }
                  }}
                >
                  <div className="row">
                    <h1> Code missing</h1>
                  </div>

                  <div className="formGroup">
                    {warningCodes.countersCodes.filter((a) => a.counter_uuid)
                      .length ? (
                      <div
                        className="row"
                        style={{
                          flexDirection: "column",
                          alignItems: "flex-start",
                        }}
                      >
                        <h2>Counters:</h2>
                        {warningCodes?.countersCodes
                          ?.filter((a) => a.counter_uuid)
                          .map((a) => (
                            <div>
                              {counters.find(
                                (b) => b.counter_uuid === a.counter_uuid
                              )?.counter_title || ""}
                            </div>
                          ))}
                      </div>
                    ) : (
                      ""
                    )}
                    {warningCodes.itemCodes.length ? (
                      <div
                        className="row"
                        style={{
                          flexDirection: "column",
                          alignItems: "flex-start",
                        }}
                      >
                        <h2>item:</h2>
                        {warningCodes.itemCodes.map((a) => (
                          <div>{a.item_title}</div>
                        ))}
                      </div>
                    ) : (
                      ""
                    )}
                  </div>

                  <button type="submit" className="submit">
                    Okay
                  </button>
                </form>
              </div>
              <button
                onClick={() => setWarningCodes(false)}
                className="closeButton"
              >
                x
              </button>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
      {allDoneConfimation ? (
        <div className="overlay">
          <div
            className="modal"
            style={{ height: "max-content", width: "350px" }}
          >
            <div
              className="content"
              style={{
                height: "fit-content",
                padding: "20px",
                width: "100%",
              }}
            >
              <div style={{ overflowY: "scroll" }}>
                <form
                  className="form"
                  onSubmit={async (e) => {
                    e?.preventDefault();
                    for (let a of selectedOrders) {
                      await putOrder(a.invoice_number);
                    }
                    setAllDoneConfimation(false);
                  }}
                >
                  <div className="row">
                    <h1>Confirm Done</h1>
                  </div>
                  <div
                    className="flex"
                    style={{ justifyContent: "space-between", width: "100%" }}
                  >
                    <button
                      type="submit"
                      disabled={doneDisabled}
                      className="submit"
                      style={
                        doneDisabled
                          ? { opacity: 0.5, cursor: "not-allowed" }
                          : {}
                      }
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setAllDoneConfimation(false)}
                      type="button"
                      className="submit"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
      {excelDownloadPopup ? (
        <ConfirmPopup
          onSave={(type) => {
            if (type === "invoice") {
              downloadHandler();
            } else {
              downloadHandlerTwo();
            }
            // downloadHandler()
          }}
          onClose={() => setExcelDownloadPopup(false)}
        />
      ) : (
        ""
      )}
    </>
  );
};

function Table({
  itemsDetails,
  setPopupOrder,
  putOrder,
  selectedOrders,
  setSelectedOrders,
  getOrders,
}) {
  console.log(selectedOrders);
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
          <th colSpan={2}>Amount</th>
          <th colSpan={2}>Cash</th>
          <th colSpan={2}>Cheque</th>
          <th colSpan={2}>UPI</th>
          <th colSpan={2}>Unpaid</th>
          <th colSpan={2}>Action</th>
        </tr>
      </thead>
      <tbody className="tbody">
        {itemsDetails
          ?.sort((a, b) => +a.invoice_number - +b.invoice_number)
          ?.map((item, i, array) => (
            <tr
              key={Math.random()}
              style={{ height: "30px" }}
              onClick={(e) => {
                e.stopPropagation();
                setPopupOrder(item);
              }}
            >
              <td
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOrders((prev) =>
                    prev.filter((a) => a.invoice_number === item.invoice_number)
                      .length
                      ? prev.filter(
                          (a) => a.invoice_number !== item.invoice_number
                        )
                      : [...(prev || []), item]
                  );
                }}
                className="flex"
                style={{ justifyContent: "space-between" }}
              >
                <input
                  type="checkbox"
                  checked={selectedOrders.find(
                    (a) => a.invoice_number === item.invoice_number
                  )}
                  style={{ transform: "scale(1.3)" }}
                />
                {i + 1}
              </td>

              <td colSpan={2}>{item.counter_title || ""}</td>
              <td colSpan={2}>{item.invoice_number || ""}</td>
              <td colSpan={2}>{item.order_grandtotal || ""}</td>
              <td colSpan={2}>
                {item.modes.find(
                  (a) => a.mode_uuid === "c67b54ba-d2b6-11ec-9d64-0242ac120002"
                )?.amt || 0}
              </td>
              <td colSpan={2}>
                {item.modes.find(
                  (a) => a.mode_uuid === "c67b5794-d2b6-11ec-9d64-0242ac120002"
                )?.amt || 0}
              </td>
              <td colSpan={2}>
                {item.modes.find(
                  (a) => a.mode_uuid === "c67b5988-d2b6-11ec-9d64-0242ac120002"
                )?.amt || 0}
              </td>
              <td colSpan={2}>{item.unpaid || 0}</td>
              <td colSpan={2}>
                <button
                  className="theme-btn"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await putOrder(item.invoice_number);
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
function ConfirmPopup({ onSave, onClose }) {
  const [itemClicked, setItemClicked] = useState("");
  return (
    <div className="overlay">
      <div
        className="modal"
        style={{ height: "fit-content", width: "300px", padding: "20px" }}
      >
        <h2 style={{ textAlign: "center" }}>Download</h2>
        <div
          className="content"
          style={{
            height: "fit-content",
            padding: "20px",
          }}
        >
          <div style={{ overflowY: "scroll", width: "100%" }}>
            <form className="form">
              <div
                className="flex"
                style={{
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h3 style={{ marginTop: "15px" }}>Sale Invoice</h3>
                <button
                  type="button"
                  className="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    setItemClicked("invoice");
                    onSave("invoice");
                  }}
                >
                  {itemClicked === "invoice" ? <CheckCircle /> : <Download />}
                </button>
              </div>
              <div
                className="flex"
                style={{
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h3 style={{ marginTop: "15px" }}>Sale Return</h3>
                <button
                  type="button"
                  className="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    setItemClicked("return");
                    onSave("return");
                  }}
                >
                  {itemClicked === "return" ? <CheckCircle /> : <Download />}
                </button>
              </div>
            </form>
          </div>
          <button onClick={onClose} className="closeButton">
            <Close />
          </button>
        </div>
      </div>
    </div>
  );
}
