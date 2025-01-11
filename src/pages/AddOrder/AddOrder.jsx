/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import { useEffect, useRef, useState, useContext, useMemo } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import "./index.css";
import { Billing, AutoAdd } from "../../Apis/functions";
import { AddCircle as AddIcon } from "@mui/icons-material";
import { v4 as uuid } from "uuid";
import Select from "react-select";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { FaSave } from "react-icons/fa";
import FreeItems from "../../components/FreeItems";
import DiliveryReplaceMent from "../../components/DiliveryReplaceMent";
import { IoCheckmarkDoneOutline } from "react-icons/io5";
import Context from "../../context/context";
import Prompt from "../../components/Prompt";
import { get } from "react-scroll/modules/mixins/scroller";
import { checkDecimalPlaces } from "../../utils/helperFunctions";

const options = {
  priorityOptions: [
    { value: 0, label: "Normal" },
    { value: 1, label: "High" },
  ],
  orderTypeOptions: [
    { value: "I", label: "Invoice" },
    { value: "E", label: "Estimate" },
  ],
};
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

export let getInitialValues = () => ({
  counter_uuid: "",
  item_details: [{ uuid: uuid(), b: 0, p: 0, sr: 1 }],
  item: [],
  priority: 0,
  order_type: "I",
  time_1: 24 * 60 * 60 * 1000,
  time_2: (24 + 48) * 60 * 60 * 1000,
  warehouse_uuid: localStorage.getItem("warehouse")
    ? JSON.parse(localStorage.getItem("warehouse")) || ""
    : "",
});

export default function AddOrder() {
  const {
    promptState,
    setPromptState,
    getSpecialPrice,
    saveSpecialPrice,
    deleteSpecialPrice,
    spcPricePrompt,
    setNotification,
  } = useContext(Context);
  const [order, setOrder] = useState(getInitialValues());
  const [deliveryPopup, setDeliveryPopup] = useState(false);
  const [counters, setCounters] = useState([]);
  const [counterFilter] = useState("");
  const [holdPopup, setHoldPopup] = useState(false);
  const [warehouse, setWarehouse] = useState([]);
  const [user_warehouse, setUser_warehouse] = useState([]);
  const [itemsData, setItemsData] = useState([]);
  const [popup, setPopup] = useState(false);
  const [autoBills, setAutoBills] = useState([]);
  const reactInputsRef = useRef({});
  const [focusedInputId, setFocusedInputId] = useState(0);
  const [edit_prices, setEditPrices] = useState([]);
  const [autoAdd, setAutoAdd] = useState(false);
  const [company, setCompanies] = useState([]);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [remarks, setRemarks] = useState("");
  const fetchCompanies = async () => {
    const cachedData = localStorage.getItem("companiesData");
    try {
      if (cachedData) {
        setCompanies(JSON.parse(cachedData));
      } else {
        const response = await axios.get("/companies/getCompanies");
        if (response?.data?.result?.[0]) {
          localStorage.setItem(
            "companiesData",
            JSON.stringify(response.data.result)
          );
          setCompanies(response.data.result);
        }
      }
    } catch (error) {
      console.log(error);
    }
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

  const getAutoBill = async () => {
    let data = [];
    const response = await axios({
      method: "get",
      url: "/autoBill/autoBillItem",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) data = response.data.result;
    const response1 = await axios({
      method: "get",
      url: "/autoBill/autoBillQty",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response1.data.success)
      data = data.length
        ? response1.data.result.length
          ? [...data, ...response1.data.result]
          : data
        : response1.data.result.length
        ? response1.data.result
        : [];
    setAutoBills(data.filter((a) => a.status));
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

  const getCounter = async () => {
    const response = await axios({
      method: "get",
      url: "/counters/GetCounterList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setCounters(response.data.result);
  };

  useEffect(() => {
    getCounter();
    getAutoBill();
    GetUserWarehouse();
    GetWarehouseList();
    fetchCompanies();
  }, []);

  useEffect(() => {
    console.log({ order });
    if (order?.warehouse_uuid) getItemsData();
  }, [order.warehouse_uuid]);
  useEffect(() => {
    if (order?.counter_uuid) {
      const counterData = counters.find(
        (a) => a.counter_uuid === order.counter_uuid
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
  }, [order.counter_uuid]);

  const setQuantity = () => {
    console.count("qty_details");
    setOrder((prev) => ({
      ...prev,
      item_details: prev.item_details.map((a) => ({
        ...a,
        b: +a.b + parseInt((+a.p || 0) / +a.conversion || 0),
        p: a.p ? +a.p % +a.conversion : 0,
      })),
    }));
  };

  const onSubmit = async (type) => {
    let counter = counters.find((a) => order.counter_uuid === a.counter_uuid);
    let data = {
      ...order,
      item_details: order.item_details
        .filter((a) => a.item_uuid)
        .map((a) => ({
          ...a,
          item_price: a.p_price || a.item_price,
        })),
    };
    if (type.autoAdd) {
      let autoAdd = await AutoAdd({
        counter,
        item_details: data.item_details,
        dbItems: itemsData,
        autobills: autoBills.filter((a) => a.status),
      });
      data = { ...data, ...autoAdd, item_details: autoAdd.item_details };
    }
    let time = new Date();
    let autoBilling = await Billing({
      new_order: 1,
      creating_new: 1,
      order_uuid: data?.order_uuid,
      invoice_number: `${data?.order_type}${data?.invoice_number}`,
      replacement: data.replacement,
      adjustment: data.adjustment,
      shortage: data.shortage,
      counter,
      items: data.item_details.map((a) => ({
        ...a,
        item_price: a.p_price || a.item_price,
      })),
      others: {
        stage: 1,
        user_uuid: localStorage.getItem("user_uuid"),
        time: time.getTime(),

        type: "NEW",
      },
      add_discounts: true,
      edit_prices: edit_prices.map((a) => ({
        ...a,
        item_price: a.p_price,
      })),
    });

    data = {
      ...data,
      ...autoBilling,
      order_uuid: uuid(),
      opened_by: 0,
      item_details: autoBilling.items.map((a) => ({
        ...a,
        unit_price:
          a.item_total / (+(+a.conversion * a.b) + a.p + a.free) ||
          a.item_price ||
          a.price,
        gst_percentage: a.item_gst,
        css_percentage: a.item_css,
        status: 0,
        price: a.price || a.item_price || 0,
      })),
      status:
        type.stage === 1
          ? [
              {
                stage: 1,
                time: data?.others?.time || new Date().getTime(),
                user_uuid:
                  data?.others?.user_uuid || localStorage.getItem("user_uuid"),
              },
            ]
          : type.stage === 2
          ? [
              {
                stage: 1,
                time: data?.others?.time || new Date().getTime(),
                user_uuid:
                  data?.others?.user_uuid || localStorage.getItem("user_uuid"),
              },
              {
                stage: 2,
                time: data?.others?.time || new Date().getTime(),
                user_uuid:
                  data?.others?.user_uuid || localStorage.getItem("user_uuid"),
              },
            ]
          : type.stage === 3
          ? [
              {
                stage: 1,
                time: data?.others?.time || new Date().getTime(),
                user_uuid:
                  data?.others?.user_uuid || localStorage.getItem("user_uuid"),
              },
              {
                stage: 2,
                time: data?.others?.time || new Date().getTime(),
                user_uuid:
                  data?.others?.user_uuid || localStorage.getItem("user_uuid"),
              },
              {
                stage: 3,
                time: data?.others?.time || new Date().getTime(),
                user_uuid:
                  data?.others?.user_uuid || localStorage.getItem("user_uuid"),
              },
            ]
          : [
              {
                stage: 1,
                time: data?.others?.time || new Date().getTime(),
                user_uuid:
                  data?.others?.user_uuid || localStorage.getItem("user_uuid"),
              },
              {
                stage: 2,
                time: data?.others?.time || new Date().getTime(),
                user_uuid:
                  data?.others?.user_uuid || localStorage.getItem("user_uuid"),
              },
              {
                stage: 3,
                time: data?.others?.time || new Date().getTime(),
                user_uuid:
                  data?.others?.user_uuid || localStorage.getItem("user_uuid"),
              },
              {
                stage: 4,
                time: data?.others?.time || new Date().getTime(),
                user_uuid:
                  data?.others?.user_uuid || localStorage.getItem("user_uuid"),
              },
            ],
      ...(type.obj || {}),
    };

    data.time_1 = data.time_1 + Date.now();
    data.time_2 = data.time_2 + Date.now();

    console.log("orderJSon", data);

    const response = await axios({
      method: "post",
      url: "/orders/postOrder",
      data,
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(response);
    if (response.data.success) {
      // window.location.reload();
      setOrder(getInitialValues());
      getCounter();
      setItemsData([]);
      setEditPrices([]);
      setAutoAdd(false);
      setPopup(false);
      setAutoBills([]);
      setDeliveryPopup(false);
      setHoldPopup(false);
      setFocusedInputId("");
      setRemarks("");
      setCompanyFilter("all");
      getItemsData();
      getAutoBill();
      setNotification({
        message: "Order Added Successfully",
        success: true,
      });
    }
  };

  const callBilling = async (type = {}) => {
    const getType = (code, match = true) =>
      ["Estimate", "Invoice"]?.find((i) => (i[0] === code) === match);

    if (!order.item_details.filter((a) => a.item_uuid).length) return;
    else if (
      order?.item_details
        .filter((a) => a.item_uuid)
        ?.some((i) => i.billing_type !== order?.order_type)
    )
      return setNotification({
        message: "Invoice and Estimate together not allowed",
        success: false,
      });
    setPopup(true);
    let counter = counters.find((a) => order.counter_uuid === a.counter_uuid);
    let time = new Date();
    let autoBilling = await Billing({
      creating_new: 1,
      new_order: 1,
      order_uuid: order?.order_uuid,
      invoice_number: `${order?.order_type}${order?.invoice_number}`,
      replacement: order.replacement,
      adjustment: order.adjustment,
      shortage: order.shortage,
      counter,
      items: order.item_details.map((a) => ({ ...a, item_price: a.p_price })),
      others: {
        stage: 1,
        user_uuid: localStorage.getItem("user_uuid"),
        time: time.getTime(),
        type: "NEW",
      },
      add_discounts: true,
      edit_prices: edit_prices.map((a) => ({
        ...a,
        item_price: a.p_price,
      })),
      ...type,
    });
    setOrder((prev) => ({
      ...prev,
      ...autoBilling,
      ...type,
      item_details: autoBilling.items,
    }));
  };

  const jumpToNextIndex = async (id) => {
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

  let listItemIndexCount = 0;

  const onItemPriceChange = async (e, item) => {
    if (e.target.value.toString().toLowerCase().includes("no special")) {
      await deleteSpecialPrice(item, order?.counter_uuid, setCounters);
      e.target.value = +e.target.value
        .split("")
        .filter((i) => i)
        .filter((i) => +i || +i === 0)
        .join("");
    }
    setOrder((prev) => {
      return {
        ...prev,
        item_details: prev.item_details.map((a) =>
          a.uuid === item.uuid
            ? {
                ...a,
                p_price: checkDecimalPlaces(e.target.value),
                b_price: (e.target.value * item.conversion || 0).toFixed(2),
              }
            : a
        ),
      };
    });
    setEditPrices((prev) =>
      prev.filter((a) => a.item_uuid === item.item_uuid).length
        ? prev.map((a) =>
            a.item_uuid === item.item_uuid
              ? {
                  ...a,
                  p_price: checkDecimalPlaces(e.target.value),
                  b_price: chcekIfDecimal(
                    e.target.value * item.conversion || 0
                  ),
                }
              : a
          )
        : prev.length
        ? [
            ...prev,
            {
              ...item,
              p_price: checkDecimalPlaces(e.target.value),
              b_price: chcekIfDecimal(e.target.value * item.conversion || 0),
            },
          ]
        : [
            {
              ...item,
              p_price: checkDecimalPlaces(e.target.value),
              b_price: chcekIfDecimal(e.target.value * item.conversion || 0),
            },
          ]
    );
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
  const chcekIfDecimal = (value) => {
    console.log({ value, isDecimal: value.toString().includes(".") });
    if (value.toString().includes(".")) {
      return parseFloat(value || 0).toFixed(2);
    } else {
      return value;
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
              <h2>Add Order </h2>
              {/* {type === 'edit' && <XIcon className='closeicon' onClick={close} />} */}
            </div>

            <div className="topInputs">
              <div className="inputGroup" style={{ width: "50px" }}>
                <label htmlFor="Warehouse">Counter</label>
                <div className="inputGroup">
                  <Select
                    ref={(ref) => (reactInputsRef.current["0"] = ref)}
                    options={counters
                      ?.filter(
                        (a) =>
                          !counterFilter ||
                          a.counter_title
                            ?.toLocaleLowerCase()
                            ?.includes(counterFilter.toLocaleLowerCase())
                      )
                      .map((a) => ({
                        value: a.counter_uuid,
                        label: a.counter_title + " , " + a.route_title,
                        isHighlighted: a.status === 2 ? a.remarks : "",
                      }))}
                    onChange={(doc) => {
                      if (doc?.isHighlighted) setRemarks(doc?.isHighlighted);
                      else
                        setOrder((prev) => ({
                          ...prev,
                          counter_uuid: doc?.value,
                        }));
                    }}
                    styles={customStyles}
                    value={
                      order?.counter_uuid
                        ? {
                            value: order?.counter_uuid,
                            label: counters?.find(
                              (j) => j.counter_uuid === order.counter_uuid
                            )?.counter_title,
                          }
                        : ""
                    }
                    autoFocus={!order?.counter_uuid}
                    openMenuOnFocus={true}
                    menuPosition="fixed"
                    menuPlacement="auto"
                    placeholder="Select"
                  />
                </div>

                {order.counter_uuid ? (
                  <button
                    className="theme-btn"
                    style={{
                      width: "max-content",
                      position: "fixed",
                      right: "100px",
                    }}
                    onClick={() => setHoldPopup("Summary")}
                  >
                    Free
                  </button>
                ) : (
                  ""
                )}
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
              <div className="inputGroup" style={{ width: "100px" }}>
                <label htmlFor="Warehouse">Priority</label>
                <div className="inputGroup">
                  <Select
                    options={options.priorityOptions}
                    onChange={(doc) =>
                      setOrder((x) => ({ ...x, priority: doc?.value }))
                    }
                    value={options.priorityOptions?.find(
                      (j) => j.value === order.priority
                    )}
                    openMenuOnFocus={true}
                    menuPosition="fixed"
                    menuPlacement="auto"
                    placeholder="Select Priority"
                  />
                </div>
              </div>
              <div className="inputGroup" style={{ width: "100px" }}>
                <label htmlFor="Warehouse">Type</label>
                <div className="inputGroup">
                  <Select
                    options={options.orderTypeOptions}
                    onChange={(doc) =>
                      setOrder((x) => ({ ...x, order_type: doc?.value }))
                    }
                    value={options.orderTypeOptions?.find(
                      (j) => j.value === order.order_type
                    )}
                    openMenuOnFocus={true}
                    menuPosition="fixed"
                    menuPlacement="auto"
                    placeholder="Select Order Type"
                  />
                </div>
              </div>
              <div className="inputGroup" style={{ width: "100px" }}>
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

                    <th className="pa2 tc bb b--black-20 ">Special Price</th>
                    <th className="pa2 tc bb b--black-20 ">Item Total</th>

                    <th className="pa2 tc bb b--black-20 "></th>
                  </tr>
                </thead>
                {order.counter_uuid ? (
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
                                      a.company_uuid === companyFilter) &&
                                    a.billing_type === order?.order_type
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
                                      const p_price =
                                        +getSpecialPrice(
                                          counters,
                                          item,
                                          order?.counter_uuid
                                        )?.price || item.item_price;
                                      return {
                                        ...a,
                                        ...item,
                                        p_price,
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
                                        b_price: Math.floor(
                                          p_price * item.conversion || 0
                                        ),
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
                                focusedInputId ===
                                  `selectContainer-${item.uuid}` ||
                                (i === 0 && focusedInputId === 0)
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
                            value={chcekIfDecimal(item?.p_price || 0)}
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
                                          b_price: chcekIfDecimal(
                                            e.target.value
                                          ),
                                          p_price: checkDecimalPlaces(
                                            e.target.value / item.conversion
                                          ),
                                        }
                                      : a
                                  ),
                                };
                              });
                              setEditPrices((prev) =>
                                prev.filter(
                                  (a) => a.item_uuid === item.item_uuid
                                ).length
                                  ? prev.map((a) =>
                                      a.item_uuid === item.item_uuid
                                        ? {
                                            ...a,
                                            b_price: chcekIfDecimal(
                                              e.target.value
                                            ),
                                            p_price: checkDecimalPlaces(
                                              e.target.value / item.conversion
                                            ),
                                          }
                                        : a
                                    )
                                  : prev.length
                                  ? [
                                      ...prev,
                                      {
                                        ...item,
                                        b_price: chcekIfDecimal(e.target.value),
                                        p_price: checkDecimalPlaces(
                                          e.target.value / item.conversion
                                        ),
                                      },
                                    ]
                                  : [
                                      {
                                        ...item,

                                        b_price: chcekIfDecimal(e.target.value),
                                        p_price: checkDecimalPlaces(
                                          e.target.value / item.conversion
                                        ),
                                      },
                                    ]
                              );
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
                            disabled={
                              !item.item_uuid ||
                              +getSpecialPrice(
                                counters,
                                item,
                                order?.counter_uuid
                              )?.price === +item?.p_price
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
                                            a.charges_discount.find(
                                              (c) => c.title === "dsc1"
                                            )
                                              ? a.charges_discount.map((b) =>
                                                  b.title === "dsc1"
                                                    ? {
                                                        ...b,
                                                        value: e.target.value,
                                                      }
                                                    : b
                                                )
                                              : [
                                                  ...a.charges_discount,
                                                  {
                                                    title: "dsc1",
                                                    value: e.target.value,
                                                  },
                                                ],
                                        }
                                      : a
                                  ),
                                };
                              });
                            }}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => onPiecesKeyDown(e, item)}
                          />
                        </td>
                        <td
                          className="ph2 pv1 tc bb b--black-20 bg-white"
                          style={{ textAlign: "center" }}
                        >
                          {console.log(item)}
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
                                    a.uuid === item.uuid ||
                                    (a.item_uuid &&
                                      a.item_uuid === item.item_uuid)
                                      ? {
                                          ...a,
                                          charges_discount:
                                            a.charges_discount.find(
                                              (c) => c.title === "dsc2"
                                            )
                                              ? a.charges_discount.map((b) =>
                                                  b.title === "dsc2"
                                                    ? {
                                                        ...b,
                                                        value: e.target.value,
                                                      }
                                                    : b
                                                )
                                              : [
                                                  ...a.charges_discount,
                                                  {
                                                    title: "dsc2",
                                                    value: e.target.value,
                                                  },
                                                ],
                                        }
                                      : a
                                  ),
                                };
                              });
                            }}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => onPiecesKeyDown(e, item)}
                            disabled={
                              !item.item_uuid ||
                              +getSpecialPrice(
                                counters,
                                item,
                                order?.counter_uuid
                              )?.price === +item?.p_price
                            }
                          />
                        </td>
                        <td className="ph2 pv1 tc bb b--black-20 bg-white">
                          {+item?.item_price !== +item?.p_price &&
                            (+getSpecialPrice(
                              counters,
                              item,
                              order?.counter_uuid
                            )?.price === +item?.p_price ? (
                              <IoCheckmarkDoneOutline
                                className="table-icon checkmark"
                                onClick={() =>
                                  spcPricePrompt(
                                    item,
                                    order?.counter_uuid,
                                    setCounters
                                  )
                                }
                              />
                            ) : (
                              <FaSave
                                className="table-icon"
                                title="Save current price as special item price"
                                onClick={() =>
                                  saveSpecialPrice(
                                    item,
                                    order?.counter_uuid,
                                    setCounters
                                  )
                                }
                              />
                            ))}
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
                    <tr
                      style={{
                        height: "50px",

                        borderBottom: "2px solid #fff",
                      }}
                    >
                      <td
                        className="ph2 pv1 tc bb b--black-20 bg-white"
                        style={{ textAlign: "center" }}
                      >
                        <div className="inputGroup">Total</div>
                      </td>

                      <td
                        className="ph2 pv1 tc bb b--black-20 bg-white"
                        style={{ textAlign: "center" }}
                      >
                        {(order?.item_details?.length > 1
                          ? order?.item_details
                              ?.map((a) => +a?.b || 0)
                              .reduce((a, b) => a + b)
                          : order?.item_details?.length
                          ? order?.item_details[0]?.b
                          : 0) || 0}
                      </td>
                      <td
                        className="ph2 pv1 tc bb b--black-20 bg-white"
                        style={{ textAlign: "center" }}
                      >
                        {(order?.item_details?.length > 1
                          ? order?.item_details
                              ?.map((a) => +a?.p || 0)
                              .reduce((a, b) => a + b)
                          : order?.item_details?.length
                          ? order?.item_details[0]?.p
                          : 0) || 0}
                      </td>
                      <td></td>
                      <td></td>
                      <td
                        className="ph2 pv1 tc bb b--black-20 bg-white"
                        style={{ textAlign: "center" }}
                      ></td>
                      <td
                        className="ph2 pv1 tc bb b--black-20 bg-white"
                        style={{ textAlign: "center" }}
                      ></td>
                      <td></td>
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
                  console.log({ order });

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
                  let empty_price = order.item_details
                    .filter((a) => a.item_uuid && !a.free && a.state !== 3)
                    .map((a) => ({
                      ...a,
                      is_empty: !+a.p_price,
                    }))
                    .find((a) => a.is_empty);
                  if (empty_price) {
                    setNotification({
                      message: `item ${empty_price?.item_title} has 0 price.`,
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
                    position: "fixed",
                    bottom: "10px",
                    right: "0",
                    cursor: "default",
                  }}
                  type="button"
                  onClick={() => {
                    // if (!order.item_details.filter((a) => a.item_uuid).length)
                    //   return;
                    // setPopup(true);
                  }}
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
      {holdPopup ? (
        <FreeItems
          onSave={() => setHoldPopup(false)}
          orders={order}
          holdPopup={holdPopup}
          itemsData={itemsData}
          setOrder={setOrder}
        />
      ) : (
        ""
      )}
      {popup ? (
        <NewUserForm
          onClose={() => setPopup(false)}
          onSubmit={(e) => {
            //console.log(e);
            setAutoAdd(e.autoAdd);
            if (e.stage === 4) setDeliveryPopup(true);
            else {
              onSubmit(e);
            }
          }}
        />
      ) : (
        ""
      )}
      {deliveryPopup ? (
        <DiliveryPopup
          onSave={() => setDeliveryPopup(false)}
          postOrderData={(obj) => onSubmit({ stage: 5, autoAdd, obj })}
          setSelectedOrder={setOrder}
          order={order}
          counters={counters}
          items={itemsData}
          updateBilling={callBilling}
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
    </>
  );
}

function NewUserForm({ onSubmit, onClose }) {
  const [data, setData] = useState({ autoAdd: false, stage: 1 });
  return (
    <div className="overlay">
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
                onSubmit(data);
                onClose();
              }}
            >
              <div className="formGroup">
                <div className="row">
                  <h3> Auto Add</h3>
                  <div onClick={() => setData({ ...data, autoAdd: true })}>
                    <input type="radio" checked={data.autoAdd} />
                    Yes
                  </div>
                  <div onClick={() => setData({ ...data, autoAdd: false })}>
                    <input type="radio" checked={!data.autoAdd} />
                    No
                  </div>
                </div>
                <div className="row">
                  <h3>Stage</h3>
                  <div onClick={() => setData({ ...data, stage: 1 })}>
                    <input type="radio" checked={data.stage === 1} />
                    Processing
                  </div>
                  <div onClick={() => setData({ ...data, stage: 2 })}>
                    <input type="radio" checked={data.stage === 2} />
                    Checking
                  </div>
                  <div onClick={() => setData({ ...data, stage: 3 })}>
                    <input type="radio" checked={data.stage === 3} />
                    Delivery
                  </div>
                  <div onClick={() => setData({ ...data, stage: 4 })}>
                    <input type="radio" checked={data.stage === 4} />
                    Complete
                  </div>
                </div>

                <div className="row">
                  <button type="submit" className="submit">
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
          <button onClick={onClose} className="closeButton">
            x
          </button>
        </div>
      </div>
    </div>
  );
}
function DiliveryPopup({
  onSave,
  postOrderData,
  credit_allowed,
  counters,
  items,
  order,
  updateBilling,
}) {
  const [PaymentModes, setPaymentModes] = useState([]);
  const [modes, setModes] = useState([]);
  const [error, setError] = useState("");
  const [popup, setPopup] = useState(false);
  // const [coinPopup, setCoinPopup] = useState(false);
  const [data, setData] = useState({});
  const [outstanding, setOutstanding] = useState({});
  useEffect(() => {
    updateBilling({
      replacement: data?.replacement || 0,
      shortage: data?.shortage || 0,
      adjustment: data?.adjustment || 0,
      adjustment_remarks: data?.adjustment_remarks || "",
    });
  }, [data]);
  const GetPaymentModes = async () => {
    const cachedData = localStorage.getItem("paymentModesData");

    if (cachedData) {
      setPaymentModes(JSON.parse(cachedData));
    } else {
      const response = await axios({
        method: "get",
        url: "/paymentModes/GetPaymentModesList",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        localStorage.setItem(
          "paymentModesData",
          JSON.stringify(response.data.result)
        );
        setPaymentModes(response.data.result);
      }
    }
  };
  useEffect(() => {
    let time = new Date();
    setOutstanding({
      order_uuid: order.order_uuid,
      amount: "",
      user_uuid: localStorage.getItem("user_uuid"),
      time: time.getTime(),
      invoice_number: order.invoice_number,
      trip_uuid: order.trip_uuid,
      counter_uuid: order.counter_uuid,
    });
    GetPaymentModes();
  }, []);
  useEffect(() => {
    if (PaymentModes.length)
      setModes(
        PaymentModes.map((a) => ({
          ...a,
          amt: "",
          coin: "",
          status:
            a.mode_uuid === "c67b5794-d2b6-11ec-9d64-0242ac120002" ||
            a.mode_uuid === "c67b5988-d2b6-11ec-9d64-0242ac120002"
              ? "0"
              : 1,
        }))
      );
  }, [PaymentModes]);
  const submitHandler = async () => {
    setError("");
    let billingData = await Billing({
      creating_new: 1,
      new_order: 1,
      order_uuid: order?.order_uuid,
      invoice_number: `${order?.order_type}${order?.invoice_number}`,
      replacement: order.replacement,
      shortage: order.shortage,
      adjustment: order.adjustment,
      counter: counters.find((a) => a.counter_uuid === order.counter_uuid),
      items: order.item_details.map((a) => {
        let itemData = items.find((b) => a.item_uuid === b.item_uuid);
        return {
          ...itemData,
          ...a,
          price: itemData?.price || 0,
        };
      }),
    });
    let Tempdata = {
      ...order,
      ...billingData,
      item_details: billingData.items,
      replacement: data?.replacement || 0,
      shortage: data?.shortage || 0,
      adjustment: data?.adjustment || 0,
      adjustment_remarks: data?.adjustment_remarks || "",
    };
    let modeTotal = modes.map((a) => +a.amt || 0)?.reduce((a, b) => a + b);
    //console.log(
    // Tempdata?.order_grandtotal,
    //   +(+modeTotal + (+outstanding?.amount || 0))
    // );
    if (
      +Tempdata?.order_grandtotal !==
      +(+modeTotal + (+outstanding?.amount || 0))
    ) {
      setError("Invoice Amount and Payment mismatch");
      return;
    }
    // let obj = modes.find((a) => a.mode_title === "Cash");
    // if (obj?.amt && obj?.coin === "") {
    //   setCoinPopup(true);
    //   return;
    // }

    let obj = {
      user_uuid: localStorage.getItem("user_uuid"),
      modes: modes.map((a) =>
        a.mode_title === "Cash" ? { ...a, coin: 0 } : a
      ),
    };

    postOrderData({ ...obj, OutStanding: outstanding.amount });
    onSave();
  };
  return (
    <>
      <div className="overlay">
        <div
          className="modal"
          style={{ height: "fit-content", width: "max-content" }}
        >
          <div className="flex" style={{ justifyContent: "space-between" }}>
            <h3>Payments</h3>
            <h3>Rs. {order.order_grandtotal}</h3>
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
                  {PaymentModes.map((item) => (
                    <div
                      className="row"
                      style={{ flexDirection: "row", alignItems: "center" }}
                      key={item.mode_uuid}
                    >
                      <div style={{ width: "50px" }}>{item.mode_title}</div>
                      <label
                        className="selectLabel flex"
                        style={{ width: "80px" }}
                      >
                        <input
                          type="number"
                          name="route_title"
                          className="numberInput"
                          value={
                            modes.find((a) => a.mode_uuid === item.mode_uuid)
                              ?.amt
                          }
                          style={{ width: "80px" }}
                          onChange={(e) =>
                            setModes((prev) =>
                              prev.map((a) =>
                                a.mode_uuid === item.mode_uuid
                                  ? {
                                      ...a,
                                      amt: e.target.value,
                                    }
                                  : a
                              )
                            )
                          }
                          maxLength={42}
                          onWheel={(e) => e.preventDefault()}
                        />
                        {/* {popupInfo.conversion || 0} */}
                      </label>
                    </div>
                  ))}
                  <div
                    className="row"
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <div style={{ width: "50px" }}>UnPaid</div>
                    <label
                      className="selectLabel flex"
                      style={{ width: "80px" }}
                    >
                      <input
                        type="number"
                        name="route_title"
                        className="numberInput"
                        value={outstanding?.amount}
                        placeholder={
                          !credit_allowed === "Y" ? "Not Allowed" : ""
                        }
                        style={
                          !credit_allowed === "Y"
                            ? {
                                width: "90px",
                                backgroundColor: "light",
                                fontSize: "12px",
                                color: "#fff",
                              }
                            : { width: "80px" }
                        }
                        onChange={(e) =>
                          setOutstanding((prev) => ({
                            ...prev,
                            amount: e.target.value,
                          }))
                        }
                        maxLength={42}
                        onWheel={(e) => e.preventDefault()}
                      />
                      {/* {popupInfo.conversion || 0} */}
                    </label>
                  </div>
                  <div
                    className="row"
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <button
                      type="button"
                      className="submit"
                      style={{ color: "#fff", backgroundColor: "#7990dd" }}
                      onClick={() => setPopup(true)}
                    >
                      Deductions
                    </button>
                  </div>
                  <i style={{ color: "red" }}>{error}</i>
                </div>

                <div
                  className="flex"
                  style={{ justifyContent: "space-between" }}
                >
                  <button
                    type="button"
                    style={{ backgroundColor: "red" }}
                    className="submit"
                    onClick={onSave}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="submit"
                    onClick={submitHandler}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {popup ? (
        <DiliveryReplaceMent
          onSave={() => {
            setPopup(false);
          }}
          setData={setData}
          data={data}
        />
      ) : (
        ""
      )}
      {/* {coinPopup ? (
        <div className="overlay">
          <div
            className="modal"
            style={{ height: "fit-content", width: "max-content" }}
          >
            <h3>Cash Coin</h3>
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
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <div style={{ width: "50px" }}>Cash</div>

                      <label
                        className="selectLabel flex"
                        style={{ width: "80px" }}
                      >
                        <input
                          type="number"
                          name="route_title"
                          className="numberInput"
                          placeholder="Coins"
                          value={
                            modes.find(
                              (a) =>
                                a.mode_uuid ===
                                "c67b54ba-d2b6-11ec-9d64-0242ac120002"
                            )?.coin
                          }
                          style={{ width: "70px" }}
                          onChange={(e) =>
                            setModes((prev) =>
                              prev.map((a) =>
                                a.mode_uuid ===
                                "c67b54ba-d2b6-11ec-9d64-0242ac120002"
                                  ? {
                                      ...a,
                                      coin: e.target.value,
                                    }
                                  : a
                              )
                            )
                          }
                          maxLength={42}
                          onWheel={(e) => e.preventDefault()}
                        />
                      </label>
                    </div>
                  </div>

                  <div
                    className="flex"
                    style={{ justifyContent: "space-between" }}
                  >
                    <button
                      type="button"
                      className="submit"
                      onClick={() => submitHandler()}
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        ""
      )} */}
    </>
  );
}
