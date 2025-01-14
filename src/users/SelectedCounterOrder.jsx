import { AiOutlineSearch } from "react-icons/ai";
import { IoArrowBackOutline } from "react-icons/io5";
import { useState, useEffect, useMemo, useContext } from "react";
import { openDB } from "idb";
import { useNavigate, useParams } from "react-router-dom";
import { AutoAdd, Billing } from "../Apis/functions";
import { Link as ScrollLink } from "react-scroll";
import { v4 as uuid } from "uuid";
import axios from "axios";
import Context from "../context/context";
import CloseIcon from "@mui/icons-material/Close";
import MobileNumberPopup from "../components/MobileNumberPopup";
const SelectedCounterOrder = () => {
  const {
  
    setNotification,
  } = useContext(Context);
  const [items, setItems] = useState([]);
  // const [foodLicensePopup, setFoodLicencePopup] = useState(false);
  const [checkNumberPopup, setCheckNumberPopup] = useState(false);
  const [pricePopup, setPricePopup] = useState(false);
  // const [number, setNumber] = useState(false);
  const [confirmItemsPopup, setConfirmItemPopup] = useState(false);
  const [enable, setEnable] = useState(false);
  const [userData, setUserData] = useState({});
  const [food_license, setFoodLicence] = useState("");
  const [order, setOrder] = useState([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [clickedId, setClickedId] = useState(false);
  const [cartPage, setCartPage] = useState(false);
  const [counters, setCounters] = useState([]);
  const [counter, setCounter] = useState({});

  const params = useParams();
  const [filterItemTitle, setFilterItemTile] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [itemsCategory, setItemsCategory] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [popupForm, setPopupForm] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [total, setTotal] = useState(0);
  const [holdPopup, setHoldPopup] = useState(false);
  const [discountPopup, setDiscountPopup] = useState(false);
  const [popupState, setPopupState] = useState();

  const [invoice_number, setInvioceNumber] = useState(false);
  const [loading, setLoading] = useState(false);

  const Navigate = useNavigate();

  const getStock = (item) => {
    const selected_warehouse = localStorage.getItem("selected_warehouse");
    const warehouse_stock = item.stock?.find(
      (i) => i.warehouse_uuid === selected_warehouse
    );
    if (!warehouse_stock) return `N/A`;
    return `${parseInt(+warehouse_stock?.qty / +item?.conversion)}:${parseInt(
      +warehouse_stock?.qty % +(+item?.conversion)
    )}`;
  };

  const callBilling = async () => {
    let counter = counters.find((a) => order.counter_uuid === a.counter_uuid);
    let time = new Date();
    Billing({
      new_order: 1,
      order_uuid: order?.order_uuid,
      invoice_number: `${order?.order_type}${order?.invoice_number}`,
      counter,
      items: order.items,
      others: {
        stage: 1,
        user_uuid: localStorage.getItem("user_uuid"),
        time: time.getTime(),

        type: "NEW",
      },
      add_discounts: true,
    }).then((data) => {
      setTotal(data.order_grandtotal);
    });
  };
  useEffect(() => {
    callBilling();
  }, [order?.items]);
  // useEffect(() => {
  //   if (counter?.mobile?.length) {
  //     if (
  //       counter?.mobile.filter((a) =>
  //         a?.lable?.find((b) => b.type === "wa" && +b.varification)
  //       )?.length &&
  //       counter?.mobile.filter(
  //         (a) =>
  //           a?.lable?.find((b) => b.type === "cal" && +b.varification)?.length
  //       )
  //     ) {
  //       setNumber(false);
  //     } else {
  //       setNumber(true);
  //     }
  //   }
  // }, [counter?.mobile]);
  const getCounter = async () => {
    const response = await axios({
      method: "post",
      url: "/counters/GetCounter",
      data: { counter_uuid: params.counter_uuid },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      setCounter(response.data.result);
      if (!response.data.result.food_license) {
        // setFoodLicencePopup(true);
      } else {
        // setCheckNumberPopup(true);
      }
    }
  };
  const getUsers = async () => {
    const response = await axios({
      method: "get",
      url: "/users/GetUser/" + localStorage.getItem("user_uuid"),

      headers: {
        "Content-Type": "application/json",
      },
    });
   
    if (response.data.success) setUserData(response.data.result);
  };

  useEffect(() => {
    getUsers();
  }, []);
  const salesman_suggestion = useMemo(() => {
    let item =
      userData?.salesman_suggestion?.filter(
        (a) => !order?.items?.find((b) => b.item_uuid === a)
      ) || [];
    return items.filter((a) => item.find((b) => b === a.item_uuid));
  }, [
    confirmItemsPopup,
    items,
    confirmItemsPopup,
    userData?.salesman_suggestion,
  ]);

  const putCounterData = async (e) => {
    e.preventDefault();
    if (!food_license) return;
    const response = await axios({
      method: "put",
      url: "/counters/putCounter",
      data: [
        {
          counter_uuid: params.counter_uuid,
          food_license,
        },
      ],
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      // setFoodLicencePopup(false);
      // setCheckNumberPopup(true);
    }
  };
  const putCounterNumber = async (e) => {
    e.preventDefault();
    if (localStorage.getItem("projectionItems")) {
      localStorage.removeItem("projectionItems");
      Navigate("/advanceOrdering");
    } else {
      Navigate(-1);
    }
  };
  const getIndexedDbData = async () => {
    const db = await openDB("BT", +localStorage.getItem("IDBVersion") || 1);
    let tx = await db.transaction("items", "readwrite").objectStore("items");
    let item = await tx.getAll();
    setItems(
      item
        .filter((a) => a.status !== 0)
        .map((a) => ({
          ...a,
          item_price: a.item_price || 0,
          gst_percentage: a.gst_percentage || 0,
          css_percentage: a.css_percentage || 0,
        }))
    );
    let projectionItems = localStorage.getItem("projectionItems");
    if (projectionItems) {
      projectionItems = JSON.parse(projectionItems);
      setOrder((prev) => ({
        ...prev,
        items: projectionItems
          .map((a) => {
            let itemData = item?.find((b) => b.item_uuid === a.item_uuid);

            if (itemData) {
              return {
                ...itemData,
                ...a,
              };
            } else {
              return null;
            }
          })
          .filter((a) => a),
      }));
    }
    let store = await db
      .transaction("companies", "readwrite")
      .objectStore("companies");
    let company = await store.getAll();
    setCompanies(company);
    setFilterCompany(company[0]?.company_uuid);
    store = await db
      .transaction("item_category", "readwrite")
      .objectStore("item_category");
    let route = await store.getAll();
    setItemsCategory(route);
    store = await db.transaction("counter", "readwrite").objectStore("counter");
    let countersData = await store.getAll();
    setCounters(countersData);
    db.close();
  };
  useEffect(() => {
    getIndexedDbData();
    getCounter();
  }, []);
  useEffect(() => {
    if (counters.length)
      setCounter(counters?.find((a) => params.counter_uuid === a.counter_uuid));
  }, [counters, params.counter_uuid]);
  useEffect(() => {
    setItems((prev) =>
      prev?.map((a) => {
        let item_price = a.item_price;
        let item_special_price = counter?.item_special_price?.find(
          (b) => b.item_uuid === a.item_uuid
        )?.price;
        let item_rate = counter?.company_discount?.find(
          (b) => b.company_uuid === a.company_uuid
        )?.item_rate;

        if (item_special_price) {
          item_price = item_special_price;
        } else if (item_rate === "a") {
          item_price = a.item_price_a;
        } else if (item_rate === "b") {
          item_price = a.item_price_b;
        } else if (item_rate === "c") {
          item_price = a.item_price_c;
        }

        return {
          ...a,
          item_price,
          b: 0,
          p: 0,
          status: 0,
        };
      })
    );
  }, [counter]);

  const postOrder = async (orderData) => {
    try {
      let data = {
        ...orderData,
        order_status: orderData?.order_status || "R",
        order_uuid: uuid(),
        opened_by: 0,
        order_type: orderData.items[0].billing_type,
        item_details: orderData.items.map((a) => {
          return {
            ...a,
            b: a.b,
            p: a.p,
            unit_price: a.price,
            gst_percentage: a.item_gst,
            css_percentage: a.item_css,
            status: 0,
            price: a.item_price,
          };
        }),
        status: [
          {
            stage: orderData.others.stage,
            time: orderData.others.time,
            user_uuid: orderData.others.user_uuid,
          },
        ],
      };
     
      const response = await axios({
        method: "post",
        url: "/orders/postOrder",
        data,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
       
        setInvioceNumber(response.data.result.invoice_number);
        let qty = `${
          data?.item_details?.length > 1
            ? data?.item_details?.reduce((a, b) => (+a.b || 0) + (+b.b || 0))
            : data?.item_details?.length
            ? data?.item_details[0]?.b
            : 0
        }:${
          data?.item_details?.length > 1
            ? data?.item_details?.reduce((a, b) => (+a.p || 0) + (+b.p || 0))
            : data?.item_details?.length
            ? data?.item_details[0]?.p
            : 0
        }`;
        postActivity({
          activity: "Order End",
          range: data?.item_details?.length,
          qty,
          amt: data.order_grandtotal || 0,
        });
        if (response.data.incentives) {
          setCheckNumberPopup(response.data.incentives);
        }
      }
    } catch (error) {
     
    } finally {
      setLoading(false);
    }
  };

  const postActivity = async (others = {}) => {
    let time = new Date();
    let data = {
      user_uuid: localStorage.getItem("user_uuid"),
      role: "Order",
      narration:
        counter.counter_title +
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
     
    }
  };
  useEffect(() => {
    if (!orderCreated && order?.items?.length) {
      postActivity({ activity: "Order Start" });
      setOrderCreated(true);
    }
   
  }, [order]);

  return (
    <>
      {/* {number ? (
        <MobileNumberPopup
          counter={counter}
          getCounter={getCounter}
          onSave={() => setNumber(false)}
        />
      ) : (
        ""
      )} */}

      <nav
        className="user_nav nav_styling"
        style={
          cartPage
            ? { backgroundColor: "#000", maxWidth: "500px" }
            : { maxWidth: "500px" }
        }
      >
        <div className="user_menubar">
          <IoArrowBackOutline
            className="user_Back_icon"
            onClick={() => (!cartPage ? Navigate(-1) : setCartPage(false))}
          />
        </div>
        {cartPage ? (
          <>
            <h1 style={{ width: "100%", textAlign: "center" }}>Cart</h1>
            <button
              className="theme-btn"
              style={{
                width: "max-content",
                backgroundColor: "#32bd33",
              }}
              onClick={() => setPopupState(true)}
            >
              Priority
            </button>
            <button
              className="theme-btn"
              style={{
                width: "max-content",
                backgroundColor: "#32bd33",
              }}
              onClick={() => setDiscountPopup("Summary")}
            >
              Discount
            </button>
            <button
              className="theme-btn"
              style={{
                width: "max-content",
                backgroundColor: "#32bd33",
              }}
              onClick={() => setHoldPopup("Summary")}
            >
              Free
            </button>
          </>
        ) : (
          ""
        )}
        {!cartPage ? (
          <>
            <div className="user_searchbar flex">
              <AiOutlineSearch className="user_search_icon" />
              <input
                style={{ width: "200px" }}
                className="searchInput"
                type="text"
                placeholder="search"
                value={filterItemTitle}
                onChange={(e) => setFilterItemTile(e.target.value)}
              />
              <CloseIcon
                className="user_cross_icon"
                onClick={() => setFilterItemTile("")}
              />
            </div>

            <div>
              <select
                className="searchInput selectInput"
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
              >
                {companies?.map((a) => (
                  <option value={a.company_uuid}>{a.company_title}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          ""
        )}
      </nav>
      <div className="home">
        <div className="container" style={{ maxWidth: "500px" }}>
          <div className="menucontainer">
            <div className="menus">
              {!cartPage
                ? itemsCategory
                    ?.filter((a) => a.company_uuid === filterCompany)
                    ?.sort((a, b) => a.sort_order - b.sort_order)
                    ?.map(
                      (category) =>
                        items?.filter(
                          (a) =>
                            (!filterItemTitle ||
                              a.item_title
                                ?.toLocaleLowerCase()
                                .includes(
                                  filterItemTitle.toLocaleLowerCase()
                                )) &&
                            a.category_uuid === category.category_uuid
                        )?.length > 0 && (
                          <div
                            id={!cartPage ? category?.category_uuid : ""}
                            key={category?.category_uuid}
                            name={category?.category_uuid}
                            className="categoryItemMap"
                          >
                            <h1 className="categoryHeadline">
                              {category?.category_title}
                            </h1>
                            {items
                              ?.filter(
                                (a) =>
                                  (!filterItemTitle ||
                                    a.item_title
                                      ?.toLocaleLowerCase()
                                      .includes(
                                        filterItemTitle.toLocaleLowerCase()
                                      )) &&
                                  a.category_uuid === category.category_uuid
                              )
                              ?.sort((a, b) => a.sort_order - b.sort_order)
                              ?.map((item) => {
                                return (
                                  <div
                                    key={item?.item_uuid}
                                    className="menu"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOrder((prev) => ({
                                        ...prev,
                                        items: prev?.items?.filter(
                                          (a) => a.item_uuid === item.item_uuid
                                        )?.length
                                          ? prev?.items?.map((a) =>
                                              a.item_uuid === item.item_uuid
                                                ? {
                                                    ...a,
                                                    b:
                                                      +(a.b || 0) +
                                                      parseInt(
                                                        ((a?.p || 0) +
                                                          (+item?.one_pack ||
                                                            1)) /
                                                          +item.conversion
                                                      ),

                                                    p:
                                                      ((a?.p || 0) +
                                                        (+item?.one_pack ||
                                                          1)) %
                                                      +item.conversion,
                                                  }
                                                : a
                                            )
                                          : prev?.items?.length
                                          ? [
                                              ...prev.items,
                                              ...items
                                                ?.filter(
                                                  (a) =>
                                                    a.item_uuid ===
                                                    item.item_uuid
                                                )
                                                .map((a) => ({
                                                  ...a,
                                                  b:
                                                    +(a.b || 0) +
                                                    parseInt(
                                                      ((a?.p || 0) +
                                                        (+item?.one_pack ||
                                                          1)) /
                                                        +item.conversion
                                                    ),

                                                  p:
                                                    ((a?.p || 0) +
                                                      (+item?.one_pack || 1)) %
                                                    +item.conversion,
                                                })),
                                            ]
                                          : items
                                              ?.filter(
                                                (a) =>
                                                  a.item_uuid === item.item_uuid
                                              )
                                              .map((a) => ({
                                                ...a,
                                                b:
                                                  +(a.b || 0) +
                                                  parseInt(
                                                    ((a?.p || 0) +
                                                      (+item?.one_pack || 1)) /
                                                      +item.conversion
                                                  ),

                                                p:
                                                  ((a?.p || 0) +
                                                    (+item?.one_pack || 1)) %
                                                  +item.conversion,
                                              })),
                                      }));
                                    }}
                                  >
                                    <div className="menuItemDetails">
                                      <h1 className="item-name">
                                        {item?.item_title}
                                      </h1>
                                      <div
                                        className="item-mode flex"
                                        style={{
                                          justifyContent: "space-between",
                                        }}
                                      >
                                        <h3
                                          className={`item-price`}
                                          style={{ cursor: "pointer" }}
                                        >
                                          {+item?.item_discount ? (
                                            <>
                                              <span
                                                style={{
                                                  color: "red",
                                                  textDecoration:
                                                    "line-through",
                                                }}
                                              >
                                                Price: {item?.item_price}
                                              </span>
                                              <br />
                                              <span
                                                style={{
                                                  color: "red",
                                                  paddingLeft: "10px",
                                                  marginLeft: "10px",
                                                  fontWeight: "500",
                                                  borderLeft: "2px solid red",
                                                }}
                                              >
                                                {item?.item_discount} % OFF
                                              </span>
                                            </>
                                          ) : (
                                            <>Price: {item?.item_price}</>
                                          )}
                                          <span style={{ marginLeft: "20px" }}>
                                            Stock {getStock(item)}
                                          </span>
                                        </h3>
                                        <h3 className={`item-price`}>
                                          MRP: {item?.mrp || ""}
                                        </h3>
                                      </div>
                                    </div>
                                    <div className="menuleft">
                                      <input
                                        value={`${
                                          order?.items?.find(
                                            (a) =>
                                              a.item_uuid === item.item_uuid
                                          )?.b || 0
                                        } : ${
                                          order?.items?.find(
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
                                    </div>
                                  </div>
                                );
                              })}
                            <div className="menu">
                              <div className="menuItemDetails">
                                <h1 className="item-name"></h1>

                                <div className="item-mode">
                                  <h3 className={`item-price`}></h3>
                                </div>
                              </div>
                              <div className="menuleft"></div>
                            </div>
                          </div>
                        )
                    )
                : itemsCategory
                    ?.sort((a, b) => a.sort_order - b.sort_order)
                    ?.map(
                      (category) =>
                        order?.items.filter(
                          (a) => a.category_uuid === category.category_uuid
                        )?.length > 0 && (
                          <div
                            id={cartPage ? category?.category_uuid : ""}
                            name={category?.category_uuid}
                            key={category?.category_uuid}
                            className="categoryItemMap"
                          >
                            <h1 className="categoryHeadline">
                              {category?.category_title}
                            </h1>

                            {order?.items
                              ?.filter(
                                (a) =>
                                  !filterItemTitle ||
                                  a.item_title
                                    ?.toLocaleLowerCase()
                                    .includes(
                                      filterItemTitle.toLocaleLowerCase()
                                    )
                              )
                              ?.sort((a, b) => a.sort_order - b.sort_order)
                              .filter(
                                (a) =>
                                  a.category_uuid === category.category_uuid
                              )
                              ?.map((item) => {
                                return (
                                  <div
                                    key={item?.item_uuid}
                                    className="menu"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOrder((prev) => ({
                                        ...prev,
                                        items:
                                          prev?.items?.map((a) =>
                                            a.item_uuid === item.item_uuid
                                              ? {
                                                  ...a,
                                                  b:
                                                    +(a.b || 0) +
                                                    parseInt(
                                                      ((a?.p || 0) +
                                                        (+item?.one_pack ||
                                                          1)) /
                                                        +item.conversion
                                                    ),

                                                  p:
                                                    ((a?.p || 0) +
                                                      (+item?.one_pack || 1)) %
                                                    +item.conversion,
                                                }
                                              : a
                                          ) ||
                                          items
                                            ?.filter(
                                              (a) =>
                                                a.item_uuid === item.item_uuid
                                            )
                                            .map((a) => ({
                                              ...a,
                                              b:
                                                +(a.b || 0) +
                                                parseInt(
                                                  ((a?.p || 0) +
                                                    (+item?.one_pack || 1)) /
                                                    +item.conversion
                                                ),

                                              p:
                                                ((a?.p || 0) +
                                                  (+item?.one_pack || 1)) %
                                                +item.conversion,
                                            })),
                                      }));
                                    }}
                                  >
                                    <div className="menuItemDetails">
                                      <h1 className="item-name">
                                        {item?.item_title}
                                      </h1>

                                      <div
                                        className="item-mode flex"
                                        style={{
                                          justifyContent: "space-between",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <h3
                                          className={`item-price`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPricePopup(item);
                                          }}
                                        >
                                          Price:
                                          {order?.items?.find(
                                            (a) =>
                                              a.item_uuid === item.item_uuid
                                          )?.item_price || item?.item_price}
                                        </h3>
                                        <h3 className={`item-price`}>
                                          MRP: {item?.mrp || ""}
                                        </h3>
                                      </div>
                                    </div>
                                    <div className="menuleft">
                                      <input
                                        value={`${item?.b || 0} : ${
                                          item?.p || 0
                                        }`}
                                        className="boxPcsInput"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPopupForm(item);
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            <div className="menu">
                              <div className="menuItemDetails">
                                <h1 className="item-name"></h1>

                                <div className="item-mode">
                                  <h3 className={`item-price`}></h3>
                                </div>
                              </div>
                              <div className="menuleft"></div>
                            </div>
                          </div>
                        )
                    )}
            </div>
            {confirmItemsPopup ? (
              <div
                id="items-popup"
                style={{
                  backgroundColor: "rgba(128, 128, 128,0.8)",
                  zIndex: 9999999,
                  top: "0",
                  position: "fixed",
                  width: "100vw",
                  height: "100vh",
                  maxWidth: "500px",
                  minHeight: "-webkit-fill-available",
                }}
              >
                <button
                  onClick={() => setConfirmItemPopup(false)}
                  className="closeButton"
                  style={{
                    top: "10vh",
                    left: "50%",
                    translate: "-50%",
                    zIndex: "999999",
                  }}
                >
                  x
                </button>
                <div
                  className="menus"
                  style={{
                    position: "fixed",
                    boxShadow: "#32bd33 0 0 50px -10px",
                    width: "100vw",
                    maxWidth: "500px",
                    maxHeight: "80vh",
                    bottom: "0",
                    backgroundColor: "#fff",
                    overflow: "auto",
                    padding: "30px 10px 60px",
                    borderRadius: "2rem 2rem 0 0",
                  }}
                >
                  {itemsCategory

                    ?.sort((a, b) => a.sort_order - b.sort_order)
                    ?.map((category) =>
                      salesman_suggestion.filter(
                        (a) => a.category_uuid === category.category_uuid
                      )?.length > 0 ? (
                        <div
                          id={!cartPage ? category?.category_uuid : ""}
                          key={category?.category_uuid}
                          name={category?.category_uuid}
                          className="categoryItemMap"
                        >
                          <h1 className="categoryHeadline">
                            {category?.category_title}
                          </h1>

                          {salesman_suggestion
                            ?.filter(
                              (a) =>
                                !filterItemTitle ||
                                a.item_title
                                  ?.toLocaleLowerCase()
                                  .includes(filterItemTitle.toLocaleLowerCase())
                            )
                            ?.sort((a, b) => a.sort_order - b.sort_order)

                            .filter(
                              (a) => a.category_uuid === category.category_uuid
                            )
                            ?.map((item) => {
                              return (
                                <div
                                  key={item?.item_uuid}
                                  className="menu"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOrder((prev) => ({
                                      ...prev,
                                      items: prev?.items?.filter(
                                        (a) => a.item_uuid === item.item_uuid
                                      )?.length
                                        ? prev?.items?.map((a) =>
                                            a.item_uuid === item.item_uuid
                                              ? {
                                                  ...a,
                                                  b:
                                                    +(a.b || 0) +
                                                    parseInt(
                                                      ((a?.p || 0) +
                                                        (+item?.one_pack ||
                                                          1)) /
                                                        +item.conversion
                                                    ),

                                                  p:
                                                    ((a?.p || 0) +
                                                      (+item?.one_pack || 1)) %
                                                    +item.conversion,
                                                }
                                              : a
                                          )
                                        : prev?.items?.length
                                        ? [
                                            ...prev.items,
                                            ...items
                                              ?.filter(
                                                (a) =>
                                                  a.item_uuid === item.item_uuid
                                              )
                                              .map((a) => ({
                                                ...a,
                                                b:
                                                  +(a.b || 0) +
                                                  parseInt(
                                                    ((a?.p || 0) +
                                                      (+item?.one_pack || 1)) /
                                                      +item.conversion
                                                  ),

                                                p:
                                                  ((a?.p || 0) +
                                                    (+item?.one_pack || 1)) %
                                                  +item.conversion,
                                              })),
                                          ]
                                        : items
                                            ?.filter(
                                              (a) =>
                                                a.item_uuid === item.item_uuid
                                            )
                                            .map((a) => ({
                                              ...a,
                                              b:
                                                +(a.b || 0) +
                                                parseInt(
                                                  ((a?.p || 0) +
                                                    (+item?.one_pack || 1)) /
                                                    +item.conversion
                                                ),

                                              p:
                                                ((a?.p || 0) +
                                                  (+item?.one_pack || 1)) %
                                                +item.conversion,
                                            })),
                                    }));
                                  }}
                                >
                                  <div className="menuItemDetails">
                                    <h1 className="item-name">
                                      {item?.item_title}
                                    </h1>

                                    <div
                                      className="item-mode flex"
                                      style={{
                                        justifyContent: "space-between",
                                      }}
                                    >
                                      <h3
                                        className={`item-price`}
                                        style={{ cursor: "pointer" }}
                                      >
                                        {+item?.item_discount ? (
                                          <>
                                            <span
                                              style={{
                                                color: "red",
                                                textDecoration: "line-through",
                                              }}
                                            >
                                              Price: {item?.item_price}
                                            </span>
                                            <br />
                                            <span
                                              style={{
                                                color: "red",
                                                paddingLeft: "10px",
                                                marginLeft: "10px",
                                                fontWeight: "500",
                                                borderLeft: "2px solid red",
                                              }}
                                            >
                                              {item?.item_discount} % OFF
                                            </span>
                                          </>
                                        ) : (
                                          <>Price: {item?.item_price}</>
                                        )}
                                      </h3>
                                      <h3 className={`item-price`}>
                                        MRP: {item?.mrp || ""}
                                      </h3>
                                    </div>
                                  </div>
                                  <div className="menuleft">
                                    <input
                                      value={`${
                                        order?.items?.find(
                                          (a) => a.item_uuid === item.item_uuid
                                        )?.b || 0
                                      } : ${
                                        order?.items?.find(
                                          (a) => a.item_uuid === item.item_uuid
                                        )?.p || 0
                                      }`}
                                      className="boxPcsInput"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPopupForm(item);
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        ""
                      )
                    )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFilterItemTile("");

                    setCartPage(true);
                    setConfirmItemPopup(false);
                    setEnable(false);
                  }}
                  className="cartBtn"
                  style={{
                    padding: "3px",
                    opacity: enable ? 1 : 0.5,
                    position: "fixed",
                    zIndex: "9999999",
                  }}
                  disabled={!enable}
                >
                  Done
                </button>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
      <div
        className="allcategoryList"
        style={{
          bottom: itemsCategory?.length > 0 ? "0" : "1rem",
        }}
      >
        <div className={`menulist`} style={{ maxWidth: "500px" }}>
          <div
            className={`${isCategoryOpen ? "showCategory" : ""} categoryList`}
            style={{ overflow: "scroll" }}
          >
            {itemsCategory
              .filter((a) => a.company_uuid === filterCompany)
              ?.sort((a, b) => a.sort_order - b.sort_order)
              ?.map((category, i) => {
                return (
                  (cartPage
                    ? order?.items?.filter(
                        (a) => a.category_uuid === category.category_uuid
                      )?.length > 0
                    : items.filter(
                        (a) => a.category_uuid === category.category_uuid
                      )?.length > 0) && (
                    <ScrollLink
                      id={`${i}`}
                      onClick={() => {
                        var element = document.getElementById(
                          category.category_uuid
                        );

                        element.scrollIntoView();
                        element.scrollIntoView(false);
                        element.scrollIntoView({ block: "start" });
                        element.scrollIntoView({
                          behavior: "smooth",
                          block: "end",
                          inline: "nearest",
                        });
                        setIsCategoryOpen(!isCategoryOpen);
                        setClickedId(i?.toString());
                      }}
                      smooth={true}
                      duration={1000}
                      to={category?.category_uuid}
                      className={`${
                        clickedId === i?.toString() ? "activeMenuList" : ""
                      } categorybtn`}
                      key={i}
                    >
                      {category?.category_title}
                      <span className="categoryLength">
                        {cartPage
                          ? order?.items?.filter(
                              (a) => a.category_uuid === category.category_uuid
                            )?.length
                          : items
                              .filter(
                                (a) =>
                                  a.category_uuid === category.category_uuid
                              )
                              ?.filter(
                                (a) =>
                                  !filterItemTitle ||
                                  a.item_title
                                    ?.toLocaleLowerCase()
                                    .includes(
                                      filterItemTitle.toLocaleLowerCase()
                                    )
                              )?.length}
                      </span>
                    </ScrollLink>
                  )
                );
              })}
          </div>
          {isCategoryOpen && <div id="black-bg" />}
          {!isCategoryOpen ? (
            <button
              className="showMenuListBtn"
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            >
              Categories
            </button>
          ) : (
            <button
              className="showMenuListBtn"
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            >
              <i className="fas fa-times"></i> Close
            </button>
          )}
          {cartPage ? (
            <>
              <button
                type="button"
                className="cartBtn"
                style={{ padding: "3px", position: "relative", width: "100%" }}
                onClick={async () => {
                  setLoading(true);
                  const db = await openDB(
                    "BT",
                    +localStorage.getItem("IDBVersion") || 1
                  );
                  let tx = db
                    .transaction("autobill", "readwrite")
                    .objectStore("autobill");
                  let autobills = await tx.getAll();
                  let store = db
                    .transaction("items", "readwrite")
                    .objectStore("items");
                  let dbItems = await store.getAll();
                  let data = await AutoAdd({
                    counter,
                    items: order.items,
                    dbItems,
                    autobills: autobills.filter((a) => a.status),
                  });
                  setOrder((prev) => ({
                    ...prev,
                    ...data,
                    items: data?.items?.map((a) => ({
                      ...a,
                      b: +a.b + parseInt(+a.p / +a.conversion),
                      p: +a.p % +a.conversion,
                    })),
                  }));
                  setTimeout(async () => {
                    let checkItemHaveSameBillingType = order.items.find(
                      (a) => a.billing_type !== order.items[0].billing_type
                    );
                   
                    if (checkItemHaveSameBillingType) {
                      setLoading(false);
                      return setNotification({
                        message: "Invoice and Estimate together not allowed",
                        success: false,
                      });
                    }

                    let time = new Date();
                    Billing({
                      new_order: 1,
                      order_uuid: order?.order_uuid,
                      invoice_number: `${order.items[0].billing_type}${order?.invoice_number}`,
                      creating_new: true,
                      counter,
                      items: data.items,
                      order_type:order.items[0].billing_type,
                      others: {
                        stage: 1,
                        user_uuid: localStorage.getItem("user_uuid"),
                        time: time.getTime(),
                        type: "NEW",
                      },
                      add_discounts: true,
                    }).then((data) => {
                      setOrder((prev) => ({ ...prev, ...data }));
                      postOrder({ ...order, ...data });
                      db.close();
                    });
                  }, 2000);
                }}
              >
                {total ? "Rs: " + total : ""} Submit
              </button>
            </>
          ) : order?.items?.length ? (
            <button
              type="button"
              onClick={() => {
                if (salesman_suggestion.length) {
                  setConfirmItemPopup(true);
                  setTimeout(() => setEnable(true), 5000);
                  return;
                }
                setFilterItemTile("");

                setCartPage(true);
              }}
              className="cartBtn"
              style={{ padding: "3px", position: "relative", width: "100%" }}
            >
              Cart
            </button>
          ) : (
            ""
          )}
        </div>
      </div>

      {popupForm ? (
        <NewUserForm
          onSave={() => setPopupForm(false)}
          setOrder={setOrder}
          popupInfo={popupForm}
          order={order}
        />
      ) : (
        ""
      )}
      {discountPopup ? (
        <DiscountPopup
          onSave={() => setDiscountPopup(false)}
          setOrder={setOrder}
          order={order}
        />
      ) : (
        ""
      )}
      {popupState ? (
        <PriorityPopup
          close={() => setPopupState(false)}
          setOrder={setOrder}
          order={order}
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

      {holdPopup ? (
        <HoldPopup
          onSave={() => setHoldPopup(false)}
          orders={order}
          holdPopup={holdPopup}
          itemsData={items}
          setOrder={setOrder}
        />
      ) : (
        ""
      )}
      {pricePopup ? (
        <PricePopup
          onSave={() => setPricePopup(false)}
          orders={order}
          holdPopup={pricePopup}
          itemsData={items}
          setOrder={setOrder}
        />
      ) : (
        ""
      )}
      {/* {foodLicensePopup ? (
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
                <form className="form" onSubmit={putCounterData}>
                  <div className="formGroup">
                    <div
                      className="row"
                      style={{ flexDirection: "row", alignItems: "flex-start" }}
                    >
                      <label
                        className="selectLabel flex"
                        style={{ width: "200px" }}
                      >
                        Food License
                        <input
                          type="text"
                          name="route_title"
                          className="numberInput"
                          value={food_license}
                          style={{ width: "200px" }}
                          onChange={(e) => setFoodLicence(e.target.value)}
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
              <button
                onClick={() => setFoodLicencePopup(false)}
                className="closeButton"
              >
                x
              </button>
            </div>
          </div>
        </div>
      ) : (
        ""
      )} */}
      {invoice_number ? (
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
                <h3>Invoice Number</h3>
                <h1
                  style={{
                    width: "100%",
                    textAlign: "center",
                    fontSize: "50px",
                    color: "var(--main)",
                  }}
                >
                  {invoice_number}
                </h1>
                {checkNumberPopup ? (
                  <h2>Incentive Estimate Rs {checkNumberPopup}</h2>
                ) : (
                  ""
                )}
                <form className="form" onSubmit={putCounterNumber}>
                  <button type="submit" className="submit">
                    Great
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
};

export default SelectedCounterOrder;
function HoldPopup({ onSave, orders, itemsData, holdPopup, setOrder }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    setItems(itemsData.filter((a) => a.free_issue === "Y"));
  }, []);
  const postOrderData = async () => {
    let data = orders;
    let itemsdata = items.filter((a) => a.free);
    let filterItem = data?.items?.filter(
      (a) => !itemsdata.filter((b) => b.item_uuid === a.item_uuid).length
    );
    let NonFilterItem = data.items.filter(
      (a) => itemsdata.filter((b) => b.item_uuid === a.item_uuid).length
    );
    NonFilterItem = itemsdata.map((a) =>
      NonFilterItem.filter((b) => b.item_uuid === a.item_uuid).length
        ? {
            ...NonFilterItem.find((b) => b.item_uuid === a.item_uuid),
            free: a.free,
          }
        : { ...a, b: 0, p: 0 }
    );
    let item_details = filterItem.length
      ? NonFilterItem.length
        ? [...filterItem, ...NonFilterItem]
        : filterItem
      : NonFilterItem.length
      ? NonFilterItem
      : [];
    setOrder((prev) => ({ ...prev, items: item_details }));
   
    onSave();
  };
 
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
        <h1>Free Items</h1>
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
                    <tr>
                      <th colSpan={3}>
                        <div className="t-head-element">Item</div>
                      </th>
                      <th colSpan={2}>
                        <div className="t-head-element">Qty</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tbody">
                    {items?.map((item, i) => (
                      <tr
                        key={item?.item_uuid || Math.random()}
                        style={{
                          height: "30px",
                        }}
                      >
                        <td colSpan={3}>{item.item_title}</td>
                        <td colSpan={2}>
                          <input
                            type="number"
                            name="route_title"
                            className="numberInput"
                            value={item?.free || ""}
                            style={{
                              width: "100px",
                              backgroundColor: "transparent",
                              color: "#000",
                            }}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((a) =>
                                  a.item_uuid === item.item_uuid
                                    ? { ...a, free: e.target.value }
                                    : a
                                )
                              )
                            }
                            onWheel={(e) => e.preventDefault()}
                            maxLength={42}
                          />
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

            {items.filter((a) => a.free).length ? (
              <div className="flex" style={{ justifyContent: "space-between" }}>
                {/* <button
                type="button"
                style={{ backgroundColor: "red" }}
                className="submit"
                onClick={onSave}
              >
                Cancel
              </button> */}
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
          </div>
          <button onClick={onSave} className="closeButton">
            x
          </button>
        </div>
      </div>
    </div>
  );
}
function PricePopup({ onSave, orders, itemsData, holdPopup, setOrder }) {
  const [item, setItem] = useState();
  useEffect(() => {
    setItem(() => {
      let data = itemsData.find((a) => a.item_uuid === holdPopup.item_uuid);
      return {
        ...data,
        p_price: data.item_price,
        b_price: Math.floor(data.item_price * data.conversion || 0),
        discount: data.discount || 0,
      };
    });
  }, []);
  const postOrderData = async () => {
    let data = orders;
    let item_details = data.items.map((a) =>
      a.item_uuid === holdPopup.item_uuid
        ? {
            ...a,
            price_approval: "N",
            discount: item.discount,
          }
        : a
    );
    setOrder((prev) => ({ ...prev, order_status: "A", items: item_details }));
   
    onSave();
  };
 
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
        <h1>Free Items</h1>
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
                  <tr>
                    <th colSpan={2}>
                      <div className="t-head-element">PCS Price</div>
                    </th>
                    <th colSpan={2}>
                      <div className="t-head-element">BOX Price</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="tbody">
                  <tr
                    key={item?.item_uuid || Math.random()}
                    style={{
                      height: "30px",
                    }}
                  >
                    <td colSpan={2}>
                      <input
                        type="number"
                        name="route_title"
                        className="numberInput"
                        value={item?.p_price || ""}
                        style={{
                          width: "100px",
                          backgroundColor: "transparent",
                          color: "#000",
                        }}
                        onChange={(e) => {
                          setItem((prev) => ({
                            ...prev,
                            discount: (
                              ((item?.item_price - e.target.value) /
                                item?.item_price) *
                              100
                            ).toFixed(2),
                            p_price: e.target.value,
                            b_price: (
                              e.target.value * item.conversion || 0
                            ).toFixed(2),
                          }));
                        }}
                        onWheel={(e) => e.preventDefault()}
                        maxLength={42}
                      />
                    </td>

                    <td colSpan={2}>
                      <input
                        type="number"
                        name="route_title"
                        className="numberInput"
                        value={item?.b_price}
                        style={{
                          width: "100px",
                          backgroundColor: "transparent",
                          color: "#000",
                        }}
                        onChange={(e) => {
                          setItem((prev) => ({
                            ...prev,
                            discount: (
                              ((item?.item_price -
                                e.target.value / item.conversion) /
                                item?.item_price) *
                              100
                            ).toFixed(2),
                            b_price: e.target.value,
                            p_price: (
                              e.target.value / item.conversion || 0
                            ).toFixed(2),
                          }));
                        }}
                        onWheel={(e) => e.preventDefault()}
                        maxLength={42}
                      />
                    </td>
                  </tr>
                </tbody>
                <thead>
                  <tr>
                    <th colSpan={4}>
                      <div className="t-head-element">Discount</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="tbody">
                  <tr>
                    <td colSpan={4}>
                      <input
                        type="number"
                        name="route_title"
                        className="numberInput"
                        value={item?.discount}
                        style={{
                          width: "100px",
                          backgroundColor: "transparent",
                          color: "#000",
                        }}
                        onChange={(e) => {
                          let item_price = +item.item_price * +item.conversion;
                          setItem((prev) => ({
                            ...prev,
                            discount: e.target.value,
                            b_price: (
                              item_price -
                              (item_price * e.target.value) / 100
                            )?.toFixed(2),
                            p_price: (
                              +item.item_price -
                              (+item.item_price * e.target.value) / 100
                            )?.toFixed(2),
                          }));
                        }}
                        onWheel={(e) => e.preventDefault()}
                        maxLength={42}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex" style={{ justifyContent: "space-between" }}>
              {/* <button
                type="button"
                style={{ backgroundColor: "red" }}
                className="submit"
                onClick={onSave}
              >
                Cancel
              </button> */}
              <button type="button" className="submit" onClick={postOrderData}>
                Save
              </button>
            </div>
          </div>
          <button onClick={onSave} className="closeButton">
            x
          </button>
        </div>
      </div>
    </div>
  );
}
function NewUserForm({ onSave, popupInfo, setOrder, order }) {
  const [data, setdata] = useState({});
  const [errMassage, setErrorMassage] = useState("");
  useEffect(() => {
    let data = order.items?.find((a) => a.item_uuid === popupInfo.item_uuid);
    setdata({
      b: data?.b || 0,
      p: data?.p || 0,
    });
  }, []);
  const submitHandler = async (e) => {
    e.preventDefault();
    setOrder((prev) => ({
      ...prev,
      items: (prev?.items?.filter((a) => a.item_uuid === popupInfo.item_uuid)
        ?.length
        ? prev?.items?.map((a) =>
            a.item_uuid === popupInfo.item_uuid
              ? {
                  ...a,
                  b: +data.b + parseInt(+data.p / +popupInfo.conversion),
                  p: +data.p % +popupInfo.conversion,
                }
              : a
          )
        : prev?.items?.length
        ? [
            ...prev?.items,
            {
              ...popupInfo,
              b: +data.b + parseInt(+data.p / +popupInfo.conversion),
              p: +data.p % +popupInfo.conversion,
            },
          ]
        : [
            {
              ...popupInfo,
              b: +data.b + parseInt(+data.p / +popupInfo.conversion),
              p: +data.p % +popupInfo.conversion,
            },
          ]
      ).filter((a) => a.b || a.p || a.free),
    }));
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
                      autoFocus={true}
                      maxLength={42}
                      onWheel={(e) => e.preventDefault()}
                    />
                  </label>
                </div>
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
  );
}
function DiscountPopup({ onSave, setOrder, order }) {
  const [data, setdata] = useState({});
  const [errMassage, setErrorMassage] = useState("");
  const [itemsData, setItemsData] = useState([]);
  const { counter_uuid } = useParams();
  const submitHandler = async (e) => {
    e.preventDefault();
    setOrder((prev) => ({
      ...prev,
      items: prev?.items?.map((a) =>
        a.exclude_discount === 0
          ? {
              ...a,
              charges_discount: [
                ...(a.charges_discount || []),
                { title: "Bill Discounting", value: data },
              ],
            }
          : a
      ),
    }));
    onSave();
  };
  const DiscountEligablilityChecking = async () => {
    const response = await axios({
      method: "post",
      url: "/counter_scheme/getRangeOrderEligibleDiscounts",
      data: {
        ...order,
        counter_uuid,
        user_uuid: localStorage.getItem("user_uuid"),
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setItemsData(response.data.result);
  };
  useEffect(() => {
    DiscountEligablilityChecking();
  }, []);
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
                    Discount
                    <input
                      type="number"
                      name="route_title"
                      className="numberInput"
                      value={data}
                      style={{ width: "100px" }}
                      onChange={(e) => setdata(e.target.value)}
                      autoFocus={true}
                      maxLength={42}
                      onWheel={(e) => e.preventDefault()}
                    />
                  </label>
                </div>
                {itemsData?.map((item) => (
                  <div
                    className="row"
                    style={{ flexDirection: "row", alignItems: "flex-start" }}
                  >
                    <label
                      className="selectLabel flex"
                      style={{ width: "100px" }}
                    >
                      {item.discount_title || ""} is eligible
                    </label>
                  </div>
                ))}
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
  );
}
function PriorityPopup({ setOrder, order, close }) {
  const priorityOptions = [
    { value: 0, label: "Normal" },
    { value: 1, label: "High" },
  ];
  return (
    <div className="overlay">
      <div className="modal">
        <div className="content" style={{ padding: "20px" }}>
          <div className="formGroup" style={{ padding: "30px" }}>
            {priorityOptions?.map((i) => (
              <div
                className="flex"
                style={{
                  alignItems: "center",
                  gap: "30px",
                  justifyContent: "flex-start",
                }}
              >
                <input
                  type="radio"
                  checked={+order?.priority === i.value}
                  id={i.label}
                  onChange={(e) => {
                    setOrder((o) => ({ ...o, priority: i.value }));
                    close();
                  }}
                />
                <label htmlFor={i.label} className="selectLabel">
                  {i.label}
                </label>
              </div>
            ))}
          </div>
          <button onClick={close} className="closeButton">
            x
          </button>
        </div>
      </div>
    </div>
  );
}
