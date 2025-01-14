import { useState, useEffect, useMemo, useContext, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";
import axios from "axios";
import context from "../context/context";
import { IoArrowBackOutline } from "react-icons/io5";

const AdvanceOrderingPage = () => {
  const [items, setItems] = useState([]);
  const Navigate = useNavigate();
  const [confirmItemsPopup, setConfirmItemPopup] = useState(false);

  const [order, setOrder] = useState([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [clickedId, setClickedId] = useState(false);
  const [cartPage, setCartPage] = useState(false);

  const [orderStatus, setOrderStatus] = useState(0);

  const [counter, setCounter] = useState({});

  const params = useParams();
  const [filterItemTitle, setFilterItemTile] = useState("");
  const [itemsCategory, setItemsCategory] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [popupForm, setPopupForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const { setNotification } = useContext(context);

  const getCounter = async () => {
    setLoading(true);
    try {
      const response = await axios({
        method: "post",
        url: "/counters/GetCounterByCategory",
        data: {
          counter_uuid: params.counter_uuid,
          categories: JSON.parse(localStorage.getItem("selectedCategories")),
        },
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.message) setNotification(response.data);
      setTimeout(() => setNotification(""), 5000);
     
      if (response.data.success) {
        setOrderStatus(response.data.result.order_status);
        setCounter(response.data.result.counter);
        localStorage.setItem(
          "counter_uuid",
          response.data.result.counter.counter_uuid
        );
        setItemsCategory(response.data.result.ItemCategories);
        setItems(
          response.data.result.items.map((a) => ({
            ...a,
            stockValue: getStockData(a),
          }))
        );
       
        setCompanies(response.data.result.company);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const postCounterStocks = async () => {
    setLoading(true);
    let category_uuid = JSON.parse(localStorage.getItem("selectedCategories"));
    const response = await axios({
      method: "post",
      url: "/counterStock/add",
      data: {
        counter_uuid: params.counter_uuid,
        user_uuid: localStorage.getItem("user_uuid"),
        category_uuid,
        timestamp: new Date(new Date().setHours(0, 0, 0, 0)).getTime(),
        details: items
          .filter(
            (a) => category_uuid.find((b) => a.category_uuid === b) && a.status
          )
          .map((a) => {
            let itemA = order.items.find((b) => b.item_uuid === a.item_uuid);
            return {
              ...a,
              pcs: +(itemA?.b || 0) * +a.conversion + +(itemA?.p ?? 0),
            };
          }),
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      setLoading(false);
      getStocks(items.map((a) => a.item_uuid));

      setNotification({ success: true, message: "Counter Stocks Added" });
      setTimeout(() => setNotification(""), 5000);
    }
  };

  function calculateStockValue(stock, one_pack) {
    if (stock < one_pack) {
      return one_pack;
    } else if (stock === one_pack) {
      return one_pack;
    } else if (stock % one_pack === 0) {
      return stock;
    } else {
      return Math.ceil(stock / one_pack) * one_pack;
    }
  }
  const getStocks = async (item_uuid) => {
    setLoading(true);
    const response = await axios({
      method: "post",
      url: "/counterStock/getStocksItem",
      data: {
        counter_uuid: params.counter_uuid,
        category_uuid: JSON.parse(localStorage.getItem("selectedCategories")),
        item_uuid,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      let data = response.data.result;
      setOrder((prev) => {
        let prevItems = data.map((a) => {
          let itemA = prev.items.find((b) => b.item_uuid === a.item_uuid);
          if (!itemA) {
            itemA = items.find((b) => b.item_uuid === a.item_uuid);
          }
          const selected_warehouse = localStorage.getItem("selected_warehouse");
    const warehouse_stock = itemA?.stock?.find(
      (i) => i.warehouse_uuid === selected_warehouse
    );
    
          let projection =
            a.projection > 0
              ? calculateStockValue(a.projection, itemA.one_pack)
              : !a.initialValue && !a.finalValue && +warehouse_stock?.qty
              ? itemA.one_pack
              : 0;
          return {
            ...itemA,
            b: ~~(projection / +itemA?.conversion),
            p: ~~(projection % +itemA?.conversion),
          };
        });
        return {
          ...prev,
          items: prevItems,
        };
      });
     
    }
    setLoading(false);
  };
  const getStockData = (item) => {
    const selected_warehouse = localStorage.getItem("selected_warehouse");
    const warehouse_stock = item?.stock?.find(
      (i) => i.warehouse_uuid === selected_warehouse
    );
    if (!warehouse_stock) return `N/A`;
    return `${parseInt(+warehouse_stock?.qty / +item?.conversion)}:${parseInt(
      +warehouse_stock?.qty % +(+item?.conversion)
    )}`;
  };
  useEffect(() => {
    getCounter();
    localStorage.removeItem("projectionItems");
  }, []);
  let filterItems = useMemo(
    () =>
      ((cartPage ? order.items.filter((a) => a.p > 0 || a.b > 0) : items) || [])
        ?.map((a) => ({
          ...a,
          item_price:
            counter.item_special_price?.find((b) => b.item_uuid === a.item_uuid)
              ?.price || a.item_price,
          b: 0,
          p: 0,
        }))
        ?.filter(
          (a) =>
            !filterItemTitle ||
            a.item_title
              ?.toLocaleLowerCase()
              .includes(filterItemTitle.toLocaleLowerCase())
        ),
    [cartPage, counter.item_special_price, filterItemTitle, items, order.items]
  );
  let filteredCategory = useMemo(
    () =>
      itemsCategory?.filter(
        (b) =>
          filterItems?.filter((a) => a.category_uuid === b.category_uuid)
            ?.length
      ),
    [filterItems, itemsCategory]
  );
  let filteredCompany = useMemo(
    () =>
      companies?.filter(
        (b) =>
          filteredCategory?.filter((a) => a.company_uuid === b.company_uuid)
            ?.length
      ),
    [companies, filteredCategory]
  );
  const onCategoryDoubleTab = (category_uuid) => {
    setOrder((prev) => ({
      ...prev,
      items: prev?.items?.map((a) =>
        a.category_uuid === category_uuid
          ? {
              ...a,
              cancelled: a.cancelled ? false : true,
            }
          : a
      ),
    }));
  };
  const onItemDoubleTab = (item_uuid) => {
    setOrder((prev) => ({
      ...prev,
      items: prev?.items?.map((a) =>
        a.item_uuid === item_uuid
          ? {
              ...a,
              cancelled: a.cancelled ? false : true,
            }
          : a
      ),
    }));
  };
  return (
    <>
      <nav className="user_nav nav_styling" style={{ maxWidth: "500px" }}>
        <div className="user_menubar">
          <IoArrowBackOutline
            className="user_Back_icon"
            onClick={() => Navigate(-1)}
          />
        </div>
        <div className="user_menubar">
          <input
            style={{ width: "200px" }}
            className="searchInput"
            type="text"
            placeholder="search"
            value={filterItemTitle}
            onChange={(e) => setFilterItemTile(e.target.value)}
          />
        </div>

        <div style={{ width: "100%", textAlign: "center", fontWeight: "900" }}>
          {counter?.counter_title || ""}
        </div>
      </nav>
      <div className="home">
        <div className="container" style={{ maxWidth: "500px" }}>
          <div className="menucontainer">
            <div className="menus">
              {cartPage ? (
                filteredCompany.length ? (
                  filteredCompany.map((company) => (
                    <div
                      id={company?.company_uuid}
                      key={company?.company_uuid}
                      name={company?.company_uuid}
                      className="categoryItemMap"
                    >
                      <h1
                        className="categoryHeadline"
                        style={{
                          textAlign: "center",
                          fontSize: "40px",
                          textDecoration: "underline",
                          color: "#5BC0F8",
                        }}
                      >
                        {company?.company_title}
                      </h1>
                      {filteredCategory
                        ?.filter((a) => a.company_uuid === company.company_uuid)
                        ?.sort((a, b) => a.sort_order - b.sort_order)
                        ?.map((category) => (
                          <div
                            id={category?.category_uuid}
                            key={category?.category_uuid}
                            name={category?.category_uuid}
                            className="categoryItemMap"
                          >
                            <h2 className="categoryHeadline small" onDoubleClick={()=>onCategoryDoubleTab(category.category_uuid)}>
                              {category?.category_title}
                            </h2>

                            {filterItems
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

                              ?.filter(
                                (a) =>
                                  a.category_uuid === category.category_uuid
                              )
                              ?.map((item) => {
                                return (
                                  <div
                                    key={item?.item_uuid}
                                    className="menu"
                                    onDoubleClick={() => onItemDoubleTab(item.item_uuid)}
                                  >
                                    <div className="menuItemDetails">
                                      <h1
                                        className="item-name"
                                        style={
                                          item.cancelled
                                            ? {
                                                textDecoration: "line-through",
                                                color: "red",
                                              }
                                            : {}
                                        }
                                      >
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
                                        </h3>
                                        <h3 className={`item-price`}>
                                          MRP: {item?.mrp || ""}
                                        </h3>
                                        <h3 className={`item-price`}>
                                          Stock: {item?.stockValue || 0}
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
                                        disabled={!orderStatus}
                                        className="boxPcsInput"
                                        style={
                                          !orderStatus
                                            ? {
                                                border: "2px solid gray",
                                                boxShadow: "0 2px 8px gray",
                                              }
                                            : {}
                                        }
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (orderStatus) setPopupForm(item);
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
                        ))}
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
                  ))
                ) : (
                  <h1 style={{ textAlign: "center" }}>No Items</h1>
                )
              ) : (
                filteredCompany.map((company) => (
                  <div
                    id={company?.company_uuid}
                    key={company?.company_uuid}
                    name={company?.company_uuid}
                    className="categoryItemMap"
                  >
                    <h1
                      className="categoryHeadline"
                      style={{
                        textAlign: "center",
                        fontSize: "40px",
                        textDecoration: "underline",
                        color: "#5BC0F8",
                      }}
                    >
                      {company?.company_title}
                    </h1>
                    {filteredCategory
                      ?.filter((a) => a.company_uuid === company.company_uuid)
                      ?.sort((a, b) => a.sort_order - b.sort_order)
                      ?.map((category) => (
                        <div
                          id={category?.category_uuid}
                          key={category?.category_uuid}
                          name={category?.category_uuid}
                          className="categoryItemMap"
                        >
                          <h2 className="categoryHeadline small">
                            {category?.category_title}
                          </h2>

                          {filterItems
                            ?.filter(
                              (a) =>
                                !filterItemTitle ||
                                a.item_title
                                  ?.toLocaleLowerCase()
                                  .includes(filterItemTitle.toLocaleLowerCase())
                            )
                            ?.sort((a, b) => a.sort_order - b.sort_order)

                            ?.filter(
                              (a) => a.category_uuid === category.category_uuid
                            )
                            ?.map((item) => {
                              return (
                                <div
                                  key={item?.item_uuid}
                                  className="menu"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (orderStatus)
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
                                                        ((a?.p || 0) + 1) /
                                                          +item.conversion
                                                      ),

                                                    p:
                                                      ((a?.p || 0) + 1) %
                                                      +item.conversion,
                                                  }
                                                : a
                                            )
                                          : prev?.items?.length
                                          ? [
                                              ...prev.items,
                                              ...filterItems
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
                                                      ((a?.p || 0) + 1) /
                                                        +item.conversion
                                                    ),

                                                  p:
                                                    ((a?.p || 0) + 1) %
                                                    +item.conversion,
                                                })),
                                            ]
                                          : filterItems
                                              ?.filter(
                                                (a) =>
                                                  a.item_uuid === item.item_uuid
                                              )
                                              .map((a) => ({
                                                ...a,
                                                b:
                                                  +(a.b || 0) +
                                                  parseInt(
                                                    ((a?.p || 0) + 1) /
                                                      +item.conversion
                                                  ),

                                                p:
                                                  ((a?.p || 0) + 1) %
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
                                      <h3 className={`item-price`}>
                                        Stock: {item?.stockValue || 0}
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
                                      disabled={!orderStatus}
                                      className="boxPcsInput"
                                      style={
                                        !orderStatus
                                          ? {
                                              border: "2px solid gray",
                                              boxShadow: "0 2px 8px gray",
                                            }
                                          : {}
                                      }
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (orderStatus) setPopupForm(item);
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
                      ))}
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
                ))
              )}
            </div>
            {confirmItemsPopup ? (
              <div
                style={{
                  backgroundColor: "rgba(128, 128, 128,0.8)",
                  zIndex: 9999999,
                  top: "0",
                  position: "fixed",
                  width: "100vw",
                  height: "100vh",
                  maxWidth: "500px",
                  minHeight: "-webkit-fill-available",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  className="categoryItemMap"
                  style={{
                    width: "300px",
                    borderRadius: "10px",
                    height: "10px",
                  }}
                >
                  <h1 className="categoryHeadline">
                    {cartPage ? "Load Projection" : "Confirm Submit"}
                  </h1>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      padding: "10px 20px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (cartPage) {
                          localStorage.setItem(
                            "projectionItems",
                            JSON.stringify(
                              order.items.filter(
                                (a) => !a.cancelled && (a.b > 0 || a.p > 0)
                              )
                            )
                          );
                          Navigate("/users/orders/" + params.counter_uuid);
                        } else {
                          postCounterStocks();
                          setCartPage(true);
                          setConfirmItemPopup(false);
                        }
                      }}
                      className="theme-btn"
                      style={{ backgroundColor: "rgb(68, 205, 74)" }}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (cartPage) {
                          Navigate("/users/orders/" + params.counter_uuid);
                        } else {
                          setConfirmItemPopup(false);
                        }
                      }}
                      className="theme-btn"
                    >
                      No
                    </button>
                  </div>
                </div>
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
          bottom: itemsCategory?.length > 0 ? "3.5rem" : "1rem",
        }}
      >
        <div className={`menulist`} style={{ maxWidth: "500px" }}>
          <div
            className={`${isCategoryOpen ? "showCategory" : ""} categoryList`}
            style={{ overflow: "scroll" }}
          >
            {filteredCategory
              ?.sort((a, b) => a.sort_order - b.sort_order)
              ?.map((category, i) => {
                return (
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
                    <span style={{ width: "50%" }}>
                      {category?.category_title}
                    </span>

                    <i
                      className="categoryLength"
                      style={{ color: "var(--main)", fontSize: "15px" }}
                    >
                      {companies.find(
                        (a) => a.company_uuid === category.company_uuid
                      )?.company_title || ""}
                    </i>
                    <span className="categoryLength">
                      {filterItems?.filter(
                        (a) => a.category_uuid === category.category_uuid
                      )?.length || 0}
                    </span>
                  </ScrollLink>
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
      {order?.items?.length ? (
        <button
          type="button"
          onClick={() => setConfirmItemPopup(true)}
          className="cartBtn"
        >
          {cartPage ? "Next" : "Submit"}
        </button>
      ) : (
        ""
      )}
    </>
  );
};

export default AdvanceOrderingPage;

function NewUserForm({ onSave, popupInfo, setOrder, order }) {
  const [data, setdata] = useState({});
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
      )?.filter((a) => a.b || a.p || a.free),
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
