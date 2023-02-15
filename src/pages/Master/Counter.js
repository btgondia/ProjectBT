import React, { useState, useEffect, useMemo, useContext } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import axios from "axios";
import {
  CopyAllOutlined,
  DeleteOutline,
  Phone,
  WhatsApp,
} from "@mui/icons-material";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid";
import CounterSequence from "../../components/CounterSequence";
import * as XLSX from "xlsx";
import * as FileSaver from "file-saver";
import { v4 as uuid } from "uuid";
import Context from "../../context/context";
const Counter = () => {
  const [counter, setCounter] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);

  const [filterCounterTitle, setFilterCounterTitle] = useState("");
  const [filterRoute, setFilterRoute] = useState("");
  const [popupForm, setPopupForm] = useState(false);
  const [routesData, setRoutesData] = useState([]);
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [xlSelection, seXlSelection] = useState(false);
  const [itemPopup, setItemPopup] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const context = useContext(Context);

  const { setNotification } = context;
  const [sequencePopup, setSequencePopup] = useState(false);
  const fileType =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const getRoutesData = async (controller = new AbortController()) => {
    const response = await axios({
      method: "get",
      url: "/routes/GetRouteList",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setRoutesData(response.data.result);
  };

  useEffect(() => {
    const controller = new AbortController();
    getRoutesData(controller);
    return () => {
      controller.abort();
    };
  }, []);
  const getCounter = async (controller = new AbortController()) => {
    const response = await axios({
      method: "get",
      url: "/counters/GetCounterData",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      setCounter(response.data.result);
      if (popupForm?.item?.counter_uuid) {
        setPopupForm((prev) => ({
          ...prev,
          item:
            response.data.result?.find(
              (a) => a.counter_uuid === prev?.item?.counter_uuid
            ) || prev.item,
        }));
      }
    }
  };
  const GetPaymentModes = async () => {
    const response = await axios({
      method: "get",
      url: "/paymentModes/GetPaymentModesList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(response.data.result);
    if (response.data.success) setPaymentModes(response.data.result);
  };

  useEffect(() => {
    const controller = new AbortController();
    getCounter(controller);
    return () => {
      controller.abort();
    };
  }, [popupForm]);
  useEffect(() => {
    GetPaymentModes();
  }, []);
  const filterCounter = useMemo(
    () =>
      counter
        .map((b) => ({
          ...b,
          route_title:
            routesData.find((a) => a.route_uuid === b.route_uuid)
              ?.route_title || "-",
          route_sort_order:
            routesData.find((a) => a.route_uuid === b.route_uuid)?.sort_order ||
            0,
        }))
        .filter(
          (a) =>
            a.counter_title &&
            (!filterCounterTitle ||
              a.counter_title
                ?.toLocaleLowerCase()
                ?.includes(filterCounterTitle?.toLocaleLowerCase())) &&
            (!filterRoute ||
              a.route_title
                ?.toLocaleLowerCase()
                ?.includes(filterRoute?.toLocaleLowerCase()))
        ) || [],
    [counter, filterCounterTitle, filterRoute, routesData]
  );

  const fileExtension = ".xlsx";
  const downloadHandler = async () => {
    seXlSelection(false);

    let sheetData = counter
      .filter((a) => selectedRoutes.filter((b) => b === a.route_uuid)?.length)
      .sort((a, b) =>
        a.route_sort_order - b.route_sort_order
          ? a.route_sort_order - b.route_sort_order
          : a.sort_order - b.sort_order
      )
      ?.map((item, i) => ({
        ...item,
        mobile: item?.mobile?.map((a, i) =>
          i === 0 ? a.mobile : ", " + a.mobile
        ),
      }));

    sheetData = sheetData.map((a) => {
      // console.log(a)
      return {
        "Route Title": a.route_title,
        "Counter Title": a.counter_title,
        "Mobile 1": a.mobile[0] || "",
        "Mobile 2": a.mobile[1]?.replace(",", "") || "",
        "Mobile 3": a.mobile[2]?.replace(",", "") || "",
        "Food License": a.food_license,
        GST: a.gst || "",
      };
    });
    // console.log(sheetData)
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(data, "counters" + fileExtension);
    setSelectedRoutes([]);
  };
  const onChangeHandler = (e) => {
    let temp = selectedRoutes || [];
    let options = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    for (let i of options) {
      if (selectedRoutes.filter((a) => a === i).length)
        temp = temp.filter((a) => a !== i);
      else temp = [...temp, i];
    }
    // temp = data.filter(a => options.filter(b => b === a.user_uuid).length)
    console.log(options, temp);

    setSelectedRoutes(temp);
  };
  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading">
          <h2>Counter </h2>
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
              type="text"
              onChange={(e) => setFilterCounterTitle(e.target.value)}
              value={filterCounterTitle}
              placeholder="Search Counter Title..."
              className="searchInput"
            />
            <input
              type="text"
              onChange={(e) => setFilterRoute(e.target.value)}
              value={filterRoute}
              placeholder="Search Route Title..."
              className="searchInput"
            />
            <button
              className="item-sales-search"
              onClick={() => seXlSelection(true)}
            >
              Xls
            </button>
            <div>Total Items: {filterCounter.length}</div>
            <button
              className="item-sales-search"
              onClick={() => setSequencePopup(true)}
            >
              Sequence
            </button>
            <button
              className="item-sales-search"
              onClick={() => setPopupForm(true)}
            >
              Add
            </button>
          </div>
        </div>
        <div className="table-container-user item-sales-container">
          <Table
            itemsDetails={filterCounter}
            routesData={routesData}
            setPopupForm={setPopupForm}
            setItemPopup={setItemPopup}
            setDeletePopup={setDeletePopup}
          />
        </div>
      </div>
      {popupForm ? (
        <NewUserForm
          onSave={() => setPopupForm(false)}
          routesData={routesData}
          setCounters={setCounter}
          popupInfo={popupForm}
          paymentModes={paymentModes}
          counters={counter}
          getCounter={getCounter}
          setNotification={setNotification}
        />
      ) : (
        ""
      )}
      {itemPopup ? (
        <ItemPopup onSave={() => setItemPopup(false)} itemPopup={itemPopup} />
      ) : (
        ""
      )}
      {sequencePopup ? (
        <CounterSequence
          onSave={() => setSequencePopup(false)}
          counters={counter}
          routesData={routesData}
        />
      ) : (
        ""
      )}
      {deletePopup ? (
        <DeleteCounterPopup
          onSave={() => setDeletePopup(false)}
          setItemsData={setCounter}
          popupInfo={deletePopup}
        />
      ) : (
        ""
      )}
      {xlSelection ? (
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
                <form className="form" onSubmit={downloadHandler}>
                  <div className="row">
                    <h1>Select Routes</h1>
                  </div>

                  <div className="form">
                    <div className="row">
                      <label className="selectLabel" style={{ width: "50%" }}>
                        <select
                          className="numberInput"
                          style={{ width: "200px", height: "100px" }}
                          value={selectedRoutes}
                          onChange={onChangeHandler}
                          multiple
                        >
                          {/* <option selected={occasionsTemp.length===occasionsData.length} value="all">All</option> */}
                          {routesData?.map((occ) => (
                            <option
                              value={occ.route_uuid}
                              style={{
                                marginBottom: "5px",
                                textAlign: "center",
                              }}
                            >
                              {occ.route_title}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="submit">
                    Done
                  </button>
                </form>
              </div>
              <button
                onClick={() => {
                  seXlSelection(false);
                  setSelectedRoutes([]);
                }}
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
    </>
  );
};

export default Counter;
function Table({ itemsDetails, setPopupForm, setItemPopup, setDeletePopup }) {
  const [items, setItems] = useState("sort_order");
  const [order, setOrder] = useState("");
  const [copied, setCopied] = useState("");
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
              <span>Router Title</span>
              <div className="sort-buttons-container">
                <button
                  onClick={() => {
                    setItems("route_title");
                    setOrder("asc");
                  }}
                >
                  <ChevronUpIcon className="sort-up sort-button" />
                </button>
                <button
                  onClick={() => {
                    setItems("route_title");
                    setOrder("desc");
                  }}
                >
                  <ChevronDownIcon className="sort-down sort-button" />
                </button>
              </div>
            </div>
          </th>
          <th colSpan={2}>
            <div className="t-head-element">
              <span>Counter Title</span>
              <div className="sort-buttons-container">
                <button
                  onClick={() => {
                    setItems("counter_title");
                    setOrder("asc");
                  }}
                >
                  <ChevronUpIcon className="sort-up sort-button" />
                </button>
                <button
                  onClick={() => {
                    setItems("counter_title");
                    setOrder("desc");
                  }}
                >
                  <ChevronDownIcon className="sort-down sort-button" />
                </button>
              </div>
            </div>
          </th>
          <th colSpan={2}>
            <div className="t-head-element">
              <span>Mobile</span>
              <div className="sort-buttons-container">
                <button
                  onClick={() => {
                    setItems("mobile");
                    setOrder("asc");
                  }}
                >
                  <ChevronUpIcon className="sort-up sort-button" />
                </button>
                <button
                  onClick={() => {
                    setItems("mobile");
                    setOrder("desc");
                  }}
                >
                  <ChevronDownIcon className="sort-down sort-button" />
                </button>
              </div>
            </div>
          </th>
          <th colSpan={2}>
            <div className="t-head-element">
              <span>Food License</span>
              <div className="sort-buttons-container">
                {/* <button
                  onClick={() => {
                    setItems("gst");
                    setOrder("asc");
                  }}
                >
                  <ChevronUpIcon className="sort-up sort-button" />
                </button> */}
                {/* <button
                  onClick={() => {
                    setItems("gst");
                    setOrder("desc");
                  }}
                >
                  <ChevronDownIcon className="sort-down sort-button" />
                </button> */}
              </div>
            </div>
          </th>
          <th colSpan={2}>
            <div className="t-head-element">
              <span>GST</span>
              <div className="sort-buttons-container">
                {/* <button
                  onClick={() => {
                    setItems("gst");
                    setOrder("asc");
                  }}
                >
                  <ChevronUpIcon className="sort-up sort-button" />
                </button> */}
                {/* <button
                  onClick={() => {
                    setItems("gst");
                    setOrder("desc");
                  }}
                >
                  <ChevronDownIcon className="sort-down sort-button" />
                </button> */}
              </div>
            </div>
          </th>
          <th colSpan={5}>Actions</th>
        </tr>
      </thead>
      <tbody className="tbody">
        {itemsDetails
          .sort((a, b) =>
            order === "asc"
              ? typeof a[items] === "string"
                ? a[items].localeCompare(b[items])
                : a[items] - b[items]
              : typeof a[items] === "string"
              ? b[items].localeCompare(a[items])
              : b[items] - a[items]
          )
          ?.map((item, i) => (
            <tr
              key={Math.random()}
              style={{ height: "30px" }}
              onClick={(e) => {
                e.stopPropagation();
                setPopupForm({ type: "edit", data: item });
              }}
            >
              <td>{i + 1}</td>
              <td colSpan={2}>{item.route_title}</td>
              <td colSpan={2}>{item.counter_title}</td>
              <td colSpan={2}>
                {item?.mobile
                  ?.filter((a) => a.mobile)
                  .map((a, i) =>
                    i === 0 ? a?.mobile || "" : ", " + a?.mobile
                  )}
              </td>
              <td colSpan={2}>{item.food_license || ""}</td>
              <td colSpan={2}>{item.gst || ""}</td>
              <td
                colSpan={1}
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(
                    "https://btgondia.com/counter/" + item.short_link
                  );
                  setCopied(item.counter_uuid);
                  setTimeout(() => setCopied(""), 3000);
                }}
              >
                {copied === item?.counter_uuid ? (
                  <div
                    style={{
                      // position: "absolute",
                      top: "-15px",
                      right: "10px",
                      fontSize: "10px",
                      backgroundColor: "#000",
                      color: "#fff",
                      padding: "3px",
                      borderRadius: "10px",
                      textAlign: "center",
                    }}
                  >
                    Copied!
                  </div>
                ) : (
                  <CopyAllOutlined />
                )}
              </td>
              <td>
                <button
                  type="button"
                  style={{ fontSize: "10px" }}
                  className="fieldEditButton"
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemPopup({ item, type: "company_discount" });
                  }}
                >
                  Company Discount
                </button>
              </td>
              <td>
                <button
                  type="button"
                  style={{ fontSize: "10px" }}
                  className="fieldEditButton"
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemPopup({ item, type: "item_special_price" });
                  }}
                >
                  Item Special Prices
                </button>
              </td>
              <td>
                <button
                  type="button"
                  style={{ fontSize: "10px" }}
                  className="fieldEditButton"
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemPopup({ item, type: "item_special_discount" });
                  }}
                >
                  Item Special Discounts
                </button>
              </td>
              <td
                colSpan={1}
                onClick={(e) => {
                  e.stopPropagation();

                  setDeletePopup(item);
                }}
              >
                <DeleteOutline />
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
function NewUserForm({
  onSave,
  popupInfo,
  routesData,
  paymentModes,
  counters,
  getCounter,
  setNotification,
}) {
  const [data, setdata] = useState({});
  const [otppoup, setOtpPopup] = useState(false);
  const [otp, setOtp] = useState("");
  const [counterGroup, setCounterGroup] = useState([]);
  const [orderFrom, setOrderFrom] = useState([]);
  const [errMassage, setErrorMassage] = useState("");
  const getItemsData = async (controller = new AbortController()) => {
    const response = await axios({
      method: "get",
      url: "/orderForm/GetFormList",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setOrderFrom(response.data.result);
  };
  useEffect(() => {
    const controller = new AbortController();
    getItemsData(controller);
    return () => {
      controller.abort();
    };
  }, []);
  const getCounterGroup = async () => {
    const response = await axios({
      method: "get",
      url: "/counterGroup/GetCounterGroupList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success)
      setCounterGroup(
        response.data.result.filter(
          (a) => a.counter_group_uuid && a.counter_group_title
        )
      );
  };

  useEffect(() => {
    getCounterGroup();
  }, []);
  useEffect(() => {
    if (popupInfo?.type === "edit") {
      setdata({
        ...popupInfo.data,
        mobile: [
          ...(popupInfo?.data?.mobile
            ?.map((a) => ({
              ...a,
              uuid: a?.uuid || uuid(),
            }))
            .filter((a) => a.mobile) || []),
          ...[1, 2, 3, 4].map((a) => ({ uuid: uuid(), mobile: "", type: "" })),
        ].slice(0, 4),
      });
    } else {
      setdata({
        payment_modes: paymentModes
          .filter(
            (a) =>
              a.mode_uuid === "c67b54ba-d2b6-11ec-9d64-0242ac120002" ||
              a.mode_uuid === "c67b5988-d2b6-11ec-9d64-0242ac120002"
          )
          .map((a) => a.mode_uuid),
        credit_allowed: "N",
        status: 1,
        mobile: [1, 2, 3, 4].map((a) => ({
          uuid: uuid(),
          mobile: "",
          type: "",
        })),
      });
    }
  }, [paymentModes, popupInfo.data, popupInfo?.type]);
  console.log(data);
  const submitHandler = async (e) => {
    e?.preventDefault();
    if (!data.counter_title) {
      setErrorMassage("Please insert  Title");
      return;
    }
    for (let item of data.mobile) {
      if (
        data?.mobile?.filter((a) => a.mobile && a.mobile === item.mobile)
          .length > 1
      ) {
        setNotification({ success: false, message: "Dublicat Number Present" });
        setTimeout(() => setNotification(null), 5000);
        return;
      }
    }
    // if (data?.mobile?.length !== 10) {
    //   setErrorMassage("Please enter 10 Numbers in Mobile");
    //   return;
    // }
    if (!data.route_uuid) {
      setdata({ ...data, route_uuid: "0" });
    }
    if (popupInfo?.type === "edit") {
      const response = await axios({
        method: "put",
        url: "/counters/putCounter",
        data: [
          {
            ...data,
            payment_modes: data.payment_modes.filter((a) => a !== "unpaid"),
          },
        ],
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        getCounter();
        if (e.type === "submit") {
          onSave();
        }
      }
    } else {
      if (counters.find((a) => a.counter_code === data.counter_code)) {
        setErrorMassage("Please insert Different Counter Code");
        return;
      }
      const response = await axios({
        method: "post",
        url: "/counters/postCounter",
        data,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        getCounter();
        if (e.type === "submit") {
          onSave();
        }
      }
    }
  };
  const onChangeHandler = (e) => {
    let temp = data.payment_modes || [];
    let options = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    for (let i of options) {
      if (data.payment_modes.filter((a) => a === i).length)
        temp = temp.filter((a) => a !== i);
      else temp = [...temp, i];
    }
    // temp = data.filter(a => options.filter(b => b === a.user_uuid).length)
    console.log(options, temp);

    setdata((prev) => ({ ...prev, payment_modes: temp }));
  };
  const onChangeGroupHandler = (e) => {
    let temp = data.counter_group_uuid || [];
    let options = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    for (let i of options) {
      if (data.counter_group_uuid.filter((a) => a === i).length)
        temp = temp.filter((a) => a !== i);
      else temp = [...temp, i];
    }
    // temp = data.filter(a => options.filter(b => b === a.user_uuid).length)
    console.log(options, temp);

    setdata((prev) => ({ ...prev, counter_group_uuid: temp }));
  };
  const sendOtp = async (mobile) => {
    if (!mobile.mobile) {
      return;
    }
    if (
      data?.mobile?.filter((a) => a.mobile && a.mobile === mobile.mobile)
        .length > 1
    ) {
      setNotification({ success: false, message: "Dublicat Number Present" });
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    submitHandler();
    setOtpPopup(mobile);
    const response = await axios({
      method: "post",
      url: "/counters/sendWhatsappOtp",
      data: {
        ...data,
        ...mobile,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
    }
  };
  const sendCallOtp = async (mobile) => {
    if (!mobile.mobile) {
      return;
    }
    if (
      data?.mobile?.filter((a) => a.mobile && a.mobile === mobile.mobile)
        .length > 1
    ) {
      setNotification({ success: false, message: "Dublicat Number Present" });
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    submitHandler();
    setOtpPopup(mobile);
    const response = await axios({
      method: "post",
      url: "/counters/sendCallOtp",
      data: {
        ...data,
        ...mobile,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
    }
  };
  const VerifyOtp = async (e) => {
    e?.preventDefault();
    const response = await axios({
      method: "post",
      url: "/counters/verifyOtp",
      data: {
        ...data,
        ...otppoup,
        otp,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      getCounter();
      setOtpPopup("");
      setOtp("");
    }
    setNotification(response.data);
    setTimeout(() => setNotification(null), 5000);
  };
  return (
    <>
      <div className="overlay" style={{ zIndex: "9999999" }}>
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
            <div style={{ overflowY: "scroll", height: "fit-content" }}>
              <form className="form" onSubmit={submitHandler}>
                <div className="row">
                  <h1>{popupInfo.type === "edit" ? "Edit" : "Add"} Counter </h1>
                </div>

                <div className="form">
                  <div className="row">
                    <label className="selectLabel">
                      Counter Title
                      <input
                        type="text"
                        name="route_title"
                        className="numberInput"
                        value={data?.counter_title}
                        onChange={(e) =>
                          setdata({
                            ...data,
                            counter_title: e.target.value,
                          })
                        }
                        maxLength={42}
                      />
                    </label>

                    <label className="selectLabel">
                      Sort Order
                      <input
                        type="number"
                        onWheel={(e) => e?.preventDefault()}
                        name="sort_order"
                        className="numberInput"
                        value={data?.sort_order}
                        onChange={(e) =>
                          setdata({
                            ...data,
                            sort_order: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="row">
                    <label className="selectLabel">
                      Adress
                      <input
                        type="text"
                        name="route_title"
                        className="numberInput"
                        value={data?.address}
                        onChange={(e) =>
                          setdata({
                            ...data,
                            address: e.target.value,
                          })
                        }
                        maxLength={42}
                      />
                    </label>

                    <label className="selectLabel">
                      Route
                      <select
                        name="user_type"
                        className="select"
                        value={data?.route_uuid}
                        onChange={(e) =>
                          setdata({
                            ...data,
                            route_uuid: e.target.value,
                          })
                        }
                      >
                        <option value="">None</option>
                        {routesData
                          ?.sort((a, b) => a.sort_order - b.sort_order)
                          ?.map((a) => (
                            <option value={a.route_uuid}>
                              {a.route_title}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                  <div className="row">
                    <label className="selectLabel" style={{ width: "50%" }}>
                      Mobile
                      <div>
                        {data?.mobile?.map((a) => (
                          <div
                            key={a.uuid}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              margin: "5px 0",
                            }}
                          >
                            <input
                              type="number"
                              name="route_title"
                              className="numberInput"
                              value={a?.mobile}
                              style={{ width: "15ch" }}
                              disabled={a.lable?.find(
                                (c) =>
                                  (c.type === "cal" || c.type === "wa") &&
                                  +c.varification
                              )}
                              onChange={(e) => {
                                if (
                                  e.target.value.length > 10 ||
                                  a.lable?.find(
                                    (c) =>
                                      (c.type === "cal" || c.type === "wa") &&
                                      +c.varification
                                  )
                                ) {
                                  return;
                                }
                                setdata((prev) => ({
                                  ...prev,
                                  mobile: prev.mobile.map((b) =>
                                    b.uuid === a.uuid
                                      ? { ...b, mobile: e.target.value }
                                      : b
                                  ),
                                }));
                              }}
                              maxLength={10}
                            />
                            <span
                              style={{
                                color: a.lable?.find(
                                  (c) => c.type === "wa" && !+c.varification
                                )
                                  ? "red"
                                  : a.lable?.find(
                                      (c) => c.type === "wa" && +c.varification
                                    )
                                  ? "green"
                                  : "gray",
                                cursor: "pointer",
                              }}
                              onClick={(e) => {
                                if (a.mobile) sendOtp({ ...a, lable: "wa" });
                                //   setdata((prev) => ({
                                //     ...prev,
                                //     mobile: prev.mobile.map((b) =>
                                //       b.uuid === a.uuid
                                //         ? {
                                //             ...b,
                                //             lable: b.lable?.find(
                                //               (c) => c.type === "wa"
                                //             )
                                //               ? b.lable.filter(
                                //                   (c) => c.type !== "wa"
                                //                 )
                                //               : [
                                //                   ...(b?.lable || []),
                                //                   { type: "wa", varification: 0 },
                                //                 ],
                                //           }
                                //         : b
                                //     ),
                                //   }));
                              }}
                            >
                              <WhatsApp />
                            </span>
                            <span
                              style={{
                                color: a.lable?.find(
                                  (c) => c.type === "cal" && !+c.varification
                                )
                                  ? "red"
                                  : a.lable?.find(
                                      (c) => c.type === "cal" && +c.varification
                                    )
                                  ? "green"
                                  : "gray",
                                cursor: "pointer",
                              }}
                              onClick={(e) => {
                                if (a.mobile)
                                  sendCallOtp({ ...a, lable: "cal" });
                                //   setdata((prev) => ({
                                //     ...prev,
                                //     mobile: prev.mobile.map((b) =>
                                //       b.uuid === a.uuid
                                //         ? {
                                //             ...b,
                                //             lable: b.lable?.find(
                                //               (c) => c.type === "cal"
                                //             )
                                //               ? b.lable.filter(
                                //                   (c) => c.type !== "cal"
                                //                 )
                                //               : [
                                //                   ...(b?.lable || []),
                                //                   { type: "cal", varification: 0 },
                                //                 ],
                                //           }
                                //         : b
                                //     ),
                                //   }));
                              }}
                            >
                              <Phone />
                            </span>
                          </div>
                        ))}
                      </div>
                    </label>
                    <label className="selectLabel" style={{ width: "50%" }}>
                      Payment Modes
                      <select
                        className="numberInput"
                        style={{ width: "200px", height: "100px" }}
                        value={
                          data.credit_allowed === "Y"
                            ? data.payment_modes.length
                              ? [...data?.payment_modes, "unpaid"]
                              : "unpaid"
                            : data?.payment_modes
                        }
                        onChange={onChangeHandler}
                        multiple
                      >
                        {/* <option selected={occasionsTemp.length===occasionsData.length} value="all">All</option> */}
                        {paymentModes?.map((occ) => (
                          <option
                            value={occ.mode_uuid}
                            style={{ marginBottom: "5px", textAlign: "center" }}
                          >
                            {occ.mode_title}
                          </option>
                        ))}
                        <option
                          onClick={() =>
                            setdata((prev) => ({
                              ...prev,
                              credit_allowed:
                                prev.credit_allowed === "Y" ? "N" : "Y",
                            }))
                          }
                          style={{ marginBottom: "5px", textAlign: "center" }}
                          value="unpaid"
                        >
                          Unpaid
                        </option>
                      </select>
                    </label>
                  </div>

                  <div className="row">
                    <label className="selectLabel">
                      Status
                      <select
                        className="numberInput"
                        value={data.status}
                        onChange={(e) =>
                          setdata((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                      >
                        {/* <option selected={occasionsTemp.length===occasionsData.length} value="all">All</option> */}

                        <option value={1}>Active</option>
                        <option value={0}>Hide</option>
                        <option value={2}>Locked</option>
                      </select>
                    </label>
                    {+data.status === 2 ? (
                      <label className="selectLabel">
                        Remarks
                        <input
                          type="text"
                          name="route_title"
                          className="numberInput"
                          value={data?.remarks}
                          onChange={(e) =>
                            setdata({
                              ...data,
                              remarks: e.target.value,
                            })
                          }
                          maxLength={42}
                        />
                      </label>
                    ) : (
                      ""
                    )}
                  </div>
                  <div className="row">
                    <label className="selectLabel">
                      GST
                      <input
                        type="text"
                        name="GST"
                        className="numberInput"
                        value={data?.gst}
                        onChange={(e) =>
                          setdata({
                            ...data,
                            gst: e.target.value,
                          })
                        }
                        maxLength={42}
                      />
                    </label>
                    <label className="selectLabel">
                      Food License
                      <input
                        type="text"
                        name="food_license"
                        className="numberInput"
                        value={data?.food_license}
                        onChange={(e) =>
                          setdata({
                            ...data,
                            food_license: e.target.value,
                          })
                        }
                        maxLength={42}
                      />
                    </label>
                  </div>
                  <div className="row">
                    <label className="selectLabel">
                      Counter Code
                      <input
                        type="text"
                        name="one_pack"
                        className="numberInput"
                        value={data?.counter_code}
                        onChange={(e) =>
                          setdata({
                            ...data,
                            counter_code: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="selectLabel">
                      Payment Reminder Days
                      <input
                        type="number"
                        name="payment_reminder_days"
                        className="numberInput"
                        value={data?.payment_reminder_days}
                        onChange={(e) =>
                          setdata({
                            ...data,
                            payment_reminder_days: e.target.value,
                          })
                        }
                        maxLength={42}
                      />
                    </label>
                  </div>
                  <div className="row">
                    <label className="selectLabel">
                      Outstanding Type
                      <select
                        className="numberInput"
                        value={data.outstanding_type}
                        onChange={(e) =>
                          setdata((prev) => ({
                            ...prev,
                            outstanding_type: e.target.value,
                          }))
                        }
                      >
                        {/* <option selected={occasionsTemp.length===occasionsData.length} value="all">All</option> */}

                        <option value={0}>None</option>
                        <option value={1}>Visit</option>
                        <option value={2}>Call</option>
                        <option value={3}>Self</option>
                        <option value={4}>Other</option>
                      </select>
                    </label>
                    <label className="selectLabel" style={{ width: "50%" }}>
                      Counter Group
                      <select
                        className="numberInput"
                        style={{ width: "200px", height: "100px" }}
                        value={data?.counter_group_uuid}
                        onChange={onChangeGroupHandler}
                        multiple
                      >
                        {/* <option selected={occasionsTemp.length===occasionsData.length} value="all">All</option> */}
                        {counterGroup?.map((occ) => (
                          <option
                            value={occ.counter_group_uuid}
                            style={{ marginBottom: "5px", textAlign: "center" }}
                          >
                            {occ.counter_group_title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
                <div className="row">
                  <label className="selectLabel">
                    Order Form
                    <select
                      name="user_type"
                      className="select"
                      value={data?.form_uuid}
                      onChange={(e) =>
                        setdata({
                          ...data,
                          form_uuid: e.target.value,
                        })
                      }
                    >
                      <option value="">None</option>
                      {orderFrom?.map((a) => (
                        <option value={a.form_uuid}>{a.form_title}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <i style={{ color: "red" }}>
                  {errMassage === "" ? "" : "Error: " + errMassage}
                </i>

                <button type="submit" className="submit">
                  Save changes
                </button>
              </form>
            </div>

            <button onClick={onSave} className="closeButton">
              x
            </button>
          </div>
        </div>
      </div>
      {otppoup ? (
        <div className="overlay" style={{ zindex: "99999999999999999" }}>
          <div
            className="modal"
            style={{ height: "fit-content", width: "max-content" }}
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
                <form className="form" onSubmit={VerifyOtp}>
                  <div className="formGroup">
                    <div
                      className="row"
                      style={{ flexDirection: "row", alignItems: "flex-start" }}
                    >
                      <label className="selectLabel flex">
                        OTP
                        <input
                          type="number"
                          name="route_title"
                          className="numberInput"
                          value={otp}
                          style={{ width: "15ch" }}
                          onChange={(e) => {
                            setOtp(e.target.value);
                          }}
                          maxLength={10}
                        />
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="submit">
                    Confirm
                  </button>
                </form>
              </div>
              <button
                onClick={() => setOtpPopup(false)}
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
    </>
  );
}
const ItemPopup = ({ onSave, itemPopupId, items, objData, itemPopup }) => {
  const [companies, setCompanies] = useState([]);
  const [itemsData, setItemsData] = useState([]);
  const [itemCategories, setItemCategories] = useState([]);
  const [value, setValue] = useState([]);
  const [filterTitle, setFilterTitle] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  useEffect(() => {
    setValue(
      itemPopup.item[itemPopup.type] ? itemPopup.item[itemPopup.type] : []
    );
  }, []);
  console.log(value);
  const getItemCategories = async () => {
    const response = await axios({
      method: "get",
      url: "/itemCategories/GetItemCategoryList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setItemCategories(response.data.result);
  };
  const getItemsData = async () => {
    const response = await axios({
      method: "get",
      url: "/items/GetItemList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success)
      setItemsData(
        response.data.result.map((b) => ({
          ...b,
          company_title:
            companies.find((a) => a.company_uuid === b.company_uuid)
              ?.company_title || "-",
          category_title:
            itemCategories.find((a) => a.category_uuid === b.category_uuid)
              ?.category_title || "-",
        }))
      );
  };
  useEffect(() => {
    getItemsData();
  }, [itemCategories, companies]);

  const getCompanies = async () => {
    const response = await axios({
      method: "get",
      url: "/companies/getCompanies",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setCompanies(response.data.result);
  };
  useEffect(() => {
    getCompanies();
    getItemCategories();
  }, []);
  const submitHandler = async () => {
    const response = await axios({
      method: "put",
      url: "/counters/putCounter",
      data: [
        {
          counter_uuid: itemPopup.item.counter_uuid,
          [itemPopup.type]: value,
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                overflowY: "scroll",
                height: "45vh",
              }}
            >
              {itemPopup?.type !== "company_discount" ? (
                <input
                  type="text"
                  onChange={(e) => setFilterTitle(e.target.value)}
                  value={filterTitle}
                  placeholder="Search Item Title..."
                  className="searchInput"
                />
              ) : (
                ""
              )}
              <input
                type="text"
                onChange={(e) => setFilterCompany(e.target.value)}
                value={filterCompany}
                placeholder="Search Company Title..."
                className="searchInput"
              />

              {itemPopup?.type !== "company_discount" ? (
                <input
                  type="text"
                  onChange={(e) => setFilterCategory(e.target.value)}
                  value={filterCategory}
                  placeholder="Search Category Title..."
                  className="searchInput"
                />
              ) : (
                ""
              )}

              <table className="table">
                <thead>
                  <tr>
                    {itemPopup?.type !== "company_discount" ? (
                      <th className="description" style={{ width: "20%" }}>
                        Item
                      </th>
                    ) : (
                      ""
                    )}
                    <th className="description" style={{ width: "20%" }}>
                      Company
                    </th>
                    {itemPopup?.type !== "company_discount" ? (
                      <th className="description" style={{ width: "20%" }}>
                        Category
                      </th>
                    ) : (
                      ""
                    )}

                    <th style={{ textAlign: "center" }} colSpan={3}>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {itemPopup?.type !== "company_discount"
                    ? itemsData
                        ?.filter((a) => a.item_uuid)
                        .filter(
                          (a) =>
                            !filterTitle ||
                            a.item_title
                              .toLocaleLowerCase()
                              .includes(filterTitle.toLocaleLowerCase())
                        )
                        .filter(
                          (a) =>
                            !filterCompany ||
                            a?.company_title
                              .toLocaleLowerCase()
                              .includes(filterCompany.toLocaleLowerCase())
                        )
                        .filter(
                          (a) =>
                            !filterCategory ||
                            a?.category_title
                              .toLocaleLowerCase()
                              .includes(filterCategory.toLocaleLowerCase())
                        )
                        .map((item, index) => {
                          return (
                            <tr key={item.item_uuid}>
                              <td>{item.item_title}</td>
                              <td>{item.company_title}</td>
                              <td>{item.category_title}</td>
                              <td>
                                <button
                                  type="button"
                                  className="noBgActionButton"
                                  style={{
                                    backgroundColor: value.filter(
                                      (a) => a.item_uuid === item.item_uuid
                                    )?.length
                                      ? "red"
                                      : "var(--mainColor)",
                                    width: "150px",
                                    fontSize: "large",
                                  }}
                                  onClick={(event) =>
                                    setValue((prev) =>
                                      value.filter(
                                        (a) => a.item_uuid === item.item_uuid
                                      )?.length
                                        ? value.filter(
                                            (a) =>
                                              a.item_uuid !== item.item_uuid
                                          )
                                        : prev.length
                                        ? [
                                            ...prev,
                                            { item_uuid: item.item_uuid },
                                          ]
                                        : [{ item_uuid: item.item_uuid }]
                                    )
                                  }
                                >
                                  {value.filter(
                                    (a) => a.item_uuid === item.item_uuid
                                  )?.length
                                    ? "Remove"
                                    : "Add"}
                                </button>
                              </td>
                              {value.filter(
                                (a) => a.item_uuid === item.item_uuid
                              )?.length ? (
                                <td>
                                  <input
                                    type="number"
                                    onWheel={(e) => e.target.blur()}
                                    style={{ width: "100px" }}
                                    onChange={(e) =>
                                      setValue((prev) =>
                                        prev.map((a) =>
                                          a.item_uuid === item.item_uuid
                                            ? {
                                                ...a,
                                                [itemPopup?.type ===
                                                "item_special_price"
                                                  ? "price"
                                                  : "discount"]: e.target.value,
                                              }
                                            : a
                                        )
                                      )
                                    }
                                    value={
                                      value.find(
                                        (a) => a.item_uuid === item.item_uuid
                                      )[
                                        itemPopup?.type === "item_special_price"
                                          ? "price"
                                          : "discount"
                                      ]
                                    }
                                    placeholder={
                                      itemPopup?.type === "item_special_price"
                                        ? "price..."
                                        : "discount..."
                                    }
                                    className="searchInput"
                                  />
                                </td>
                              ) : (
                                <td />
                              )}
                            </tr>
                          );
                        })
                    : companies
                        .filter(
                          (a) =>
                            !filterCompany ||
                            a?.company_title
                              .toLocaleLowerCase()
                              .includes(filterCompany.toLocaleLowerCase())
                        )
                        .map((item, index) => {
                          return (
                            <tr key={item.item_uuid}>
                              <td>{item.company_title}</td>

                              <td>
                                <button
                                  type="button"
                                  className="noBgActionButton"
                                  style={{
                                    backgroundColor: value.filter(
                                      (a) =>
                                        a.company_uuid === item.company_uuid
                                    )?.length
                                      ? "red"
                                      : "var(--mainColor)",
                                    width: "150px",
                                    fontSize: "large",
                                  }}
                                  onClick={(event) =>
                                    setValue((prev) =>
                                      value.filter(
                                        (a) =>
                                          a.company_uuid === item.company_uuid
                                      )?.length
                                        ? value.filter(
                                            (a) =>
                                              a.company_uuid !==
                                              item.company_uuid
                                          )
                                        : prev.length
                                        ? [
                                            ...prev,
                                            { company_uuid: item.company_uuid },
                                          ]
                                        : [{ company_uuid: item.company_uuid }]
                                    )
                                  }
                                >
                                  {value.filter(
                                    (a) => a.company_uuid === item.company_uuid
                                  )?.length
                                    ? "Remove"
                                    : "Add"}
                                </button>
                              </td>
                              {value.filter(
                                (a) => a.company_uuid === item.company_uuid
                              )?.length ? (
                                <td>
                                  <input
                                    type="number"
                                    onWheel={(e) => e.target.blur()}
                                    style={{ width: "100px" }}
                                    onChange={(e) =>
                                      setValue((prev) =>
                                        prev.map((a) =>
                                          a.company_uuid === item.company_uuid
                                            ? { ...a, discount: e.target.value }
                                            : a
                                        )
                                      )
                                    }
                                    value={
                                      value.find(
                                        (a) =>
                                          a.company_uuid === item.company_uuid
                                      )?.discount
                                    }
                                    placeholder="Discount..."
                                    className="searchInput"
                                  />
                                </td>
                              ) : (
                                <td />
                              )}
                            </tr>
                          );
                        })}
                </tbody>
              </table>
            </div>
          </div>
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button className="fieldEditButton" onClick={submitHandler}>
              Save
            </button>
          </div>

          <button onClick={onSave} className="closeButton">
            x
          </button>
        </div>
      </div>
    </div>
  );
};
function DeleteCounterPopup({ onSave, popupInfo, setItemsData }) {
  const [errMassage, setErrorMassage] = useState("");
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const response = await axios({
        method: "delete",
        url: "/counters/deleteCounter",
        data: { counter_uuid: popupInfo.counter_uuid },
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        setItemsData((prev) =>
          prev.filter((i) => i.counter_uuid !== popupInfo.counter_uuid)
        );
        onSave();
      }
    } catch (err) {
      console.log(err);
      setErrorMassage("Order already exist");
    }
    setLoading(false);
  };

  return (
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
            <form className="form" onSubmit={submitHandler}>
              <div className="row">
                <h1>Delete Counter</h1>
              </div>
              <div className="row">
                <h1>{popupInfo.counter_title}</h1>
              </div>

              <i style={{ color: "red" }}>
                {errMassage === "" ? "" : "Error: " + errMassage}
              </i>
              <div className="flex" style={{ justifyContent: "space-between" }}>
                {loading ? (
                  <button
                    className="submit"
                    id="loading-screen"
                    style={{ background: "red", width: "120px" }}
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
                ) : (
                  <button
                    type="submit"
                    className="submit"
                    style={{ background: "red" }}
                  >
                    Confirm
                  </button>
                )}
                <button type="button" className="submit" onClick={onSave}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
