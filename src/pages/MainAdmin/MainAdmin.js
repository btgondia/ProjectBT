import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import "./style.css";
import CloseIcon from "@mui/icons-material/Close";
import { AiOutlineSearch } from "react-icons/ai";
import Card from "../../components/Card";
import { AiOutlineReload } from "react-icons/ai";
import VerticalTabs from "../../components/VerticalTabs";
import ItemAvilibility from "../QuikAccess/ItemAvilibility";
import { OrderDetails } from "../../components/OrderDetails";
import { ArrowDropDown } from "@mui/icons-material";
import { useReactToPrint } from "react-to-print";
import Select from "react-select";
import { Billing } from "../../Apis/functions";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import OrderPrint from "../../components/OrderPrint";
import ChangeStage from "../../components/ChangeStage";
import MessagePopup from "../../components/MessagePopup";
import TaskPopupMenu from "../../components/TaskPopupMenu";
const MainAdmin = () => {
  const [isItemAvilableOpen, setIsItemAvilableOpen] = useState(false);
  const [popupForm, setPopupForm] = useState(false);
  const [orders, setOrders] = useState([]);
  const [details, setDetails] = useState([]);
  const [routesData, setRoutesData] = useState([]);
  const [tripData, setTripData] = useState([]);
  const [counter, setCounter] = useState([]);
  const [btn, setBtn] = useState(false);
  const [selectedWarehouseOrders, setSelectedWarehouseOrders] = useState([]);
  const [selectedWarehouseOrder, setSelectedWarehouseOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [selectedRouteOrder, setSelectedRouteOrder] = useState({});
  const [selectedTrip, setSelectedTrip] = useState("");
  const [searchItems, setSearhItems] = useState("");
  const [popupOrder, setPopupOrder] = useState(null);
  const [users, setUsers] = useState([]);
  const [dropdown, setDropDown] = useState(false);
  const [joinSummary, setJoinSummary] = useState(false);
  const [selectOrder, setSelectOrder] = useState(false);
  const [summaryPopup, setSumaryPopup] = useState(false);
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState([]);
  const [changesStatePopup, setChangeStatePopup] = useState(false);
  const [holdOrders, setHoldOrders] = useState(false);
  const componentRef = useRef(null);
  const [messagePopup, setMessagePopup] = useState("");
  const [company, setCompanies] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedtasks, setSelectedTasks] = useState(false);
  let user_uuid = localStorage.getItem("user_uuid");
  useEffect(() => {
    if (selectedWarehouseOrders.length) {
      setSelectedWarehouseOrder(selectedWarehouseOrders[0]);
    } else {
      setSelectedWarehouseOrder(false);
    }
  }, [selectedWarehouseOrders]);

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
  const reactToPrintContent = useCallback(() => {
    return componentRef.current;
  }, [selectedOrder]);
  const getItemCategories = async () => {
    const response = await axios({
      method: "get",
      url: "/itemCategories/GetItemCategoryList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setCategory(response.data.result);
  };
  const handlePrint = useReactToPrint({
    content: reactToPrintContent,
    documentTitle: "Statement",
    removeAfterPrint: true,
  });
  const getItemsData = async () => {
    const response = await axios({
      method: "get",
      url: "/items/GetItemList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setItems(response.data.result);
  };
  const getUsers = async () => {
    const response = await axios({
      method: "get",
      url: "/users/GetUserList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("users", response);
    if (response.data.success) setUsers(response.data.result);
  };

  const getCounter = async () => {
    const response = await axios({
      method: "get",
      url: "/counters/GetCounterList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success)
      setCounter(
        response.data.result.map((b) => ({
          ...b,
          route_title:
            routesData.find((a) => a.route_uuid === b.route_uuid)
              ?.route_title || "-",
        }))
      );
  };
  const getDetails = async () => {
    const response = await axios({
      method: "get",
      url: "/details/GetDetails",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setDetails(response.data.result);
  };
  useEffect(() => {
    if (tasks.length) setSelectedTasks(tasks[0]);
  }, [tasks]);
  const getRoutesData = async () => {
    const response = await axios({
      method: "get",
      url: "/routes/GetOrderRouteList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setRoutesData(response.data.result);
  };
  const handleWarehouseChacking = async () => {
    let data = [];

    for (let orderData of selectedOrder) {
      let warehouse_uuid = JSON.parse(localStorage.getItem("warehouse"))[0];

      if (
        warehouse_uuid &&
        +warehouse_uuid !== 0 &&
        warehouse_uuid !== orderData.warehouse_uuid
      ) {
        console.log(orderData.warehouse_uuid);
        if (!orderData.warehouse_uuid) {
          updateWarehouse(warehouse_uuid, orderData);
        } else {
          console.log(warehouse_uuid, orderData);
          data.push({ warehouse_uuid, orderData });
        }
      }
    }

    console.log(data);
    if (data?.length) {
      setSelectedWarehouseOrders(data);
    } else {
      getTasksData();
    }
  };
  const updateWarehouse = async (warehouse_uuid, orderData) => {
    const response = await axios({
      method: "put",
      url: "/orders/putOrders",
      data: [{ ...orderData, warehouse_uuid }],
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      return true;
    }
  };
  const getTasksData = async () => {
    const response = await axios({
      method: "post",
      url: "/tasks/getCounterList",
      data: { counter_uuid: selectedOrder.map((a) => a.counter_uuid) },
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(response);
    if (response.data.success) setTasks(response.data.result);
    else handlePrint();
  };

  const getTripData = async () => {
    const response = await axios({
      method: "get",
      url: "/trips/GetTripList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setTripData(response.data.result);
  };
  useEffect(() => {
    getTripData();
  }, [popupForm]);
  useEffect(() => {
    if (holdOrders) getRunningHoldOrders();
    else getRunningOrders();
    if (window.location.pathname.includes("admin")) {
      getRoutesData();
    } else if (window.location.pathname.includes("trip")) {
      getTripData();
    }
    let intervalOrder = setInterval(() => {
      if (holdOrders) getRunningHoldOrders();
      else getRunningOrders();
      if (window.location.pathname.includes("admin")) {
        getRoutesData();
      } else if (window.location.pathname.includes("trip")) {
        getTripData();
      }
    }, 180000);
    return () => {
      clearInterval(intervalOrder);
    };
  }, [holdOrders]);

  useEffect(() => {
    getCounter();

    getDetails();
    getUsers();
    getItemsData();
    getItemCategories();
    getCompanies();
  }, []);

  const getRunningOrders = async () => {
    const response = await axios({
      method: "get",
      url: "/orders/GetOrderAllRunningList/" + user_uuid,
    });

    if (response.data.success) {
      let data = response.data.result;
      setSelectedOrder((prev) =>
        prev.map((a) => data.find((b) => b.order_uuid === a.order_uuid) || a)
      );
      setOrders(response.data.result);
    }
  };
  const getRunningHoldOrders = async () => {
    const response = await axios({
      method: "get",
      url: "/orders/GetOrderHoldRunningList/" + user_uuid,
    });

    if (response.data.success) {
      let data = response.data.result;
      setSelectedOrder((prev) =>
        prev.map((a) => data.find((b) => b.order_uuid === a.order_uuid) || a)
      );
      setOrders(response.data.result);
    }
  };
  // console.log(selectedOrder);
  useEffect(() => {
    if (
      window.location.pathname.includes("admin") ||
      window.location.pathname.includes("trip")
    ) {
      if (holdOrders) getRunningHoldOrders();
      else getRunningOrders();
    }
    if (window.location.pathname.includes("admin")) {
      getRoutesData();
    } else if (window.location.pathname.includes("trip")) {
      getTripData();
    }
  }, [btn, popupForm]);
  const postOrderData = async () => {
    const response = await axios({
      method: "put",
      url: "/orders/putOrders",
      data: selectedOrder
        .filter((a) => a.order_status !== "A")
        .map((a) => ({
          order_uuid: a.order_uuid,
          trip_uuid: +selectedTrip.trip_uuid === 0 ? "" : selectedTrip.trip_uuid,
          warehouse_uuid: +selectedTrip.warehouse_uuid,
        })),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      setSelectedOrder([]);
      setSelectedTrip("");
      setBtn((prev) => !prev);
    }
  };
  return (
    <>
      <Sidebar setIsItemAvilableOpen={setIsItemAvilableOpen} />
      <div
        className="right-side"
        style={holdOrders ? { backgroundColor: "#f2e017" } : {}}
      >
        <Header />
        <AiOutlineReload
          style={{
            position: "fixed",
            fontSize: "20px",
            zIndex: "99999",
            top: "10px",
            right: "250px",
            cursor: "pointer",
          }}
          onClick={() => setBtn((prev) => !prev)}
        />
        <div style={{ display: "flex", height: "100%" }}>
          <VerticalTabs />
          <div className="inputs">
            <div
              id="customer-dropdown-trigger"
              className={"active"}
              style={{
                position: "fixed",
                top: "70px",
                right: "10px",
                transform: dropdown ? "rotate(0deg)" : "rotate(180deg)",
                width: "30px",
                height: "30px",
                backgroundColor: "#fff",
              }}
              onClick={(e) => {
                setDropDown((prev) => !prev);
              }}
            >
              <ArrowDropDown />
            </div>
          </div>
          {dropdown && (
            <div
              id="customer-details-dropdown"
              className={"page1 flex"}
              style={{ top: "100px", flexDirection: "column", zIndex: "200" }}
              onMouseLeave={() => setDropDown(false)}
            >
              {!selectOrder ? (
                <>
                  <button
                    className="simple_Logout_button"
                    onClick={() => {
                      setPopupForm(true);
                      setDropDown(false);
                    }}
                    // style={{ padding: "10px" }}
                  >
                    Add Trip
                  </button>

                  <button
                    // style={{ padding: "10px" }}
                    className="simple_Logout_button"
                    type="button"
                    onClick={() => {
                      setSelectOrder(true);
                      setDropDown(false);
                    }}
                  >
                    Select
                  </button>
                  {holdOrders ? (
                    <button
                      // style={{ padding: "10px" }}
                      className="simple_Logout_button"
                      type="button"
                      onClick={() => {
                        setHoldOrders(false);
                        setOrders([]);
                      }}
                    >
                      Show Running Orders
                    </button>
                  ) : (
                    <button
                      // style={{ padding: "10px" }}
                      className="simple_Logout_button"
                      type="button"
                      onClick={() => {
                        setHoldOrders(true);
                        setOrders([]);
                      }}
                    >
                      Show hold Orders
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    // style={{ padding: "10px" }}
                    className="simple_Logout_button"
                    type="button"
                    onClick={() => {
                      setSelectOrder(false);
                      setSelectedOrder([]);
                      setDropDown(false);
                    }}
                  >
                    Cancel
                  </button>
                  {selectedOrder.length ? (
                    <>
                      <button
                        // style={{ padding: "10px" }}
                        className="simple_Logout_button"
                        type="button"
                        onClick={() => {
                          setPopupForm({ type: "edit" });
                          setDropDown(false);
                        }}
                      >
                        Assign Trip
                      </button>
                      <button
                        // style={{ padding: "10px" }}
                        className="simple_Logout_button"
                        type="button"
                        onClick={() => {
                          handleWarehouseChacking();
                        }}
                      >
                        Print Invoice
                      </button>
                      <button
                        // style={{ padding: "10px" }}
                        className="simple_Logout_button"
                        type="button"
                        onClick={() => {
                          let stage = selectedOrder.map(
                            (a) => a.status[a.status.length - 1]?.stage
                          );
                          if (
                            stage.filter((a, i) =>
                              i === 0 ? false : !(stage[0] === a)
                            ).length
                          ) {
                            setMessagePopup("Select Orders of Same Stage");
                          } else {
                            setChangeStatePopup(+stage[0]);
                          }
                        }}
                      >
                        Change Stage
                      </button>
                    </>
                  ) : (
                    ""
                  )}
                  <button
                    // style={{ padding: "10px" }}
                    className="simple_Logout_button"
                    type="button"
                    onClick={() => {
                      setSumaryPopup(true);
                      setDropDown(false);
                    }}
                  >
                    Item Summary
                  </button>
                </>
              )}
            </div>
          )}
          <div className="content-container" id="content-file-container">
            {window.location.pathname.includes("admin") ? (
              <>
                {routesData.length ? (
                  <>
                    {routesData.map((route) => {
                      if (
                        orders
                          .filter(
                            (a) =>
                              counter.filter(
                                (c) =>
                                  c.counter_uuid === a.counter_uuid &&
                                  (route.route_uuid === c.route_uuid ||
                                    ((!c.route_uuid || +c.route_uuid === 0) &&
                                      +route.route_uuid === 0))
                              ).length
                          )
                          .filter(
                            (a) =>
                              !searchItems ||
                              a.invoice_number
                                ?.toString()
                                ?.includes(searchItems.toLocaleLowerCase()) ||
                              a.counter_title
                                ?.toLocaleLowerCase()
                                ?.includes(searchItems.toLocaleLowerCase())
                          ).length
                      )
                        return (
                          <div key={Math.random()} className="sectionDiv">
                            <h1>
                              <span
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                  setJoinSummary(
                                    orders?.filter(
                                      (b) =>
                                        counter.filter(
                                          (c) =>
                                            c.counter_uuid === b.counter_uuid &&
                                            (route.route_uuid ===
                                              c.route_uuid ||
                                              ((!c.route_uuid ||
                                                +c.route_uuid === 0) &&
                                                +route.route_uuid === 0))
                                        ).length
                                    )
                                  )
                                }
                              >
                                {route.route_title}
                              </span>{" "}
                              ({route.orderLength}) [ processing:{" "}
                              {route?.processingLength}, Checking:{" "}
                              {route.checkingLength}, Delivery:{" "}
                              {route?.deliveryLength}]
                              {selectOrder ? (
                                <input
                                  type="checkbox"
                                  style={{
                                    marginLeft: "10px",
                                    transform: "scale(1.5)",
                                  }}
                                  onClick={() =>
                                    orders.filter(
                                      (a) =>
                                        counter.filter(
                                          (c) =>
                                            c.counter_uuid === a.counter_uuid &&
                                            (route.route_uuid ===
                                              c.route_uuid ||
                                              ((!c.route_uuid ||
                                                +c.route_uuid === 0) &&
                                                +route.route_uuid === 0))
                                        ).length &&
                                        selectedOrder.filter(
                                          (b) => b.order_uuid === a.order_uuid
                                        ).length
                                    ).length ===
                                    orders.filter(
                                      (a) =>
                                        counter.filter(
                                          (c) =>
                                            c.counter_uuid === a.counter_uuid &&
                                            (route.route_uuid ===
                                              c.route_uuid ||
                                              ((!c.route_uuid ||
                                                +c.route_uuid === 0) &&
                                                +route.route_uuid === 0))
                                        ).length
                                    ).length
                                      ? setSelectedOrder(
                                          selectedOrder.filter(
                                            (b) =>
                                              !orders.filter(
                                                (a) =>
                                                  counter.filter(
                                                    (c) =>
                                                      c.counter_uuid ===
                                                        a.counter_uuid &&
                                                      (route.route_uuid ===
                                                        c.route_uuid ||
                                                        ((!c.route_uuid ||
                                                          +c.route_uuid ===
                                                            0) &&
                                                          +route.route_uuid ===
                                                            0))
                                                  ).length &&
                                                  b.order_uuid === a.order_uuid
                                              ).length
                                          )
                                        )
                                      : setSelectedOrder(
                                          selectedOrder.length
                                            ? [
                                                ...selectedOrder.filter(
                                                  (b) =>
                                                    !orders.filter(
                                                      (a) =>
                                                        counter.filter(
                                                          (c) =>
                                                            c.counter_uuid ===
                                                              a.counter_uuid &&
                                                            (route.route_uuid ===
                                                              c.route_uuid ||
                                                              ((!c.route_uuid ||
                                                                +c.route_uuid ===
                                                                  0) &&
                                                                +route.route_uuid ===
                                                                  0))
                                                        ).length &&
                                                        b.order_uuid ===
                                                          a.order_uuid
                                                    ).length
                                                ),
                                                ...orders.filter(
                                                  (a) =>
                                                    counter.filter(
                                                      (c) =>
                                                        c.counter_uuid ===
                                                          a.counter_uuid &&
                                                        (route.route_uuid ===
                                                          c.route_uuid ||
                                                          ((!c.route_uuid ||
                                                            +c.route_uuid ===
                                                              0) &&
                                                            +route.route_uuid ===
                                                              0))
                                                    ).length
                                                ),
                                              ]
                                            : orders.filter(
                                                (a) =>
                                                  counter.filter(
                                                    (c) =>
                                                      c.counter_uuid ===
                                                        a.counter_uuid &&
                                                      (route.route_uuid ===
                                                        c.route_uuid ||
                                                        ((!c.route_uuid ||
                                                          +c.route_uuid ===
                                                            0) &&
                                                          +route.route_uuid ===
                                                            0))
                                                  ).length
                                              )
                                        )
                                  }
                                  defaultChecked={
                                    orders.filter(
                                      (a) =>
                                        counter.filter(
                                          (c) =>
                                            c.counter_uuid === a.counter_uuid &&
                                            (route.route_uuid ===
                                              c.route_uuid ||
                                              ((!c.route_uuid ||
                                                +c.route_uuid === 0) &&
                                                +route.route_uuid === 0))
                                        ).length &&
                                        selectedOrder.filter(
                                          (b) => b.order_uuid === a.order_uuid
                                        ).length
                                    ).length ===
                                    orders.filter(
                                      (a) =>
                                        counter.filter(
                                          (c) =>
                                            c.counter_uuid === a.counter_uuid &&
                                            (route.route_uuid ===
                                              c.route_uuid ||
                                              ((!c.route_uuid ||
                                                +c.route_uuid === 0) &&
                                                +route.route_uuid === 0))
                                        ).length
                                    ).length
                                  }
                                />
                              ) : (
                                ""
                              )}
                            </h1>
                            <div
                              className="content"
                              style={{
                                flexDirection: "row",
                                flexWrap: "wrap",
                                gap: "0px",
                                marginBottom: "10px",
                                paddingBottom: "20px",
                              }}
                              id="seats_container"
                            >
                              {orders
                                ?.filter(
                                  (b) =>
                                    counter.filter(
                                      (c) =>
                                        c.counter_uuid === b.counter_uuid &&
                                        (route.route_uuid === c.route_uuid ||
                                          ((!c.route_uuid ||
                                            +c.route_uuid === 0) &&
                                            +route.route_uuid === 0))
                                    ).length
                                )
                                .filter(
                                  (a) =>
                                    !searchItems ||
                                    a.invoice_number
                                      ?.toString()
                                      ?.includes(
                                        searchItems.toLocaleLowerCase()
                                      ) ||
                                    a.counter_title
                                      ?.toLocaleLowerCase()
                                      ?.includes(
                                        searchItems.toLocaleLowerCase()
                                      )
                                )
                                .sort(
                                  (a, b) => a.invoice_number - b.invoice_number
                                )

                                .map((item) => {
                                  return (
                                    <div
                                      className={`seatSearchTarget`}
                                      style={{ height: "fit-content" }}
                                      key={Math.random()}
                                      seat-name={item.seat_name}
                                      seat-code={item.seat_uuid}
                                      seat={item.seat_uuid}
                                      // section={section.section_uuid}
                                      // section-name={section?.section_name}
                                      // outlet={outletIdState}
                                      onClick={(e) =>
                                        selectOrder
                                          ? setSelectedOrder((prev) =>
                                              prev.filter(
                                                (a) =>
                                                  a.order_uuid ===
                                                  item.order_uuid
                                              ).length
                                                ? prev.filter(
                                                    (a) =>
                                                      a.order_uuid !==
                                                      item.order_uuid
                                                  )
                                                : prev.length
                                                ? [...prev, item]
                                                : [item]
                                            )
                                          : setSelectedRouteOrder(
                                              item.order_uuid
                                            )
                                      }
                                      onDoubleClick={() =>
                                        setSelectedRouteOrder(item.order_uuid)
                                      }
                                    >
                                      <span
                                        className="dblClickTrigger"
                                        style={{ display: "none" }}
                                        // onClick={() =>
                                        //   menuOpenHandler(item)
                                        // }
                                      />
                                      <Card
                                        details={details}
                                        order={item}
                                        onDoubleClick={() =>
                                          setPopupOrder(item)
                                        }
                                        // on_order={on_order && on_order}
                                        // key={item.seat_uuid}
                                        dateTime={item?.status[0]?.time}
                                        title1={item?.invoice_number || ""}
                                        selectedOrder={
                                          selectOrder
                                            ? selectedOrder.filter(
                                                (a) =>
                                                  a.order_uuid ===
                                                  item.order_uuid
                                              ).length
                                            : selectedRouteOrder ===
                                              item.order_uuid
                                        }
                                        title2={item?.counter_title || ""}
                                        status={
                                          +item.status[item.status.length - 1]
                                            ?.stage === 1
                                            ? "Processing"
                                            : +item.status[
                                                item.status.length - 1
                                              ]?.stage === 2
                                            ? "Checking"
                                            : +item.status[
                                                item.status.length - 1
                                              ]?.stage === 3
                                            ? "Delivery"
                                            : +item.status[
                                                item.status.length - 1
                                              ]?.stage === 4
                                            ? "Complete"
                                            : +item.status[
                                                item.status.length - 1
                                              ]?.stage === 5
                                            ? "Cancelled"
                                            : ""
                                        }
                                        // price={item.price}
                                        // visibleContext={visibleContext}
                                        // setVisibleContext={setVisibleContext}
                                        // isMouseInsideContext={isMouseInsideContext}
                                        // seats={seatsState.filter(s => +s.seat_status === 1)}
                                        rounded
                                      />
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        );
                    })}
                  </>
                ) : (
                  ""
                )}
              </>
            ) : (
              <>
                {orders
                  .filter(
                    (a) =>
                      !searchItems ||
                      a.invoice_number
                        ?.toString()
                        ?.includes(searchItems.toLocaleLowerCase()) ||
                      a.counter_title
                        ?.toLocaleLowerCase()
                        ?.includes(searchItems.toLocaleLowerCase())
                  )
                  .filter((a) => !a?.trip_uuid).length ? (
                  <div key={Math.random()} className="sectionDiv">
                    <h2>
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setJoinSummary(orders.filter((a) => !a?.trip_uuid))
                        }
                      >
                        UnKnown
                      </span>{" "}
                      ({orders.filter((a) => !a?.trip_uuid).length}) [
                      processing:{" "}
                      {
                        tripData.find((a) => +a.trip_uuid === 0)
                          ?.processingLength
                      }
                      , Checking:{" "}
                      {tripData.find((a) => +a.trip_uuid === 0)?.checkingLength}
                      , Delivery:{" "}
                      {tripData.find((a) => +a.trip_uuid === 0)?.deliveryLength}
                      ]
                      {selectOrder ? (
                        <input
                          type="checkbox"
                          style={{
                            marginLeft: "10px",
                            transform: "scale(1.5)",
                          }}
                          defaultChecked={
                            orders.filter(
                              (a) =>
                                !a?.trip_uuid &&
                                selectedOrder.filter(
                                  (b) => b.order_uuid === a.order_uuid
                                ).length
                            ).length ===
                            orders.filter((a) => !a?.trip_uuid).length
                          }
                          onClick={() =>
                            orders?.filter(
                              (a) =>
                                !a?.trip_uuid &&
                                selectedOrder?.filter(
                                  (b) => b.order_uuid === a.order_uuid
                                )?.length
                            ).length ===
                            orders?.filter((a) => !a?.trip_uuid)?.length
                              ? setSelectedOrder(
                                  selectedOrder.filter(
                                    (b) =>
                                      !orders.filter(
                                        (a) =>
                                          !a?.trip_uuid &&
                                          b.order_uuid === a.order_uuid
                                      ).length
                                  )
                                )
                              : setSelectedOrder(
                                  selectedOrder.length
                                    ? [
                                        ...selectedOrder.filter(
                                          (b) =>
                                            !orders.filter(
                                              (a) =>
                                                !a?.trip_uuid &&
                                                b.order_uuid === a.order_uuid
                                            ).length
                                        ),
                                        ...orders.filter((a) => !a?.trip_uuid),
                                      ]
                                    : orders?.filter((a) => !a?.trip_uuid)
                                )
                          }
                        />
                      ) : (
                        ""
                      )}
                    </h2>
                    <div
                      className="content"
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: "0",
                        marginBottom: "10px",
                      }}
                      id="seats_container"
                    >
                      {orders
                        .filter((a) => !a?.trip_uuid)
                        .sort((a, b) => a.invoice_number - b.invoice_number)
                        .filter(
                          (a) =>
                            !searchItems ||
                            a.invoice_number
                              ?.toString()
                              ?.includes(searchItems.toLocaleLowerCase()) ||
                            a.counter_title
                              ?.toLocaleLowerCase()
                              ?.includes(searchItems.toLocaleLowerCase())
                        )
                        .map((item) => {
                          return (
                            <div
                              className={`seatSearchTarget`}
                              style={{ height: "fit-content" }}
                              key={Math.random()}
                              seat-name={item.seat_name}
                              seat-code={item.seat_uuid}
                              seat={item.seat_uuid}
                              // section={section.section_uuid}
                              // section-name={section?.section_name}
                              // outlet={outletIdState}
                              onClick={(e) =>
                                selectOrder
                                  ? setSelectedOrder((prev) =>
                                      prev.filter(
                                        (a) => a.order_uuid === item.order_uuid
                                      ).length
                                        ? prev.filter(
                                            (a) =>
                                              a.order_uuid !== item.order_uuid
                                          )
                                        : prev.length
                                        ? [...prev, item]
                                        : [item]
                                    )
                                  : setSelectedRouteOrder(item.order_uuid)
                              }
                            >
                              <span
                                className="dblClickTrigger"
                                style={{ display: "none" }}
                                // onClick={() =>
                                //   menuOpenHandler(item)
                                // }
                              />

                              <Card
                                details={details}
                                order={item}
                                onDoubleClick={() => setPopupOrder(item)}
                                // on_order={order}
                                dateTime={item?.status[0]?.time}
                                // key={item.seat_uuid}
                                title1={item?.invoice_number || ""}
                                selectedOrder={
                                  selectOrder
                                    ? selectedOrder.filter(
                                        (a) => a.order_uuid === item.order_uuid
                                      ).length
                                    : selectedRouteOrder === item.order_uuid
                                }
                                title2={item?.counter_title || ""}
                                status={
                                  +item.status[item.status.length - 1]
                                    ?.stage === 1
                                    ? "Processing"
                                    : +item.status[item.status.length - 1]
                                        ?.stage === 2
                                    ? "Checking"
                                    : +item.status[item.status.length - 1]
                                        ?.stage === 3
                                    ? "Delivery"
                                    : +item.status[item.status.length - 1]
                                        ?.stage === 4
                                    ? "Complete"
                                    : +item.status[item.status.length - 1]
                                        ?.stage === 5
                                    ? "Cancelled"
                                    : ""
                                }
                                // price={item.price}
                                // visibleContext={visibleContext}
                                // setVisibleContext={setVisibleContext}
                                // isMouseInsideContext={isMouseInsideContext}
                                // seats={seatsState.filter(s => +s.seat_status === 1)}
                                rounded
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  ""
                )}
                {tripData.length ? (
                  <>
                    {tripData.map((trip) => {
                      if (
                        orders
                          .filter((a) => a.trip_uuid === trip.trip_uuid)
                          .filter(
                            (a) =>
                              a.invoice_number
                                ?.toString()

                                ?.includes(searchItems.toLocaleLowerCase()) ||
                              a.counter_title
                                ?.toLocaleLowerCase()
                                ?.includes(searchItems.toLocaleLowerCase())
                          ).length
                      )
                        return (
                          <div key={Math.random()} className="sectionDiv">
                            <h1>
                              <span
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                  setJoinSummary(
                                    orders.filter(
                                      (a) => a.trip_uuid === trip.trip_uuid
                                    )
                                  )
                                }
                              >
                                {trip.trip_title}
                              </span>{" "}
                              (
                              {
                                orders.filter(
                                  (a) => a.trip_uuid === trip.trip_uuid
                                ).length
                              }
                              ) [ processing: {trip?.processingLength},
                              Checking: {trip?.checkingLength}, Delivery:{" "}
                              {trip?.deliveryLength}] [
                              {trip?.users?.map((a, i) =>
                                i === 0
                                  ? users?.find((b) => b.user_uuid === a)
                                      ?.user_title
                                  : ", " +
                                    users?.find((b) => b.user_uuid === a)
                                      ?.user_title
                              )}
                              ]
                              {selectOrder ? (
                                <input
                                  type="checkbox"
                                  style={{
                                    marginLeft: "10px",
                                    transform: "scale(1.5)",
                                  }}
                                  defaultChecked={
                                    orders.filter(
                                      (a) =>
                                        a.trip_uuid === trip.trip_uuid &&
                                        selectedOrder.filter(
                                          (b) => b.order_uuid === a.order_uuid
                                        ).length
                                    ).length ===
                                    orders.filter(
                                      (a) => a.trip_uuid === trip.trip_uuid
                                    ).length
                                  }
                                  onClick={() =>
                                    orders?.filter(
                                      (a) =>
                                        a.trip_uuid === trip.trip_uuid &&
                                        selectedOrder?.filter(
                                          (b) => b.order_uuid === a.order_uuid
                                        )?.length
                                    ).length ===
                                    orders?.filter(
                                      (a) => a.trip_uuid === trip.trip_uuid
                                    )?.length
                                      ? setSelectedOrder(
                                          selectedOrder.filter(
                                            (b) =>
                                              !orders.filter(
                                                (a) =>
                                                  a.trip_uuid ===
                                                    trip.trip_uuid &&
                                                  b.order_uuid === a.order_uuid
                                              ).length
                                          )
                                        )
                                      : setSelectedOrder(
                                          selectedOrder.length
                                            ? [
                                                ...selectedOrder.filter(
                                                  (b) =>
                                                    !orders.filter(
                                                      (a) =>
                                                        a.trip_uuid ===
                                                          trip.trip_uuid &&
                                                        b.order_uuid ===
                                                          a.order_uuid
                                                    ).length
                                                ),
                                                ...orders.filter(
                                                  (a) =>
                                                    a.trip_uuid ===
                                                    trip.trip_uuid
                                                ),
                                              ]
                                            : orders?.filter(
                                                (a) =>
                                                  a.trip_uuid === trip.trip_uuid
                                              )
                                        )
                                  }
                                />
                              ) : (
                                ""
                              )}
                            </h1>
                            <div
                              className="content"
                              style={{
                                flexDirection: "row",
                                flexWrap: "wrap",
                                gap: "0",
                                marginBottom: "10px",
                              }}
                              id="seats_container"
                            >
                              {orders
                                .filter((a) => a.trip_uuid === trip.trip_uuid)
                                .filter(
                                  (a) =>
                                    !searchItems ||
                                    a.invoice_number
                                      ?.toString()
                                      ?.includes(
                                        searchItems.toLocaleLowerCase()
                                      ) ||
                                    a.counter_title
                                      ?.toLocaleLowerCase()
                                      ?.includes(
                                        searchItems.toLocaleLowerCase()
                                      )
                                )
                                .sort(
                                  (a, b) => a.invoice_number - b.invoice_number
                                )

                                .map((item) => {
                                  return (
                                    <div
                                      className={`seatSearchTarget`}
                                      style={{ height: "fit-content" }}
                                      key={Math.random()}
                                      seat-name={item.seat_name}
                                      seat-code={item.seat_uuid}
                                      seat={item.seat_uuid}
                                      // section={section.section_uuid}
                                      // section-name={section?.section_name}
                                      // outlet={outletIdState}
                                      onClick={(e) =>
                                        selectOrder
                                          ? setSelectedOrder((prev) =>
                                              prev.filter(
                                                (a) =>
                                                  a.order_uuid ===
                                                  item.order_uuid
                                              ).length
                                                ? prev.filter(
                                                    (a) =>
                                                      a.order_uuid !==
                                                      item.order_uuid
                                                  )
                                                : prev.length
                                                ? [...prev, item]
                                                : [item]
                                            )
                                          : setSelectedRouteOrder(
                                              item.order_uuid
                                            )
                                      }
                                    >
                                      <span
                                        className="dblClickTrigger"
                                        style={{ display: "none" }}
                                        // onClick={() =>
                                        //   menuOpenHandler(item)
                                        // }
                                      />
                                      <Card
                                        details={details}
                                        order={item}
                                        onDoubleClick={() =>
                                          setPopupOrder(item)
                                        }
                                        // on_order={on_order && on_order}
                                        // key={item.seat_uuid}
                                        dateTime={item?.status[0]?.time}
                                        title1={item?.invoice_number || ""}
                                        selectedOrder={
                                          selectOrder
                                            ? selectedOrder.filter(
                                                (a) =>
                                                  a.order_uuid ===
                                                  item.order_uuid
                                              ).length
                                            : selectedRouteOrder ===
                                              item.order_uuid
                                        }
                                        title2={item?.counter_title || ""}
                                        status={
                                          +item.status[item.status.length - 1]
                                            ?.stage === 1
                                            ? "Processing"
                                            : +item.status[
                                                item.status.length - 1
                                              ]?.stage === 2
                                            ? "Checking"
                                            : +item.status[
                                                item.status.length - 1
                                              ]?.stage === 3
                                            ? "Delivery"
                                            : +item.status[
                                                item.status.length - 1
                                              ]?.stage === 4
                                            ? "Complete"
                                            : +item.status[
                                                item.status.length - 1
                                              ]?.stage === 5
                                            ? "Cancelled"
                                            : ""
                                        }
                                        // price={item.price}
                                        // visibleContext={visibleContext}
                                        // setVisibleContext={setVisibleContext}
                                        // isMouseInsideContext={isMouseInsideContext}
                                        // seats={seatsState.filter(s => +s.seat_status === 1)}
                                        rounded
                                      />
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        );
                    })}
                  </>
                ) : (
                  ""
                )}
              </>
            )}

            <div
              className="searchBar"
              style={{
                width: "400px",
              }}
            >
              <input
                type="text"
                placeholder="Search..."
                value={searchItems}
                onChange={(e) => setSearhItems(e.target.value)}
              />
            </div>
          </div>
          {isItemAvilableOpen && (
            <ItemAvilibility
              isItemAvilableOpen={isItemAvilableOpen}
              setIsItemAvilableOpen={setIsItemAvilableOpen}
            />
          )}
        </div>
      </div>
      <div
        style={{ position: "fixed", top: -1000, right: -1000, zIndex: "-1000" }}
      >
        <div
          ref={componentRef}
          style={
            {
              // marginTop: "20mm",
              // marginLeft: "20mm",
              // marginRight: "20mm",
              // margin: "45mm 40mm 30mm 60mm",
              // textAlign: "center",
              // padding: "10px"
            }
          }
        >
          {selectedOrder
            .map((a) => ({
              ...a,
              sort_order: +category.find(
                (b) => b.category_uuid === a.category_uuid
              )?.sort_order,
            }))
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((a) => ({
              ...a,
              item_details: a.item_details
                .filter((b) => b.status !== 3)
                .map((b, i) => ({ ...b, sr: i + 1 })),
            }))
            .map((orderData, index) => (
              <>
                {/* {index === 0 ? "" : <div style={{ height: "20mm" }}></div>} */}
                <OrderPrint
                  counter={counter.find(
                    (a) => a.counter_uuid === orderData?.counter_uuid
                  )}
                  order={orderData}
                  date={new Date(orderData?.status[0]?.time)}
                  user={
                    users.find(
                      (a) => a.user_uuid === orderData.status[0].user_uuid
                    )?.user_title || ""
                  }
                  itemData={items}
                  item_details={
                    orderData?.item_details?.length > 12
                      ? orderData?.item_details?.slice(0, 12)
                      : orderData?.item_details
                  }
                  footer={!(orderData?.item_details?.length > 12)}
                />
                {orderData?.item_details?.length > 12 ? (
                  <>
                    {/* <div style={{ height: "20mm" }}></div> */}
                    <OrderPrint
                      counter={counter.find(
                        (a) => a.counter_uuid === orderData?.counter_uuid
                      )}
                      order={orderData}
                      date={new Date(orderData?.status[0]?.time)}
                      user={
                        users.find(
                          (a) => a.user_uuid === orderData?.status[0]?.user_uuid
                        )?.user_title || ""
                      }
                      itemData={items}
                      item_details={
                        orderData?.item_details?.length > 24
                          ? orderData?.item_details?.slice(12, 24)
                          : orderData?.item_details?.slice(
                              12,
                              orderData?.item_details?.length
                            )
                      }
                      footer={!(orderData?.item_details?.length > 24)}
                    />
                  </>
                ) : (
                  ""
                )}
                {orderData?.item_details?.length > 24 ? (
                  <>
                    {/* <div style={{ height: "20mm" }}></div> */}
                    <OrderPrint
                      counter={counter.find(
                        (a) => a.counter_uuid === orderData?.counter_uuid
                      )}
                      order={orderData}
                      date={new Date(orderData?.status[0]?.time)}
                      user={
                        users.find(
                          (a) => a.user_uuid === orderData?.status[0]?.user_uuid
                        )?.user_title || ""
                      }
                      itemData={items}
                      item_details={
                        orderData?.item_details?.length > 36
                          ? orderData?.item_details?.slice(24, 36)
                          : orderData?.item_details?.slice(
                              24,
                              orderData?.item_details?.length
                            )
                      }
                      footer={!(orderData?.item_details?.length > 36)}
                    />
                  </>
                ) : (
                  ""
                )}

                {orderData?.item_details?.length > 36 ? (
                  <>
                    {/* <div style={{ height: "20mm" }}></div> */}
                    <OrderPrint
                      counter={counter.find(
                        (a) => a.counter_uuid === orderData?.counter_uuid
                      )}
                      order={orderData}
                      date={new Date(orderData?.status[0]?.time)}
                      user={
                        users.find(
                          (a) => a.user_uuid === orderData?.status[0]?.user_uuid
                        )?.user_title || ""
                      }
                      itemData={items}
                      item_details={orderData?.item_details?.slice(
                        36,
                        orderData?.item_details.length
                      )}
                      footer={true}
                    />
                  </>
                ) : (
                  ""
                )}
              </>
            ))}
        </div>
      </div>
      {selectedWarehouseOrder ? (
        <WarehouseUpdatePopup
          onClose={() =>
            setSelectedWarehouseOrders((prev) => {
              if (prev.length === 1) {
                getTasksData();
                return [];
              } else {
                prev.filter(
                  (a) =>
                    a.orderData.order_uuid !==
                    selectedWarehouseOrder.orderData.order_uuid
                );
              }
            })
          }
          updateChanges={updateWarehouse}
          popupInfo={selectedWarehouseOrder}
        />
      ) : (
        ""
      )}
      {popupForm ? (
        <NewUserForm
          onSave={() => {
            setPopupForm(false);
            postOrderData();
            setSelectOrder("");
          }}
          selectedTrip={selectedTrip}
          setSelectedTrip={setSelectedTrip}
          setRoutesData={setRoutesData}
          popupInfo={popupForm}
          orders={selectedOrder}
          trips={tripData}
          onClose={() => {
            setPopupForm(null);
            setSelectOrder("");
            setSelectedOrder([]);
            setSelectedTrip(null);
          }}
        />
      ) : (
        ""
      )}
      {selectedtasks ? (
        <TaskPopupMenu
          onSave={() => {
            if (tasks.length === 1) {
              handlePrint();
              setTasks([]);
              setSelectedTasks(false);
            } else {
              setTasks((prev) =>
                prev.filter((a) => a.task_uuid !== selectedtasks.task_uuid)
              );
            }
          }}
          onClose={() => {
            setSelectedTasks(false);
            setTasks([]);
          }}
          taskData={selectedtasks}
          users={users}
          counter={counter.find(
            (a) => a.counter_uuid === selectedtasks.counter_uuid
          )}
        />
      ) : (
        ""
      )}
      {popupOrder ? (
        <OrderDetails
          onSave={() => {
            setPopupOrder(null);
            if (holdOrders) getRunningHoldOrders();
            else getRunningOrders();
          }}
          order={popupOrder}
        />
      ) : (
        ""
      )}
      {messagePopup ? (
        <MessagePopup
          onClose={() => {
            setMessagePopup("");
          }}
          message={messagePopup}
          button1="Okay"
        />
      ) : (
        ""
      )}
      {summaryPopup ? (
        <HoldPopup
          onSave={() => {
            setSumaryPopup(false);
            if (holdOrders) getRunningHoldOrders();
            else getRunningOrders();
          }}
          orders={selectedOrder}
          itemsData={items}
          counter={counter}
          category={category}
          setPopupOrder={setPopupOrder}
        />
      ) : (
        ""
      )}
      {joinSummary ? (
        <SummaryPopup
          onSave={() => {
            setJoinSummary(false);
            if (holdOrders) getRunningHoldOrders();
            else getRunningOrders();
          }}
          orders={joinSummary}
          itemsData={items}
          counter={counter}
          category={category}
          company={company}
          setPopupOrder={setPopupOrder}
        />
      ) : (
        ""
      )}
      {changesStatePopup ? (
        <ChangeStage
          onClose={() => {
            setChangeStatePopup(false);
            setSelectOrder("");
            setSelectedOrder([]);
            if (holdOrders) getRunningHoldOrders();
            else getRunningOrders();
          }}
          orders={selectedOrder}
          stage={changesStatePopup}
          counters={counter}
          items={items}
        />
      ) : (
        ""
      )}
    </>
  );
};

export default MainAdmin;
function NewUserForm({
  onSave,
  popupInfo,
  setSelectedTrip,
  selectedTrip,
  trips,
  onClose,
}) {
  const [data, setdata] = useState("");
  const [errMassage, setErrorMassage] = useState("");
  const [warehouse, setWarehouse] = useState([]);
  const [edit, setEdit] = useState(true);
  const getItemsData = async () => {
    const response = await axios({
      method: "get",
      url: "/warehouse/GetWarehouseList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setWarehouse(response.data.result);
  };
  useEffect(() => {
    if (popupInfo?.type === "edit") setSelectedTrip({trip_uuid:"0",warehouse_uuid:""});
    else {
      let warehouse_uuid = localStorage.getItem("warehouse") || 0;
      warehouse_uuid = warehouse_uuid ? JSON.parse(warehouse_uuid)[0] : 0;
      console.log(warehouse_uuid);
      setdata({
        warehouse_uuid,
      });
      setEdit(warehouse_uuid ? false : true);
    }
    getItemsData();
  }, [popupInfo?.type, setSelectedTrip]);
  const submitHandler = async (e) => {
    e.preventDefault();
    if (popupInfo?.type === "edit") {
      console.log(data);
      onSave();
    } else {
      if (!data.trip_title) {
        setErrorMassage("Please insert Trip Title");
        return;
      }

      const response = await axios({
        method: "post",
        url: "/trips/postTrip",
        data,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        onSave();
      }
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
          // style={{ flexDirection: "row", flexWrap: "wrap", gap: "5" }}
          style={{
            height: "fit-content",
            padding: "20p0",
            marginBottom: "10px",
            width: "fit-content",
          }}
        >
          <div style={{ overflowY: "scroll" }}>
            <form className="form" onSubmit={submitHandler}>
              <div className="row">
                <h1>{popupInfo.type === "edit" ? "Edit" : "Add"} Trip</h1>
              </div>

              <div className="formGroup">
                <div className="row">
                  <label className="selectLabel">
                    {popupInfo.type === "edit" ? "Trip" : "Trip Title"}
                    {popupInfo.type === "edit" ? (
                      <select
                        name="route_title"
                        className="numberInput"
                        value={selectedTrip.trip_uuid}
                        onChange={(e) =>
                          setSelectedTrip({
                            trip_uuid: e.target.value,
                            warehouse_uuid:
                              trips?.find((a) => a.trip_uuid === e.target.value)
                                ?.warehouse_uuid || "",
                          })
                        }
                        maxLength={42}
                        style={{ width: "200px" }}
                      >
                        <option value="0">None</option>
                        {trips
                          .filter((a) => a.trip_uuid && a.status)
                          .map((a) => (
                            <option value={a.trip_uuid}>{a.trip_title}</option>
                          ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="route_title"
                        className="numberInput"
                        value={data?.trip_title}
                        onChange={(e) =>
                          setdata({
                            ...data,
                            trip_title: e.target.value,
                          })
                        }
                        maxLength={42}
                      />
                    )}
                  </label>
                </div>
                {popupInfo.type !== "edit" ? (
                  <div className="row">
                    <label className="selectLabel">
                      Warehouse
                      <div className="inputGroup" style={{ width: "200px" }}>
                        <Select
                          options={[
                            { value: 0, label: "None" },
                            ...warehouse.map((a) => ({
                              value: a.warehouse_uuid,
                              label: a.warehouse_title,
                            })),
                          ]}
                          onChange={(doc) =>
                            setdata((prev) => ({
                              ...prev,
                              warehouse_uuid: doc.value,
                            }))
                          }
                          value={
                            data?.warehouse_uuid
                              ? {
                                  value: data?.warehouse_uuid,
                                  label: warehouse?.find(
                                    (j) =>
                                      j.warehouse_uuid === data.warehouse_uuid
                                  )?.warehouse_title,
                                }
                              : { value: 0, label: "None" }
                          }
                          autoFocus={!data?.warehouse_uuid}
                          openMenuOnFocus={true}
                          menuPosition="fixed"
                          menuPlacement="auto"
                          placeholder="Select"
                          isDisabled={!edit}
                        />
                      </div>
                    </label>
                  </div>
                ) : (
                  ""
                )}
              </div>
              <i style={{ color: "red" }}>
                {errMassage === "" ? "" : "Error: " + errMassage}
              </i>

              <button type="submit" className="submit">
                Save changes
              </button>
            </form>
          </div>
          <button
            type="button"
            onClick={() => onClose()}
            className="closeButton"
          >
            x
          </button>
        </div>
      </div>
    </div>
  );
}
function HoldPopup({
  onSave,
  orders,
  itemsData,
  counter,
  category,
  setPopupOrder,
}) {
  const [items, setItems] = useState([]);
  const [stage, setStage] = useState("");
  const [itemStatus, setItemStatus] = useState("");
  const [FilteredOrder, setFilteredOrder] = useState([]);
  const [popup, setPopup] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const componentRef = useRef(null);
  const componentBoxRef = useRef(null);
  const [filterItemTitle, setFilterItemTile] = useState("");
  const reactToPrintContent = useCallback(() => {
    return componentRef.current;
  }, []);
  const reactToBoxPrintContent = useCallback(() => {
    return componentBoxRef.current;
  }, []);

  const handlePrint = useReactToPrint({
    content: reactToPrintContent,
    documentTitle: "Statement",
    removeAfterPrint: true,
  });
  const handleBoxPrint = useReactToPrint({
    content: reactToBoxPrintContent,
    documentTitle: "BoxStatement",
    removeAfterPrint: true,
  });
  const stagesData = [
    { value: "all", label: "All" },
    { value: 1, label: "Processing" },
    { value: 2, label: "Checking" },
    { value: 3, label: "Delivery" },
  ];
  const ItemsStatusData = [
    { value: "all", label: "All" },
    { value: 0, label: "Placed" },
    { value: 1, label: "Complete" },
    { value: 2, label: "Hold" },
    { value: 3, label: "Canceld" },
  ];
  useEffect(() => {
    let orderStage = orders.map((a) => ({
      ...a,
      stage:
        a.status.length > 1
          ? a.status.map((b) => +b.stage || 0).reduce((c, b) => Math.max(c, b))
          : a.status[0].stage,
    }));
    setFilteredOrder(orderStage);
    console.log(
      "orders",
      [].concat.apply(
        [],
        orderStage.map((a) => a.item_details)
      )
    );
    orderStage = orderStage.filter(
      (a) => stage === "all" || +a.stage === stage
    );

    let data = [].concat
      .apply(
        [],
        orderStage.map((a) => a.item_details)
      )
      .filter((a) => itemStatus === "all" || +a.status === itemStatus)
      .map((a) => {
        let itemDetails = itemsData?.find((b) => b.item_uuid === a.item_uuid);

        return {
          ...a,
          item_title: itemDetails?.item_title,
          mrp: itemDetails?.mrp,
          category_uuid: itemDetails?.category_uuid,
        };
      });
    let result = [];
    for (let item of data) {
      var existing = result.filter(function (v, i) {
        return v.item_uuid === item.item_uuid;
      });

      if (existing.length === 0) {
        let itemsFilteredData = data.filter(
          (a) => a.item_uuid === item.item_uuid
        );
        let b =
          itemsFilteredData.length > 1
            ? itemsFilteredData?.map((c) => +c.b || 0).reduce((c, d) => c + d)
            : +itemsFilteredData[0]?.b || 0;
        let p =
          itemsFilteredData.length > 1
            ? itemsFilteredData?.map((c) => +c.p || 0).reduce((c, d) => c + d)
            : +itemsFilteredData[0]?.p || 0;
        let free =
          itemsFilteredData.length > 1
            ? itemsFilteredData
                ?.map((c) => +c.free || 0)
                .reduce((c, d) => c + d)
            : +itemsFilteredData[0]?.free || 0;
        let obj = {
          ...item,
          b: parseInt(
            +b +
              (+p + free) /
                +itemsData?.find((b) => b.item_uuid === item.item_uuid)
                  ?.conversion
          ),
          p: parseInt(
            (+p + free) %
              +itemsData?.find((b) => b.item_uuid === item.item_uuid)
                ?.conversion
          ),
        };
        result.push(obj);
      }
    }

    // let result = data.reduce((acc, curr) => {
    //   let item = acc.find((item) => item.item_uuid === curr.item_uuid);
    //   if (item) {
    //     let conversion = +itemsData?.find((b) => b.item_uuid === item.item_uuid)
    //       ?.conversion;
    //     item.b = +(
    //       +item.b + curr.b + (+item.p + curr.p + (+curr.free || 0)) / conversion
    //     );
    //     item.p = +((+item.p + curr.p + (+curr.free || 0)) % conversion);
    //   } else {
    //     acc.push(curr);
    //   }

    //   return acc;
    // }, []);
    setOrderTotal(
      orderStage.length > 1
        ? orderStage
            .map((a) => +a?.order_grandtotal || 0)
            .reduce((a, b) => a + b)
        : orderStage[0]?.order_grandtotal
    );
    console.log(result);
    setItems(result);
  }, [stage, itemStatus]);
  return (
    <>
      <div className="overlay">
        <div
          className="modal"
          style={{
            height: "600px",
            width: "max-content",
            minWidth: "250px",
            paddingTop: "50px",
          }}
        >
          <div
            className="flex"
            style={{ justifyContent: "space-between", alignItems: "start" }}
          >
            <h1>Summary</h1>
            {stage && itemStatus ? (
              <>
                <div
                  className="flex"
                  style={{
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "80px",
                  }}
                >
                  <button
                    style={{ width: "fit-Content", backgroundColor: "black" }}
                    className="item-sales-search"
                    onClick={() => {
                      handlePrint();
                    }}
                  >
                    Print
                  </button>
                  <div
                    className="user_searchbar flex"
                    style={{ width: "100%" }}
                  >
                    <AiOutlineSearch className="user_search_icon" />
                    <input
                      style={{ width: "100%" }}
                      className="searchInput"
                      type="text"
                      placeholder="search"
                      value={filterItemTitle}
                      onChange={(e) => setFilterItemTile(e.target.value)}
                      id="checking_summary_search"
                    />
                    <CloseIcon
                      className="user_cross_icon"
                      onClick={() => {
                        setFilterItemTile("");
                        document
                          .getElementById("checking_summary_search")
                          .focus();
                      }}
                    />
                    <button
                      style={{
                        width: "fit-Content",
                        backgroundColor: "black",
                        position: "absolute",
                        right: "-100px",
                      }}
                      className="item-sales-search"
                      onClick={() => {
                        handleBoxPrint();
                      }}
                    >
                      Box
                    </button>
                  </div>
                </div>
                <h3>Orders Total:Rs. {orderTotal}</h3>
              </>
            ) : (
              ""
            )}
          </div>

          <div
            className="content"
            style={{
              height: "fit-content",
              padding: "20px",
              width: "fit-content",
            }}
          >
            <div style={{ overflowY: "scroll", width: "100%" }}>
              {stage && (itemStatus || itemStatus === 0) ? (
                items.length ? (
                  <div
                    className="flex"
                    style={{ flexDirection: "column", width: "100%" }}
                  >
                    <table
                      className="user-table"
                      style={{
                        width: "500px",
                        height: "fit-content",
                      }}
                    >
                      <thead>
                        <tr>
                          <th>Sr.</th>
                          <th colSpan={3}>
                            <div className="t-head-element">Item</div>
                          </th>
                          <th colSpan={2}>
                            <div className="t-head-element">MRP</div>
                          </th>
                          <th colSpan={2}>
                            <div className="t-head-element">Qty</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="tbody">
                        {category
                          .filter(
                            (a) =>
                              items?.filter(
                                (b) =>
                                  (!filterItemTitle ||
                                    b.item_title
                                      .toLocaleLowerCase()
                                      .includes(
                                        filterItemTitle.toLocaleLowerCase()
                                      )) &&
                                  a.category_uuid === b.category_uuid
                              ).length
                          )
                          .map((a) => (
                            <>
                              <tr>
                                <td colSpan={8}>{a.category_title}</td>
                              </tr>

                              {items
                                ?.filter(
                                  (b) =>
                                    (!filterItemTitle ||
                                      b.item_title
                                        .toLocaleLowerCase()
                                        .includes(
                                          filterItemTitle.toLocaleLowerCase()
                                        )) &&
                                    a.category_uuid === b.category_uuid
                                )
                                .sort((a, b) =>
                                  a?.item_title?.localeCompare(b?.item_title)
                                )
                                ?.map((item, i) => (
                                  <tr
                                    key={item?.item_uuid || Math.random()}
                                    style={{
                                      height: "30px",
                                      color:
                                        +item.status === 1
                                          ? "#fff"
                                          : +item.status === 2
                                          ? "#000"
                                          : +item.status === 3
                                          ? "#fff"
                                          : "#000",
                                      backgroundColor:
                                        +item.status === 1
                                          ? "green"
                                          : +item.status === 2
                                          ? "yellow"
                                          : +item.status === 3
                                          ? "red"
                                          : "#fff",
                                    }}
                                    onClick={() => setPopup(item)}
                                  >
                                    <td>{i + 1}</td>
                                    <td colSpan={3}>{item.item_title}</td>
                                    <td colSpan={2}>{item.mrp}</td>
                                    <td colSpan={2}>
                                      {Math.floor(item?.b || 0)} :{" "}
                                      {item?.p || 0}
                                    </td>
                                  </tr>
                                ))}
                            </>
                          ))}
                        <tr
                          style={{
                            height: "30px",
                            fontWeight: "bold",
                          }}
                        >
                          <td>Total</td>
                          <td colSpan={3}></td>
                          <td colSpan={2}></td>
                          <td colSpan={2}>
                            {Math.floor(
                              items.length > 1
                                ? items
                                    .map((a) => +a.b || 0)
                                    .reduce((a, b) => a + b)
                                : items[0].b || 0
                            )}{" "}
                            :{" "}
                            {items.length > 1
                              ? items
                                  .map((a) => +a.p || 0)
                                  .reduce((a, b) => a + b)
                              : items[0].p || 0}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    className="flex"
                    style={{ flexDirection: "column", width: "100%" }}
                  >
                    <i>No Data Present</i>
                  </div>
                )
              ) : stage ? (
                <div style={{ width: "400px" }}>
                  <h3>Item Status</h3>
                  <Select
                    options={ItemsStatusData}
                    onChange={(doc) => setItemStatus(doc.value)}
                    value={
                      itemStatus
                        ? {
                            value: itemStatus,
                            label: ItemsStatusData?.find(
                              (j) => j.value === itemStatus
                            )?.label,
                          }
                        : ""
                    }
                    openMenuOnFocus={true}
                    menuPosition="fixed"
                    menuPlacement="auto"
                    placeholder="Select"
                  />
                </div>
              ) : !stage ? (
                <div style={{ width: "400px" }}>
                  <h3>Order Stage</h3>
                  <Select
                    options={stagesData}
                    onChange={(doc) => setStage(doc.value)}
                    value={
                      stage
                        ? {
                            value: stage,
                            label: stagesData?.find((j) => j.value === stage)
                              ?.label,
                          }
                        : ""
                    }
                    openMenuOnFocus={true}
                    menuPosition="fixed"
                    menuPlacement="auto"
                    placeholder="Select"
                  />
                </div>
              ) : (
                ""
              )}
            </div>
            <button onClick={onSave} className="closeButton">
              x
            </button>
          </div>
        </div>
      </div>
      {popup ? (
        <OrdersEdit
          order={FilteredOrder}
          onSave={() => {
            setPopup(false);
            onSave();
          }}
          items={popup}
          counter={counter}
          itemsData={itemsData}
          onClose={() => setPopup(false)}
          setPopupOrder={setPopupOrder}
        />
      ) : (
        ""
      )}
      <div
        style={{
          position: "fixed",
          top: -100,
          left: -180,
          zIndex: "-1000",
        }}
      >
        <div
          ref={componentRef}
          id="item-container"
          style={{
            // margin: "45mm 40mm 30mm 60mm",
            // textAlign: "center",
            height: "128mm",
            // padding: "10px"
          }}
        >
          {items?.length ? (
            <table
              className="user-table"
              style={{
                width: "170mm",
                // marginTop: "20mm",
                // marginLeft: "20mm",
                // marginRight: "20mm",
                border: "1px solid black",
                pageBreakInside: "auto",
                display: "block",
              }}
            >
              <thead
                style={{
                  width: "100%",
                  color: "#000",
                  backgroundColor: "#fff",
                }}
              >
                <tr style={{ width: "100%", fontSize: "12px" }}>
                  <th style={{ width: "10mm" }}>Sr.</th>
                  <th colSpan={5} style={{ width: "100mm" }}>
                    <div className="t-head-element">Item</div>
                  </th>
                  <th colSpan={3} style={{ width: "30mm" }}>
                    <div className="t-head-element">MRP</div>
                  </th>
                  <th colSpan={3} style={{ width: "30mm" }}>
                    <div className="t-head-element">Qty</div>
                  </th>
                </tr>
              </thead>
              <tbody className="tbody" style={{ width: "100%" }}>
                {category
                  .filter(
                    (a) =>
                      items?.filter((b) => a.category_uuid === b.category_uuid)
                        .length
                  )
                  .sort((a, b) =>
                    a?.category_title?.localeCompare(b?.category_title)
                  )
                  .map((a) => (
                    <>
                      <tr
                        style={{
                          pageBreakAfter: "always",
                          width: "100%",
                          height: "8px",
                          fontSize: "12px",
                        }}
                      >
                        <td colSpan={11} style={{ padding: "5px" }}>
                          {a.category_title}
                        </td>
                      </tr>

                      {items
                        .filter((b) => a.category_uuid === b.category_uuid)
                        .sort((a, b) =>
                          a?.item_title?.localeCompare(b?.item_title)
                        )
                        ?.map((item, i) => (
                          <tr
                            key={item?.item_uuid || Math.random()}
                            style={{
                              height: "8px",
                              pageBreakAfter: "always",
                              color: "#000",
                              backgroundColor: "#fff",
                              fontSize: "12px",
                            }}
                            onClick={() => setPopup(item)}
                          >
                            <td style={{ padding: "0" }}>{i + 1}</td>
                            <td colSpan={5} style={{ padding: "0" }}>
                              {item.item_title}
                            </td>
                            <td colSpan={3} style={{ padding: "0" }}>
                              {item.mrp}
                            </td>
                            <td colSpan={3} style={{ padding: "0" }}>
                              {Math.floor(item?.b || 0)} : {item?.p || 0}
                            </td>
                          </tr>
                        ))}
                    </>
                  ))}
                <tr
                  style={{
                    height: "30px",
                    fontWeight: "bold",
                    fontSize: "12px",
                  }}
                >
                  <td style={{ padding: "5px" }}>Total</td>
                  <td colSpan={5} style={{ padding: "5px" }}></td>
                  <td colSpan={3} style={{ padding: "5px" }}></td>
                  <td colSpan={3} style={{ padding: "5px" }}>
                    {Math.floor(
                      items.length > 1
                        ? items?.map((a) => +a.b || 0).reduce((a, b) => a + b)
                        : items[0]?.b || 0
                    )}{" "}
                    :{" "}
                    {items.length > 1
                      ? items.map((a) => +a.p || 0).reduce((a, b) => a + b)
                      : items[0].p || 0}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            ""
          )}
        </div>
      </div>
      <div
        style={{
          position: "fixed",
          top: -100,
          left: -180,
          zIndex: "-1000",
        }}
      >
        <div
          ref={componentBoxRef}
          id="item-container"
          style={{
            // margin: "45mm 40mm 30mm 60mm",
            // textAlign: "center",
            height: "128mm",
            // padding: "10px"
          }}
        >
          {items?.length ? (
            <table
              className="user-table"
              style={{
                width: "170mm",
                // marginTop: "20mm",
                // marginLeft: "20mm",
                // marginRight: "20mm",
                border: "1px solid black",
                pageBreakInside: "auto",
                display: "block",
              }}
            >
              <thead
                style={{
                  width: "100%",
                  color: "#000",
                  backgroundColor: "#fff",
                }}
              >
                <tr style={{ width: "100%", fontSize: "12px" }}>
                  <th style={{ width: "10mm" }}>Sr.</th>
                  <th colSpan={5} style={{ width: "100mm" }}>
                    <div className="t-head-element">Item</div>
                  </th>
                  <th colSpan={3} style={{ width: "30mm" }}>
                    <div className="t-head-element">MRP</div>
                  </th>
                  <th colSpan={3} style={{ width: "30mm" }}>
                    <div className="t-head-element">Qty</div>
                  </th>
                </tr>
              </thead>
              <tbody className="tbody" style={{ width: "100%" }}>
                {category
                  .filter(
                    (a) =>
                      items?.filter(
                        (b) => a.category_uuid === b.category_uuid && b.b
                      ).length
                  )
                  .sort((a, b) =>
                    a?.category_title?.localeCompare(b?.category_title)
                  )
                  .map((a) => (
                    <>
                      <tr
                        style={{
                          pageBreakAfter: "always",
                          width: "100%",
                          height: "8px",
                          fontSize: "12px",
                        }}
                      >
                        <td colSpan={11} style={{ padding: "5px" }}>
                          {a.category_title}
                        </td>
                      </tr>

                      {items
                        .filter(
                          (b) => a.category_uuid === b.category_uuid && b.b
                        )

                        .sort((a, b) =>
                          a?.item_title?.localeCompare(b?.item_title)
                        )
                        ?.map((item, i) => (
                          <tr
                            key={item?.item_uuid || Math.random()}
                            style={{
                              height: "8px",
                              pageBreakAfter: "always",
                              color: "#000",
                              backgroundColor: "#fff",
                              fontSize: "12px",
                            }}
                            onClick={() => setPopup(item)}
                          >
                            <td style={{ padding: "0" }}>{i + 1}</td>
                            <td colSpan={5} style={{ padding: "0" }}>
                              {item.item_title}
                            </td>
                            <td colSpan={3} style={{ padding: "0" }}>
                              {item.mrp}
                            </td>
                            <td colSpan={3} style={{ padding: "0" }}>
                              {Math.floor(item?.b || 0)} : {0}
                            </td>
                          </tr>
                        ))}
                    </>
                  ))}
                <tr
                  style={{
                    height: "30px",
                    fontWeight: "bold",
                    fontSize: "12px",
                  }}
                >
                  <td style={{ padding: "5px" }}>Total</td>
                  <td colSpan={5} style={{ padding: "5px" }}></td>
                  <td colSpan={3} style={{ padding: "5px" }}></td>
                  <td colSpan={3} style={{ padding: "5px" }}>
                    {Math.floor(
                      items.length > 1
                        ? items?.map((a) => +a.b || 0).reduce((a, b) => a + b)
                        : items[0]?.b || 0
                    )}{" "}
                    : {0}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            ""
          )}
        </div>
      </div>
    </>
  );
}
function SummaryPopup({
  onSave,
  orders,
  itemsData,
  counter,
  category,
  company,
  setPopupOrder,
}) {
  const [items, setItems] = useState([]);

  const [FilteredOrder, setFilteredOrder] = useState([]);
  const [popup, setPopup] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const componentRef = useRef(null);
  const reactToPrintContent = useCallback(() => {
    return componentRef.current;
  }, [items]);

  const handlePrint = useReactToPrint({
    content: reactToPrintContent,
    documentTitle: "Statement",
    removeAfterPrint: true,
  });

  useEffect(() => {
    let orderStage = orders.map((a) => ({
      ...a,
      stage:
        a.status.length > 1
          ? a.status.map((b) => +b.stage || 0).reduce((c, b) => Math.max(c, b))
          : a.status[0].stage,
    }));
    setFilteredOrder(orderStage);
    console.log(
      "orders",
      [].concat.apply(
        [],
        orderStage.map((a) => a.item_details)
      )
    );

    let data = [].concat
      .apply(
        [],
        orderStage.map((a) => a.item_details)
      )

      .map((a) => {
        let itemDetails = itemsData?.find((b) => b.item_uuid === a.item_uuid);

        return {
          ...a,
          item_title: itemDetails?.item_title,
          mrp: itemDetails?.mrp,
          category_uuid: itemDetails?.category_uuid,
        };
      });
    console.log(data);
    let result = [];
    for (let item of data) {
      var existing = result.filter(function (v, i) {
        return v.item_uuid === item.item_uuid;
      });

      if (existing.length === 0) {
        let itemsFilteredData = data.filter(
          (a) => a.item_uuid === item.item_uuid
        );
        let b =
          itemsFilteredData.length > 1
            ? itemsFilteredData?.map((c) => +c.b || 0).reduce((c, d) => c + d)
            : +itemsFilteredData[0]?.b || 0;
        let p =
          itemsFilteredData.length > 1
            ? itemsFilteredData?.map((c) => +c.p || 0).reduce((c, d) => c + d)
            : +itemsFilteredData[0]?.p || 0;
        let free =
          itemsFilteredData.length > 1
            ? itemsFilteredData
                ?.map((c) => +c.free || 0)
                .reduce((c, d) => c + d)
            : +itemsFilteredData[0]?.free || 0;
        let obj = {
          ...item,
          b: parseInt(
            +b +
              (+p + free) /
                +itemsData?.find((b) => b.item_uuid === item.item_uuid)
                  ?.conversion
          ),
          p: parseInt(
            (+p + free) %
              +itemsData?.find((b) => b.item_uuid === item.item_uuid)
                ?.conversion
          ),
        };
        result.push(obj);
      }
    }
    setOrderTotal(
      orderStage.length > 1
        ? orderStage
            .map((a) => +a?.order_grandtotal || 0)
            .reduce((a, b) => a + b)
        : orderStage[0]?.order_grandtotal
    );
    console.log(result);

    setItems(result);
  }, []);
  const GetItemsQty = (category_uuid) => {
    let itemsData = items?.filter((b) => category_uuid === b.category_uuid);
    let box =
      itemsData.length > 1
        ? itemsData.map((a) => +a.b || 0).reduce((a, b) => a + b)
        : itemsData.length
        ? itemsData[0]?.b
        : 0;
    let pcs =
      itemsData.length > 1
        ? itemsData.map((a) => +a.p || 0).reduce((a, b) => a + b)
        : itemsData.length
        ? itemsData[0]?.p
        : 0;
    console.log(
      category.find((a) => a.category_uuid === category_uuid)?.category_title,
      itemsData
    );
    return box + " : " + pcs;
  };
  const getTotalItems = (company_uuid) => {
    let itemsData = items?.filter(
      (b) =>
        category.filter(
          (a) =>
            a.company_uuid === company_uuid &&
            a.category_uuid === b.category_uuid
        ).length
    );
    let box =
      itemsData.length > 1
        ? itemsData.map((a) => +a.b || 0).reduce((a, b) => a + b)
        : itemsData.length
        ? itemsData[0]?.b
        : 0;
    let pcs =
      itemsData.length > 1
        ? itemsData.map((a) => +a.p || 0).reduce((a, b) => a + b)
        : itemsData.length
        ? itemsData[0]?.p
        : 0;
    return box + " : " + pcs;
  };
  return (
    <>
      <div className="overlay">
        <div
          className="modal"
          style={{
            height: "600px",
            width: "max-content",
            minWidth: "250px",
            paddingTop: "50px",
          }}
        >
          <div
            className="flex"
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <h1 style={{ textAlign: "center", width: "100%" }}>
              Rs. {orderTotal}
            </h1>
          </div>

          <div
            className="content"
            style={{
              height: "fit-content",
              padding: "20px",
              width: "fit-content",
            }}
          >
            <div style={{ overflowY: "scroll", width: "100%" }}>
              {items.length ? (
                <div
                  className="flex"
                  style={{ flexDirection: "column", width: "100%" }}
                >
                  <table
                    className="user-table"
                    style={{
                      width: "500px",
                      height: "fit-content",
                    }}
                  >
                    <thead>
                      <tr>
                        <th>Sr.</th>
                        <th colSpan={3}>
                          <div className="t-head-element">Item</div>
                        </th>

                        <th colSpan={2}>
                          <div className="t-head-element">Qty</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="tbody">
                      {company
                        .filter(
                          (c) =>
                            category.filter(
                              (a) =>
                                items?.filter(
                                  (b) => a.category_uuid === b.category_uuid
                                ).length && c.company_uuid === a.company_uuid
                            ).length
                        )
                        .map((c) => (
                          <>
                            {category
                              .filter(
                                (a) =>
                                  items?.filter(
                                    (b) => a.category_uuid === b.category_uuid
                                  ).length && c.company_uuid === a.company_uuid
                              )
                              .map((a, i) => (
                                <>
                                  <tr
                                    style={{
                                      height: "30px",
                                    }}
                                  >
                                    <td>{i + 1}</td>
                                    <td colSpan={3}>{a.category_title}</td>

                                    <td colSpan={2}>
                                      {GetItemsQty(a.category_uuid)}
                                    </td>
                                  </tr>
                                </>
                              ))}
                            <tr
                              style={{
                                height: "30px",
                                fontWeight: "bold",
                              }}
                            >
                              <td></td>
                              <td colSpan={3}>{c.company_title}</td>

                              <td colSpan={2}>
                                {getTotalItems(c.company_uuid)}
                              </td>
                            </tr>
                            <tr
                              style={{
                                height: "30px",
                                fontWeight: "bold",
                              }}
                            >
                              <td></td>
                              <td colSpan={3}></td>

                              <td colSpan={2}></td>
                            </tr>
                          </>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  className="flex"
                  style={{ flexDirection: "column", width: "100%" }}
                >
                  <i>No Data Present</i>
                </div>
              )}
            </div>
            <button onClick={onSave} className="closeButton">
              x
            </button>
          </div>
        </div>
      </div>
      {popup ? (
        <OrdersEdit
          order={FilteredOrder}
          onSave={() => {
            setPopup(false);
            onSave();
          }}
          items={popup}
          counter={counter}
          itemsData={itemsData}
          onClose={() => setPopup(false)}
          setPopupOrder={setPopupOrder}
        />
      ) : (
        ""
      )}{" "}
      <div
        style={{
          position: "fixed",
          top: -100,
          left: -180,
          zIndex: "-1000",
        }}
      >
        <div
          ref={componentRef}
          id="item-container"
          style={{
            // margin: "45mm 40mm 30mm 60mm",
            // textAlign: "center",
            height: "128mm",
            // padding: "10px"
          }}
        >
          {items?.length ? (
            <table
              className="user-table"
              style={{
                width: "170mm",
                // marginTop: "20mm",
                // marginLeft: "20mm",
                // marginRight: "20mm",
                border: "1px solid black",
                pageBreakInside: "auto",
                display: "block",
              }}
            >
              <thead
                style={{
                  width: "100%",
                  color: "#000",
                  backgroundColor: "#fff",
                }}
              >
                <tr
                  style={{
                    width: "100%",
                    color: "#000",
                    backgroundColor: "#fff",
                  }}
                >
                  <th style={{ width: "10mm" }}>Sr.</th>
                  <th colSpan={5} style={{ width: "100mm" }}>
                    <div className="t-head-element">Item</div>
                  </th>
                  <th colSpan={3} style={{ width: "30mm" }}>
                    <div className="t-head-element">MRP</div>
                  </th>
                  <th colSpan={3} style={{ width: "30mm" }}>
                    <div className="t-head-element">Qty</div>
                  </th>
                </tr>
              </thead>
              <tbody className="tbody" style={{ width: "100%" }}>
                {category
                  .sort((a, b) =>
                    a?.category_title?.localeCompare(b?.category_title)
                  )
                  .filter(
                    (a) =>
                      items?.filter((b) => a.category_uuid === b.category_uuid)
                        .length
                  )
                  .map((a) => (
                    <>
                      <tr style={{ pageBreakAfter: "always", width: "100%" }}>
                        <td colSpan={11}>{a.category_title}</td>
                      </tr>

                      {items
                        .filter((b) => a.category_uuid === b.category_uuid)
                        ?.map((item, i) => (
                          <tr
                            key={item?.item_uuid || Math.random()}
                            style={{
                              height: "30px",
                              pageBreakAfter: "always",
                              color: "#000",
                              backgroundColor: "#fff",
                            }}
                            onClick={() => setPopup(item)}
                          >
                            <td>{i + 1}</td>
                            <td colSpan={5}>{item.item_title}</td>
                            <td colSpan={3}>{item.mrp}</td>
                            <td colSpan={3}>
                              {Math.floor(item?.b || 0)} : {item?.p || 0}
                            </td>
                          </tr>
                        ))}
                    </>
                  ))}
                <tr
                  style={{
                    height: "30px",
                    fontWeight: "bold",
                  }}
                >
                  <td>Total</td>
                  <td colSpan={5}></td>
                  <td colSpan={3}></td>
                  <td colSpan={3}>
                    {Math.floor(
                      items.length > 1
                        ? items?.map((a) => +a.b || 0).reduce((a, b) => a + b)
                        : items[0]?.b || 0
                    )}{" "}
                    :{" "}
                    {items.length > 1
                      ? items.map((a) => +a.p || 0).reduce((a, b) => a + b)
                      : items[0].p || 0}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            ""
          )}
        </div>
      </div>
    </>
  );
}

const OrdersEdit = ({
  order,
  onSave,
  items,
  counter,
  itemsData,
  onClose,
  setPopupOrder,
}) => {
  const [orderEditPopup, setOrderEditPopup] = useState("");
  const [updateOrders, setUpdateOrders] = useState([]);
  const [deleteItemsOrder, setDeleteItemOrders] = useState([]);
  useEffect(() => {
    setUpdateOrders(
      order.filter(
        (item) =>
          item.item_details.filter((a) => a.item_uuid === items.item_uuid)
            ?.length
      )
    );
  }, []);
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
  console.log("updatedOrders", updateOrders, deleteItemsOrder);
  const postOrderData = async (deleteItems) => {
    let dataArray = deleteItems
      ? updateOrders.map((a) => ({
          ...a,
          item_details: a.item_details.filter(
            (b) => !(b.item_uuid === items.item_uuid)
          ),
        }))
      : updateOrders
          .filter(
            (a) =>
              a.edit ||
              deleteItemsOrder.filter((b) => b === a.order_uuid).length
          )
          .map((a) =>
            deleteItemsOrder.filter((b) => b === a.order_uuid).length
              ? {
                  ...a,
                  item_details: a.item_details.filter(
                    (b) => !(b.item_uuid === items.item_uuid)
                  ),
                }
              : a
          );
    console.log("dataArray", dataArray);
    let finalData = [];
    for (let orderObject of dataArray) {
      let data = orderObject;

      let billingData = await Billing({
        replacement: data.replacement,
        adjustment: data.adjustment,
        shortage: data.shortage,
        counter: counter.find((a) => a.counter_uuid === data.counter_uuid),
        // add_discounts: true,
        items: data.item_details.map((a) => {
          let itemData = itemsData.find((b) => a.item_uuid === b.item_uuid);
          return {
            ...itemData,
            ...a,
            price: itemData?.price || 0,
          };
        }),
      });
      data = {
        ...data,
        ...billingData,
        item_details: billingData.items,
      };
      data = Object.keys(data)
        .filter((key) => key !== "others" || key !== "items")
        .reduce((obj, key) => {
          obj[key] = data[key];
          return obj;
        }, {});

      finalData.push({ ...data, opened_by: 0 });
    }
    console.log("finalData", finalData);

    const response = await axios({
      method: "put",
      url: "/orders/putOrders",
      data: finalData,
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
      <div className="overlay">
        <div
          className="modal"
          style={{
            height: "500px",
            width: "max-content",
            minWidth: "250px",
          }}
        >
          <h1>Orders</h1>
          <div
            className="content"
            style={{
              height: "fit-content",
              padding: "20px",
              width: "700px",
            }}
          >
            <div style={{ overflowY: "scroll", width: "100%" }}>
              {order.length ? (
                <div
                  className="flex"
                  style={{ flexDirection: "column", width: "100%" }}
                >
                  <table
                    className="user-table"
                    style={{
                      height: "fit-content",
                    }}
                  >
                    <thead>
                      <tr style={{ color: "#fff", backgroundColor: "#7990dd" }}>
                        <th>Sr.</th>
                        <th colSpan={3}>
                          <div className="t-head-element">Date</div>
                        </th>
                        <th colSpan={2}>
                          <div className="t-head-element">Invoice Number</div>
                        </th>
                        <th colSpan={2}>
                          <div className="t-head-element">Counter</div>
                        </th>
                        <th colSpan={2}>
                          <div className="t-head-element">Quantity</div>
                        </th>
                        <th colSpan={2}>
                          <div className="t-head-element">Free</div>
                        </th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody className="tbody">
                      {updateOrders?.map((item, i) => (
                        <tr
                          key={item?.item_uuid || Math.random()}
                          style={{
                            height: "30px",
                            color: "#fff",
                            backgroundColor: +deleteItemsOrder.filter(
                              (a) => a === item.order_uuid
                            ).length
                              ? "red"
                              : "#7990dd",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPopupOrder(item);
                          }}
                        >
                          <td>{i + 1}</td>
                          <td colSpan={3}>
                            {new Date(item?.status[0]?.time).toDateString() +
                              " - " +
                              formatAMPM(new Date(item?.status[0]?.time))}
                          </td>
                          <td colSpan={2}>{item.invoice_number}</td>
                          <td colSpan={2}>
                            {counter?.find(
                              (a) => a.counter_uuid === item.counter_uuid
                            )?.counter_title || "-"}
                          </td>
                          <td colSpan={2}>
                            <input
                              value={
                                (item.item_details.find(
                                  (a) => a.item_uuid === items.item_uuid
                                )?.b || 0) +
                                " : " +
                                (item.item_details.find(
                                  (a) => a.item_uuid === items.item_uuid
                                )?.p || 0)
                              }
                              className="boxPcsInput"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOrderEditPopup(item);
                              }}
                            />
                          </td>
                          <td colSpan={2}>
                            {item.item_details.find(
                              (a) => a.item_uuid === items.item_uuid
                            )?.free || 0}
                          </td>
                          <td
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteItemOrders((prev) =>
                                prev?.filter((a) => a === item.order_uuid)
                                  .length
                                  ? prev.filter((a) => !(a === item.order_uuid))
                                  : [...(prev || []), item.order_uuid]
                              );
                            }}
                          >
                            {!deleteItemsOrder.filter(
                              (a) => a === item.order_uuid
                            ).length ? (
                              <DeleteOutlineIcon />
                            ) : (
                              ""
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  className="flex"
                  style={{ flexDirection: "column", width: "100%" }}
                >
                  <i>No Data Present</i>
                </div>
              )}
            </div>
            <button
              className="simple_Logout_button"
              style={{
                position: "absolute",
                right: "50px",
                top: "0px",
                backgroundColor: "red",
              }}
              onClick={() => postOrderData(true)}
            >
              Delete All
            </button>
            <button onClick={onClose} className="closeButton">
              x
            </button>
          </div>
          {updateOrders.filter((a) => a.edit).length ||
          deleteItemsOrder.length ? (
            <button
              className="simple_Logout_button"
              onClick={() => postOrderData()}
            >
              Update
            </button>
          ) : (
            ""
          )}
        </div>
      </div>
      {orderEditPopup ? (
        <QuantityChanged
          popupInfo={items}
          order={orderEditPopup}
          onSave={() => setOrderEditPopup("")}
          setOrder={setUpdateOrders}
          itemsData={itemsData}
        />
      ) : (
        ""
      )}
    </>
  );
};
function QuantityChanged({ onSave, popupInfo, setOrder, order, itemsData }) {
  const [data, setdata] = useState({});

  useEffect(() => {
    let data = order.item_details?.find(
      (a) => a.item_uuid === popupInfo.item_uuid
    );
    setdata({
      b: data?.b || 0,
      p: data?.p || 0,
    });
  }, []);
  console.log(popupInfo);
  const submitHandler = async (e) => {
    e.preventDefault();
    let item = itemsData.find((a) => a.item_uuid === popupInfo.item_uuid);
    setOrder((prev) =>
      prev.map((a) =>
        a.order_uuid === order.order_uuid
          ? {
              ...a,
              edit: true,
              item_details: a.item_details.map((b) =>
                b.item_uuid === popupInfo.item_uuid
                  ? {
                      ...b,
                      b: Math.floor(+data.b + +data.p / +item.conversion || 0),
                      p: +data.p % +item.conversion,
                    }
                  : b
              ),
            }
          : a
      )
    );
    onSave();
  };

  return (
    <div className="overlay">
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
            <form className="form" onSubmit={submitHandler}>
              <div className="formGroup">
                <div
                  className="row"
                  style={{ flexDirection: "row", alignItems: "flex-start" }}
                >
                  <label
                    className="selectLabel flex"
                    style={{ width: "100px" }}
                  >
                    Box
                    <input
                      type="number"
                      name="route_title"
                      className="numberInput"
                      value={data?.b}
                      style={{ width: "100px" }}
                      onChange={(e) =>
                        setdata({
                          ...data,
                          b: e.target.value,
                        })
                      }
                      maxLength={42}
                      onWheel={(e) => e.preventDefault()}
                    />
                    {popupInfo.conversion || 0}
                  </label>
                  <label
                    className="selectLabel flex"
                    style={{ width: "100px" }}
                  >
                    Pcs
                    <input
                      type="number"
                      name="route_title"
                      className="numberInput"
                      value={data?.p}
                      style={{ width: "100px" }}
                      onChange={(e) =>
                        setdata({
                          ...data,
                          p: e.target.value,
                        })
                      }
                      maxLength={42}
                      onWheel={(e) => e.preventDefault()}
                      autoFocus={true}
                    />
                  </label>
                </div>
              </div>

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
  );
}
function WarehouseUpdatePopup({ popupInfo, updateChanges, onClose }) {
  const [data, setdata] = useState("");

  const [warehouse, setWarehouse] = useState([]);
  const getItemsData = async () => {
    const response = await axios({
      method: "get",
      url: "/warehouse/GetWarehouseList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setWarehouse(response.data.result);
  };
  useEffect(() => {
    setdata(popupInfo.warehouse_uuid);
    getItemsData();
  }, [popupInfo]);
  const submitHandler = async (e) => {
    e.preventDefault();
    updateChanges(data, popupInfo.orderData);
    onClose();
  };

  return (
    <div className="overlay" style={{ zIndex: 99999999999 }}>
      <div
        className="modal"
        style={{ height: "fit-content", width: "fit-content", padding: 50 }}
      >
        <div
          className="content"
          // style={{ flexDirection: "row", flexWrap: "wrap", gap: "5" }}
          style={{
            height: "fit-content",
            padding: "20p0",
            marginBottom: "10px",
            width: "fit-content",
          }}
        >
          <div style={{ overflowY: "scroll" }}>
            <form className="form" onSubmit={submitHandler}>
              <div className="row">
                <h1>Update Warehouse</h1>
              </div>
              <div className="row">
                <h2>Order:{popupInfo.orderData.invoice_number}</h2>
              </div>

              <div className="formGroup">
                <div className="row">
                  <label className="selectLabel">
                    Warehouse
                    <div className="inputGroup" style={{ width: "200px" }}>
                      <Select
                        options={[
                          { value: 0, label: "None" },
                          ...warehouse.map((a) => ({
                            value: a.warehouse_uuid,
                            label: a.warehouse_title,
                          })),
                        ]}
                        onChange={(doc) => setdata(doc.value)}
                        value={
                          data
                            ? {
                                value: data,
                                label: warehouse?.find(
                                  (j) => j.warehouse_uuid === data
                                )?.warehouse_title,
                              }
                            : { value: 0, label: "None" }
                        }
                        autoFocus={!data}
                        openMenuOnFocus={true}
                        menuPosition="fixed"
                        menuPlacement="auto"
                        placeholder="Select"
                      />
                    </div>
                  </label>
                </div>
              </div>

              <button type="submit" className="submit">
                Save changes
              </button>
            </form>
          </div>
          <button
            type="button"
            onClick={() => onClose()}
            className="closeButton"
          >
            x
          </button>
        </div>
      </div>
    </div>
  );
}
