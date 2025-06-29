import React, { useState, useEffect, useMemo, useContext, useCallback } from "react";
import axios from "axios";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid";
import { Check, ExitToApp, UploadFile } from "@mui/icons-material";
import Select from "react-select";
import { v4 as uuid } from "uuid";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import context from "../../context/context";
import * as XLSX from "xlsx";
import { FaCross } from "react-icons/fa";
import { truncateDecimals } from "../../utils/helperFunctions";
import { get } from "react-scroll/modules/mixins/scroller";

const BankReconciliation = () => {
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerGroup, setLedgerGroup] = useState([]);

  const [popupForm, setPopupForm] = useState(false);
  const [filterTitle, setFilterTitle] = useState("");

  const { setNotification, loading, setLoading } = useContext(context);

  const getLedgerData = async (controller = new AbortController()) => {
    const response = await axios({
      method: "get",
      url: "/ledger/getBankLedger",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setLedgerData(response.data.result);
  };
  const getLedgerGroup = async (controller = new AbortController()) => {
    const response = await axios({
      method: "get",
      url: "/ledgerGroup/getLedgerGroup",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setLedgerGroup(response.data.result);
  };

  useEffect(() => {
    const controller = new AbortController();
    getLedgerData(controller);
    getLedgerGroup(controller);
    return () => {
      controller.abort();
    };
  }, [popupForm]);
  const filterLedgerData = useMemo(
    () =>
      ledgerData
        .map((a) => ({
          ...a,
          ledger_group_title: ledgerGroup.find(
            (b) => b.ledger_group_uuid === a.ledger_group_uuid
          )?.ledger_group_title,
        }))
        ?.filter(
          (a) =>
            a.ledger_title &&
            (!filterTitle ||
              a.ledger_title
                .toLocaleLowerCase()
                .includes(filterTitle.toLocaleLowerCase()))
        ),
    [filterTitle, ledgerData, ledgerGroup]
  );

  useEffect(() => {
    const controller = new AbortController();

    return () => {
      controller.abort(controller);
    };
  }, []);

  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading" style={{ position: "relative" }}>
          <h2>Ledger</h2>
          <span
            style={{
              position: "absolute",
              right: "30px",
              top: "50%",
              translate: "0 -50%",
            }}
          >
            Total Ledger: {filterLedgerData.length}
          </span>
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="text"
                onChange={(e) => setFilterTitle(e.target.value)}
                value={filterTitle}
                placeholder="Search Ledger Title..."
                className="searchInput"
              />
            </div>
          </div>
        </div>
        <div className="table-container-user item-sales-container">
          <Table itemsDetails={filterLedgerData} setPopupForm={setPopupForm} />
        </div>
      </div>

      {popupForm ? (
        <ImportStatements
          onSave={() => {
            setPopupForm(false);
            getLedgerData();
          }}
          setLedgerData={setLedgerData}
          popupInfo={popupForm}
          setNotification={setNotification}
          loading={loading}
          setLoading={setLoading}
        />
      ) : (
        ""
      )}
    </>
  );
};

export default BankReconciliation;
function Table({ itemsDetails, setPopupForm }) {
  const [items, setItems] = useState("sort_order");
  const [order, setOrder] = useState("");
  return (
    <>
      <div
        style={{ maxWidth: "100vw", height: "fit-content", overflowX: "auto" }}
      >
        <table className="user-table" style={{ tableLayout: "auto" }}>
          <thead>
            <tr>
              <th>S.N</th>

              <th>
                <div className="t-head-element">
                  <span>Ledger Title</span>
                  <div className="sort-buttons-container">
                    <button
                      onClick={() => {
                        setItems("ledger_title");
                        setOrder("asc");
                      }}
                    >
                      <ChevronUpIcon className="sort-up sort-button" />
                    </button>
                    <button
                      onClick={() => {
                        setItems("ledger_title");
                        setOrder("desc");
                      }}
                    >
                      <ChevronDownIcon className="sort-down sort-button" />
                    </button>
                  </div>
                </div>
              </th>
              <th>
                <div className="t-head-element">
                  <span>Ledger Group Title</span>
                  <div className="sort-buttons-container">
                    <button
                      onClick={() => {
                        setItems("ledger_group_title");
                        setOrder("asc");
                      }}
                    >
                      <ChevronUpIcon className="sort-up sort-button" />
                    </button>
                    <button
                      onClick={() => {
                        setItems("ledger_group_title");
                        setOrder("desc");
                      }}
                    >
                      <ChevronDownIcon className="sort-down sort-button" />
                    </button>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="tbody">
            {itemsDetails

              .sort((a, b) =>
                order === "asc"
                  ? typeof a[items] === "string"
                    ? a[items]?.localeCompare(b[items])
                    : a[items] - b[items]
                  : typeof a[items] === "string"
                  ? b[items]?.localeCompare(a[items])
                  : b[items] - a[items]
              )
              ?.map((item, i) => (
                <tr
                  key={Math.random()}
                  style={{ height: "30px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPopupForm(item);
                  }}
                >
                  <td>{i + 1}</td>

                  <td>{item.ledger_title}</td>
                  <td>{item.ledger_group_title}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ImportStatements({
  onSave,
  popupInfo,
  setNotification,
  loading,
  setLoading,
}) {
  const [errMassage, setErrorMassage] = useState("");
  const [data, setData] = useState(null);
  const [defaultData, setDefaultData] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [changeTransition, setChangeTransition] = useState(null);
  const [counter, setCounter] = useState([]);
  const [counterSelected, setCounterSelected] = useState(null);
  const [confirmPopup, setConfirmPopup] = useState(false);
  const [matchPricePopup, setMatchPricePopup] = useState(false);
  const [otherCheckReciptsData, setOtherCheckReciptsData] = useState(false);
  const getCounter = async (controller = new AbortController()) => {
    const response = await axios({
      method: "post",
      url: "/counters/GetCounterList",
      signal: controller.signal,
      data: { counters: [] },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setCounter(response.data.result);
  };
  const getLedgerData = async (controller = new AbortController()) => {
    const response = await axios({
      method: "get",
      url: "/ledger/getLedger",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setLedgerData(response.data.result);
  };
  useEffect(() => {
    const controller = new AbortController();
    getLedgerData(controller);
    getCounter(controller);
    return () => {
      controller.abort();
    };
  }, []);
  const counterList = useCallback(
    (counterLists=[]) =>
      [...counter, ...ledgerData]?.filter(a=>!counterLists.length||
        counterLists?.find((b) => b === (a?.counter_uuid || a?.ledger_uuid))
      ).map((a) => ({
        label:
          (a.counter_title || a.ledger_title || "") +
          (a.route_title ? `,${a.route_title}` : ""),
        value: a?.counter_uuid || a.ledger_uuid,
        closing_balance: truncateDecimals(
          (a.closing_balance || 0) + +(a.opening_balance_amount || 0),
          2
        ),
      })),
    [counter, ledgerData]
  );
  const createImportedVouchers = async (mark_entry) => {
    if (loading) return;
    setLoading(true);
    let dataArray = data
      ?.filter((item) => !item.unMatch)
      .map((a) => ({
        ...a,
        counter_uuid: a?.counter_uuid || a.ledger_uuid,
      }));
   
    let array = [];
    let time = new Date();
    for (let item of dataArray) {
      if (item.existVoucher === false) continue;
      if(item?.otherCheckReciptsData){
        for (let other of item.otherCheckReciptsData) {
          array.push({
            voucher_uuid: uuid(),
            mark_entry,
            type: "RCPT",
            created_by: localStorage.getItem("user_uuid"),
            created_at: time.getTime(),
            amt: other.amount,
            invoice_number: [other.invoice_number],
            order_uuid: item.order_uuid,
            mode_uuid: item.mode_uuid,
            transaction_tags: item.transaction_tags,
            matched_entry: item.matched_entry,
            details: [
              {
                ledger_uuid: popupInfo.ledger_uuid,
                amount: -other.amount,
                narration: "Ref no: " + other.invoice_number,
              },
              {
                ledger_uuid: item.counter_uuid,
                amount: other.amount,
                narration: "Ref no: " + other.invoice_number,
              },
            ],
            voucher_date: item.date_time_stamp,
          });
        }
        continue;
      }
      if (item?.otherReciptsData?.length&&!item.multipleNarration?.length) {
        for (let other of item.otherReciptsData) {
          array.push({
            voucher_uuid: uuid(),
            mark_entry,
            type: "RCPT",
            created_by: localStorage.getItem("user_uuid"),
            created_at: time.getTime(),
            amt: other.amount,
            invoice_number: [other.invoice_number],
            order_uuid: item.order_uuid,
            mode_uuid: item.mode_uuid,
            transaction_tags: item.transaction_tags,
            matched_entry: item.matched_entry,
            details: [
              {
                ledger_uuid: popupInfo.ledger_uuid,
                amount: -other.amount,
                narration: "Ref no: " + other.invoice_number,
              },
              {
                ledger_uuid: item.counter_uuid,
                amount: other.amount,
                narration: "Ref no: " + other.invoice_number,
              },
            ],
            voucher_date: item.date_time_stamp,
          });
        }
        continue;
      }
      array.push({
        voucher_uuid: uuid(),
        mark_entry,
        type:
          item.ledger_group_uuid === "9c2a6c85-c0f0-4acf-957e-dcea223f3d00" ||
          (!item.ledger_group_uuid && item?.counter_uuid)
            ? "RCPT"
            : item.ledger_group_uuid === "004fd020-853c-4575-bebe-b29faefae3c9"
            ? "PAYMENT"
            : item.ledger_group_uuid ===
                "8550248f-41e9-4f5f-aea0-927b12a7146c" ||
              item.ledger_group_uuid === "0c0c8cbd-1a2a-4adc-9b65-d5c807f275c7"
            ? "CNTR"
            : +item.received_amount
            ? "RCPT"
            : "PAYMENT",
        created_by: localStorage.getItem("user_uuid"),
        created_at: time.getTime(),
        amt: item.paid_amount || item.received_amount,
        invoice_number: item.reference_no,
        order_uuid: item.order_uuid,
        mode_uuid: item.mode_uuid,
        transaction_tags: item.transaction_tags,
        matched_entry: item.matched_entry,
        details: [
          {
            ledger_uuid: popupInfo.ledger_uuid,
            amount: item.paid_amount || -item.received_amount,
            narration: "Ref no: " + (item.reference_no || []).join(", "),
          },
          {
            ledger_uuid: item?.counter_uuid,
            amount: -item.paid_amount || +item.received_amount,
            narration: "Ref no: " + (item.reference_no || []).join(", "),
          },
        ],
        voucher_date: item.date_time_stamp,
      });
    }
   
    const response = await axios({
      method: "post",
      url: "/vouchers/postAccountVouchers",
      data: array,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      setNotification({
        message: "Voucher Imported Successfully",
        success: true,
      });
      setTimeout(() => {
        setNotification(null);
      }, 5000);
      onSave();
    } else {
      setNotification({
        message: "Voucher Not imported",
        success: false,
      });
    }
    setTimeout(() => {
      setNotification(null);
    }, 5000);
    setLoading(false);
  };

  const submitHandler = async (data) => {
    setLoading(true);
    const response = await axios({
      method: "post",
      url: "/ledger/getExcelDetailsData",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        array: data,
        ledger_uuid: popupInfo.ledger_uuid,
      },
    });
    if (response.data.success) {
      let a = response.data.result;
      setData(a.map((a, i) => ({ ...a, match: !a.unMatch })));
      setDefaultData(
        a.map((a, i) => ({
          ...a,
          match: a?.otherReciptsData?.length ? false : !a.unMatch,
        }))
      );

      setLoading(false);
    } else {
      setErrorMassage(response.data.message);
    }
  };
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      submitHandler(excelData);
    };

    reader.readAsBinaryString(file);
  };
  const filterOption = (data, value) => {
    let label = data.data.label;
    if (label.toLowerCase().includes(value.toLowerCase())) return true;
    return false;
  };
  const updateTransitionTags = async (e) => {
    e.preventDefault();
    let isCounter = counterList()?.find(
      (a) => a.value === changeTransition?.counter_uuid
    );
    const response = await axios({
      method: "post",
      url: "/ledger/updateTransactionTags",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        ...(isCounter
          ? { counter_uuid: changeTransition?.counter_uuid }
          : { ledger_uuid: changeTransition?.counter_uuid }),
        transaction_tags: changeTransition.tags
          ?.filter((a) => a.checked)
          .map((a) => a.tag),
      },
    });
    if (response.data.success) {
      setNotification({
        message: "Transition Tags Updated Successfully",
        success: true,
      });
      getOtherReceiptsData(changeTransition.counter_uuid, changeTransition.narration,changeTransition.sr);
      setChangeTransition(null);
    } else {
      setNotification({
        message: "Transition Tags Not Updated",
        success: false,
      });
    }
  };
  const getOtherReceiptsData = async (counter_uuid, tags,sr) => {
    const response = await axios({
      method:"post",
      url: "/ledger/getOtherReceiptsData",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        counter_uuid,
        narration: tags.map((a) => a.tag),
      },
    });
    if (response.data.success) {
      setData((prev) =>
        prev.map((a) =>
          a.s === sr
            ? {
                ...a,
                otherReciptsData: response.data.result,
              }
            : a
        )
      );
    }
  };

  const counterOptions = (option) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <span>{option.label}</span>
      <span>{option.closing_balance}</span>
    </div>
  );

  return (
    <>
      <div className="overlay">
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
                onSubmit={submitHandler}
                style={{
                  justifyContent: "start",
                }}
              >
                {data ? (
                  <>
                    <div className="row" style={{ width: "90vw" }}>
                      <h5>Total Recodes:{data?.length || 0}</h5>
                      <h5>
                        Matched Recodes:
                        {data?.filter((a) => a.match).length || 0}
                      </h5>
                      <h5>
                        Unmatched Recodes:
                        {data?.filter((a) => !a.match).length || 0}
                      </h5>
                      <h5>
                        Total Amount Paid:
                        {data.reduce((a, b) => a + +(b.paid_amount || 0), 0) ||
                          0}
                      </h5>
                      <h5>
                        Total Amount Received:
                        {data.reduce(
                          (a, b) => a + +(b.received_amount || 0),
                          0
                        ) || 0}
                      </h5>
                    </div>
                    <table
                      className="user-table"
                      style={{ tableLayout: "auto" }}
                    >
                      <thead>
                        <tr>
                          <th>Sr.</th>
                          <th>Date</th>
                          <th>Reference No.</th>
                          <th>Counter Matches</th>
                          <th>Route</th>
                          <th>Paid Amt</th>
                          <th>Received Amt</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody className="tbody">
                        {data?.map((item, i) => (
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
                            <td>{item.sr}</td>
                            <td>{item.date}</td>
                            <td>
                              {item.reference_no.length
                                ? (item.reference_no || []).join(", ")
                                : "Un Matched"}
                            </td>
                            {item.multipleNarration?.length ? (
                              <td colSpan={2}>
                         
                                  <Select
                                    options={counterList(item.multipleNarration.map(a=>a.counter_uuid))}
                                    getOptionLabel={counterOptions}
                                    filterOption={filterOption}
                                    onChange={(doc) => {
                                     
                                      setData((prev) =>
                                        prev.map((a, j) =>
                                          j === i
                                            ? {
                                                ...a,
                                                counter_uuid: doc.value,
                                                counter_title: doc.label,
                                              }
                                            : a
                                        )
                                      );
                                    }}
                                    value={
                                      item?.counter_uuid
                                        ? {
                                            label: item.counter_title,
                                            value: item?.counter_uuid,
                                          }
                                        : {
                                            label: "Select Counter",
                                            value: "",
                                          }
                                    }
                                    openMenuOnFocus={true}
                                    menuPosition="fixed"
                                    menuPlacement="auto"
                                    placeholder="Select"
                                  />
                               
                              </td>
                            ) : item?.counter_uuid ? (
                              <>
                                <td colSpan={item.narration ? 2 : 1}>
                                  <div
                                    className="flex"
                                    style={{
                                      justifyContent: "space-between",
                                      width: "100%",
                                    }}
                                  >
                                    {item.counter_title}
                                    {item.existVoucher && item.narration&&item.unMatch ? (
                                      <button
                                        type="button"
                                        className="submit"
                                        style={{
                                          padding: "5px 10px",
                                          fontSize: "12px",
                                          background: "red",
                                          margin: 0,
                                        }}
                                        onClick={() =>
                                          setData((prev) =>
                                            prev.map((a) =>
                                              item.sr === a.sr
                                                ? {
                                                    ...a,
                                                    counter_uuid: "",
                                                    counter_title: "",
                                                  }
                                                : a
                                            )
                                          )
                                        }
                                      >
                                        X
                                      </button>
                                    ) : (
                                      ""
                                    )}
                                  </div>
                                </td>
                                {!item.narration ? (
                                  <td>{item.route_title}</td>
                                ) : (
                                  ""
                                )}
                              </>
                            ) : (
                              <td colSpan={2}>
                                {counterSelected === item.sr ? (
                                  <Select
                                    options={counterList()}
                                    getOptionLabel={counterOptions}
                                    filterOption={filterOption}
                                    onChange={(doc) => {
                                      setChangeTransition({
                                        counter_uuid: doc.value,
                                        tags: item.transaction_tags?.map(
                                          (a) => ({
                                            checked: false,
                                            tag: a,
                                          })
                                        ),
                                      });
                                      setData((prev) =>
                                        prev.map((a, j) =>
                                          j === i
                                            ? {
                                                ...a,
                                                counter_uuid: doc.value,
                                                counter_title: doc.label,
                                              }
                                            : a
                                        )
                                      );
                                    }}
                                    value={
                                      item?.counter_uuid
                                        ? {
                                            label: item.counter_title,
                                            value: item?.counter_uuid,
                                          }
                                        : {
                                            label: "Select Counter",
                                            value: "",
                                          }
                                    }
                                    openMenuOnFocus={true}
                                    menuPosition="fixed"
                                    menuPlacement="auto"
                                    placeholder="Select"
                                  />
                                ) : item?.otherCheckReciptsData?.length ? (
                                  <div
                                    className="flex"
                                    style={{
                                      justifyContent: "space-between",
                                      width: "100%",
                                    }}
                                  >
                                    {item.otherCheckReciptsData.length} orders
                                  </div>
                                ) : (
                                  <div
                                    className="flex"
                                    style={{
                                      justifyContent: "space-between",
                                      width: "100%",
                                    }}
                                  >
                                    {item.narration}
                                    <button
                                      type="button"
                                      className="submit"
                                      style={{
                                        padding: "5px 10px",
                                        fontSize: "12px",
                                        margin: 0,
                                      }}
                                      onClick={() =>
                                        setCounterSelected(item.sr)
                                      }
                                    >
                                      Ledger
                                    </button>
                                  </div>
                                )}
                              </td>
                            )}

                            <td>{item.paid_amount || ""}</td>
                            <td>{item.received_amount || ""}</td>
                            {!item.match ? (
                              <td>
                                <input
                                  type="checkbox"
                                  checked={!item.unMatch}
                                  onChange={(e) => {
                                    if (
                                      !item.reference_no &&
                                      item.otherReciptsData?.length
                                    ) {
                                      setMatchPricePopup(item);
                                      return;
                                    }
                                    if(item.otherCheckReciptsData){
                                      setOtherCheckReciptsData(item);
                                      return;
                                    }
                                   
                                    if (item?.counter_uuid) {
                                      setData((prev) =>
                                        prev.map((a, j) =>
                                          j === i
                                            ? !a.unMatch
                                              ? defaultData[i]
                                              : { ...a, unMatch: false }
                                            : a
                                        )
                                      );
                                    }
                                  }}
                                />
                              </td>
                            ) : (
                              <td
                                style={{
                                  cursor: "pointer",
                                  color: "red",
                                  fontSize: "20px",
                                  fontWeight: "bolder",
                                  width: "50px",
                                  height: "50px",
                                }}
                              ></td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  ""
                )}
                {data ? (
                  ""
                ) : (
                  <div className="row">
                    <h1>Import File</h1>
                  </div>
                )}
                <i style={{ color: "red" }}>
                  {errMassage === "" ? "" : "Error: " + errMassage}
                </i>
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
                    Cancel{data ? " Import" : ""}
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
                  ) : data ? (
                    <button
                      className="submit"
                      onClick={(e) => {
                        e.preventDefault();
                        setConfirmPopup(true);
                      }}
                    >
                      Import Matched
                    </button>
                  ) : (
                    <label
                      htmlFor="file"
                      type="button"
                      className="submit"
                      style={{
                        background: "green",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <UploadFile className="icon" />
                      Upload
                      <input
                        type="file"
                        accept=".xls, .xlsx, .csv"
                        id="file"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                    </label>
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
                    createImportedVouchers(1);
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
                        onClick={() => createImportedVouchers(0)}
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
      ) : matchPricePopup ? (
        <div className="overlay">
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
                onSubmit={(e) => {
                  e.preventDefault();

                  setData((prev) =>
                    prev.map((a) =>
                      a.sr === matchPricePopup.sr
                        ? {
                            ...matchPricePopup,
                            unMatch: false,
                          }
                        : a
                    )
                  );
                  setMatchPricePopup(null);
                }}
                style={{
                  justifyContent: "start",
                }}
              >
                <div className="row">
                  <h1>Match Price for {matchPricePopup.counter_title}</h1>
                </div>
                <div className="row">
                  <h2>
                    Total:{" "}
                    {matchPricePopup.otherReciptsData
                      ?.filter((a) => a.checked)
                      .reduce((a, b) => a + b.amount, 0)}{" "}
                    / {matchPricePopup.received_amount}
                  </h2>
                </div>
                <table className="user-table" style={{ tableLayout: "auto" }}>
                  <thead>
                    <tr>
                      <th>Sr.</th>
                      <th>Invoice</th>
                      {matchPricePopup.multipleCounter ? (
                        <th>Counter</th>
                      ) : (
                        ""
                      )}
                      <th>Amount</th>

                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="tbody">
                    {matchPricePopup.otherReciptsData?.filter(a=>a.counter_uuid===matchPricePopup.counter_uuid)?.map((item, i) => (
                      <tr
                        key={Math.random()}
                        style={{
                          height: "30px",
                        }}
                      >
                        <td>{i + 1}</td>
                        <td>{item.invoice_number}</td>
                        {matchPricePopup.multipleCounter ? (
                          <td>{item.counter_title}</td>
                        ) : (
                          ""
                        )}
                        <td>{item.amount}</td>

                        <td>
                          <input
                            type="checkbox"
                            checked={item?.checked}
                            onChange={(e) => {
                              setMatchPricePopup((prev) => ({
                                ...prev,
                                otherReciptsData: prev.otherReciptsData.map(
                                  (a, j) =>
                                    j === i
                                      ? {
                                          ...a,
                                          checked: item.checked
                                            ? false
                                            : true,
                                        }
                                      : a
                                ),
                              }));
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex">
                  {" "}
                  <div
                    className="flex"
                    style={{
                      justifyContent: "space-between",
                      minWidth: "300px",
                    }}
                    onClick={() => {
                      setData((prev) =>
                        prev.map((a) =>
                          a.sr === matchPricePopup.sr
                            ? {
                                ...matchPricePopup,
                                reference_no: [],
                                unMatch: false,
                              }
                            : a
                        )
                      );
                      setMatchPricePopup(null);
                    }}
                  >
                    {!matchPricePopup.multipleCounter ? (
                      <button className="submit" type="button">
                        New Reference
                      </button>
                    ) : (
                      ""
                    )}
                  </div>
                  {+matchPricePopup.received_amount ===
                  +matchPricePopup.otherReciptsData
                    ?.filter((a) => a.checked)
                    .reduce((a, b) => a + b.amount, 0) ? (
                    <div
                      className="flex"
                      style={{
                        justifyContent: "space-between",
                        minWidth: "300px",
                      }}
                    >
                      <button className="submit">Save</button>
                    </div>
                  ) : (
                    ""
                  )}
                </div>

                <button
                  onClick={() => {
                    setMatchPricePopup(false);
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
      ) : otherCheckReciptsData ? (
        <div className="overlay">
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
                  onSubmit={(e) => {
                    e.preventDefault();

                    setData((prev) =>
                      prev.map((a) =>
                        a.sr === otherCheckReciptsData.sr
                          ? {
                              ...otherCheckReciptsData,
                              unMatch: false,
                            }
                          : a
                      )
                    );
                    setOtherCheckReciptsData(null);
                  }}
                  style={{
                    justifyContent: "start",
                  }}
                >
                  <div className="row">
                    <h1>Match Price for {otherCheckReciptsData.narration}</h1>
                  </div>
                  <div className="row">
                    <h2>
                      Total:{" "}
                      {otherCheckReciptsData.otherCheckReciptsData
                        ?.filter((a) => a.checked)
                        .reduce((a, b) => a + b.amount, 0)}{" "}
                      / {otherCheckReciptsData.received_amount}
                    </h2>
                  </div>
                  <table className="user-table" style={{ tableLayout: "auto" }}>
                    <thead>
                      <tr>
                        <th>Sr.</th>
                        <th>Invoice</th>
                        {otherCheckReciptsData.multipleCounter ? (
                          <th>Counter</th>
                        ) : (
                          ""
                        )}
                        <th>Amount</th>

                        <th></th>
                      </tr>
                    </thead>
                    <tbody className="tbody">
                      {otherCheckReciptsData.otherCheckReciptsData?.map((item, i) => (
                        <tr
                          key={Math.random()}
                          style={{
                            height: "30px",
                          }}
                        >
                          <td>{i + 1}</td>
                          <td>{item.invoice_number}</td>
                          {otherCheckReciptsData.multipleCounter ? (
                            <td>{item.counter_title}</td>
                          ) : (
                            ""
                          )}
                          <td>{item.amount}</td>

                          <td>
                            <input
                              type="checkbox"
                              checked={item?.checked}
                              onChange={(e) => {
                                setOtherCheckReciptsData((prev) => ({
                                  ...prev,
                                  otherCheckReciptsData: prev.otherCheckReciptsData.map(
                                    (a, j) =>
                                      j === i
                                        ? {
                                            ...a,
                                            checked: item.checked
                                              ? false
                                              : true,
                                          }
                                        : a
                                  ),
                                }));
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex">
                    {" "}
                    <div
                      className="flex"
                      style={{
                        justifyContent: "space-between",
                        minWidth: "300px",
                      }}
                      onClick={() => {
                        setData((prev) =>
                          prev.map((a) =>
                            a.sr === otherCheckReciptsData.sr
                              ? {
                                  ...otherCheckReciptsData,
                                  reference_no: [],
                                  unMatch: false,
                                }
                              : a
                          )
                        );
                        setOtherCheckReciptsData(null);
                      }}
                    >
             
                        <button className="submit" type="button">
                          New Reference
                        </button>
                     
                    </div>
                    {+otherCheckReciptsData.received_amount ===
                    +otherCheckReciptsData.otherCheckReciptsData
                    ?.filter((a) => a.checked)
                    .reduce((a, b) => a + b.amount, 0) ? (
                      <div
                        className="flex"
                        style={{
                          justifyContent: "space-between",
                          minWidth: "300px",
                        }}
                      >
                        <button className="submit">Save</button>
                      </div>
                    ) : (
                      ""
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setOtherCheckReciptsData(false);
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
      ) :  changeTransition ? (
        <div className="overlay">
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
                  onSubmit={updateTransitionTags}
                  style={{
                    justifyContent: "start",
                  }}
                >
                  <div className="row">
                    <h1>
                      Transition Tags for{" "}
                      {counterList().find?.(
                        (a) => a.value === changeTransition?.counter_uuid
                      )?.label || ""}
                    </h1>
                  </div>
                  <table className="user-table" style={{ tableLayout: "auto" }}>
                    <thead>
                      <tr>
                        <th>Sr.</th>
                        <th>Tag</th>

                        <th></th>
                      </tr>
                    </thead>
                    <tbody className="tbody">
                      {changeTransition.tags?.map((item, i) => (
                        <tr
                          key={Math.random()}
                          style={{
                            height: "30px",
                          }}
                        >
                          <td>{i + 1}</td>
                          <td>{item.tag}</td>

                          <td>
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={(e) => {
                                setChangeTransition((prev) => ({
                                  ...prev,
                                  tags: prev.tags.map((a, j) =>
                                    j === i
                                      ? { ...a, checked: e.target.checked }
                                      : a
                                  ),
                                }));
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <i style={{ color: "red" }}>
                    {errMassage === "" ? "" : "Error: " + errMassage}
                  </i>
                  <div
                    className="flex"
                    style={{
                      justifyContent: "space-between",
                      minWidth: "300px",
                    }}
                  >
                    <button
                      className="submit"
                      type="button"
                      style={{ background: "red" }}
                      onClick={(e) => {
                        e.preventDefault();
                        getOtherReceiptsData(
                          changeTransition.counter_uuid,
                          changeTransition.tags,
                          changeTransition.sr
                        );
                        setChangeTransition(null);
                      }}
                    >
                      Cancel
                    </button>

                    <button className="submit">Update</button>
                  </div>
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
