import axios from "axios";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { OrderDetails } from "../../components/OrderDetails";
import * as XLSX from "xlsx";
import Context from "../../context/context";
import * as FileSaver from "file-saver";
import {
  Check,
  CommentOutlined,
  CopyAll,
  PaymentRounded,
  UploadFile,
  WhatsApp,
} from "@mui/icons-material";
import Select from "react-select";
import {
  compareObjects,
  getFormateDate,
  truncateDecimals,
} from "../../utils/helperFunctions";
import context from "../../context/context";
import { AddCircle as AddIcon } from "@mui/icons-material";
import { v4 as uuid } from "uuid";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
const fileExtension = ".xlsx";
const fileType =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
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
const UPITransection = () => {
  const [popupOrder, setPopupOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [remarksPopup, setRemarksPoup] = useState();
  const [commentPopup, setCommentPoup] = useState();
  const [type, setType] = useState("All");
  const [checkVouceherPopup, setCheckVoucherPopup] = useState(false);

  const [items, setItems] = useState([]);
  const getActivityData = async (controller = new AbortController()) => {
    const response = await axios({
      method: "get",
      url: "/receipts/getReceipt",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });
   
    if (response.data.success) setItems(response.data.result);
    setLoading(false);
  };
  const getOrderData = async (order_uuid) => {
    const response = await axios({
      method: "get",
      url: "/orders/GetOrder/" + order_uuid,
      headers: {
        "Content-Type": "application/json",
      },
    });
   
    if (response.data.success) setPopupOrder(response.data.result);
  };
  const getCounter = async (counter_uuid) => {
    const response = await axios({
      method: "post",
      url: "/counters/getFilteredList",
      data: {
        counterList: [counter_uuid],
        jsonList: ["payment_remarks", "counter_uuid", "counter_title"],
      },

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.result.length) setRemarksPoup(response.data.result[0]);
  };
  const getCommentRecipt = async (order_uuid, counter_uuid) => {
    const response = await axios({
      method: "post",
      url: "/receipts/getComments",
      data: {
        order_uuid,
        counter_uuid,
      },

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.result) setCommentPoup(response.data.result);
  };
  const putActivityData = async (order_uuid, mode_uuid, invoice_number) => {
    const response = await axios({
      method: "put",
      url: "/receipts/putReceiptUPIStatus",
      data: { order_uuid, status: 1, mode_uuid, invoice_number },
      headers: {
        "Content-Type": "application/json",
      },
    });
   
    if (response.data.success) {
      getActivityData();
    }
  };
  useEffect(() => {
    const controller = new AbortController();
    getActivityData(controller);
    return () => {
      controller.abort();
    };
  }, []);
  const downloadHandler = async () => {
    let sheetData = items.map((a) => {
      
      return {
        "Counter Title": a.counter_title,
        Amount: a.amt,
        "Invoice Number": a.invoice_number,
        "Order Date":
          new Date(a.order_date).toDateString() +
          " - " +
          formatAMPM(new Date(a.order_date)),
        "Payment Date":
          new Date(a.payment_date).toDateString() +
          " - " +
          formatAMPM(new Date(a.payment_date)),

        User: a.user_title,
        type: a.mode_title,
      };
    });
    

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(data, "TripOrders" + fileExtension);
  };
  const itemDetails = useMemo(() => {
    if (type === "All") {
      return items;
    } else {
      return items.filter((a) => a.mode_title === type);
    }
  }, [items, type]);
  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading">
          <h2>UPI and Cheque Transaction </h2>
          {/* <button type="button" onClick={downloadHandler}>
            Exels
          </button> */}
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
            <div className="inputGroup" style={{ width: "20%" }}>
              Type
              <Select
                options={[
                  { value: "All", label: "All" },
                  { value: "UPI", label: "UPI" },
                  { value: "Cheque", label: "Cheque" },
                ]}
                onChange={(doc) => setType(doc.value)}
                value={{ value: type, label: type }}
                openMenuOnFocus={true}
                menuPosition="fixed"
                menuPlacement="auto"
                placeholder="Select Type"
              />
            </div>
            <div className="inputGroup" style={{ width: "20%" }}>
              <button
                type="button"
                onClick={() => {
                  setCheckVoucherPopup(true);
                }}
              >
                X
              </button>
            </div>
          </div>
        </div>
        <div className="table-container-user item-sales-container">
          <Table
            itemsDetails={itemDetails}
            putActivityData={putActivityData}
            getOrderData={getOrderData}
            setRemarksPoup={setRemarksPoup}
            loading={loading}
            setLoading={setLoading}
            getCounter={getCounter}
            getCommentRecipt={getCommentRecipt}
          />
        </div>
      </div>
      {popupOrder ? (
        <OrderDetails
          onSave={() => {
            setPopupOrder(null);
            getActivityData();
          }}
          order_uuid={popupOrder.order_uuid}
          orderStatus="edit"
        />
      ) : (
        ""
      )}
      {remarksPopup ? (
        <NotesPopup
          onSave={() => {
            setRemarksPoup(false);
            getActivityData();
          }}
          notesPopup={remarksPopup}
          setItems={setItems}
          // postOrderData={() => onSubmit({ stage: 5 })}
        />
      ) : (
        ""
      )}
      {loading ? (
        <div className="overlay" style={{ zIndex: 9999999 }}>
          <div className="flex" style={{ width: "40px", height: "40px" }}>
            <svg viewBox="0 0 100 100">
              <path
                d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50"
                fill="#ffffff"
                stroke="none"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  dur="1s"
                  repeatCount="indefinite"
                  keyTimes="0;1"
                  values="0 50 51;360 50 51"
                ></animateTransform>
              </path>
            </svg>
          </div>
        </div>
      ) : (
        ""
      )}

      {commentPopup ? (
        <ReciptsCommentsPopup
          commentPopup={commentPopup}
          onClose={() => {
            setCommentPoup(null);
          }}
          onSave={() => {
            setCommentPoup(null);
            getActivityData();
          }}
        />
      ) : (
        ""
      )}
      {checkVouceherPopup ? (
        <ImportStatements
          onSave={() => {
            setCheckVoucherPopup(false);
          }}
          setNotification={setItems}
        />
      ) : (
        ""
      )}
    </>
  );
};

export default UPITransection;
function Table({
  itemsDetails,
  putActivityData,
  getOrderData,
  setRemarksPoup,
  loading,
  setLoading,
  Counters,
  getCounter,
  getCommentRecipt,
}) {
  const context = useContext(Context);

  const { setNotification } = context;
  const sendMessage = async (item) => {
    setLoading(true);
    let response = await axios({
      method: "post",
      url: "/orders/sendMsg",
      data: {
        ...item,
        notification_uuid: "payment-reminder-manual",
        consolidated_payment_reminder: true,
      },
    });

   
    setNotification(response.data);
    setTimeout(() => setNotification(null), 3000);
    setLoading(false);
  };
  const copySendMessage = async (item) => {
    setLoading(true);
    let response = await axios({
      method: "post",
      url: "/orders/copySendMessage",
      data: {
        ...item,
        notification_uuid: "payment-reminder-manual",
        consolidated_payment_reminder: true,
      },
    });

   
    if (response.data.success) {
      setNotification({ success: true, message: "Message Copied" });
      setTimeout(() => setNotification(null), 3000);
      setLoading(false);
     
      navigator.clipboard.writeText(
        response.data.result.WhatsappNotification.message[0]?.text || ""
      );
    } else {
      setNotification({ success: false, message: "Message Not Copied" });
      setTimeout(() => setNotification(null), 3000);
      setLoading(false);
    }
  };
  const isTimestampPlusDaysLessThanCurrent = ({
    timestamp,
    numberOfDays = 2,
  }) => {
    // Convert timestamp to milliseconds
    timestamp = new Date(timestamp).getTime();

    // Calculate the timestamp plus the number of days in milliseconds
    var timestampPlusDays = timestamp + numberOfDays * 24 * 60 * 60 * 1000;

    // Get the current date in milliseconds
    var currentDate = new Date().getTime();

    // Compare the two dates
    return timestampPlusDays < currentDate;
  };
  return (
    <table
      className="user-table"
      style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}
    >
      <thead>
        <tr>
          <th>S.N</th>
          <th colSpan={3}>Counter Title</th>
          <th colSpan={2}>Amount</th>
          <th colSpan={2}>Invoice Number</th>
          <th colSpan={2}>Order Date</th>
          <th colSpan={2}>Payment Date</th>
          <th colSpan={3}>User</th>
          <th>Type</th>
          <th>Days</th>

          <th colSpan={5}>Action</th>
        </tr>
      </thead>
      <tbody className="tbody">
        {itemsDetails
          // ?.sort((a, b) => a.timestamp - b.timestamp)
          ?.map((item, i, array) => (
            <tr
              key={Math.random()}
              style={{
                height: "30px",

                color: isTimestampPlusDaysLessThanCurrent({
                  timestamp: +item.payment_date,
                  numberOfDays: item.payment_reminder_days || 2,
                })
                  ? "red"
                  : "black",
              }}
              onClick={(e) => {
                e.stopPropagation();
                getOrderData(item.order_uuid);
              }}
            >
              <td>{i + 1}</td>

              <td colSpan={3}>{item.counter_title || ""}</td>
              <td colSpan={2}>{item.amt || ""}</td>
              <td colSpan={2}>{item.invoice_number || ""}</td>

              <td colSpan={2}>
                {new Date(item.order_date).toDateString()} -
                {formatAMPM(new Date(item.order_date)) || ""}
              </td>
              <td colSpan={2}>
                {new Date(item.payment_date).toDateString()} -
                {formatAMPM(new Date(item.payment_date)) || ""}
              </td>
              <td colSpan={3}>{item.user_title || ""}</td>
              <td>{item.mode_title || ""}</td>
              <td>{item.payment_reminder_days || ""}</td>

              <td
                style={{ color: "green" }}
                onClick={(e) => {
                  e.stopPropagation();
                  sendMessage(item);
                }}
              >
                <WhatsApp />
              </td>
              <td
                style={{ color: "green" }}
                onClick={(e) => {
                  e.stopPropagation();
                  copySendMessage(item);
                }}
              >
                <CopyAll />
              </td>
              <td>
                <div
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Payment Remarks"
                  style={{ color: "green" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    getCounter(item.counter_uuid);
                  }}
                >
                  <PaymentRounded />
                </div>
              </td>
              <td>
                <div
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Comment"
                  style={{ color: "green" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    getCommentRecipt(item.order_uuid, item.counter_uuid);
                  }}
                >
                  <CommentOutlined />
                </div>
              </td>
              <td>
                {loading?.order_uuid === item.order_uuid &&
                loading?.mode_uuid === item?.mode_uuid ? (
                  <div
                    type="button"
                    className="submit"
                    style={{ width: "fit-content" }}
                    id="loading-screen"
                  >
                    <svg viewBox="0 0 100 100">
                      <path
                        d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50"
                        fill="#ffffff"
                        stroke="none"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          dur="1s"
                          repeatCount="indefinite"
                          keyTimes="0;1"
                          values="0 50 51;360 50 51"
                        ></animateTransform>
                      </path>
                    </svg>
                  </div>
                ) : (
                  <div
                    data-tooltip-id="my-tooltip"
                    data-tooltip-content="Complete"
                    style={{ color: "green" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLoading({
                        order_uuid: item.order_uuid,
                        mode_uuid: item.mode_uuid,
                      });
                      putActivityData(
                        item.order_uuid,
                        item.mode_uuid,
                        item.invoice_number
                      );
                    }}
                  >
                    <Check />
                  </div>
                )}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
function NotesPopup({ onSave, setItems, notesPopup }) {
  const [notes, setNotes] = useState([]);
  const [edit, setEdit] = useState(false);

  useEffect(() => {
   
    setNotes(notesPopup?.payment_remarks || []);
  }, [notesPopup]);
  const submitHandler = async () => {
    const response = await axios({
      method: "put",
      url: "/counters/putCounter",
      data: [
        {
          payment_remarks: notes,
          counter_uuid: notesPopup.counter_uuid,
        },
      ],
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      onSave();
    }
  };
  return (
    <>
      <div className="overlay" style={{ zIndex: 9999999999 }}>
        <div
          className="modal"
          style={{ height: "fit-content", width: "max-content" }}
        >
          <div className="flex" style={{ justifyContent: "space-between" }}>
            <h3>
              {" "}
              Payment Remarks for <br />
              {notesPopup.counter_title}
            </h3>
          </div>
          <div
            className="content"
            style={{
              height: "fit-content",
              padding: "10px",
              width: "fit-content",
            }}
          >
            <div style={{ overflowY: "scroll" }}>
              <form className="form">
                <div className="formGroup">
                  <div
                    className="row"
                    style={{ flexDirection: "row", alignItems: "start" }}
                  >
                    <div style={{ width: "50px" }}>Remarks</div>
                    <label
                      className="selectLabel flex"
                      style={{ width: "200px" }}
                    >
                      <textarea
                        name="route_title"
                        className="numberInput"
                        style={{ height: "200px" }}
                        value={notes?.toString()?.replace(/,/g, "\n")}
                        onChange={(e) => {
                          setNotes(e.target.value.split("\n"));
                          setEdit(true);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div
                  className="flex"
                  style={{ justifyContent: "space-between" }}
                >
                  <button onClick={onSave} className="closeButton">
                    x
                  </button>
                  {edit ? (
                    <button
                      type="button"
                      className="submit"
                      onClick={submitHandler}
                    >
                      Save
                    </button>
                  ) : (
                    ""
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
function ReciptsCommentsPopup({ commentPopup, onClose, onSave }) {
  const [data, setData] = useState({});

  //post request to save bank statement import

  //get request to get bank statement import

  useEffect(() => {
    setData(commentPopup);
  }, [commentPopup]);
  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.data.isHighlighted
        ? "red"
        : provided.backgroundColor,
      color: state.data.isHighlighted ? "white" : provided.color,
    }),
  };
  const submitHandler = async () => {
    const response = await axios({
      method: "put",
      url: "/receipts/putSingleReceipt",
      data: data,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      onSave();
    }
  };

  return (
    <div className="overlay" style={{ zIndex: "999999" }}>
      <div
        className="modal"
        style={{ height: "fit-content", width: "fit-content" }}
      >
        <div
          className="content"
          style={{
            height: "fit-content",
            padding: "20px",
            minWidth: "500px",
          }}
        >
          <div style={{ overflowY: "scroll" }}>
            <div className="form">
              <div className="row">
                <h1>Recipt Notes</h1>
              </div>
              <div className="row">
                <h3>Counter: {data.counter_title}</h3>
              </div>
              <div
                className="items_table"
                style={{ flex: "1", height: "75vh", overflow: "scroll" }}
              >
                <table className="f6 w-100 center" cellSpacing="0">
                  <thead className="lh-copy" style={{ position: "static" }}>
                    <tr className="white">
                      <th className="pa2 tc bb b--black-20">Notes</th>
                      <th className="pa2 tc bb b--black-20">Created At</th>
                    </tr>
                  </thead>
                  {data.counter_uuid ? (
                    <tbody className="lh-copy">
                      {data?.comment?.map((item, i) => (
                        <tr
                          key={item.uuid}
                          item-billing-type={item?.billing_type}
                        >
                          <td
                            className="ph2 pv1 tc bb b--black-20 bg-white"
                            style={{ textAlign: "center" }}
                          >
                            <input
                              id={"p" + item.uuid}
                              style={{
                                width: "50vw",
                                marginLeft: "10px",
                                marginRight: "10px",
                              }}
                              type="text"
                              className="numberInput"
                              onWheel={(e) => e.preventDefault()}
                              value={item.note || ""}
                              onChange={(e) => {
                                setData((prev) => ({
                                  ...prev,
                                  comment: prev.comment.map((a) =>
                                    a.uuid === item.uuid
                                      ? { ...a, note: e.target.value }
                                      : a
                                  ),
                                }));
                              }}
                              onFocus={(e) => e.target.select()}
                            />
                          </td>
                          <td style={{ marginRight: "5px" }}>
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td
                          onClick={() =>
                            setData((prev) => ({
                              ...prev,
                              comment: [
                                ...(prev.comment || []),
                                {
                                  uuid: uuid(),
                                  date: new Date().toUTCString(),
                                  created_at: new Date().toUTCString(),
                                  note: "",
                                },
                              ],
                            }))
                          }
                        >
                          <AddIcon
                            sx={{ fontSize: 40 }}
                            style={{ color: "#32bd33", cursor: "pointer" }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  ) : (
                    ""
                  )}
                </table>
              </div>
              {compareObjects(commentPopup, data) ? (
                <button
                  type="button"
                  className="submit"
                  style={{
                    maxWidth: "250px",
                  }}
                  onClick={() => {
                    submitHandler();
                  }}
                >
                  Save changes
                </button>
              ) : (
                ""
              )}
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
            }}
            className="closeButton"
          >
            x
          </button>
        </div>
      </div>
    </div>
  );
}
function ImportStatements({ onSave, popupInfo, setNotification }) {
  const [loading, setLoading] = useState(true);
  const [confirmPopup, setConfirmPopup] = useState(false);
  const [listData, setListData] = useState([]);
  const getCounter = async (controller = new AbortController()) => {
    const response = await axios({
      method: "get",
      url: "/vouchers/getCompleteVoucherList",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setListData(response.data.result);
    setLoading(false);
  };

  useEffect(() => {
    const controller = new AbortController();
    getCounter(controller);
    return () => {
      controller.abort();
    };
  }, []);
 

  const submitHandler = async (data) => {
    //receipts/putBulkReceiptUPIStatus
    setLoading(true);
    const response = await axios({
      method: "put",
      url: "/receipts/putBulkReceiptUPIStatus",
      data: listData.filter((a) => a.checked),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      onSave();
    }
  };

  return (
    <>
      <div className="overlay" style={{ zIndex: 9999999 }}>
        <div className="modal" style={{ width: "fit-content" }}>
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
                style={{
                  justifyContent: "start",
                }}
              >
                {listData.length ? (
                  <>
                    <div className="row" style={{ width: "90vw" }}>
                      <h5>Total Recodes:{listData?.length || 0}</h5>
                    </div>
                    <table
                      className="user-table"
                      style={{ tableLayout: "auto" }}
                    >
                      <thead>
                        <tr>
                          <th>Sr.</th>
                          <th>Voucher Date</th>

                          <th>Counter</th>
                          <th>Invoice Number</th>
                          <th>Mode</th>
                          <th>Amt</th>
                          <th>
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                setListData((prev) =>
                                  prev.map((a) => ({
                                    ...a,
                                    checked: e.target.checked,
                                  }))
                                );
                              }}
                              checked={listData?.every((a) => a.checked)}
                            />
                          </th>
                        </tr>
                      </thead>
                      <tbody className="tbody">
                        {listData?.map((item, i) => (
                          <tr
                            key={Math.random()}
                            style={{
                              height: "30px",
                              color:
                                item.existVoucher === false ||
                                (item.multipleNarration?.length && item.unMatch)
                                  ? "blue"
                                  : !item.unMatch
                                  ? "green"
                                  : "red",
                            }}
                          >
                            <td>{i + 1}</td>
                            <td>
                              {new Date(+item.voucher_date).toDateString()}
                            </td>
                            <td>{item.counter_title || ""}</td>
                            <td>{item.invoice_number || ""}</td>{" "}
                            <td>{item.mode_title || ""}</td>
                            <td>{item.amt || ""}</td>
                            <td>
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={(e) => {
                                  setListData((prev) =>
                                    prev.map((a) =>
                                      a.accounting_voucher_uuid ===
                                      item.accounting_voucher_uuid
                                        ? { ...a, checked: e.target.checked }
                                        : a
                                    )
                                  );
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  ""
                )}
                {loading || listData.length ? (
                  ""
                ) : (
                  <div className="row">
                    <h1>No Data Found</h1>
                  </div>
                )}

                <div
                  className="flex"
                  style={{ justifyContent: "space-between", minWidth: "300px" }}
                >
                  <button
                    className="submit"
                    style={{ background: "red" }}
                    onClick={() => {
                      onSave();
                    }}
                  >
                    Cancel
                  </button>
                  {loading ? (
                    <button
                      className="submit"
                      id="loading-screen"
                      style={{ width: "120px" }}
                    >
                      <svg viewBox="0 0 100 100">
                        <path
                          d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50"
                          fill="#ffffff"
                          stroke="none"
                        >
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            dur="1s"
                            repeatCount="indefinite"
                            keyTimes="0;1"
                            values="0 50 51;360 50 51"
                          ></animateTransform>
                        </path>
                      </svg>
                    </button>
                  ) : listData.length ? (
                    <button
                      className="submit"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        submitHandler()
                      }}
                    >
                      Mark Done
                    </button>
                  ) : (
                    ""
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {confirmPopup ? (
        <div
          className="overlay"
          style={{ position: "fixed", top: 0, left: 0, zIndex: 9999999999 }}
        >
          <div
            className="modal"
            style={{ height: "fit-content", width: "fit-content" }}
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
                    // createImportedVouchers(1);
                  }}
                >
                  <div className="formGroup">
                    <div
                      className="row"
                      style={{ flexDirection: "column", alignItems: "start" }}
                    >
                      <h1 style={{ textAlign: "center" }}>Mark Entry Done</h1>
                    </div>

                    <div className="row message-popup-actions">
                      <button
                        className="simple_Logout_button"
                        type="button"
                        onClick={() => {}}
                        style={{ background: "red" }}
                      >
                        No
                      </button>
                      <button className="simple_Logout_button" type="submit">
                        Yes
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setConfirmPopup(false);
                    }}
                    className="closeButton"
                  >
                    x
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
}
