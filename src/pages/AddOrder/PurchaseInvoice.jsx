/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import { useEffect, useRef, useState, useContext, useMemo } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import "./index.css";
import { PurchaseInvoiceBilling } from "../../Apis/functions";
import { AddCircle as AddIcon, ArrowBack } from "@mui/icons-material";
import { v4 as uuid } from "uuid";
import Select from "react-select";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Context from "../../context/context";
import { getFormateDate, truncateDecimals } from "../../utils/helperFunctions";
import MessagePopup from "../../components/MessagePopup";
import NotesPopup from "../../components/popups/NotesPopup";
import { useNavigate, useParams } from "react-router-dom";

const customStyles = {
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.data.isHighlighted
      ? "red"
      : provided.backgroundColor,
    color: state.data.isHighlighted ? "white" : provided.color,
  }),
};

const CovertedQty = (qty, conversion) => {
  let b = qty / +conversion;
  b = Math.sign(b) * Math.floor(Math.sign(b) * b);
  let p = Math.floor(qty % +conversion);
  return b + ":" + p;
};

const rateTypeOptions = [
  { label: "Before Tax", value: "bt" },
  { label: "After Tax", value: "at" },
];

export let getInititalValues = () => ({
  ledger_uuid: "",
  item_details: [{ uuid: uuid(), b: 0, p: 0, sr: 1 }],
  priority: 0,
  order_type: "I",
  rate_type: "at",
  party_number: "",
  deductions: [],
  time_1: 24 * 60 * 60 * 1000,
  time_2: (24 + 48) * 60 * 60 * 1000,
  warehouse_uuid: localStorage.getItem("warehouse")
    ? JSON.parse(localStorage.getItem("warehouse")) || ""
    : "",
  party_invoice_date: new Date().getTime(),
});

export default function PurchaseInvoice() {
  const { setNotification } = useContext(Context);
  const { order_uuid } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(getInititalValues());
  const [deductionPopup, setDeductionPopup] = useState(false);
  const [ledgerData, setLedgerData] = useState([]);
  const [allLedgerData, setAllLedgerData] = useState([]);
  const [counter, setCounter] = useState([]);
  const [notesPopup, setNotesPoup] = useState();
  const [warehouse, setWarehouse] = useState([]);
  const [user_warehouse, setUser_warehouse] = useState([]);
  const [itemsData, setItemsData] = useState([]);
  const [confirmPopup, setConfirmPopup] = useState(false);
  const reactInputsRef = useRef({});
  const [focusedInputId, setFocusedInputId] = useState(0);
  const [company, setCompanies] = useState([]);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [remarks, setRemarks] = useState("");
  const fetchCompanies = async () => {
    try {
      const response = await axios.get("/companies/getCompanies");
      if (response?.data?.result?.[0]) setCompanies(response?.data?.result);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    let controller = new AbortController();
    if (order_uuid) {
      axios
        .get(`/purchaseInvoice/getPurchaseInvoice/${order_uuid}`, {
          signal: controller.signal,
        })
        .then((res) => {
          if (res.data.success) {
            let data = res.data.result;
            data.item_details = data.item_details.map((a, i) => {
              let itemData = itemsData.find((b) => b.item_uuid === a.item_uuid);
              return {
                ...itemData,
                ...a,
                uuid: a.item_uuid || uuid(),
                sr: i + 1,
                p_price: a.price,
                b_price: a.price * itemData.conversion,
              };
            });
            setOrder(
              data
                ? {
                    ...data,
                    item_details: data.item_details,
                  }
                : getInititalValues()
            );
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
    return () => controller.abort();
  }, [order_uuid, itemsData]);
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

  const GetUserWarehouse = async () => {
    const response = await axios({
      method: "get",
      url: "users/GetUser/" + localStorage.getItem("user_uuid"),

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success)
      setUser_warehouse(response.data.result.warehouse);
  };

  const getItemsData = async () => {
    const response = await axios({
      method: "get",
      url: "/items/GetItemStockList/" + order.warehouse_uuid,

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setItemsData(response.data.result);
  };

  const getLedger = async () => {
    const response = await axios({
      method: "get",
      url: "/ledger/getLedger",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      setLedgerData(
        response.data.result.filter(
          (a) => a.ledger_group_uuid === "004fd020-853c-4575-bebe-b29faefae3c9"
        )
      );
      setAllLedgerData(response.data.result);
    }
  };

  useEffect(() => {
    getCounter();
    GetUserWarehouse();
    GetWarehouseList();
    fetchCompanies();
    getLedger();
  }, []);

  useEffect(() => {
    if (order?.warehouse_uuid) getItemsData();
  }, [order.warehouse_uuid]);
  useEffect(() => {
    if (order?.ledger_uuid) {
      const counterData = ledgerData.find(
        (a) => a.ledger_uuid === order.ledger_uuid
      );
      setItemsData((prev) =>
        prev.map((item) => {
          let item_rate = counterData?.company_discount?.find(
            (a) => a.company_uuid === item.company_uuid
          )?.item_rate;
          console.log({ item_rate, item_title: item.item_title });
          let item_price = item.item_price;
          if (item_rate === "a") item_price = item.item_price_a;
          if (item_rate === "b") item_price = item.item_price_b;
          if (item_rate === "c") item_price = item.item_price_c;

          return { ...item, item_price };
        })
      );
    }
  }, [order.ledger_uuid]);

  const onSubmit = async (type, orderData = order) => {
    let data = {
      ...orderData,
      item_details: order.item_details
        .filter((a) => a.item_uuid)
        .map((a) => ({
          ...a,
          item_price: a.p_price || a.item_price,
        })),
    };

    let autoBilling = await PurchaseInvoiceBilling({
      rate_type: order.rate_type,

      item_details: data.item_details.map((a) => ({
        ...a,
        item_price: a.p_price || a.item_price,
      })),
    });

    data = {
      ...data,
      ...autoBilling,
      opened_by: 0,
      item_details: autoBilling.item_details.map((a) => ({
        ...a,
        unit_price:
          a.item_total / (+(+a.conversion * a.b) + a.p + a.free) ||
          a.item_price ||
          a.price,
        gst_percentage: a.item_gst,
        status: 0,
        price: a.price || a.item_price || 0,
      })),
      ...(type?.obj || {}),
    };

    data.time_1 = data.time_1 + Date.now();
    data.time_2 = data.time_2 + Date.now();

    console.log("orderJSon", data);

    const response = await axios({
      method: order_uuid ? "put" : "post",
      url: `/purchaseInvoice/${order_uuid ? "put" : "post"}PurchaseInvoice`,
      data,
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(response);
    if (response.data.success) {
      if (order_uuid) {
        setNotification({
          message: "Purchase Invoice Updated Successfully",
          severity: "success",
        });
        navigate(-1);
      } else {
        setNotification({
          message: "Purchase Invoice Added Successfully",
          severity: "success",
        });
        setOrder(getInititalValues());
      }
    }
  };

  const callBilling = async (type = {}) => {
    if (!order.item_details.filter((a) => a.item_uuid).length) return;

    let autoBilling = await PurchaseInvoiceBilling({
      rate_type: order.rate_type,
      deductions: order.deductions,

      item_details: order.item_details.map((a) => ({
        ...a,
        item_price: a.p_price,
      })),
    });

    setConfirmPopup({
      ...order,
      ...autoBilling,
      ...type,
    });
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
            item_details: [
              ...prev.item_details,
              {
                uuid: nextElemId,
                b: 0,
                p: 0,
                sr: prev.item_details.length + 1,
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

  const onItemPriceChange = async (e, item) => {
    setOrder((prev) => {
      return {
        ...prev,
        item_details: prev.item_details.map((a) =>
          a.uuid === item.uuid
            ? {
                ...a,
                p_price: e.target.value,
                b_price: (e.target.value * item.conversion || 0).toFixed(4),
              }
            : a
        ),
      };
    });
  };

  const onPiecesKeyDown = (e, item) => {
    if (e.key === "Enter") jumpToNextIndex("p" + item.uuid);
    else if (e.key === "+") {
      e.preventDefault();
      setOrder((prev) => ({
        ...prev,
        item_details: prev?.item_details?.map((i) =>
          i.item_uuid === item.item_uuid
            ? { ...i, p: (+i.p || 0) + (+item?.one_pack || 0) }
            : i
        ),
      }));
    } else if (e.key === "-") {
      e.preventDefault();
      setOrder((prev) => ({
        ...prev,
        item_details: prev?.item_details?.map((i) =>
          i.item_uuid === item.item_uuid
            ? { ...i, p: (+i.p || 0) - (+item?.one_pack || 0) }
            : i
        ),
      }));
    }
  };
  const LedgerOptions = useMemo(
    () =>
      [...counter, ...allLedgerData].map((a) => ({
        ...a,
        label: a.counter_title || a.ledger_title,
        value: a.counter_uuid || a.ledger_uuid,
        closing_balance: truncateDecimals(
          (a.closing_balance || 0) + +(a.opening_balance_amount || 0),
          2
        ),
      })),
    [counter, allLedgerData]
  );
  return (
    <>
      <Sidebar />
      <div className="right-side">
        <Header />
        <div className="inventory">
          <div className="accountGroup" id="voucherForm" action="">
            <div className="inventory_header">
              {order_uuid ? (
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
              <h2>Purchase Invoice </h2>
            </div>

            <div className="topInputs">
              <div className="inputGroup" style={{ width: "50px" }}>
                <label htmlFor="Warehouse">Ledger</label>
                <div className="inputGroup">
                  <Select
                    ref={(ref) => (reactInputsRef.current["0"] = ref)}
                    options={ledgerData.map((a) => ({
                      value: a.ledger_uuid,
                      label: a.ledger_title,
                      closing_balance: truncateDecimals(
                        (a.closing_balance || 0) +
                          +(a.opening_balance_amount || 0),
                        2
                      ),
                    }))}
                    getOptionLabel={(option) => (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{option.label}</span>
                        <span>{option.closing_balance || 0}</span>
                      </div>
                    )}
                    onChange={(doc) => {
                      setOrder((prev) => ({
                        ...prev,
                        ledger_uuid: doc?.value,
                      }));
                    }}
                    styles={customStyles}
                    value={
                      order?.ledger_uuid
                        ? {
                            value: order?.ledger_uuid,
                            label: ledgerData?.find(
                              (j) => j.ledger_uuid === order.ledger_uuid
                            )?.ledger_title,
                          }
                        : ""
                    }
                    autoFocus={!order?.ledger_uuid && !order_uuid}
                    openMenuOnFocus={true}
                    menuPosition="fixed"
                    menuPlacement="auto"
                    placeholder="Select"
                  />
                </div>
              </div>
              <div className="inputGroup" style={{ width: "100px" }}>
                <label htmlFor="Warehouse">Warehouse</label>
                <div className="inputGroup">
                  <Select
                    options={[
                      { value: 0, label: "None" },
                      ...warehouse
                        .filter(
                          (a) =>
                            !user_warehouse.length ||
                            +user_warehouse[0] === 1 ||
                            user_warehouse.find((b) => b === a.warehouse_uuid)
                        )
                        .map((a) => ({
                          value: a.warehouse_uuid,
                          label: a.warehouse_title,
                        })),
                    ]}
                    onChange={(doc) =>
                      setOrder((prev) => ({
                        ...prev,
                        warehouse_uuid: doc.value,
                      }))
                    }
                    value={
                      order?.warehouse_uuid
                        ? {
                            value: order?.warehouse_uuid,
                            label: warehouse?.find(
                              (j) => j.warehouse_uuid === order.warehouse_uuid
                            )?.warehouse_title,
                          }
                        : { value: 0, label: "None" }
                    }
                    openMenuOnFocus={true}
                    menuPosition="fixed"
                    menuPlacement="auto"
                    placeholder="Select"
                  />
                </div>
              </div>

              <div className="inputGroup" style={{ width: "50px" }}>
                <label htmlFor="Warehouse">Company</label>
                <div className="inputGroup">
                  <Select
                    options={[
                      {
                        value: "all",
                        label: "All",
                      },
                      ...company
                        .filter((a) => +a.status)
                        .map((a) => ({
                          value: a.company_uuid,
                          label: a.company_title,
                        })),
                    ]}
                    onChange={(doc) => setCompanyFilter(doc?.value)}
                    value={[
                      {
                        value: "all",
                        label: "All",
                      },
                      ...company.map((a) => ({
                        value: a.company_uuid,
                        label: a.company_title,
                      })),
                    ].find((j) => j.value === companyFilter)}
                    openMenuOnFocus={true}
                    menuPosition="fixed"
                    menuPlacement="auto"
                    placeholder="Select Order Type"
                  />
                </div>
              </div>
              <div className="inputGroup" style={{ width: "30px" }}>
                <label htmlFor="Warehouse">Rate</label>
                <div className="inputGroup">
                  <Select
                    options={rateTypeOptions}
                    onChange={(doc) => {
                      setOrder((prev) => ({
                        ...prev,
                        rate_type: doc.value,
                      }));
                    }}
                    value={rateTypeOptions.find(
                      (j) => j.value === order.rate_type
                    )}
                    openMenuOnFocus={true}
                    menuPosition="fixed"
                    menuPlacement="auto"
                    placeholder="Select Order Type"
                  />
                </div>
              </div>
              <div className="inputGroup" style={{ width: "30px" }}>
                <label htmlFor="Warehouse">Party Invoice Date</label>
                <div className="inputGroup">
                  <input
                    type="date"
                    onChange={(e) => {
                      setOrder((prev) => ({
                        ...prev,
                        party_invoice_date: new Date(e.target.value).getTime(),
                      }));
                    }}
                    value={getFormateDate(new Date(order.party_invoice_date))}
                    placeholder="Search Counter Title..."
                    className="searchInput"
                    pattern="\d{4}-\d{2}-\d{2}"
                  />
                </div>
              </div>
              <div className="inputGroup" style={{ width: "100px" }}>
                <label htmlFor="Warehouse">Party Invoice Number</label>
                <div className="inputGroup">
                  <input
                    style={{ width: "200px" }}
                    type="text"
                    className="numberInput"
                    onWheel={(e) => e.preventDefault()}
                    value={order.party_number || ""}
                    onChange={(e) => {
                      if (e.target.value.length <= 30)
                        setOrder((prev) => {
                          return {
                            ...prev,
                            party_number: e.target.value,
                          };
                        });
                    }}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
              <div className="inputGroup" style={{ width: "100px" }}>
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
              </div>
            </div>

            <div
              className="items_table"
              style={{ flex: "1", height: "75vh", overflow: "scroll" }}
            >
              <table className="f6 w-100 center" cellSpacing="0">
                <thead className="lh-copy" style={{ position: "static" }}>
                  <tr className="white">
                    <th className="pa2 tl bb b--black-20 w-30">Item Name</th>
                    <th className="pa2 tc bb b--black-20">Boxes</th>
                    <th className="pa2 tc bb b--black-20">Pcs</th>
                    <th className="pa2 tc bb b--black-20 ">Price (pcs)</th>
                    <th className="pa2 tc bb b--black-20 ">Price (box)</th>
                    <th className="pa2 tc bb b--black-20 ">Dsc1</th>
                    <th className="pa2 tc bb b--black-20 ">Dsc2</th>

                    <th className="pa2 tc bb b--black-20 ">Item Total</th>

                    <th className="pa2 tc bb b--black-20 "></th>
                  </tr>
                </thead>
                {order.ledger_uuid ? (
                  <tbody className="lh-copy">
                    {order?.item_details?.map((item, i) => (
                      <tr
                        key={item.uuid}
                        item-billing-type={item?.billing_type}
                      >
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
                              ref={(ref) =>
                                (reactInputsRef.current[item.uuid] = ref)
                              }
                              id={"item_uuid" + item.uuid}
                              className="order-item-select"
                              options={itemsData
                                .filter(
                                  (a) =>
                                    !order?.item_details.filter(
                                      (b) => a.item_uuid === b.item_uuid
                                    ).length &&
                                    a.status !== 0 &&
                                    (companyFilter === "all" ||
                                      a.company_uuid === companyFilter)
                                )
                                .sort((a, b) =>
                                  a?.item_title?.localeCompare(b.item_title)
                                )
                                .map((a, j) => ({
                                  value: a.item_uuid,
                                  label:
                                    a.item_title +
                                    "______" +
                                    a.mrp +
                                    `, ${
                                      company.find(
                                        (b) => b.company_uuid === a.company_uuid
                                      )?.company_title
                                    }` +
                                    (a.qty > 0
                                      ? " _______[" +
                                        CovertedQty(a.qty || 0, a.conversion) +
                                        "]"
                                      : ""),
                                  key: a.item_uuid,
                                  qty: a.qty,
                                }))}
                              styles={{
                                option: (a, b) => {
                                  return {
                                    ...a,
                                    color:
                                      b.data.qty === 0
                                        ? ""
                                        : b.data.qty > 0
                                        ? "#4ac959"
                                        : "red",
                                  };
                                },
                              }}
                              onChange={(e) => {
                                setOrder((prev) => ({
                                  ...prev,
                                  item_details: prev.item_details.map((a) => {
                                    if (a.uuid === item.uuid) {
                                      let item = itemsData.find(
                                        (b) => b.item_uuid === e.value
                                      );

                                      return {
                                        ...a,
                                        ...item,
                                        p_price: item?.last_purchase_price || 0,
                                        charges_discount: [
                                          {
                                            title: "dsc1",
                                            value: 0,
                                          },
                                          {
                                            title: "dsc2",
                                            value: 0,
                                          },
                                        ],
                                        b_price: (
                                          (item?.last_purchase_price || 0) *
                                          +item?.conversion
                                        ).toFixed(4),
                                      };
                                    } else return a;
                                  }),
                                }));
                                jumpToNextIndex(`selectContainer-${item.uuid}`);
                              }}
                              value={
                                itemsData

                                  .filter((a) => a.item_uuid === item.uuid)
                                  .map((a, j) => ({
                                    value: a.item_uuid,
                                    label:
                                      a.item_title +
                                      "______" +
                                      a.mrp +
                                      `, ${
                                        company.find(
                                          (b) =>
                                            b.company_uuid === a.company_uuid
                                        )?.company_title
                                      }` +
                                      (a.qty > 0
                                        ? "[" +
                                          CovertedQty(
                                            a.qty || 0,
                                            a.conversion
                                          ) +
                                          "]"
                                        : ""),
                                    key: a.item_uuid,
                                  }))[0]
                              }
                              openMenuOnFocus={true}
                              autoFocus={
                                (focusedInputId ===
                                  `selectContainer-${item.uuid}` ||
                                  (i === 0 && focusedInputId === 0)) &&
                                !order_uuid
                              }
                              menuPosition="fixed"
                              menuPlacement="auto"
                              placeholder="Item"
                            />
                          </div>
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
                            value={item.b || ""}
                            onChange={(e) => {
                              setOrder((prev) => {
                                return {
                                  ...prev,
                                  item_details: prev.item_details.map((a) =>
                                    a.uuid === item.uuid
                                      ? { ...a, b: e.target.value }
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
                            disabled={!item.item_uuid}
                          />
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
                            value={item.p || ""}
                            onChange={(e) => {
                              setOrder((prev) => {
                                return {
                                  ...prev,
                                  item_details: prev.item_details.map((a) =>
                                    a.uuid === item.uuid
                                      ? { ...a, p: e.target.value }
                                      : a
                                  ),
                                };
                              });
                            }}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => onPiecesKeyDown(e, item)}
                            disabled={!item.item_uuid}
                          />
                        </td>

                        <td
                          className="ph2 pv1 tc bb b--black-20 bg-white"
                          style={{ textAlign: "center" }}
                        >
                          Rs:
                          <input
                            id="Quantity"
                            style={{ width: "100px" }}
                            type="text"
                            className="numberInput"
                            min={1}
                            onWheel={(e) => e.preventDefault()}
                            value={item?.p_price || 0}
                            onChange={(e) => onItemPriceChange(e, item)}
                          />
                        </td>
                        <td
                          className="ph2 pv1 tc bb b--black-20 bg-white"
                          style={{ textAlign: "center" }}
                        >
                          Rs:
                          <input
                            id="Quantity"
                            type="text"
                            className="numberInput"
                            min={1}
                            onWheel={(e) => e.preventDefault()}
                            value={item?.b_price}
                            onChange={(e) => {
                              setOrder((prev) => {
                                return {
                                  ...prev,
                                  item_details: prev.item_details.map((a) =>
                                    a.uuid === item.uuid
                                      ? {
                                          ...a,
                                          b_price: e.target.value,
                                          p_price: (
                                            e.target.value / +item.conversion
                                          ).toFixed(4),
                                        }
                                      : a
                                  ),
                                };
                              });
                            }}
                          />
                        </td>
                        <td
                          className="ph2 pv1 tc bb b--black-20 bg-white"
                          style={{ textAlign: "center" }}
                        >
                          <input
                            style={{ width: "100px" }}
                            type="number"
                            className="numberInput"
                            onWheel={(e) => e.preventDefault()}
                            value={
                              item?.charges_discount?.find(
                                (b) => b.title === "dsc1"
                              )?.value || ""
                            }
                            onChange={(e) => {
                              setOrder((prev) => {
                                return {
                                  ...prev,
                                  item_details: prev.item_details.map((a) =>
                                    a.uuid === item.uuid
                                      ? {
                                          ...a,
                                          charges_discount:
                                            a.charges_discount.map((b) =>
                                              b.title === "dsc1"
                                                ? {
                                                    ...b,
                                                    value: e.target.value,
                                                  }
                                                : b
                                            ),
                                        }
                                      : a
                                  ),
                                };
                              });
                            }}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => onPiecesKeyDown(e, item)}
                            disabled={!item.item_uuid}
                          />
                        </td>
                        <td
                          className="ph2 pv1 tc bb b--black-20 bg-white"
                          style={{ textAlign: "center" }}
                        >
                          <input
                            style={{ width: "100px" }}
                            type="number"
                            className="numberInput"
                            onWheel={(e) => e.preventDefault()}
                            value={
                              item?.charges_discount?.find(
                                (b) => b.title === "dsc2"
                              )?.value || ""
                            }
                            onChange={(e) => {
                              setOrder((prev) => {
                                return {
                                  ...prev,
                                  item_details: prev.item_details.map((a) =>
                                    a.uuid === item.uuid
                                      ? {
                                          ...a,
                                          charges_discount:
                                            a.charges_discount.map((b) =>
                                              b.title === "dsc2"
                                                ? {
                                                    ...b,
                                                    value: e.target.value,
                                                  }
                                                : b
                                            ),
                                        }
                                      : a
                                  ),
                                };
                              });
                            }}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => onPiecesKeyDown(e, item)}
                            disabled={!item.item_uuid}
                          />
                        </td>

                        <td
                          className="ph2 pv1 tc bb b--black-20 bg-white"
                          style={{ textAlign: "center" }}
                        >
                          {item?.item_total || ""}
                        </td>
                        <td
                          className="ph2 pv1 tc bb b--black-20 bg-white"
                          style={{ textAlign: "center" }}
                        >
                          <DeleteOutlineIcon
                            style={{ color: "red" }}
                            className="table-icon"
                            onClick={() => {
                              setOrder({
                                ...order,
                                item_details: order.item_details.filter(
                                  (a) => a.uuid !== item.uuid
                                ),
                              });
                              //console.log(item);
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td
                        className="ph2 pv1 tc bb b--black-20 bg-white"
                        style={{ textAlign: "center" }}
                        onClick={() =>
                          setOrder((prev) => ({
                            ...prev,
                            item_details: [
                              ...prev.item_details,
                              { uuid: uuid(), b: 0, p: 0 },
                            ],
                          }))
                        }
                      >
                        <AddIcon
                          sx={{ fontSize: 40 }}
                          style={{ color: "#4AC959", cursor: "pointer" }}
                        />
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  ""
                )}
              </table>
            </div>

            <div className="bottomContent" style={{ background: "white" }}>
              <button
                type="button"
                onClick={() => {
                  let empty_item = order.item_details
                    .filter((a) => a.item_uuid)
                    .map((a) => ({
                      ...a,
                      is_empty: !((+a.p || 0) + (+a.b || 0) + (+a.free || 0)),
                    }))
                    .find((a) => a.is_empty);
                  console.log({
                    empty_item,
                    order: order.item_details.map((a) => ({
                      ...a,
                      is_empty: !(+a.p + +a.b + +a.free),
                    })),
                  });
                  if (empty_item) {
                    setNotification({
                      message: `${empty_item.item_title} has 0 Qty.
                      0 Qty Not allowed.`,
                      success: false,
                    });
                    setTimeout(() => setNotification(null), 2000);
                    return;
                  }
                  setOrder((prev) => ({
                    ...prev,
                    item_details: prev.item_details.filter((a) => a.item_uuid),
                  }));
                  callBilling();
                }}
              >
                Bill
              </button>
              {order?.order_grandtotal ? (
                <button
                  style={{
                   
                    cursor: "default",
                  }}
                  type="button"
                >
                  Total: {order?.order_grandtotal || 0}
                </button>
              ) : (
                ""
              )}

              <button
                style={{
                 
                  cursor: "default",
                }}
                type="button"
                onClick={() => {
                  setDeductionPopup(true);
                }}
              >
                Deductions
              </button>

              {order_uuid ? (
                <button
                  style={{
                    
                    cursor: "default",
                  }}
                  type="button"
                  onClick={() => {
                    navigate("/admin/editVoucher/" + order_uuid);
                  }}
                >
                  A/c Voucher
                </button>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      </div>
      {confirmPopup ? (
        <MessagePopup
          message="Are you sure you want to bill?"
          message2={`Total: ${confirmPopup?.order_grandtotal || 0}`}
          onSave={() => setConfirmPopup(false)}
          onClose={() => {
            onSubmit(confirmPopup.type, confirmPopup);
            setConfirmPopup(false);
          }}
          button2="Cancel"
          button1="Confirm"
        />
      ) : (
        ""
      )}
      {remarks ? (
        <div className="overlay">
          <div
            className="modal"
            style={{
              height: "fit-content",
              width: "max-content",
              padding: "50px",
              backgroundColor: "red",
            }}
          >
            <h3>{remarks}</h3>

            <button onClick={() => setRemarks(false)} className="closeButton">
              x
            </button>
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
      {deductionPopup ? (
        <div className="overlay">
          <div className="modal">
            <h3>Deductions</h3>
            <div
              className="items_table"
              style={{
                flex: "1",
                height: "75vh",
                overflow: "scroll",
                width: "80vw",
              }}
            >
              <table className="f6 w-100 center" cellSpacing="0">
                <thead className="lh-copy" style={{ position: "static" }}>
                  <tr className="white">
                    <th className="pa2 tl bb b--black-20 w-30">Ledger</th>
                    <th className="pa2 tl bb b--black-20 w-30">Amount</th>
                    <th className="pa2 tl bb b--black-20 w-30"></th>
                  </tr>
                </thead>
                <tbody>
                  {order.deductions?.map((a, i) => (
                    <tr key={i}>
                      <td
                        className="ph2 pv1 tc bb b--black-20 bg-white"
                        style={{ textAlign: "center" }}
                      >
                        <Select
                          options={LedgerOptions}
                          getOptionLabel={(option) => (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <span>{option.label}</span>
                              <span>{option.closing_balance || 0}</span>
                            </div>
                          )}
                          onChange={(doc) => {
                            setOrder((prev) => ({
                              ...prev,
                              deductions: prev.deductions.map((b, j) =>
                                i === j ? { ...b, ledger_uuid: doc?.value } : b
                              ),
                            }));
                          }}
                          styles={customStyles}
                          value={
                            a?.ledger_uuid
                              ? LedgerOptions.find(
                                  (j) =>
                                    j.value === a.ledger_uuid ||
                                    j.value === a.counter_uuid
                                )
                              : ""
                          }
                          openMenuOnFocus={true}
                          menuPosition="fixed"
                          menuPlacement="auto"
                          placeholder="Select"
                        />
                      </td>
                      <td
                        className="ph2 pv1 tc bb b--black-20 bg-white"
                        style={{ textAlign: "center" }}
                      >
                        <input
                          type="number"
                          className="numberInput"
                          onWheel={(e) => e.preventDefault()}
                          value={a.amount}
                          onChange={(e) => {
                            setOrder((prev) => ({
                              ...prev,
                              deductions: prev.deductions.map((b, j) =>
                                i === j ? { ...b, amount: e.target.value } : b
                              ),
                            }));
                          }}
                        />
                      </td>
                      <td
                        className="ph2 pv1 tc bb b--black-20 bg-white"
                        style={{ textAlign: "center" }}
                      >
                        <DeleteOutlineIcon
                          style={{ color: "red" }}
                          onClick={() => {
                            setOrder((prev) => ({
                              ...prev,
                              deductions: prev.deductions.filter(
                                (b, j) => i !== j
                              ),
                            }));
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td
                      colSpan={3}
                      onClick={() =>
                        setOrder((prev) => ({
                          ...prev,
                          deductions: [
                            ...prev.deductions,
                            {
                              title: "",
                              ledger_uuid: "",
                              amount: 0,
                              uuid: uuid(),
                            },
                          ],
                        }))
                      }
                    >
                      <AddIcon
                        sx={{ fontSize: 40 }}
                        style={{ color: "#4AC959", cursor: "pointer" }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              className="submit"
              type="button"
              onClick={() => setDeductionPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
}
