/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-loop-func */
import axios from "axios";
import React, { useEffect, useState, useRef, useContext } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  UNSAFE_NavigationContext,
} from "react-router-dom";
import { AiFillPlayCircle } from "react-icons/ai";
import { openDB } from "idb";
import { Billing } from "../functions";
import { AiOutlineReload } from "react-icons/ai";
import { IoArrowBackOutline } from "react-icons/io5";
import { Phone } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HomeIcon from "@mui/icons-material/Home";
import { ArrowDropDown, SquareFoot } from "@mui/icons-material";
let intervalId = 0;

const ProcessingOrders = ({ navigation }) => {
  const [BarcodeMessage, setBarcodeMessage] = useState([]);
  const [itemChanged, setItemChanged] = useState([]);
  const [popupDelivery, setPopupDelivery] = useState(false);
  const [checking, setChecking] = useState(true);
  const [confirmPopup, setConfirmPopup] = useState(false);
  const [popupBarcode, setPopupBarcode] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState(false);
  const [holdPopup, setHoldPopup] = useState(false);
  const params = useParams();
  const [popupForm, setPopupForm] = useState(false);
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [counters, setCounters] = useState([]);
  const [itemCategories, setItemsCategory] = useState([]);
  const [playCount, setPlayCount] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState();
  const audiosRef = useRef();
  const Location = useLocation();
  const [playerSpeed, setPlayerSpeed] = useState(1);
  const [updateBilling, setUpdateBilling] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [oneTimeState, setOneTimeState] = useState(false);
  const [barcodeFilter, setBarcodeFilter] = useState("");
  const [barcodeFilterState, setBarcodeFilterState] = useState("");
  const [tempQuantity, setTempQuantity] = useState([]);
  const [users, setUsers] = useState([]);
  const [warningPopup, setWarningPopUp] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phonePopup, setPhonePopup] = useState(false);
  const [dropdown, setDropDown] = useState(false);
  const Navigate = useNavigate();
  useEffect(() => {
    window.history.pushState(null, document.title, window.location.href);
    window.addEventListener("popstate", function (event) {
      if (selectedOrder) {
        setConfirmPopup(true);
        window.history.pushState(null, document.title, window.location.href);
      } else {
        Navigate(-1);
      }
    });
  }, [selectedOrder, confirmPopup]);
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

  useEffect(() => {
    let data = sessionStorage.getItem("playCount");
    if (data) {
      setPlayCount(data);
    }
    getUsers();
  }, []);

  const getIndexedDbData = async () => {
    const db = await openDB("BT", +localStorage.getItem("IDBVersion") || 1);
    let tx = await db.transaction("items", "readwrite").objectStore("items");
    let item = await tx.getAll();
    setItems(item);
    let store = await db
      .transaction("companies", "readwrite")
      .objectStore("companies");
    let company = await store.getAll();
    setCompanies(company);
    store = await db
      .transaction("item_category", "readwrite")
      .objectStore("item_category");
    let route = await store.getAll();
    setItemsCategory(route);
    store = await db.transaction("counter", "readwrite").objectStore("counter");
    let countersData = await store.getAll();
    setCounters(countersData);
    store = await db
      .transaction("payment_modes", "readwrite")
      .objectStore("payment_modes");
    let PaymentData = await store.getAll();
    setPaymentModes(PaymentData);
    db.close();
  };

  const audioLoopFunction = ({ i, recall, forcePlayCount }) => {
    try {
      clearInterval(intervalId);

      if (audiosRef.current?.[i]?.getAttribute("played") === "true") {
        console.log(`skipped number : ${i + 1}`);
        audioLoopFunction({ i: i + 1, recall, forcePlayCount });
        return;
      }

      console.log(`trying to play audio number : ${i + 1}`);

      navigator.mediaSession.setActionHandler("play", function () {
        audiosRef.current[i].play();
        navigator.mediaSession.playbackState = "playing";
      });

      navigator.mediaSession.setActionHandler("pause", function () {
        audiosRef.current[i].pause();
        navigator.mediaSession.playbackState = "paused";
      });

      audiosRef.current[i]
        .play()
        .then((res) => {
          if (!forcePlayCount) {
            audiosRef.current[i].pause();
            navigator.mediaSession.playbackState = "paused";
            console.log(`Paused ${i + 1}/${audiosRef.current.length} audios`);
          } else {
            console.log(`Playing ${i + 1}/${audiosRef.current.length} audios`);
            navigator.mediaSession.playbackState = "playing";
            console.log("forcePlayCount:", forcePlayCount);
          }

          intervalId = setInterval(() => {
            if (
              audiosRef.current[i]?.duration -
                audiosRef.current[i].currentTime >
              8.8
            )
              return console.log(
                `returning : ${
                  audiosRef.current[i]?.duration -
                  audiosRef.current[i].currentTime
                }`
              );

            clearInterval(intervalId);
            audiosRef.current[i].currentTime = audiosRef.current[i].duration;
            audiosRef.current[i].pause();
            audiosRef.current[i].setAttribute("played", "true");
            navigator.mediaSession.playbackState = "paused";
            setItemChanged((prev) => [
              ...prev,
              selectedOrder.item_details.find(
                (a) => a.item_uuid === audiosRef.current[i].item_uuid
              ),
            ]);
            setSelectedOrder((prev) => ({
              ...prev,
              item_details: prev.item_details.map((a) =>
                a.item_uuid === audiosRef.current[i].item_uuid
                  ? { ...a, status: 1 }
                  : a
              ),
            }));

            if (!audiosRef.current[i + 1])
              return console.log(`no next audio : ${i + 1}`);

            setTimeout(() => {
              audioLoopFunction({
                i: i + 1,
                forcePlayCount: forcePlayCount ? forcePlayCount - 1 : 0,
                recall,
              });
            }, 1000);
          }, 100);
        })
        .catch((error) => {
          if (recall)
            setTimeout(() => {
              console.log(
                `could not play ${i} audio : ${error.message} recall : ${recall}`
              );
              audioLoopFunction({ i, recall });
            }, 3000);
          else console.log(`could not play ${i} audio : ${error.message}`);
        });
    } catch (error) {
      console.log(error.message);
    }
  };

  const getTripOrders = async () => {
    setLoading(true);
    const db = await openDB("BT", +localStorage.getItem("IDBVersion") || 1);
    let tx = db.transaction("items", "readonly").objectStore("items");
    let IDBItems = await tx.getAll();
    setItems(IDBItems);
    db.close();
    const response = await axios({
      method: "post",
      url: `/orders/${
        Location.pathname.includes("checking")
          ? "GetOrderCheckingList"
          : Location.pathname.includes("delivery")
          ? "GetOrderDeliveryList"
          : "GetOrderProcessingList"
      }`,
      data: {
        trip_uuid: params.trip_uuid,
        user_uuid: localStorage.getItem("user_uuid"),
      },
    });
    console.log(response);
    if (response.data.success) {
      setOrders(response.data.result);
      setLoading(false);
    }
    if (!response?.data?.result) return;
  };

  useEffect(() => {
    getTripOrders();
    getIndexedDbData();
  }, []);

  useEffect(() => {
    if (Location.pathname.includes("delivery") && selectedOrder && !checking) {
      let data = paymentModes?.filter(
        (a) =>
          !counters
            ?.find((a) => selectedOrder?.counter_uuid === a.counter_uuid)
            ?.payment_modes?.filter((b) => b === a.mode_uuid)?.length
      );
      if (data?.length || selectedOrder.credit_allowed !== "Y") {
        setDeliveryMessage(data || []);
        setChecking(true);
      }
    }
  }, [selectedOrder]);

  useEffect(() => {
    if (!selectedOrder || audiosRef.current?.[0]) return;

    const audioElements = [];
    const unprocessedItems =
      selectedOrder?.item_details?.filter((a) => !a.status) || [];
    let progressCount = 0;

    unprocessedItems.forEach((order_item) => {
      const item = items.find((j) => j.item_uuid === order_item.item_uuid);

      if (item) {
        console.log(item.item_title);
        const handleQty = (value, label, sufix) =>
          value ? `${value} ${label}${value > 1 ? sufix : ""}` : "";
        const speechString = `${item.pronounce} ${item.mrp} MRP ${handleQty(
          order_item.b,
          "Box",
          "es"
        )} ${handleQty(
          (+order_item.p || 0) + (+order_item.free || 0),
          "Piece",
          "s"
        )}`;

        let audioElement = new Audio(
          `${axios.defaults.baseURL}/stream/${speechString
            .toLowerCase()
            .replaceAll(" ", "_")}`
        );

        audioElement.addEventListener(
          "durationchange",
          function (e) {
            if (audioElement.duration !== Infinity) {
              audioElement.remove();
              console.log(audioElement.duration);
              audioElement.item_uuid = item.item_uuid;
              loopEndFunctioin(audioElement);
            }
          },
          false
        );

        audioElement.load();
        audioElement.currentTime = 24 * 60 * 60;
        audioElement.volume = 0;

        const loopEndFunctioin = (audio) => {
          audioElements.push(audio);
          console.log(`${++progressCount}/${unprocessedItems?.length}`);

          if (progressCount === unprocessedItems?.length) {
            console.log(audioElements);
            audiosRef.current = audioElements
              .sort(itemsSortFunction)
              .map((i) => {
                i.volume = 1;
                i.currentTime = 0;
                return i;
              });
            audioLoopFunction({ i: 0, recall: true });
          }
        };
      } else progressCount++;
    });
  }, [selectedOrder]);

  const postActivity = async (others = {}) => {
    let time = new Date();
    let data = {
      user_uuid: localStorage.getItem("user_uuid"),
      role: Location.pathname.includes("checking")
        ? "Checking"
        : Location.pathname.includes("delivery")
        ? "Delivery"
        : "Processing",
      narration:
        counters.find((a) => a.counter_uuid === selectedOrder.counter_uuid)
          ?.counter_title +
        (sessionStorage.getItem("route_title")
          ? ", " + sessionStorage.getItem("route_title")
          : ""),
      timestamp: time.getTime(),
      ...others,
    };
    const response = await axios({
      method: "post",
      url: "/userActivity/postUserActivity",
      data,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      console.log(response);
    }
  };

  const postOrderData = async (
    dataArray = selectedOrder ? [selectedOrder] : orders,
    hold = false
  ) => {
    setLoading(true);
    console.log(dataArray);
    setPopupBarcode(false);
    let finalData = [];
    for (let orderObject of dataArray) {
      let data = orderObject;
      if (updateBilling) {
        let billingData = await Billing({
          replacement: data.replacement,
          counter: counters.find((a) => a.counter_uuid === data.counter_uuid),
          add_discounts: true,
          items: data.item_details.map((a) => {
            let itemData = items.find((b) => a.item_uuid === b.item_uuid);
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
      }

      let time = new Date();
      if (
        data?.item_details?.filter((a) => +a.status === 1 || +a.status === 3)
          ?.length === data?.item_details.length &&
        Location.pathname.includes("processing")
      )
        data = {
          ...data,
          item_details: data.item_details.map((a) =>
            +a.status === 3 ? { ...a, b: 0, p: 0 } : a
          ),
          processing_canceled: data?.item_details?.filter(
            (a) => +a.status === 3
          ),
          status: [
            ...data.status,
            {
              stage: "2",
              time: time.getTime(),
              user_uuid: localStorage.getItem("user_uuid"),
            },
          ],
        };
      if (Location.pathname.includes("checking"))
        data = {
          ...data,
          status: [
            ...data.status,
            {
              stage: "3",
              time: time.getTime(),
              user_uuid: localStorage.getItem("user_uuid"),
            },
          ],
        };
      if (Location.pathname.includes("delivery"))
        data = {
          ...data,
          status: [
            ...data.status,
            {
              stage: "4",
              time: time.getTime(),
              user_uuid: localStorage.getItem("user_uuid"),
            },
          ],
        };

      data = Object.keys(data)
        .filter((key) => key !== "others" || key !== "items")
        .reduce((obj, key) => {
          obj[key] = data[key];
          return obj;
        }, {});

      finalData.push({ ...data, opened_by: 0 });
    }
    const response = await axios({
      method: "put",
      url: "/orders/putOrders",
      data: finalData,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      console.log(response);
      sessionStorage.setItem("playCount", playCount);
      setLoading(false);
      getTripOrders();
      if (!hold) {
        let dataItem = Location.pathname.includes("processing")
          ? itemChanged
          : finalData[0]?.item_details;

        let qty = `${
          dataItem?.length > 1
            ? dataItem?.reduce((a, b) => (+a.b || 0) + (+b.b || 0))
            : dataItem?.length
            ? dataItem[0]?.b
            : 0
        }:${
          dataItem?.length > 1
            ? dataItem?.reduce((a, b) => (+a.p || 0) + (+b.p || 0))
            : dataItem?.length
            ? dataItem[0]?.p
            : 0
        }`;
        setLoading(false);
        setSelectedOrder(false);

        postActivity({
          activity:
            (Location.pathname.includes("checking")
              ? "Checking"
              : Location.pathname.includes("delivery")
              ? "Delivery"
              : "Processing") + " End",
          range: Location.pathname.includes("processing")
            ? itemChanged.length
            : finalData[0]?.item_details?.length,
          qty,
          amt: finalData[0].order_grandtotal || 0,
        });
      }
    }
  };
  const postOrderContained = async (data = selectedOrder, opened_by = 0) => {
    data = Object.keys(data)
      .filter((key) => key !== "others" || key !== "items")
      .reduce((obj, key) => {
        obj[key] = data[key];
        return obj;
      }, {});

    console.log(data);
    const response = await axios({
      method: "put",
      url: "/orders/putOrders",
      data: [{ order_uuid: data.order_uuid, opened_by }],
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      console.log(response);
      getTripOrders();
    }
  };
  const postHoldOrders = async (orders) => {
    await postOrderData(orders, true);
  };
  useEffect(() => {
    if (!orderCreated && selectedOrder) {
      postActivity({
        activity:
          (Location.pathname.includes("checking")
            ? "Checking"
            : Location.pathname.includes("delivery")
            ? "Delivery"
            : "Processing") + " Start",
      });
      setOrderCreated(true);
    }
  }, [oneTimeState, selectedOrder]);

  const itemsSortFunction = (a, b) => {
    let aItem = items.find((i) => i.item_uuid === a.item_uuid);
    let bItem = items.find((i) => i.item_uuid === b.item_uuid);
    let aItemCompany = companies.find(
      (i) => i.company_uuid === aItem?.company_uuid
    );
    let bItemCompany = companies.find(
      (i) => i.company_uuid === bItem?.company_uuid
    );
    let aItemCategory = itemCategories.find(
      (i) => i.category_uuid === aItem?.category_uuid
    );
    let bItemCategory = itemCategories.find(
      (i) => i.category_uuid === bItem?.category_uuid
    );
    return (
      aItemCompany?.company_title?.localeCompare(bItemCompany?.company_title) ||
      aItemCategory?.category_title?.localeCompare(
        bItemCategory?.category_title
      ) ||
      aItem?.item_title?.localeCompare(bItem?.item_title)
    );
  };

  useEffect(() => {
    if (selectedOrder)
      setBarcodeFilterState(
        items?.map((a) => ({
          item_uuid: a.item_uuid,
          one_pack: a.one_pack,
          qty: 0,
          barcode: items.find((b) => a.item_uuid === b.item_uuid)?.barcode,
        }))
      );
  }, [selectedOrder]);

  const barcodeFilterUpdate = () => {
    if (
      barcodeFilterState.find(
        (a) =>
          a?.barcode?.filter((a) => a).filter((a) => a === barcodeFilter)
            ?.length
      )
    ) {
      setBarcodeFilterState((prev) =>
        prev.map((a) =>
          a?.barcode?.filter((a) => a).filter((a) => a === barcodeFilter)
            ?.length
            ? { ...a, qty: (+a.qty || 0) + (+a.one_pack || 1) }
            : a
        )
      );
    } else {
      setBarcodeFilterState((prev) =>
        prev.length
          ? [...prev, { barcode: [barcodeFilter], qty: 1 }]
          : { barcode: [barcodeFilter], qty: 1 }
      );
    }
    setBarcodeFilter("");
  };

  const checkingQuantity = () => {
    setLoading(true);
    let data = [];
    let item_details = selectedOrder
      ? selectedOrder?.item_details
      : [].concat
          .apply(
            [],
            orders.map((a) => a.item_details)
          )
          .filter((a) => a.status === 1)
          .reduce((acc, curr) => {
            let item = acc.find((item) => item.item_uuid === curr.item_uuid);

            if (item) {
              item.p = +item.p + curr.p;
              item.b = +item.b + curr.b;
            } else {
              acc.push(curr);
            }

            return acc;
          }, []);
    console.log(item_details);
    for (let a of tempQuantity) {
      let orderItem = item_details.find((b) => b.item_uuid === a.item_uuid);
      console.log(
        (+orderItem?.b || 0) * +(+a?.conversion || 1) +
          orderItem?.p +
          (+orderItem?.free || 0),
        (+a?.b || 0) * +(+a?.conversion || 1) + a?.p
      );
      if (
        (+orderItem?.b || 0) * +(+a?.conversion || 1) +
          orderItem?.p +
          (+orderItem?.free || 0) !==
        (+a?.b || 0) * +(+a?.conversion || 1) + a?.p
      )
        setBarcodeMessage((prev) =>
          prev.length
            ? [
                ...prev,
                {
                  ...a,
                  ...orderItem,
                  barcodeQty: (+a?.b || 0) * +(+a?.conversion || 1) + a?.p,
                  case: 1,
                  qty:
                    (+orderItem?.b || 0) * +(+a?.conversion || 1) +
                    orderItem?.p +
                    (+orderItem?.free || 0),
                },
              ]
            : [
                {
                  ...a,
                  ...orderItem,
                  barcodeQty: (+a?.b || 0) * +(+a?.conversion || 1) + a?.p,
                  case: 1,
                  qty:
                    (+orderItem?.b || 0) * +(+a?.conversion || 1) +
                    orderItem?.p +
                    (+orderItem?.free || 0),
                },
              ]
        );
      else data.push(a);
    }
    if (selectedOrder) {
      for (let a of barcodeFilterState.filter(
        (a) => !data.filter((b) => b.item_uuid === a.item_uuid).length
      )) {
        let orderItem = item_details.find((b) => b.item_uuid === a.item_uuid);
        let ItemData = items.find((b) => b.item_uuid === a.item_uuid);
        console.log(a.qty, ItemData);
        if (
          (+orderItem?.b || 0) * +(+ItemData?.conversion || 1) +
            orderItem?.p +
            (+orderItem?.free || 0) !==
          a?.qty
        ) {
          if (orderItem)
            setBarcodeMessage((prev) =>
              prev.length
                ? [
                    ...prev,
                    {
                      ...ItemData,
                      ...orderItem,
                      barcodeQty: (+a?.b || 0) * +(+a?.conversion || 1) + a?.p,
                      case: 1,
                      qty:
                        (+orderItem?.b || 0) * +(+ItemData?.conversion || 1) +
                        orderItem?.p +
                        (+orderItem?.free || 0),
                    },
                  ]
                : [
                    {
                      ...ItemData,
                      ...orderItem,
                      barcodeQty: (+a?.b || 0) * +(+a?.conversion || 1) + a?.p,
                      case: 1,
                      qty:
                        (+orderItem?.b || 0) * +(+ItemData?.conversion || 1) +
                        orderItem?.p +
                        (+orderItem?.free || 0),
                    },
                  ]
            );
          else if (ItemData && a?.qty)
            setBarcodeMessage((prev) =>
              prev.length
                ? [
                    ...prev,
                    {
                      ...ItemData,
                      barcodeQty: a.qty,
                      case: 2,
                      qty:
                        (+orderItem?.b || 0) * +(+ItemData?.conversion || 1) +
                        orderItem?.p +
                        (+orderItem?.free || 0),
                    },
                  ]
                : [
                    {
                      ...ItemData,
                      barcodeQty: a.qty,
                      case: 2,
                      qty:
                        (+orderItem?.b || 0) * +(+ItemData?.conversion || 1) +
                        orderItem?.p +
                        (+orderItem?.free || 0),
                    },
                  ]
            );
          else if (a?.qty)
            setBarcodeMessage((prev) =>
              prev.length
                ? [
                    ...prev,
                    {
                      ...a,
                      barcodeQty: a.qty,
                      case: 3,
                      qty:
                        (+orderItem?.b || 0) * +(+ItemData?.conversion || 1) +
                        orderItem?.p +
                        (+orderItem?.free || 0),
                    },
                  ]
                : [
                    {
                      ...a,
                      barcodeQty: a.qty,
                      case: 3,
                      qty:
                        (+orderItem?.b || 0) * +(+ItemData?.conversion || 1) +
                        orderItem?.p +
                        (+orderItem?.free || 0),
                    },
                  ]
            );
        }
      }
    }

    setTimeout(() => {
      setPopupBarcode(true);
      setLoading(false);
    }, 2000);
  };
  const updateBillingAmount = async () => {
    let billingData = await Billing({
      replacement: selectedOrder.replacement,
      counter: counters.find(
        (a) => a.counter_uuid === selectedOrder.counter_uuid
      ),
      add_discounts: true,
      items: selectedOrder.item_details.map((a) => {
        let itemData = items.find((b) => a.item_uuid === b.item_uuid);
        return {
          ...itemData,
          ...a,
          price: itemData?.price || 0,
        };
      }),
    });
    setSelectedOrder((prev) => ({
      ...prev,
      ...billingData,
      item_details: billingData.items,
    }));
  };
  useEffect(() => {
    if (Location.pathname.includes("delivery")) {
      updateBillingAmount();
    }
  }, []);

  return (
    <div>
      <nav className="user_nav nav_styling" style={{ top: "0" }}>
        <div
          className="user_menubar flex"
          style={{ width: "160px", justifyContent: "space-between" }}
        >
          <IoArrowBackOutline
            className="user_Back_icon"
            onClick={() => {
              if (selectedOrder) {
                setConfirmPopup(true);
              } else Navigate(-1);
            }}
          />
          {!selectedOrder ? (
            <HomeIcon
              className="user_Back_icon"
              onClick={() => {
                Navigate("/users");
              }}
            />
          ) : (
            ""
          )}
        </div>

        <h1 style={{ width: "100%", textAlign: "left", marginLeft: "30px" }}>
          {selectedOrder ? selectedOrder.counter_title : "Orders"}
        </h1>
        {!selectedOrder ? (
          <div
            className="user_menubar flex"
            style={{ width: "160px", justifyContent: "space-between" }}
          >
            <AiOutlineReload
              className="user_Back_icon"
              onClick={() => {
                if (selectedOrder) {
                  setConfirmPopup(true);
                } else getTripOrders();
              }}
            />
          </div>
        ) : (
          ""
        )}
        {!selectedOrder ? (
          <>
            <div className="inputs">
              <div
                id="customer-dropdown-trigger"
                className={"active"}
                style={{
                  transform: dropdown ? "rotate(0deg)" : "rotate(180deg)",
                  width: "30px",
                  height: "30px",
                  backgroundColor: "#fff",
                }}
                onClick={(e) => {
                  setDropDown((prev) => !prev);
                }}
              >
                <ArrowDropDown style={{ color: "green" }} />
              </div>
            </div>

            {selectedOrder &&
            !(
              Location.pathname.includes("checking") ||
              Location.pathname.includes("delivery")
            ) ? (
              <>
                <input
                  className="searchInput"
                  style={{
                    border: "none",
                    borderBottom: "2px solid #fff",
                    borderRadius: "0px",
                    width: "50px",
                    padding: "0 5px",
                    backgroundColor: "transparent",
                    color: "#fff",
                    marginRight: "10px",
                  }}
                  value={playCount}
                  onChange={(e) => setPlayCount(e.target.value)}
                />
                <select
                  className="audioPlayerSpeed"
                  style={{
                    border: "none",
                    borderBottom: "2px solid #fff",
                    borderRadius: "0px",
                    width: "75px",
                    padding: "0 5px",
                    backgroundColor: "transparent",
                    color: "#fff",
                  }}
                  defaultValue={playerSpeed}
                  onChange={(e) => {
                    console.log(e.target.value);
                    setPlayerSpeed(e.target.value);
                    audiosRef.current.forEach(
                      (i) => (i.playbackRate = +e.target.value)
                    );
                  }}
                >
                  <option value="1">1x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.50">1.50x</option>
                </select>
              </>
            ) : (
              ""
            )}
          </>
        ) : (
          ""
        )}
      </nav>
      {dropdown ? (
        <div
          id="customer-details-dropdown"
          className={"page1 flex"}
          style={{ top: "40px", flexDirection: "column", zIndex: "200" }}
          onMouseLeave={() => setDropDown(false)}
        >
          {Location.pathname.includes("checking") ? (
            <button
              className="simple_Logout_button"
              onClick={() => {
                setHoldPopup("Checking Summary");
                setDropDown(false);
              }}
            >
              Summary
            </button>
          ) : window.location.pathname.includes("processing") ? (
            <>
              <button
                className="simple_Logout_button"
                onClick={() => {
                  setHoldPopup("Summary");
                  setDropDown(false);
                }}
              >
                Summary
              </button>
              <button
                className="simple_Logout_button"
                onClick={() => {
                  setHoldPopup("Hold");
                  setDropDown(false);
                }}
              >
                Hold
              </button>
            </>
          ) : (
            ""
          )}
        </div>
      ) : (
        ""
      )}
      <div
        className="item-sales-container orders-report-container"
        style={{
          width: "100vw",
          left: "0",
          top: "50px",
          textAlign: "center",
        }}
      >
        {selectedOrder ? (
          <>
            <div
              className="flex"
              style={{ justifyContent: "space-between", margin: "10px 0" }}
            >
              <h2 style={{ width: "20vw", textAlign: "start" }}>
                {selectedOrder.invoice_number}
              </h2>
              {Location.pathname.includes("delivery") ? (
                <h2 style={{ width: "20vw", textAlign: "start" }}>
                  Rs: {selectedOrder.order_grandtotal}
                </h2>
              ) : (
                ""
              )}
              {Location.pathname.includes("checking") ? (
                <input
                  type="text"
                  onChange={(e) => setBarcodeFilter(e.target.value)}
                  value={barcodeFilter}
                  placeholder="Search Barcode..."
                  className="searchInput"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") barcodeFilterUpdate();
                  }}
                />
              ) : !Location.pathname.includes("delivery") ? (
                <button
                  className="item-sales-search"
                  style={{ width: "max-content" }}
                  onClick={() =>
                    audioLoopFunction({ i: 0, forcePlayCount: +playCount })
                  }
                >
                  Play
                </button>
              ) : (
                ""
              )}
              <button
                className="item-sales-search"
                style={{
                  width: "max-content",
                }}
                onClick={() => {
                  Location.pathname.includes("checking")
                    ? checkingQuantity()
                    : Location.pathname.includes("delivery")
                    ? setPopupDelivery(true)
                    : postOrderData();
                }}
              >
                Save
              </button>
            </div>
          </>
        ) : (
          ""
        )}
        <div
          className="table-container-user item-sales-container"
          style={{
            width: "100vw",
            overflow: "scroll",
            left: "0",
            top: "0",
            display: "flex",
            minHeight: "93vh",
          }}
        >
          <table
            className="user-table"
            style={{
              width:
                Location.pathname.includes("checking") ||
                Location.pathname.includes("delivery")
                  ? "100"
                  : "max-content",
              height: "fit-content",
            }}
          >
            <thead>
              <tr>
                {selectedOrder &&
                !(
                  Location.pathname.includes("checking") ||
                  Location.pathname.includes("delivery")
                ) ? (
                  <th></th>
                ) : (
                  ""
                )}
                <th>S.N</th>
                {selectedOrder ? (
                  <>
                    <th colSpan={2}>
                      <div className="t-head-element">Item Name</div>
                    </th>
                    <th>
                      <div className="t-head-element">MRP</div>
                    </th>

                    {!Location.pathname.includes("checking") ? (
                      <>
                        <th>
                          <div className="t-head-element">Qty</div>
                        </th>
                        {!Location.pathname.includes("delivery") ? (
                          <th colSpan={2}>
                            <div className="t-head-element">Action</div>
                          </th>
                        ) : (
                          ""
                        )}
                      </>
                    ) : (
                      <th>Quantity</th>
                    )}
                  </>
                ) : (
                  <>
                    <th colSpan={2}>
                      <div className="t-head-element">Counter Title</div>
                    </th>
                    <th colSpan={2}>
                      <div className="t-head-element">Progress</div>
                    </th>
                    <th>
                      <div className="t-head-element">User</div>
                    </th>
                    <th>
                      <div className="t-head-element"></div>
                    </th>
                    {!Location.pathname.includes("checking") ? <th></th> : ""}
                  </>
                )}
              </tr>
            </thead>
            <tbody className="tbody">
              {selectedOrder
                ? selectedOrder?.item_details
                    .filter(
                      (a) =>
                        !Location.pathname.includes("delivery") ||
                        +a.status === 1
                    )
                    .filter(
                      (a) =>
                        !Location.pathname.includes("checking") ||
                        +a.status === 1
                    )
                    ?.sort(itemsSortFunction)
                    ?.map((item, i) => (
                      <tr
                        key={item.item_uuid}
                        style={{
                          height: "30px",
                          backgroundColor: window.location.pathname.includes(
                            "processing"
                          )
                            ? +item.status === 1
                              ? "green"
                              : +item.status === 2
                              ? "yellow"
                              : +item.status === 3
                              ? "red"
                              : "#fff"
                            : "#fff",
                          color: window.location.pathname.includes("processing")
                            ? +item.status === 1 || +item.status === 3
                              ? "#fff"
                              : "#000"
                            : "#000",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (Location.pathname.includes("checking")) {
                            setTempQuantity(
                              tempQuantity?.filter(
                                (a) => a.item_uuid === item.item_uuid
                              )?.length
                                ? tempQuantity?.map((a) =>
                                    a.item_uuid === item.item_uuid
                                      ? {
                                          ...a,
                                          b:
                                            +(a.b || 0) +
                                            parseInt(
                                              (+a?.one_pack || 1) /
                                                +a.conversion
                                            ),

                                          p:
                                            ((a?.p || 0) +
                                              (+a?.one_pack || 1)) %
                                            +a.conversion,
                                        }
                                      : a
                                  )
                                : tempQuantity?.length
                                ? [
                                    ...tempQuantity,
                                    ...items
                                      ?.filter(
                                        (a) => a.item_uuid === item.item_uuid
                                      )
                                      .map((a) => ({
                                        ...a,
                                        b:
                                          +(a.b || 0) +
                                          parseInt(
                                            ((a?.p || 0) +
                                              (+a?.one_pack || 1)) /
                                              +a.conversion
                                          ),

                                        p:
                                          ((a?.p || 0) + (+a?.one_pack || 1)) %
                                          +a.conversion,
                                      })),
                                  ]
                                : items
                                    ?.filter(
                                      (a) => a.item_uuid === item.item_uuid
                                    )
                                    .map((a) => ({
                                      ...a,
                                      b: (
                                        (+a.b || 0) +
                                        +((+a?.p || 0) + (+a?.one_pack || 1)) /
                                          +a.conversion
                                      ).toFixed(0),
                                      p:
                                        ((+a?.p || 0) + (+a?.one_pack || 1)) %
                                        +a.conversion,
                                    }))
                            );
                          }
                        }}
                      >
                        {selectedOrder &&
                        !(
                          Location.pathname.includes("checking") ||
                          Location.pathname.includes("delivery")
                        ) ? (
                          <td
                            style={{ padding: "10px", height: "50px" }}
                            onClick={() => {
                              setItemChanged((prev) =>
                                +item.status !== 1
                                  ? [
                                      ...prev,
                                      selectedOrder.item_details.find(
                                        (a) => a.item_uuid === item.item_uuid
                                      ),
                                    ]
                                  : prev
                              );
                              setOneTimeState();
                              setSelectedOrder((prev) => ({
                                ...prev,
                                item_details: prev.item_details.map((a) =>
                                  a.item_uuid === item.item_uuid
                                    ? {
                                        ...a,
                                        status: +a.status === 1 ? 0 : 1,
                                      }
                                    : a
                                ),
                              }));

                              audiosRef.current?.forEach((audio) => {
                                if (audio.item_uuid === item.item_uuid) {
                                  audio.setAttribute("played", "true");
                                }
                              });
                              audioLoopFunction({ i: 0 });
                            }}
                          >
                            {item.item_uuid === "" ? (
                              <AiFillPlayCircle
                                style={{ fontSize: "25px", cursor: "pointer" }}
                              />
                            ) : +item.status !== 1 ? (
                              <CheckCircleOutlineIcon />
                            ) : (
                              ""
                            )}
                          </td>
                        ) : (
                          ""
                        )}
                        <td>{i + 1}</td>
                        <td colSpan={2}>
                          {
                            items.find((a) => a.item_uuid === item.item_uuid)
                              ?.item_title
                          }
                        </td>
                        <td>
                          {
                            items.find((a) => a.item_uuid === item.item_uuid)
                              ?.mrp
                          }
                        </td>

                        <td
                          onClick={(e) => {
                            e.stopPropagation();
                            setOneTimeState();
                            setPopupForm(
                              items.find((a) => a.item_uuid === item.item_uuid)
                            );
                          }}
                        >
                          {Location.pathname.includes("delivery")
                            ? item.b === 0 && item.p === 0 && item.free
                              ? item.free + "(F)"
                              : item.b +
                                ":" +
                                item.p +
                                (item.free ? "  " + item.free + "(F)" : "")
                            : Location.pathname.includes("checking")
                            ? (tempQuantity?.find(
                                (a) => a.item_uuid === item.item_uuid
                              )?.b || 0) +
                              ":" +
                              (tempQuantity?.find(
                                (a) => a.item_uuid === item.item_uuid
                              )?.p || 0)
                            : item.b +
                              ":" +
                              ((+item.p || 0) + (+item.free || 0))}
                        </td>
                        {!(
                          Location.pathname.includes("delivery") ||
                          Location.pathname.includes("checking")
                        ) ? (
                          <>
                            <td className="flex">
                              <button
                                className="item-sales-search"
                                style={{ width: "max-content" }}
                                onClick={() => {
                                  setOneTimeState();

                                  setSelectedOrder((prev) => ({
                                    ...prev,
                                    item_details: prev.item_details.map((a) =>
                                      a.item_uuid === item.item_uuid
                                        ? {
                                            ...a,
                                            status: +a.status === 2 ? 0 : 2,
                                          }
                                        : a
                                    ),
                                  }));
                                }}
                              >
                                Hold
                              </button>
                            </td>
                            <td>
                              <DeleteOutlineIcon
                                onClick={() => {
                                  setOneTimeState();

                                  setSelectedOrder((prev) => ({
                                    ...prev,
                                    item_details: prev.item_details.map((a) =>
                                      a.item_uuid === item.item_uuid
                                        ? {
                                            ...a,
                                            status: +a.status === 3 ? 0 : 3,
                                          }
                                        : a
                                    ),
                                  }));
                                }}
                              />
                            </td>
                          </>
                        ) : (
                          ""
                        )}
                      </tr>
                    ))
                : orders
                    ?.sort((a, b) => a.created_at - b.created_at)
                    ?.map((item, i) => (
                      <tr
                        key={Math.random()}
                        style={{
                          height: "30px",
                          backgroundColor:
                            +item.opened_by || item.opened_by !== "0"
                              ? "yellow"
                              : "#fff",
                        }}
                      >
                        <td>{i + 1}</td>
                        <td
                          colSpan={2}
                          onClick={(e) => {
                            e.stopPropagation();
                            setChecking(false);
                            setWarningPopUp(item);
                          }}
                        >
                          {item.counter_title}
                        </td>
                        <td
                          colSpan={2}
                          onClick={(e) => {
                            e.stopPropagation();
                            setChecking(false);
                            setWarningPopUp(item);
                          }}
                        >
                          {
                            item?.item_details?.filter((a) => +a.status === 1)
                              ?.length
                          }
                          /
                          {item?.item_details
                            .filter(
                              (a) =>
                                !Location.pathname.includes("delivery") ||
                                +a.status === 1
                            )
                            .filter(
                              (a) =>
                                !Location.pathname.includes("checking") ||
                                +a.status === 1
                            )?.length || 0}
                        </td>
                        <td>
                          {users.find((a) => a.user_uuid === item.opened_by)
                            ?.user_title || "-"}
                        </td>
                        <td>
                          {item?.mobile ? (
                            <Phone
                              className="user_Back_icon"
                              style={{ color: "#4ac959" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.mobile.length === 1) {
                                  window.location.assign(
                                    "tel:" + item?.mobile[0]
                                  );
                                } else {
                                  setPhonePopup(item.mobile);
                                }
                              }}
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                        {!Location.pathname.includes("checking") ? (
                          <td>
                            <DeleteOutlineIcon
                              onClick={() => {
                                setDeletePopup(item);
                              }}
                            />
                          </td>
                        ) : (
                          ""
                        )}
                      </tr>
                    ))}
              <tr>
                <td style={{ height: "80px" }}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {popupForm ? (
        <NewUserForm
          items={items}
          tempQuantity={tempQuantity}
          onClose={() => setPopupForm("")}
          onSave={async (data) => {
            setPopupForm(false);
            console.log(data);
            if (data) {
              // setUpdate((prev) => !prev);
              let billingData = await Billing({
                counter: counters.find(
                  (a) => a.counter_uuid === data.counter_uuid
                ),
                add_discounts: true,
                items: data.item_details.map((a) => {
                  let itemData = items.find((b) => a.item_uuid === b.item_uuid);
                  return {
                    ...itemData,
                    ...a,
                    price: itemData?.price || 0,
                  };
                }),
              });
              setSelectedOrder((prev) => ({
                ...prev,
                ...billingData,
                item_details: billingData.items,
              }));
            }
          }}
          setTempQuantity={setTempQuantity}
          setOrder={setSelectedOrder}
          popupInfo={popupForm}
          order={selectedOrder}
          setUpdateBilling={setUpdateBilling}
          deliveryPage={Location.pathname.includes("delivery")}
        />
      ) : (
        ""
      )}
      {popupBarcode ? (
        <CheckingValues
          onSave={() => {
            setPopupBarcode(false);
            setBarcodeMessage([]);
            setHoldPopup(false);
            setTempQuantity([]);
          }}
          BarcodeMessage={BarcodeMessage}
          postOrderData={() => postOrderData()}
          selectedOrder={selectedOrder}
        />
      ) : (
        ""
      )}
      {popupDelivery ? (
        <DiliveryPopup
          onSave={() => setPopupDelivery(false)}
          postOrderData={postOrderData}
          order_uuid={selectedOrder?.order_uuid}
          setSelectedOrder={setSelectedOrder}
          order={selectedOrder}
          allowed={paymentModes?.filter(
            (a) =>
              counters
                ?.find((a) => selectedOrder?.counter_uuid === a.counter_uuid)
                ?.payment_modes?.filter((b) => b === a.mode_uuid)?.length
          )}
          counters={counters}
          items={items}
        />
      ) : (
        ""
      )}
      {holdPopup ? (
        <HoldPopup
          onSave={() => setHoldPopup(false)}
          orders={orders}
          holdPopup={holdPopup}
          itemsData={items}
          postHoldOrders={postHoldOrders}
          checkingQuantity={checkingQuantity}
          setTempQuantity={setTempQuantity}
          tempQuantity={tempQuantity}
          categories={itemCategories}
        />
      ) : (
        ""
      )}
      {phonePopup ? (
        <PhoneList onSave={() => setPhonePopup(false)} mobile={phonePopup} />
      ) : (
        ""
      )}
      {confirmPopup ? (
        <ConfirmPopup
          onSave={() => {
            setConfirmPopup(false);
            postOrderContained(selectedOrder);
            setSelectedOrder(false);
            clearInterval(intervalId);
            audiosRef.current.forEach((audio) => audio.pause());
            navigator.mediaSession.playbackState = "none";
            audiosRef.current = null;
            console.clear();
          }}
          selectedOrder={selectedOrder}
          onClose={() => setConfirmPopup(false)}
          Navigate={Navigate}
        />
      ) : (
        ""
      )}
      {deliveryMessage ? (
        <DeliveryMessagePopup
          onSave={() => {
            setDeliveryMessage(false);
          }}
          data={deliveryMessage}
          credit_allowed={selectedOrder.credit_allowed || ""}
        />
      ) : (
        ""
      )}
      {warningPopup ? (
        <OpenWarningMessage
          onClose={() => {
            setWarningPopUp(false);
          }}
          data={warningPopup}
          users={users}
          onSave={() => {
            setSelectedOrder(warningPopup);
            postOrderContained(warningPopup, localStorage.getItem("user_uuid"));
            setWarningPopUp(false);
          }}
        />
      ) : (
        ""
      )}
      {deletePopup ? (
        <DeleteOrderPopup
          onSave={() => {
            setDeletePopup(false);
            getTripOrders();
          }}
          order={deletePopup}
          counters={counters}
          items={items}
        />
      ) : (
        ""
      )}
      {loading ? (
        <div className="overlay">
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
    </div>
  );
};

export default ProcessingOrders;
const DeleteOrderPopup = ({ onSave, order, counters, items }) => {
  const [disable, setDisabled] = useState(true);
  useEffect(() => {
    setTimeout(() => setDisabled(false), 5000);
  }, []);
  const PutOrder = async () => {
    let time = new Date();
    let data = {
      ...order,
      status: [
        ...order.status,
        {
          stage: 5,
          user_uuid: localStorage.getItem("user_uuid"),
          time: time.getTime(),
        },
      ],
      processing_canceled: window.location.pathname.includes("processing")
        ? order.processing_canceled.length
          ? [...order.processing_canceled, ...order.item_details]
          : order.item_details
        : order.processing_canceled || [],
      delivery_return: window.location.pathname.includes("delivery")
        ? order.delivery_return.length
          ? [...order.delivery_return, ...order.item_details]
          : order.item_details
        : order.delivery_return || [],
      item_details: order.item_details.map((a) => ({ ...a, b: 0, p: 0 })),
    };

    let billingData = await Billing({
      replacement: data.replacement,
      counter: counters.find((a) => a.counter_uuid === data.counter_uuid),
      add_discounts: true,
      items: data.item_details.map((a) => {
        let itemData = items.find((b) => a.item_uuid === b.item_uuid);
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
    const response = await axios({
      method: "put",
      url: "/orders/putOrders",
      data: [data],
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
        style={{
          height: "fit-content",
          width: "max-content",
          paddingTop: "50px",
        }}
      >
        <h3>Complete Order will be CANCELED</h3>

        <div className="flex">
          <button
            type="button"
            className="submit"
            onClick={() => PutOrder()}
            disabled={disable}
            style={{ opacity: disable ? "0.5" : "1" }}
          >
            Confirm
          </button>
        </div>

        <button onClick={onSave} className="closeButton">
          x
        </button>
      </div>
    </div>
  );
};
function CheckingValues({
  onSave,
  BarcodeMessage,
  postOrderData,
  selectedOrder,
}) {
  const [confirmPopup, setConfirmPopup] = useState(false);
  return (
    <>
      <div className="overlay" style={{ zIndex: "999999" }}>
        <div
          className="modal"
          style={{ height: "fit-content", width: "max-content" }}
        >
          <h1>Correction</h1>
          <div
            className="content"
            style={{
              height: "fit-content",
              padding: "20px",
              width: "500px",
            }}
          >
            <div style={{ overflowY: "scroll", width: "100%" }}>
              {BarcodeMessage?.filter((a) => +a.case === 1).length ? (
                <div
                  className="flex"
                  style={{ flexDirection: "column", width: "300px" }}
                >
                  {" "}
                  <i>Incorrect Quantity</i>
                  <table
                    className="user-table"
                    style={{
                      width: "100%",
                      height: "fit-content",
                    }}
                  >
                    <thead>
                      <tr style={{ color: "#fff", backgroundColor: "#7990dd" }}>
                        <th colSpan={2}>
                          <div className="t-head-element">Item</div>
                        </th>
                        <th>
                          <div className="t-head-element">MRP</div>
                        </th>
                        <th style={{ backgroundColor: "green" }}>
                          <div className="t-head-element">Order</div>
                        </th>
                        <th style={{ backgroundColor: "red" }}>
                          <div className="t-head-element">Checking</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="tbody">
                      {BarcodeMessage?.filter((a) => +a.case === 1)?.map(
                        (item, i) => (
                          <tr
                            key={item?.item_uuid || Math.random()}
                            style={{
                              height: "30px",
                              color: "#fff",
                              backgroundColor: "#7990dd",
                            }}
                          >
                            <td colSpan={2}>{item.item_title}</td>
                            <td>{item?.mrp || 0}</td>
                            <td style={{ backgroundColor: "green" }}>
                              {item?.b || 0}:{item?.p || 0}
                            </td>
                            <td style={{ backgroundColor: "red" }}>
                              {item?.barcodeQty || 0}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                ""
              )}
              {BarcodeMessage?.filter((a) => +a.case === 2).length ? (
                <div
                  className="flex"
                  style={{ flexDirection: "column", width: "300px" }}
                >
                  {" "}
                  <i>Remove Extra Items</i>
                  <table
                    className="user-table"
                    style={{
                      width: "100%",
                      height: "fit-content",
                      backgroundColor: "yellow",
                      color: "#fff",
                    }}
                  >
                    <thead>
                      <tr style={{ color: "#fff", backgroundColor: "red" }}>
                        <th colSpan={2}>
                          <div className="t-head-element">Item</div>
                        </th>
                        <th>
                          <div className="t-head-element">MRP</div>
                        </th>
                        <th>
                          <div className="t-head-element">Checking</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="tbody">
                      {BarcodeMessage?.filter((a) => +a.case === 2)?.map(
                        (item, i) => (
                          <tr
                            key={item?.item_uuid || Math.random()}
                            style={{
                              height: "30px",
                              color: "#fff",
                              backgroundColor: "red",
                            }}
                          >
                            <td colSpan={2}>{item.item_title}</td>
                            <td>{item?.mrp || 0}</td>
                            <td>{item?.barcodeQty}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                ""
              )}
              {/* {BarcodeMessage?.filter((a) => +a.case === 1 && !a.barcodeQty)
                .length ? (
                <div className="flex" style={{ flexDirection: "column",width:"300px" }}>
                  {" "}
                  <i>Add Items</i>
                  <table
                    className="user-table"
                    style={{
                      width: "100%",
                      height: "fit-content",
                      backgroundColor: "yellow",
                      color: "#000",
                    }}
                  >
                    <thead>
                      <tr style={{ color: "#000", backgroundColor: "#ffbf00" }}>
                        <th colSpan={2}>
                          <div className="t-head-element">Item</div>
                        </th>
                        <th>
                          <div className="t-head-element">MRP</div>
                        </th>
                        <th>
                          <div className="t-head-element">Order</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="tbody">
                      {BarcodeMessage?.filter(
                        (a) => +a.case === 1 && !a.barcodeQty
                      )?.map((item, i) => (
                        <tr
                          key={item?.item_uuid || Math.random()}
                          style={{
                            height: "30px",
                            color: "#000",
                            backgroundColor: "#ffbf00",
                          }}
                        >
                          <td colSpan={2}>{item.item_title}</td>
                          <td>{item?.mrp || 0}</td>
                          <td>
                            {item?.b || 0}:{item?.p || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                ""
              )} */}
              {BarcodeMessage?.filter((a) => +a.case === 3).length ? (
                <div
                  className="flex"
                  style={{ flexDirection: "column", width: "300px" }}
                >
                  {" "}
                  <i>Unknown Barcode</i>
                  <table
                    className="user-table"
                    style={{
                      width: "100%",
                      height: "fit-content",
                      backgroundColor: "yellow",
                      color: "#fff",
                      border: "2px solid #000",
                    }}
                  >
                    <thead>
                      <tr style={{ color: "#000", backgroundColor: "#fff" }}>
                        <th colSpan={2}>
                          <div className="t-head-element">Barcode</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="tbody">
                      {BarcodeMessage?.filter((a) => +a.case === 3)?.map(
                        (item, i) => (
                          <tr
                            key={item?.item_uuid || Math.random()}
                            style={{
                              height: "30px",
                              color: "#000",
                              backgroundColor: "#fff",
                            }}
                          >
                            <td colSpan={2}>{item.barcode[0]}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                ""
              )}
              <div
                className="flex"
                style={{ justifyContent: "space-between", width: "300px" }}
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
                  onClick={() =>
                    selectedOrder ? postOrderData() : setConfirmPopup(true)
                  }
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {confirmPopup ? (
        <div className="overlay" style={{ zIndex: "999999" }}>
          <div
            className="modal"
            style={{ height: "fit-content", width: "max-content" }}
          >
            <h1>Move Orders to DELIVERY</h1>
            <div
              className="content"
              style={{
                height: "fit-content",
                padding: "20px",
                width: "fit-content",
              }}
            >
              <div style={{ overflowY: "scroll", width: "100%" }}>
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
                    No
                  </button>
                  <button
                    type="button"
                    className="submit"
                    onClick={postOrderData}
                  >
                    Yes
                  </button>
                </div>
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
function HoldPopup({
  onSave,
  orders,
  itemsData,
  holdPopup,
  postHoldOrders,
  checkingQuantity,
  setTempQuantity,
  tempQuantity,
  categories,
}) {
  const [items, setItems] = useState([]);
  const [popupForm, setPopupForm] = useState(false);
  useEffect(() => {
    let data = [].concat
      .apply(
        [],
        orders.map((a) => a.item_details)
      )
      .filter(
        (a) =>
          a.status ===
          (holdPopup === "Hold" ? 2 : holdPopup === "Checking Summary" ? 1 : 0)
      )
      .map((a) => {
        let itemDetails = itemsData?.find((b) => b.item_uuid === a.item_uuid);

        return {
          ...a,
          item_title: itemDetails?.item_title,
          mrp: itemDetails?.mrp,
        };
      });
    console.log(data);
    let result = data.reduce((acc, curr) => {
      let item = acc.find((item) => item.item_uuid === curr.item_uuid);
      if (item) {
        let conversion = +itemsData?.find((b) => b.item_uuid === item.item_uuid)
          ?.conversion;
        item.b = +item.b + curr.b + (+item.p + curr.p) / conversion;
        item.p = (+item.p + curr.p) % conversion;
      } else {
        acc.push(curr);
      }

      return acc;
    }, []);
    console.log(result);
    result.map((item) =>
      setTempQuantity((prev) =>
        prev?.filter((a) => a.item_uuid === item.item_uuid)?.length
          ? prev?.map((a) =>
              a.item_uuid === item.item_uuid
                ? {
                    ...a,
                    b: +(data.b || 0),
                    p: data?.p || 0,
                  }
                : a
            )
          : prev?.length
          ? [
              ...prev,
              ...itemsData
                ?.filter((a) => a.item_uuid === item.item_uuid)
                .map((a) => ({
                  ...a,
                  b: +(data.b || 0),
                  p: data?.p || 0,
                })),
            ]
          : itemsData
              ?.filter((a) => a.item_uuid === item.item_uuid)
              .map((a) => ({
                ...a,
                b: (+data.b || 0 || 0).toFixed(0),
                p: +data?.p || 0,
              }))
      )
    );
    setItems(result);
  }, []);
  const postOrderData = async () => {
    postHoldOrders(
      orders
        .filter(
          (a) =>
            a.item_details.filter(
              (b) =>
                items.filter((c) => c.edit && c.item_uuid === b.item_uuid)
                  .length
            ).length
        )
        .map((a) => ({
          ...a,
          item_details: a.item_details.map((a) => ({
            ...a,
            status:
              items.find((b) => b.item_uuid === a.item_uuid)?.status ||
              a.status,
          })),
        }))
    );
    onSave();
  };
  console.log(tempQuantity);
  return (
    <>
      <div className="overlay">
        <div
          className="modal"
          style={{
            height: "fit-content",
            width: "max-content",
            minWidth: "250px",
            paddingTop: "40px",
          }}
        >
          <h1>{holdPopup}</h1>
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
                      width: "100%",
                      height: "fit-content",
                    }}
                  >
                    <thead>
                      <tr style={{ color: "#fff", backgroundColor: "#7990dd" }}>
                        <th></th>
                        <th colSpan={3}>
                          <div className="t-head-element">Item</div>
                        </th>
                        <th colSpan={2}>
                          <div className="t-head-element">MRP</div>
                        </th>
                        <th colSpan={2}>
                          <div className="t-head-element">Qty</div>
                        </th>
                        {!window.location.pathname.includes("checking") ? (
                          <th></th>
                        ) : (
                          ""
                        )}
                      </tr>
                    </thead>
                    <tbody className="tbody">
                      {categories
                        .filter(
                          (a) =>
                            items?.filter(
                              (b) =>
                                a.category_uuid ===
                                itemsData?.find(
                                  (c) => b.item_uuid === c.item_uuid
                                )?.category_uuid
                            ).length
                        )
                        .map((a) => (
                          <>
                            <tr>
                              <td colSpan={8}>{a.category_title}</td>
                            </tr>
                            {console.log(a, items)}
                            {items
                              ?.filter(
                                (b) =>
                                  a.category_uuid ===
                                  itemsData?.find(
                                    (c) => b.item_uuid === c.item_uuid
                                  )?.category_uuid
                              )
                              .map((item, i) => (
                                <tr
                                  key={item?.item_uuid || Math.random()}
                                  style={{
                                    height: "30px",
                                    fontSize: "12px",
                                    color: "#fff",
                                    backgroundColor:
                                      +item.status === 1
                                        ? "green"
                                        : +item.status === 3
                                        ? "red"
                                        : "#7990dd",
                                  }}
                                >
                                  <td
                                    style={{ padding: "5px" }}
                                    onClick={() =>
                                      setItems((prev) =>
                                        prev.map((a) =>
                                          a.item_uuid === item.item_uuid
                                            ? {
                                                ...a,
                                                status:
                                                  a.status !== 1
                                                    ? 1
                                                    : holdPopup === "Hold"
                                                    ? 2
                                                    : 0,
                                                edit: true,
                                              }
                                            : a
                                        )
                                      )
                                    }
                                  >
                                    {+item.status !== 1 ? (
                                      <CheckCircleOutlineIcon
                                        style={{ width: "15px" }}
                                      />
                                    ) : (
                                      ""
                                    )}
                                  </td>

                                  <td colSpan={3}>{item.item_title}</td>
                                  <td colSpan={2}>{item.mrp}</td>
                                  {!window.location.pathname.includes(
                                    "checking"
                                  ) ? (
                                    <>
                                      <td colSpan={2}>
                                        {item?.b || 0} : {item?.p || 0}
                                      </td>
                                      <td
                                        style={{ padding: "5px" }}
                                        onClick={() =>
                                          setItems((prev) =>
                                            prev.map((a) =>
                                              a.item_uuid === item.item_uuid
                                                ? {
                                                    ...a,
                                                    status:
                                                      a.status !== 3
                                                        ? 3
                                                        : holdPopup === "Hold"
                                                        ? 2
                                                        : 0,
                                                    edit: true,
                                                  }
                                                : a
                                            )
                                          )
                                        }
                                      >
                                        {+item.status !== 3 ? (
                                          <DeleteOutlineIcon
                                            style={{ width: "15px" }}
                                          />
                                        ) : (
                                          ""
                                        )}
                                      </td>
                                    </>
                                  ) : (
                                    <td colSpan={2}>
                                      <input
                                        value={`${
                                          tempQuantity?.find(
                                            (a) =>
                                              a.item_uuid === item.item_uuid
                                          )?.b || 0
                                        } : ${
                                          tempQuantity?.find(
                                            (a) =>
                                              a.item_uuid === item.item_uuid
                                          )?.p || 0
                                        }`}
                                        className="boxPcsInput"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPopupForm(item);
                                        }}
                                      />
                                    </td>
                                  )}
                                </tr>
                              ))}
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

              {items.filter((a) => a.edit).length ? (
                <div
                  className="flex"
                  style={{ justifyContent: "space-between" }}
                >
                  <button
                    type="button"
                    className="submit"
                    onClick={postOrderData}
                  >
                    Save
                  </button>
                </div>
              ) : (
                ""
              )}
              {holdPopup === "Checking Summary" ? (
                <div
                  className="flex"
                  style={{ justifyContent: "space-between" }}
                >
                  <button
                    type="button"
                    className="submit"
                    onClick={checkingQuantity}
                  >
                    Save
                  </button>
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
      {popupForm ? (
        <CheckingItemInput
          onSave={() => setPopupForm(false)}
          setOrder={setItems}
          popupInfo={popupForm}
          setTempQuantity={setTempQuantity}
          items={items}
        />
      ) : (
        ""
      )}
    </>
  );
}
function CheckingItemInput({ onSave, popupInfo, setTempQuantity, items }) {
  const [data, setdata] = useState({});

  useEffect(() => {
    setdata({
      b: popupInfo?.checkB || 0,
      p: popupInfo?.checkP || 0,
    });
  }, []);
  const submitHandler = async (e) => {
    e.preventDefault();
    setTempQuantity((prev) =>
      prev?.filter((a) => a.item_uuid === popupInfo.item_uuid)?.length
        ? prev?.map((a) =>
            a.item_uuid === popupInfo.item_uuid
              ? {
                  ...a,
                  b: +(data.b || 0),
                  p: data?.p || 0,
                }
              : a
          )
        : prev?.length
        ? [
            ...prev,
            ...items
              ?.filter((a) => a.item_uuid === popupInfo.item_uuid)
              .map((a) => ({
                ...a,
                b: +(data.b || 0),
                p: data?.p || 0,
              })),
          ]
        : items
            ?.filter((a) => a.item_uuid === popupInfo.item_uuid)
            .map((a) => ({
              ...a,
              b: (+data.b || 0 || 0).toFixed(0),
              p: +data?.p || 0,
            }))
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
function DiliveryPopup({
  onSave,
  postOrderData,
  order_uuid,
  credit_allowed,
  counters,
  items,
  order,
  allowed,
}) {
  const [PaymentModes, setPaymentModes] = useState([]);
  const [modes, setModes] = useState([]);
  const [error, setError] = useState("");
  const [popup, setPopup] = useState(false);
  const [coinPopup, setCoinPopup] = useState(false);
  const [data, setData] = useState({});
  const [outstanding, setOutstanding] = useState({});
  const GetPaymentModes = async () => {
    const response = await axios({
      method: "get",
      url: "/paymentModes/GetPaymentModesList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setPaymentModes(response.data.result);
  };
  useEffect(() => {
    let time = new Date();
    setOutstanding({
      order_uuid,
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
      replacement: order.replacement,
      counter: counters.find((a) => a.counter_uuid === order.counter_uuid),
      add_discounts: true,
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
      replacement: data.actual,
      replacement_mrp: data.mrp,
    };
    let modeTotal = modes.map((a) => +a.amt || 0)?.reduce((a, b) => a + b);
    console.log(
      Tempdata?.order_grandtotal,
      +(+modeTotal + (+outstanding?.amount || 0))
    );
    if (
      +Tempdata?.order_grandtotal !==
      +(+modeTotal + (+outstanding?.amount || 0))
    ) {
      setError("Invoice Amount and Payment mismatch");
      return;
    }
    let obj = modes.find((a) => a.mode_title === "Cash");
    if (obj?.amt && obj?.coin === "") {
      setCoinPopup(true);
      return;
    }
    let time = new Date();
    obj = {
      user_uuid: localStorage.getItem("user_uuid"),
      time: time.getTime(),
      order_uuid,
      counter_uuid: order.counter_uuid,
      trip_uuid: order.trip_uuid,
      modes,
    };
    const response = await axios({
      method: "post",
      url: "/receipts/postReceipt",
      data: obj,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (outstanding?.amount)
      await axios({
        method: "post",
        url: "/Outstanding/postOutstanding",
        data: outstanding,
        headers: {
          "Content-Type": "application/json",
        },
      });
    if (response.data.success) {
      postOrderData();
      onSave();
    }
  };
  return (
    <>
      <div className="overlay">
        <div
          className="modal"
          style={{ height: "fit-content", width: "max-content" }}
        >
          <h3>Payments</h3>
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
                          placeholder={
                            !allowed.find((a) => a.mode_uuid === item.mode_uuid)
                              ? "Not Allowed"
                              : ""
                          }
                          style={
                            !allowed.find((a) => a.mode_uuid === item.mode_uuid)
                              ? {
                                  width: "90px",
                                  backgroundColor: "light",
                                  fontSize: "12px",
                                  color: "#fff",
                                }
                              : { width: "80px" }
                          }
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
                          disabled={
                            !allowed.find((a) => a.mode_uuid === item.mode_uuid)
                          }
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
                          credit_allowed !== "Y" ? "Not Allowed" : ""
                        }
                        style={
                          credit_allowed !== "Y"
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
                        disabled={credit_allowed !== "Y"}
                        maxLength={42}
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
                      Replacement
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
          onSave={() => setPopup(false)}
          setData={setData}
          data={data}
        />
      ) : (
        ""
      )}
      {coinPopup ? (
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
                          style={
                            !allowed.find(
                              (a) =>
                                a.mode_uuid ===
                                "c67b54ba-d2b6-11ec-9d64-0242ac120002"
                            )
                              ? { width: "70px", backgroundColor: "gray" }
                              : { width: "70px" }
                          }
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
      )}
    </>
  );
}
function DiliveryReplaceMent({ onSave, data, setData }) {
  return (
    <div className="overlay">
      <div
        className="modal"
        style={{ height: "fit-content", width: "max-content" }}
      >
        <h2>Replacements</h2>
        <div
          className="content"
          style={{
            height: "fit-content",
            padding: "20px",
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
                  <div style={{ width: "50px" }}>MRP</div>
                  <label
                    className="selectLabel flex"
                    style={{ width: "100px" }}
                  >
                    <input
                      type="number"
                      name="route_title"
                      className="numberInput"
                      value={data.mrp}
                      style={{ width: "100px" }}
                      onChange={(e) =>
                        setData((prev) => ({
                          mrp: e.target.value,
                          actual: +e.target.value * 0.8,
                        }))
                      }
                      maxLength={42}
                    />
                    {/* {popupInfo.conversion || 0} */}
                  </label>
                </div>
                <div
                  className="row"
                  style={{ flexDirection: "row", alignItems: "center" }}
                >
                  <div style={{ width: "50px" }}>Actual</div>
                  <label
                    className="selectLabel flex"
                    style={{ width: "100px" }}
                  >
                    <input
                      type="number"
                      name="route_title"
                      className="numberInput"
                      value={data.actual}
                      style={{ width: "100px" }}
                      onChange={(e) =>
                        setData((prev) => ({
                          actual: e.target.value,
                        }))
                      }
                      maxLength={42}
                    />
                    {/* {popupInfo.conversion || 0} */}
                  </label>
                </div>
              </div>

              <div className="flex" style={{ justifyContent: "space-between" }}>
                <button
                  type="button"
                  style={{ backgroundColor: "red" }}
                  className="submit"
                  onClick={onSave}
                >
                  Cancel
                </button>
                <button type="button" className="submit" onClick={onSave}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
function ConfirmPopup({ onSave, onClose, selectedOrder, Navigate }) {
  if (!selectedOrder) Navigate(-1);
  return selectedOrder ? (
    <div className="overlay">
      <div
        className="modal"
        style={{ height: "fit-content", width: "max-content", padding: "30px" }}
      >
        <h2 style={{ textAlign: "center" }}>Are you sure?</h2>
        <h2 style={{ textAlign: "center" }}>Changes will be discarded</h2>
        <div
          className="content"
          style={{
            height: "fit-content",
            padding: "20px",
          }}
        >
          <div style={{ overflowY: "scroll", width: "100%" }}>
            <form className="form">
              <div className="flex">
                <button
                  type="submit"
                  style={{ backgroundColor: "red" }}
                  className="submit"
                  onClick={onSave}
                >
                  Discard
                </button>
              </div>
            </form>
          </div>
          <button onClick={onClose} className="closeButton">
            <CloseIcon />
          </button>
        </div>
      </div>
    </div>
  ) : (
    ""
  );
}
function DeliveryMessagePopup({ onSave, data, credit_allowed }) {
  const [disabled, setDisabled] = useState(true);
  useEffect(() => {
    setTimeout(() => setDisabled(false), 5000);
  }, []);
  console.log("counters", data);
  return (
    <div className="overlay">
      <div
        className="modal"
        style={{ height: "fit-content", width: "max-content" }}
      >
        {data.length ? (
          <h2>
            {data.map((a, i) =>
              i === 0 ? (
                <b style={{ color: "red" }}>
                  <u>{a.mode_title}</u>
                </b>
              ) : data.length === i + 1 ? (
                <>
                  {" "}
                  and{" "}
                  <b style={{ color: "red" }}>
                    <u>{a.mode_title}</u>
                  </b>
                </>
              ) : (
                ", " + a.mode_title
              )
            )}{" "}
            not allowed
          </h2>
        ) : (
          ""
        )}
        {credit_allowed !== "Y" ? (
          <h2>
            <b style={{ color: "red" }}>
              <u>Credit / Unpaid </u>
            </b>
            not allowed
          </h2>
        ) : (
          ""
        )}

        <div
          className="content"
          style={{
            height: "fit-content",
            padding: "20px",
          }}
        >
          <div style={{ overflowY: "scroll", width: "100%" }}>
            <form className="form">
              <div className="flex" style={{ width: "100%" }}>
                <button
                  disabled={disabled}
                  type="button"
                  style={
                    disabled
                      ? { opacity: "0.5", cursor: "not-allowed" }
                      : { opacity: "1", cursor: "pointer" }
                  }
                  className="submit"
                  onClick={onSave}
                >
                  Okay
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
function OpenWarningMessage({ onSave, data, users, onClose }) {
  const [orderData, setOrderData] = useState(data);
  const [timer, setTimer] = useState(0);

  const getOrders = async () => {
    const response = await axios({
      method: "get",
      url: "/orders/GetOrder/" + data.order_uuid,

      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("users", response);
    if (response.data.result.opened_by === "0") onSave();
    if (response.data.success) setOrderData(response.data.result);
  };
  useEffect(() => {
    setTimeout(() => setTimer(true), 2000);
    getOrders();
  }, []);
  console.log("counters", data);
  return timer ? (
    <div className="overlay">
      <div
        className="modal"
        style={{
          height: "fit-content",
          width: "max-content",
          paddingTop: "50px",
        }}
      >
        <h2>
          Order Already Opened By{" "}
          {
            users.find((a, i) => a.user_uuid === orderData.opened_by)
              ?.user_title
          }
        </h2>

        <div
          className="content"
          style={{
            height: "fit-content",
            padding: "20px",
          }}
        >
          <div style={{ overflowY: "scroll", width: "100%" }}>
            <form className="form">
              <div className="flex" style={{ width: "100%" }}>
                <button
                  type="button"
                  style={{ opacity: "1", cursor: "pointer" }}
                  className="submit"
                  onClick={onSave}
                >
                  Still Open
                </button>
              </div>
            </form>
          </div>
          <button onClick={onClose} className="closeButton">
            x
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div />
  );
}
function NewUserForm({
  onSave,
  popupInfo,
  tempQuantity,
  setTempQuantity,
  order,
  setUpdateBilling,
  deliveryPage,
  items,
  onClose,
}) {
  const [data, setdata] = useState({});
  useEffect(() => {
    let data = window.location.pathname.includes("checking")
      ? tempQuantity?.find((a) => a.item_uuid === popupInfo.item_uuid)
      : order?.item_details?.find((a) => a.item_uuid === popupInfo.item_uuid);
    setdata({
      b: data?.b || 0,
      p: data?.p || 0,
    });
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    let orderData = order;

    if (window.location.pathname.includes("checking")) {
      setTempQuantity(
        tempQuantity?.filter((a) => a.item_uuid === popupInfo.item_uuid)?.length
          ? tempQuantity?.map((a) =>
              a.item_uuid === popupInfo.item_uuid
                ? {
                    ...a,
                    b:
                      +(+data.b || 0) +
                      parseInt((+data.p || 1) / +a.conversion),
                    p: ((+data.p || 1) % +a.conversion).toFixed(0),
                  }
                : a
            )
          : tempQuantity?.length
          ? [
              ...tempQuantity,
              ...items
                ?.filter((a) => a.item_uuid === popupInfo.item_uuid)
                .map((a) => ({
                  ...a,
                  b: +(+data.b || 0) + parseInt((+data.p || 1) / +a.conversion),
                  p: ((+data.p || 1) % +a.conversion).toFixed(0),
                })),
            ]
          : items
              ?.filter((a) => a.item_uuid === popupInfo.item_uuid)
              .map((a) => ({
                ...a,
                b:
                  +(+data.b || 0) +
                  +parseInt((+data.p || 1) / +a.conversion).toFixed(0),
                p: ((+data.p || 1) % +a.conversion).toFixed(0),
              }))
      );
      onClose();
    } else if (window.location.pathname.includes("delivery")) {
      orderData = {
        ...orderData,
        delivery_return: deliveryPage
          ? orderData.delivery_return.length
            ? orderData.delivery_return.filter(
                (a) => a.item_uuid === popupInfo.item_uuid
              )
              ? orderData.delivery_return.map((a) =>
                  a.item_uuid === popupInfo.item_uuid
                    ? {
                        item_uuid: popupInfo.item_uuid,
                        b:
                          +a.b +
                          data.b -
                          (+orderData?.item_details?.find(
                            (a) => a.item_uuid === popupInfo.item_uuid
                          )?.b || 0),
                        p:
                          +a.b +
                          data.p -
                          (+orderData?.item_details?.find(
                            (a) => a.item_uuid === popupInfo.item_uuid
                          )?.p || 0),
                      }
                    : a
                )
              : [
                  ...orderData.delivery_return,
                  {
                    item_uuid: popupInfo.item_uuid,
                    b:
                      (+data.b || 0) -
                      (+orderData?.item_details?.find(
                        (a) => a.item_uuid === popupInfo.item_uuid
                      )?.b || 0),
                    p:
                      +data.p -
                      (+orderData?.item_details?.find(
                        (a) => a.item_uuid === popupInfo.item_uuid
                      )?.p || 0),
                  },
                ]
            : [
                {
                  item_uuid: popupInfo.item_uuid,
                  b:
                    (+data.b || 0) -
                    (+orderData?.item_details?.find(
                      (a) => a.item_uuid === popupInfo.item_uuid
                    )?.b || 0),
                  p:
                    +data.p -
                    (+orderData?.item_details?.find(
                      (a) => a.item_uuid === popupInfo.item_uuid
                    )?.p || 0),
                },
              ]
          : [],
        item_details: orderData.item_details.map((a) =>
          a.item_uuid === popupInfo.item_uuid
            ? {
                ...a,
                b:
                  (+data.b || 0) +
                  parseInt(+data.p / (+popupInfo.conversion || 1)),
                p: +data.p % (+popupInfo.conversion || 1),
              }
            : a
        ),
      };
      setUpdateBilling(true);
      onSave(orderData);
    } else {
      orderData = {
        ...orderData,
        processing_canceled: orderData.processing_canceled.length
          ? orderData.processing_canceled.filter(
              (a) => a.item_uuid === popupInfo.item_uuid
            )
            ? orderData.processing_canceled.map((a) =>
                a.item_uuid === popupInfo.item_uuid
                  ? {
                      item_uuid: popupInfo.item_uuid,
                      b:
                        +a.b +
                        (+orderData?.item_details?.find(
                          (a) => a.item_uuid === popupInfo.item_uuid
                        )?.b || 0) -
                        data.b,
                      p:
                        +a.p +
                        (+orderData?.item_details?.find(
                          (a) => a.item_uuid === popupInfo.item_uuid
                        )?.p || 0) -
                        data.p,
                    }
                  : a
              )
            : [
                ...orderData.processing_canceled,
                {
                  item_uuid: popupInfo.item_uuid,
                  b:
                    (+orderData?.item_details?.find(
                      (a) => a.item_uuid === popupInfo.item_uuid
                    )?.b || 0) - data.b,
                  p:
                    (+orderData?.item_details?.find(
                      (a) => a.item_uuid === popupInfo.item_uuid
                    )?.p || 0) - data.p,
                },
              ]
          : [
              {
                item_uuid: popupInfo.item_uuid,
                b:
                  (+orderData?.item_details?.find(
                    (a) => a.item_uuid === popupInfo.item_uuid
                  )?.b || 0) - data.b,
                p:
                  (+orderData?.item_details?.find(
                    (a) => a.item_uuid === popupInfo.item_uuid
                  )?.p || 0) - data.p,
              },
            ],
        item_details: orderData.item_details.map((a) =>
          a.item_uuid === popupInfo.item_uuid
            ? {
                ...a,
                b:
                  (+data.b || 0) +
                  parseInt(+data.p / (+popupInfo.conversion || 1)),
                p: +data.p % (+popupInfo.conversion || 1),
              }
            : a
        ),
      };
      setUpdateBilling(true);
      onSave(orderData);
    }
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
const PhoneList = ({ onSave, mobile }) => {
  return (
    <div className="overlay" style={{ zIndex: 999999999 }}>
      <div
        className="modal"
        style={{
          height: "fit-content",
          width: "max-content",
          minWidth: "250px",
        }}
      >
        <div
          className="content"
          style={{
            height: "fit-content",
            padding: "20px",
            width: "fit-content",
          }}
        >
          <div style={{ overflowY: "scroll", width: "100%" }}>
            {mobile.length ? (
              <div
                className="flex"
                style={{ flexDirection: "column", width: "100%" }}
              >
                <table
                  className="user-table"
                  style={{
                    width: "100%",
                    height: "fit-content",
                  }}
                >
                  <tbody className="tbody">
                    {mobile?.map((item, i) => (
                      <tr
                        key={item?.item_uuid || Math.random()}
                        style={{
                          height: "30px",
                          width: "100%",
                        }}
                      >
                        <td
                          colSpan={3}
                          className="flex"
                          onClick={() => {
                            window.location.assign("tel:" + item);
                            onSave();
                          }}
                        >
                          <Phone />
                          {item}
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
          <button onClick={onSave} className="closeButton">
            x
          </button>
        </div>
      </div>
    </div>
  );
};
