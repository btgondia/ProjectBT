/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import { useEffect, useRef, useState, useContext, useMemo } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import "./index.css";
import { AddCircle as AddIcon, ArrowBack } from "@mui/icons-material";
import { v4 as uuid } from "uuid";
import Select from "react-select";
import Context from "../../context/context";
import Prompt from "../../components/Prompt";
import { useNavigate, useParams } from "react-router-dom";
import {
  getFormateDate,
  getMidnightTimestamp,
  truncateDecimals,
} from "../../utils/helperFunctions";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import NotesPopup from "../../components/popups/NotesPopup";
export let getInititalValues = () => {
  let time = new Date();
  return {
    voucher_uuid: uuid(),
    type: "",
    created_by: localStorage.getItem("user_uuid"),
    created_at: time.getTime(),
    amt: 0,
    details: [],
    voucher_date: time.getTime(),
  };
};
let typeOptions = [
  { value: "PURCHASE", label: "Purchase" },
  { value: "PAYMENT", label: "Payment" },
  { value: "SALE", label: "Sales" },
  { value: "RCPT", label: "Receipt" },
  { value: "RECEIPT_ORDER", label: "Receipt" },
  { value: "JPNL", label: "Journal" },
  { value: "CNTR", label: "Contra" },
  { value: "SALE_ORDER", label: "Sale Order" },
  { value: "RECEIPT_ORDER", label: "Purchase Order" },
];

export default function NewVoucher() {
  const { promptState, setNotification } = useContext(Context);
  const [isEdit, setIsEdit] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [order, setOrder] = useState(getInititalValues());
  const [notesPopup, setNotesPoup] = useState();
  const [ledgerData, setLedgerData] = useState([]);
  const [counters, setCounters] = useState([]);
  const reactInputsRef = useRef({});
  const [focusedInputId, setFocusedInputId] = useState(0);
  const params = useParams();
  const navigate = useNavigate();

  const getLedgers = async () => {
    const response = await axios({
      method: "get",
      url: "/ledger/getLedger",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setLedgerData(response.data.result);
  };
  const getCounter = async () => {
    const response = await axios({
      method: "post",
      url: "/counters/GetCounterList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setCounters(response.data.result);
  };
  const getVoucher = async (accounting_voucher_uuid) => {
    const response = await axios({
      method: "get",
      url: "/vouchers/getAccountVoucher/" + accounting_voucher_uuid,

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      let data = response.data.result;
      setIsEdit(false);
      setOrder({
        ...data,
        details: data.details.map((a, i) => ({
          ...a,
          uuid: a.ledger_uuid,
          add: a.amount > 0 && (![4, 6].includes(i))? a.amount : i===3 ? Math.abs(a.amount) : 0,
          sub: a.amount < 0 && i!==3 ? Math.abs(a.amount) : 0,
        })),
      });
    }
  };

  useEffect(() => {
    getCounter();

    getLedgers();
  }, []);
  useEffect(() => {
    if (params.accounting_voucher_uuid)
      getVoucher(params.accounting_voucher_uuid);
  }, [params.accounting_voucher_uuid]);

  const totalSum = useMemo(() => {
    let total = 0;
    for (let item of order.details) {
      total = +(item.add || 0) + +total;
      total = total.toFixed(2);
    }
    return total;
  }, [order.details]);
  const totalSub = useMemo(() => {
    let total = 0;
    for (let item of order.details) {
      total = +(item.sub || 0) + +total;
      total = total.toFixed(2);
    }

    return total;
  }, [order.details]);
  const onSubmit = async ({isDelete=false,voucher_date=order.voucher_date}) => {
    let is_empty = order.details.find(
      (a) =>
        a.add !== 0 &&
        !a.add &&
        a.sub !== 0 &&
        !a.sub &&
        (a.ledger_title || a.counter_title)
    );

    if (!isDelete && !order.type) {
      setNotification({
        message: "Please Select Voucher Type",
        success: false,
      });
      return;
    }
    if (is_empty) {
      setNotification({
        message:
          "Please add quantity to Ledger " +
          (is_empty.ledger_title || is_empty.counter_title),
        success: false,
      });
      return;
    }
    // check all add and sub sum is 0
    if (totalSum !== totalSub && !isDelete) {
      setNotification({
        message: "Total Debit and Credit Not Equal",
        success: false,
      });
      setTimeout(() => setNotification(null), 2000);
      return;
    }

    const response = await axios({
      method: isDelete
        ? "delete"
        : params.accounting_voucher_uuid
        ? "put"
        : "post",
      url: `/vouchers/${
        isDelete
          ? "deleteAccountVoucher"
          : params.accounting_voucher_uuid
          ? "putAccountVoucher"
          : "postAccountVoucher"
      }`,
      data: {
        ...order,
        amt: totalSum,
        voucher_date,
        details: order.details.map((a) => {
          return {
            ledger_uuid: a.ledger_uuid || a.counter_uuid,
            amount: a.add || -(a.sub || 0),
            narration: a.narration,
          };
        }),
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      setTimeout(() => setNotification(null), 2000);
      if (isDelete) {
        setNotification({
          message: "Voucher Deleted",
          success: true,
        });
        sessionStorage.setItem("isEditVoucher", 1);
        navigate(-1);
        return;
      }
      if (params.accounting_voucher_uuid) {
        setNotification({
          message: "Voucher Updated",
          success: true,
        });
        sessionStorage.setItem("isEditVoucher", 1);
        navigate(-1);
        return;
      }
      setNotification({
        message: "Voucher Added",
        success: true,
      });
      setOrder(getInititalValues());
    } else {
      setNotification({
        message: "Voucher Not Added",
        success: false,
      });
    }
    setTimeout(() => setNotification(null), 2000);
  };

  const jumpToNextIndex = (id) => {
    document.querySelector(`#${id}`).blur();
    const index = document.querySelector(`#${id}`).getAttribute("index");
    const nextElem = document.querySelector(`[index="${+index + 1}"]`);
    if (nextElem) {
      if (nextElem.id.includes("selectContainer-")) {
        reactInputsRef.current[
          nextElem.id.replace("selectContainer-", "")
        ].focus();
      } else {
        setFocusedInputId("");
        setTimeout(
          () => document.querySelector(`[index="${+index + 1}"]`).focus(),
          10
        );
        return;
      }
    } else {
      let nextElemId = uuid();
      setFocusedInputId(`selectContainer-${nextElemId}`);
      setTimeout(
        () =>
          setOrder((prev) => ({
            ...prev,
            details: [
              ...prev.details,
              {
                uuid: nextElemId,
                b: 0,
                p: 0,
                sr: prev.details.length + 1,
              },
            ],
          })),
        250
      );
    }
    // setQuantity();
  };
  console.count("render");

  let listItemIndexCount = 0;

  const onPiecesKeyDown = (e, item) => {
    if (e.key === "Enter") jumpToNextIndex("p" + item.uuid);
    else if (e.key === "+") {
      e.preventDefault();
      setOrder((prev) => ({
        ...prev,
        details: prev?.details?.map((i) =>
          i.item_uuid === item.item_uuid
            ? { ...i, p: (+i.p || 0) + (+item?.one_pack || 0) }
            : i
        ),
      }));
    } else if (e.key === "-") {
      e.preventDefault();
      setOrder((prev) => ({
        ...prev,
        details: prev?.details?.map((i) =>
          i.item_uuid === item.item_uuid
            ? { ...i, p: (+i.p || 0) - (+item?.one_pack || 0) }
            : i
        ),
      }));
    }
  };

  const LedgerOptions = useMemo(
    () =>
      [...counters, ...ledgerData].map((a) => ({
        ...a,
        label: a.counter_title || a.ledger_title,
        value: a.counter_uuid || a.ledger_uuid,
        closing_balance: truncateDecimals(
          (a.closing_balance || 0) + +(a.opening_balance_amount || 0),
          2
        ),
      })),
    [ledgerData, counters, order.details]
  );
  const filterOption = (data, value) => {
    let label = data.data.label;
    if (label.toLowerCase().includes(value.toLowerCase())) return true;
    return false;
  };

  console.log(order);

  return (
    <>
      <Sidebar />
      <div className="right-side">
        <Header />
        <div className="inventory">
          <div className="accountGroup" id="voucherForm" action="">
            <div className="inventory_header">
              {params.accounting_voucher_uuid ? (
                <div
                  style={{
                    cursor: "pointer",
                    padding: "5px",
                    backgroundColor: "#000",
                    borderRadius: "50%",
                  }}
                  onClick={() => {
                    sessionStorage.setItem("isEditVoucher", 1);
                    navigate(-1);
                  }}
                >
                  <ArrowBack style={{ fontSize: "40px", color: "#fff" }} />
                </div>
              ) : (
                ""
              )}
              <h2>
                Voucher
                {order.accounting_voucher_number || order.invoice_number?.length
                  ? "-"
                  : ""}
                {order.accounting_voucher_number ||
                  (order.invoice_number || []).join(", ") ||
                  ""}{" "}
              </h2>
            </div>

            <div className="topInputs">
              <div className="inputGroup" >
                <label htmlFor="Warehouse">Voucher date</label>
                <div className="inputGroup">
                  <div className="flex">
                  <input
                    type="date"
                    onChange={(e) => {
                      setOrder((prev) => ({
                        ...prev,
                        voucher_date: getMidnightTimestamp(e.target.value),
                      }));
                      if (
                        order.type === "SALE_ORDER" ||
                        order.type === "RECEIPT_ORDER"
                      )
                        onSubmit({voucher_date:getMidnightTimestamp(e.target.value)});
                    }}
                    value={order.voucher_date?getFormateDate(new Date(+order.voucher_date)):0}
                    placeholder="Search Counter Title..."
                    className="searchInput"
                    pattern="\d{4}-\d{2}-\d{2}"
                    // disabled={!isEdit}
                    filterOption={filterOption}
                  />
                    <button
                    type="button"
                    onClick={(e) => {
                      setOrder((prev) => ({
                        ...prev,
                        voucher_date: 0,
                      }));
                      if (
                        order.type === "SALE_ORDER" ||
                        order.type === "RECEIPT_ORDER"
                      )
                        onSubmit({voucher_date:0});
                    }}
                    value={order.voucher_date?getFormateDate(new Date(+order.voucher_date)):0}
   
                    className="theme-btn"
               
                    // disabled={!isEdit}
                    filterOption={filterOption}
                  >Unknown</button></div>
                </div>
                
              </div>
              <div className="inputGroup" style={{ width: "100px" }}>
                <label htmlFor="Warehouse">Type</label>
                <div className="inputGroup">
                  <Select
                    options={typeOptions.filter(
                      (a) =>
                        a.value !== "SALE_ORDER" && a.value !== "RECEIPT_ORDER"
                    )}
                    onChange={(doc) => {
                      setOrder((prev) => ({
                        ...prev,
                        type: doc.value,
                      }));
                    }}
                    value={
                      typeOptions.find((a) => a.value === order.type) || {
                        value: "",
                        label: "Select",
                      }
                    }
                    openMenuOnFocus={true}
                    menuPosition="fixed"
                    menuPlacement="auto"
                    placeholder="Select"
                    isDisabled={
                      !isEdit ||
                      ((order?.type === "SALE_ORDER" ||
                        order?.type === "RECEIPT_ORDER") &&
                        order.order_uuid)
                    }
                  />
                </div>
              </div>
              <div className="inputGroup" style={{ width: "100px" }}>
                {isEdit ? (
                  <button
                    style={{ width: "fit-Content" }}
                    className="theme-btn"
                    onClick={(e) => {
                      e.target.blur();
                      setNotesPoup((prev) => !prev);
                    }}
                  >
                    Notes
                  </button>
                ) : (
                  ""
                )}
              </div>
            </div>

            <div
              className="items_table"
              style={{ flex: "1", height: "75vh", overflow: "scroll" }}
            >
              <table className="f6 w-100 center" cellSpacing="0">
                <thead className="lh-copy" style={{ position: "static" }}>
                  <tr className="white">
                    <th className="pa2 tl bb b--black-20 w-30">Ledger</th>
                    <th className="pa2 tc bb b--black-20">Debit</th>
                    <th className="pa2 tc bb b--black-20">Credit</th>
                    <th className="pa2 tc bb b--black-20" colSpan={3}>
                      Narration
                    </th>
                    <th className="pa2 tc bb b--black-20">Action</th>
                  </tr>
                </thead>

                <tbody className="lh-copy">
                  {order?.details?.map((item, i) => (
                    <tr key={item.uuid} item-billing-type={item?.billing_type}>
                      <td
                        className="ph2 pv1 tl bb b--black-20 bg-white"
                        style={{ width: "300px" }}
                      >
                        <div
                          className="inputGroup"
                          id={`selectContainer-${item.uuid}`}
                          index={listItemIndexCount++}
                          style={{ width: "300px" }}
                        >
                          <Select
                            options={LedgerOptions.filter(
                              (a) =>
                                a.ledger_uuid !==
                                  "ebab980c-4761-439a-9139-f70875e8a298" &&
                                !order.details.find(
                                  (b) =>
                                    (a.counter_uuid &&
                                      b.ledger_uuid === a.counter_uuid) ||
                                    (a.ledger_uuid &&
                                      b.ledger_uuid === a.ledger_uuid)
                                )
                            )}
                            getOptionLabel={(option) => (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>{option.label}</span>
                                <span>{option.closing_balance}</span>
                              </div>
                            )}
                            filterOption={filterOption}
                            openMenuOnFocus={true}
                            menuPosition="fixed"
                            menuPlacement="auto"
                            placeholder="Select"
                            onChange={(e) => {
                              setOrder((prev) => ({
                                ...prev,
                                details: prev.details.map((a) => {
                                  if (a.uuid === item.uuid) {
                                    let item = ledgerData.find(
                                      (a) => a.ledger_uuid === e.value
                                    );
                                    if (!item) {
                                      item = counters.find(
                                        (a) => a.counter_uuid === e.value
                                      );
                                    }
                                    return {
                                      ...a,
                                      ...item,
                                      ledger_uuid: e.value,
                                    };
                                  } else return a;
                                }),
                              }));
                              jumpToNextIndex(`selectContainer-${item.uuid}`);
                            }}
                            value={
                              item.ledger_uuid
                                ? LedgerOptions.find(
                                    (a) =>
                                      a.counter_uuid === item.ledger_uuid ||
                                      a.ledger_uuid === item.ledger_uuid
                                  )
                                : { value: "", label: "" }
                            }
                            autoFocus={
                              !params.accounting_voucher_uuid &&
                              (focusedInputId ===
                                `selectContainer-${item.uuid}` ||
                                (i === 0 && focusedInputId === 0))
                            }
                            isDisabled={
                              !isEdit ||
                              item.ledger_uuid ===
                                "ebab980c-4761-439a-9139-f70875e8a298"
                            }
                          />
                        </div>
                      </td>
                      <td
                        className="ph2 pv1 tc bb b--black-20 bg-white"
                        style={{ textAlign: "center" }}
                      >
                        <input
                          id={"p" + item.uuid}
                          style={{ width: "100px" }}
                          type="number"
                          className="numberInput"
                          onWheel={(e) => e.preventDefault()}
                          index={listItemIndexCount++}
                          value={item.sub || ""}
                          onChange={(e) => {
                            setOrder((prev) => {
                              return {
                                ...prev,
                                details: prev.details.map((a) =>
                                  a.uuid === item.uuid
                                    ? { ...a, sub: e.target.value }
                                    : a
                                ),
                              };
                            });
                          }}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={(e) => onPiecesKeyDown(e, item)}
                          disabled={
                            !isEdit ||
                            +item.add ||
                            item.ledger_uuid ===
                              "ebab980c-4761-439a-9139-f70875e8a298"
                          }
                        />
                      </td>
                      <td
                        className="ph2 pv1 tc bb b--black-20 bg-white"
                        style={{ textAlign: "center" }}
                      >
                        <input
                          id={"q" + item.uuid}
                          style={{ width: "100px" }}
                          type="number"
                          className="numberInput"
                          onWheel={(e) => e.preventDefault()}
                          index={listItemIndexCount++}
                          disabled={
                            !isEdit ||
                            +item.sub ||
                            item.ledger_uuid ===
                              "ebab980c-4761-439a-9139-f70875e8a298"
                          }
                          value={item.add || ""}
                          onChange={(e) => {
                            setOrder((prev) => {
                              return {
                                ...prev,
                                details: prev.details.map((a) =>
                                  a.uuid === item.uuid
                                    ? { ...a, add: e.target.value }
                                    : a
                                ),
                              };
                            });
                          }}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={(e) =>
                            e.key === "Enter"
                              ? jumpToNextIndex("q" + item.uuid)
                              : ""
                          }
                        />
                      </td>
                      <td
                        className="ph2 pv1 tc bb b--black-20 bg-white"
                        style={{ textAlign: "center" }}
                        color={3}
                      >
                        <input
                          id={"q" + item.uuid}
                          style={{ width: "300px" }}
                          type="text"
                          className="numberInput"
                          onWheel={(e) => e.preventDefault()}
                          index={listItemIndexCount++}
                          disabled={
                            !isEdit ||
                            item.ledger_uuid ===
                              "ebab980c-4761-439a-9139-f70875e8a298"
                          }
                          value={item.narration || ""}
                          onChange={(e) => {
                            setOrder((prev) => {
                              return {
                                ...prev,
                                details: prev.details.map((a) =>
                                  a.uuid === item.uuid
                                    ? { ...a, narration: e.target.value }
                                    : a
                                ),
                              };
                            });
                          }}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={(e) =>
                            e.key === "Enter"
                              ? jumpToNextIndex("q" + item.uuid)
                              : ""
                          }
                        />
                      </td>
                      <td
                        className="ph2 pv1 tc bb b--black-20 bg-white"
                        style={{ textAlign: "center" }}
                      >
                        {!isEdit ||
                        item.ledger_uuid ===
                          "ebab980c-4761-439a-9139-f70875e8a298" ? (
                          ""
                        ) : (
                          <DeleteOutlineIcon
                            style={{ color: "red" }}
                            className="table-icon"
                            onClick={() => {
                              setOrder((prev) => ({
                                ...prev,
                                details: prev.details.filter(
                                  (a) => a.uuid !== item.uuid
                                ),
                              }));
                              //console.log(item);
                            }}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td
                      onClick={() =>
                        isEdit
                          ? setOrder((prev) => ({
                              ...prev,
                              details: [
                                ...prev.details,
                                { uuid: uuid(), b: 0, p: 0 },
                              ],
                            }))
                          : ""
                      }
                    >
                      <AddIcon
                        sx={{ fontSize: 40 }}
                        style={{ color: "#4AC959", cursor: "pointer" }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td
                      className="ph2 pv1 tl bb b--black-20 bg-white"
                      style={{ width: "300px" }}
                    >
                      <div
                        className="inputGroup"
                        id={`selectContainer-total`}
                        index={listItemIndexCount++}
                        style={{ width: "300px" }}
                      >
                        Total
                      </div>
                    </td>
                    <td
                      className="ph2 pv1 tc bb b--black-20 bg-white"
                      style={{ textAlign: "center" }}
                    >
                      {totalSub}
                    </td>
                    <td
                      className="ph2 pv1 tc bb b--black-20 bg-white"
                      style={{ textAlign: "center" }}
                    >
                      {totalSum}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bottomContent" style={{ background: "white" }}>

              {!(order.type==="RECEIPT_ORDER" || order.type==="SALE_ORDER") ? (
                <button
                  type="button"
                  onClick={() => {
                    if (isEdit) onSubmit({});
                    else setIsEdit(true);
                  }}
                >
                  {isEdit ? "Save" : "Edit"}
                </button>
              ) : (
                ""
              )}
              {params.accounting_voucher_uuid &&
              !(order.type==="RECEIPT_ORDER" || order.type==="SALE_ORDER") ? (
                <button
                  type="button"
                  style={{ backgroundColor: "red" }}
                  onClick={() => {
                    setConfirm(true);
                  }}
                >
                  Delete
                </button>
              ) : (
                ""
              )}
              {order?.order_grandtotal ? (
                <button
                  style={{
                    position: "fixed",
                    bottom: "10px",
                    right: "0",
                    cursor: "default",
                  }}
                  type="button"
                >
                  Total: {order?.order_grandtotal || 0}
                </button>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      </div>
      {promptState ? <Prompt {...promptState} /> : ""}
      {confirm ? (
        <div className="overlay">
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
                      onSubmit({isDelete:true});
                    }}
                  >
                    <div className="formGroup">
                      <div
                        className="row"
                        style={{ flexDirection: "column", alignItems: "start" }}
                      >
                        <h1 style={{ textAlign: "center" }}>Are you sure</h1>
                      </div>

                      <div className="row message-popup-actions">
                        <button
                          className="simple_Logout_button"
                          type="button"
                          style={{ backgroundColor: "red" }}
                          onClick={() => setConfirm(false)}
                        >
                          Cancel
                        </button>

                        <button className="simple_Logout_button" type="submit">
                          Confirm
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
      {notesPopup ? (
        <NotesPopup
          onSave={() => setNotesPoup(false)}
          setSelectedOrder={setOrder}
          notesPopup={notesPopup}
          order={order}
        />
      ) : (
        ""
      )}
    </>
  );
}
