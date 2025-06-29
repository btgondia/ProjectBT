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
  credit_notes_invoice_number: "",
  deductions: [],
  time_1: 24 * 60 * 60 * 1000,
  time_2: (24 + 48) * 60 * 60 * 1000,
  warehouse_uuid: localStorage.getItem("warehouse")
    ? JSON.parse(localStorage.getItem("warehouse")) || ""
    : "",
    credit_notes_invoice_date: new Date().getTime(),
});

export default function CreditNotes() {
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
  const [deletePopup, setDeletePopup] = useState(false);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [remarks, setRemarks] = useState("");
  const fetchCompanies = async () => {
    const cachedData = localStorage.getItem('companiesData');
    try {
      if (cachedData) {
        setCompanies(JSON.parse(cachedData));
      } else {
        const response = await axios.get("/companies/getCompanies");
        if (response?.data?.result?.[0]) {
          localStorage.setItem('companiesData', JSON.stringify(response.data.result));
          setCompanies(response.data.result);
        }
      }
    } catch (error) {
     
    }
  };
  useEffect(() => {
    let controller = new AbortController();
    if (order_uuid) {
      axios
        .get(`/creditNote/getCreditNote/${order_uuid}`, {
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
                p_price: a.price || itemData.item_price || 0,
                b_price:
                  (+(a.price || itemData.item_price || 0) *
                  +(itemData.conversion || 0)).toFixed(4),
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
            if(data.notes.length) setNotesPoup(true)
          }
        })
        .catch((err) => {
         
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
      setLedgerData(response.data.result);
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
         
          let item_price = item.item_price;
          if (item_rate === "a") item_price = item.item_price_a;
          if (item_rate === "b") item_price = item.item_price_b;
          if (item_rate === "c") item_price = item.item_price_c;
          if (item_rate === "d") item_price = item.item_price_d;

          return { ...item, item_price };
        })
      );
    }
  }, [order.ledger_uuid]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const response = await axios({
      method: order_uuid ? "put" : "post",
      url: `/creditNote/${order_uuid ? "put" : "post"}CreditNote`,
      data: confirmPopup,
      headers: {
        "Content-Type": "application/json",
      },
    });
   
    if (response.data.success) {
      if (order_uuid) {
        setNotification({
          message: "Credit Note Updated Successfully",
          success: true,
        });
        sessionStorage.setItem("isEditVoucher", 1);
        navigate(-1);
      } else {
        setNotification({
          message: "Credit Note Added Successfully",
          success: true,
        });
        setConfirmPopup(null);
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
        price: a.p_price,
        gst_percentage: a.item_gst,
        css_percentage: a.item_css
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
      [...counter, ...allLedgerData]
        .map((a) => ({
          ...a,
          label: a.counter_title || a.ledger_title,
          value: a.counter_uuid || a.ledger_uuid,
          closing_balance: truncateDecimals(
            (a.closing_balance || 0) + +(a.opening_balance_amount || 0),
            2
          ),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [counter, allLedgerData]
  );
  const deletePurchaseInvoice = async (e) => {
    e.preventDefault();
    const response = await axios({
      method: "delete",
      url: `/creditNote/deleteCreditNote`,
      data: { order_uuid },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      setNotification({
        message: "Credit Note Deleted Successfully",
        success: true,
      });
      sessionStorage.setItem("isEditVoucher", 1);
      navigate(-1);
    }
  };

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
              <h2>Credit Note </h2>
            </div>

            <div className="topInputs" style={{ width: "80vw" }}>
              <div className="inputGroup" style={{ width: "50px" }}>
                <label htmlFor="Warehouse">Ledger</label>
                <div className="inputGroup">
                  <Select
                    ref={(ref) => (reactInputsRef.current["0"] = ref)}
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
                        ledger_uuid: doc?.value,
                      }));
                    }}
                    styles={customStyles}
                    value={
                      LedgerOptions.find((a) => a.value === order.ledger_uuid) ||
                      ""
                    }
                    autoFocus={!order?.ledger_uuid && !order_uuid}
                    openMenuOnFocus={true}
                    menuPosition="fixed"
                    menuPlacement="auto"
                    placeholder="Select"
                    filterOption={(data, value) => {
                      let label = data.data.label;
                      if (label.toLowerCase().includes(value.toLowerCase()))
                        return true;
                      return false;
                    }}
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
                <label htmlFor="Warehouse">Credit Invoice Date</label>
                <div className="inputGroup">
                  <input
                    type="date"
                    onChange={(e) => {
                      setOrder((prev) => ({
                        ...prev,
                        credit_notes_invoice_date: new Date(e.target.value).getTime(),
                      }));
                    }}
                    value={getFormateDate(new Date(order.credit_notes_invoice_date))}
                    placeholder="Search Counter Title..."
                    className="searchInput"
                    pattern="\d{4}-\d{2}-\d{2}"
                  />
                </div>
              </div>
              <div className="inputGroup" style={{ width: "100px" }}>
                <label htmlFor="Warehouse">Credit Invoice Number</label>
                <div className="inputGroup">
                  <input
                    style={{ width: "200px" }}
                    type="text"
                    className="numberInput"
                    onWheel={(e) => e.preventDefault()}
                    value={order.credit_notes_invoice_number || ""}
                    onChange={(e) => {
                      if (e.target.value.length <= 30)
                        setOrder((prev) => {
                          return {
                            ...prev,
                            credit_notes_invoice_number: e.target.value,
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
                                        ? "#32bd33"
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
                                        p_price: item?.item_price || 0,
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
                                          (item?.item_price || 0) *
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

            <div
              className="bottomContent"
              style={{ background: "white", justifyContent: "flex-end" }}
            >
              <button
                type="button"
                onClick={() => {
                  if (!order.credit_notes_invoice_number) {
                    setNotification({
                      message: "Credit Invoice Number is required",
                      success: false,
                    });
                    return;
                  }
                  let empty_item = order.item_details
                    .filter((a) => a.item_uuid)
                    .map((a) => ({
                      ...a,
                      is_empty: !((+a.p || 0) + (+a.b || 0) + (+a.free || 0)),
                    }))
                    .find((a) => a.is_empty);
                  
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
              <div
                className="flex"
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                  width: "45vw",
                }}
              >
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
                    setDeductionPopup(order.deductions);
                  }}
                >
                  Adjustment
                </button>
                {order_uuid ? (
                  <>
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
                    <button
                      style={{
                        cursor: "default",
                        background: "red",
                      }}
                      type="button"
                      onClick={() => setDeletePopup(true)}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  ""
                )}
              </div>
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
                <form className="form" onSubmit={onSubmit}>
                  <div className="formGroup">
                    <div
                      className="row"
                      style={{ flexDirection: "column", alignItems: "start" }}
                    >
                      <h1 style={{ textAlign: "center" }}>
                        Are you sure you want to bill?
                      </h1>
                      <div className="inputGroup" style={{ width: "100px" }}>
                        <label htmlFor="Warehouse">Total</label>
                        <div className="inputGroup">
                          <input
                            style={{ width: "200px" }}
                            type="text"
                            className="numberInput"
                            onWheel={(e) => e.preventDefault()}
                            value={confirmPopup.order_grandtotal || ""}
                            onChange={(e) => {
                              if (e.target.value.length <= 30)
                                setConfirmPopup((prev) => {
                                  return {
                                    ...prev,
                                    order_grandtotal: e.target.value,
                                    round_off: truncateDecimals(
                                      e.target.value - prev.old_grandtotal,
                                      2
                                    ),
                                  };
                                });
                            }}
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                      </div>
                      <h3 style={{ textAlign: "center" }}>
                        RoundOff Value: {confirmPopup.round_off || 0}
                      </h3>
                    </div>

                    <div className="row message-popup-actions">
                      <button
                        className="simple_Logout_button"
                        type="button"
                        onClick={() => setConfirmPopup(false)}
                      >
                        Cancel
                      </button>
                      <button className="simple_Logout_button" type="submit">
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
      {deletePopup ? (
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
                <form className="form" onSubmit={deletePurchaseInvoice}>
                  <div className="formGroup">
                    <div
                      className="row"
                      style={{ flexDirection: "column", alignItems: "start" }}
                    >
                      <h1 style={{ textAlign: "center" }}>
                        Are you sure you want to Delete?
                      </h1>
                    </div>

                    <div className="row message-popup-actions">
                      <button
                        className="simple_Logout_button"
                        type="button"
                        onClick={() => setDeletePopup(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="simple_Logout_button"
                        type="submit"
                        style={{ background: "red" }}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
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
          isCreditNote={true}
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
                width: "40vw",
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
                  {deductionPopup?.map((a, i) => (
                    <tr key={i}>
                      <td
                        className="ph2 pv1 tc bb b--black-20 bg-white"
                        style={{ textAlign: "center" }}
                      >
                        <Select
                          options={LedgerOptions.filter(
                            (ledger) =>
                              !order.deductions.find(
                                (b) => b.ledger_uuid === ledger.value
                              )
                          )}
                          filterOption={(data, value) => {
                            let label = data.data.label;
                            if (
                              label.toLowerCase().includes(value.toLowerCase())
                            )
                              return true;
                            return false;
                          }}
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
                            setDeductionPopup((prev) =>
                              prev.map((b, j) =>
                                i === j ? { ...b, ledger_uuid: doc?.value } : b
                              )
                            );
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
                            setDeductionPopup((prev) =>
                              prev.map((b, j) =>
                                i === j ? { ...b, amount: e.target.value } : b
                              )
                            );
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
                            setDeductionPopup((prev) =>
                              prev.filter((b, j) => i !== j)
                            );
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3}>
                      <div
                        onClick={() =>
                          setDeductionPopup((prev) => [
                            ...(prev || []),
                            {
                              title: "",
                              ledger_uuid: "",
                              amount: 0,
                              uuid: uuid(),
                            },
                          ])
                        }
                      >
                        <AddIcon
                          sx={{ fontSize: 40 }}
                          style={{ color: "#32bd33", cursor: "pointer" }}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              className="submit"
              type="button"
              onClick={() => {
                setOrder((prev) => ({
                  ...prev,
                  deductions: deductionPopup,
                }));
                setDeductionPopup(false);
              }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setDeductionPopup(false);
              }}
              className="closeButton"
            >
              x
            </button>
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
}
