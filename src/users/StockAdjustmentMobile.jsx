import { IoArrowBackOutline } from "react-icons/io5";
import { useState, useEffect, useCallback, useRef } from "react";
import { openDB } from "idb";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import { formatAMPM } from "../utils/helperFunctions";
let time = new Date();
const StockAdjustmentMobile = () => {
  const [items, setItems] = useState([]);
  const [warehouseUuid, setWarehouseUuid] = useState("");
  const [warehouse, setWarehouse] = useState([]);
  const [filterItemTitle, setFilterItemTile] = useState("");
  const [order, setOrder] = useState({
    type: "SA",
    created_by: localStorage.getItem("user_uuid"),
    from_warehouse: 0,
    to_warehouse: "",
    created_at: time.getTime(),
    item_details: [],
  });
  const [filterCategory, setFilterCategory] = useState("");
  const [itemsCategory, setItemsCategory] = useState([]);
  const [popupForm, setPopupForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const componentRef = useRef(null);
  const Navigate = useNavigate();
  const onSubmit = async () => {
    setLoading(true);
    let item_details = order.items
      .map((item) => {
        return {
          ...item,
          b: 0,
          p:
            (+item.b || 0) * (+item.conversion || 0) +
            (+item.p || 0) -
            item.stockQty,
        };
      })
      .filter((a) => a.p);

    setOrder((prev) => ({ ...prev, item_details }));
    const response = await axios({
      method: "post",
      url: "/vouchers/postVoucher",
      data: { ...order, to_warehouse: warehouseUuid, item_details },
      headers: {
        "Content-Type": "application/json",
      },
    });
   
    if (response.data.success) {
      setLoading(false);
      Navigate(-1);
    }
  };
  const reactToPrintContent = useCallback(() => {
    return componentRef.current;
  }, []);
  const handlePrint = useReactToPrint({
    content: reactToPrintContent,
    
    removeAfterPrint: true,
  });
  const getRemaingStock = (item) => {
    const warehouse_stock = item.stock?.find(
      (i) => i.warehouse_uuid === warehouseUuid
    );
    if (!warehouse_stock) return `N/A`;
    let q = +item.q || 0;
    let p = +item.p || 0;
    let finalQty = (+warehouse_stock?.qty || 0) - (q * +item?.conversion + p);
    return `${parseInt(finalQty / +item?.conversion)}:${parseInt(
      finalQty % +(+item?.conversion)
    )}`;
  };

  const getIndexedDbData = async () => {
    const db = await openDB("BT", +localStorage.getItem("IDBVersion") || 1);

    let tx = await db
      .transaction("warehouse", "readwrite")
      .objectStore("warehouse");
    let warehouseData = await tx.getAll();
   
    setWarehouse(warehouseData.filter((a) => a.status && a.warehouse_title));
    if (warehouseData.length)
      setWarehouseUuid(warehouseData[0]?.warehouse_uuid);

    let store = await db
      .transaction("item_category", "readwrite")
      .objectStore("item_category");
    let route = await store.getAll();
    setItemsCategory(route);
    if (route.length) setFilterCategory(route[0]?.category_uuid);
    db.close();
  };
  const getItemsData = async (warehouseUuid) => {
    const response = await axios({
      method: "get",
      url: "/items/GetItemStockList/" + warehouseUuid,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success)
      setItems(response.data.result?.filter((a) => a.status));
  };
  useEffect(() => {
    getIndexedDbData();
  }, []);
  useEffect(() => {
    if (warehouseUuid) getItemsData(warehouseUuid);
  }, [warehouseUuid]);
  useEffect(() => {
    if (warehouseUuid) {
      setOrder((prev) => ({
        ...prev,
        items: items
          ?.filter((a) => a.category_uuid === filterCategory)
          .sort((a, b) => a.item_title.localeCompare(b.item_title))
          .map((a) => {
            const warehouse_stock = a.stock?.find(
              (i) => i.warehouse_uuid === warehouseUuid
            );
            let stockQty = +warehouse_stock?.qty || 0;
            return {
              ...a,
              p: ~~(stockQty % a.conversion),

              b: ~~(stockQty / a.conversion),
              stockQty,
            };
          }),
      }));
    }
  }, [warehouseUuid, filterCategory, items]);

  return (
    <>
      <nav
        className="user_nav nav_styling"
        style={{ maxWidth: "500px", flexDirection: "column", height: "100px" }}
      >
        <div
          className="flex"
          style={{ justifyContent: "space-between", width: "100%" }}
        >
          <div className="user_menubar">
            <IoArrowBackOutline
              className="user_Back_icon"
              onClick={() => Navigate(-1)}
            />
          </div>
          <select
            className="searchInput selectInput"
            value={warehouseUuid}
            onChange={(e) => setWarehouseUuid(e.target.value)}
            style={{ width: "100%", marginRight: "10px", marginLeft: "10px" }}
          >
            {warehouse?.map((a) => (
              <option value={a.warehouse_uuid}>{a.warehouse_title}</option>
            ))}
          </select>

          <select
            className="searchInput selectInput"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ width: "100%" }}
          >
            {itemsCategory?.map((a) => (
              <option value={a.category_uuid}>{a.category_title}</option>
            ))}
          </select>
        </div>
        <div>
          <input
            style={{ width: "200px" }}
            className="searchInput"
            type="text"
            placeholder="Search Items"
            value={filterItemTitle}
            onChange={(e) => setFilterItemTile(e.target.value)}
          />
        </div>
      </nav>
      <div className="home" >
        <div className="container" style={{ maxWidth: "500px",marginTop: "100px"  }}>
          <div className="menucontainer">
            <div className="menus" style={{paddingBottom:"10vh"}}>
              {order?.items
                ?.filter((a) =>
                  a.item_title
                    .toLowerCase()
                    .includes(filterItemTitle.toLowerCase())
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
                                            (+item?.one_pack || 1)) /
                                            +item.conversion
                                        ),

                                      p:
                                        ((a?.p || 0) + (+item?.one_pack || 1)) %
                                        +item.conversion,
                                    }
                                  : a
                              )
                            : prev?.items?.length
                            ? [
                                ...prev.items,
                                ...items
                                  ?.filter(
                                    (a) => a.item_uuid === item.item_uuid
                                  )
                                  .map((a) => ({
                                    ...a,
                                    b:
                                      +(a.b || 0) +
                                      parseInt(
                                        ((a?.p || 0) + (+item?.one_pack || 1)) /
                                          +item.conversion
                                      ),

                                    p:
                                      ((a?.p || 0) + (+item?.one_pack || 1)) %
                                      +item.conversion,
                                  })),
                              ]
                            : items
                                ?.filter((a) => a.item_uuid === item.item_uuid)
                                .map((a) => ({
                                  ...a,
                                  b:
                                    +(a.b || 0) +
                                    parseInt(
                                      ((a?.p || 0) + (+item?.one_pack || 1)) /
                                        +item.conversion
                                    ),

                                  p:
                                    ((a?.p || 0) + (+item?.one_pack || 1)) %
                                    +item.conversion,
                                })),
                        }));
                      }}
                    >
                      <div className="menuItemDetails">
                        <h1 className="item-name">{item?.item_title}</h1>
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
                            <span style={{ marginLeft: "20px" }}>
                              Stock {getRemaingStock(item)}
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

            <button
              type="button"
              onClick={() => {
                onSubmit();
              }}
              className="cartBtn"
              style={{
                padding: "3px",
                opacity: order.items?.length ? 1 : 0.5,
                position: "fixed",
                zIndex: "9999999",
              }}
              disabled={order.items?.length ? false : true}
            >
              Done
            </button>
          </div>
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
              fontSize: "small",
              fontWeight: "900",
            }}
          >
            <thead>
              <tr>
                <th
                  colSpan={5}
                  style={{
                    width: "170mm",
                    backgroundColor: "#fff",
                    fontWeight: "900",
                  }}
                >
                  In:{" "}
                  {
                    warehouse.find(
                      (a) => a.warehouse_uuid === order.to_warehouse
                    )?.warehouse_title
                  }
                </th>
              </tr>
              <tr>
                <th
                  colSpan={2}
                  style={{ backgroundColor: "#fff", fontWeight: "900" }}
                >
                  Created At: {new Date(order?.created_at).toDateString()} -{" "}
                  {formatAMPM(new Date(order?.created_at))}
                </th>
                <th
                  colSpan={3}
                  style={{ backgroundColor: "#fff", fontWeight: "900" }}
                >
                  Created By: {localStorage.getItem("user_title")}
                </th>
              </tr>
              <tr>
                <th
                  style={{
                    width: "10mm",
                    backgroundColor: "#fff",
                    fontWeight: "900",
                  }}
                >
                  S.N
                </th>
                <th style={{ backgroundColor: "#fff", fontWeight: "900" }}>
                  Item Name
                </th>
                <th style={{ backgroundColor: "#fff", fontWeight: "900" }}>
                  MRP
                </th>
                <th style={{ backgroundColor: "#fff", fontWeight: "900" }}>
                  Box
                </th>
                <th style={{ backgroundColor: "#fff", fontWeight: "900" }}>
                  Pcs
                </th>
              </tr>
            </thead>
            <tbody className="tbody">
              {order?.items
                ?.sort((a, b) => a?.item_title?.localeCompare(b?.item_title))
                .map((item, i, array) => (
                  <tr key={Math.random()}>
                    <td
                      className="flex"
                      style={{ justifyContent: "space-between" }}
                    >
                      {i + 1}
                    </td>

                    <td>{item.item_title || ""}</td>
                    <td>{item.mrp || ""}</td>
                    <td>{item.b || 0}</td>

                    <td>{item.p || 0}</td>
                  </tr>
                ))}

              <tr key={Math.random()}>
                <td
                  className="flex"
                  style={{ justifyContent: "space-between" }}
                ></td>

                <td>Total</td>
                <td></td>
                <td>
                  {" "}
                  {order?.items?.length > 1
                    ? order?.items
                        ?.map((a) => +a.b || 0)
                        ?.reduce((a, b) => a + b)
                    : order?.items?.length
                    ? order?.items[0].b
                    : 0}
                </td>

                <td>
                  {" "}
                  {order?.items?.length > 1
                    ? order?.items
                        ?.map((a) => +a.p || 0)
                        ?.reduce((a, b) => a + b)
                    : order?.items?.length
                    ? order?.items[0].p
                    : 0}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default StockAdjustmentMobile;

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
      items: prev?.items?.map((a) =>
        a.item_uuid === popupInfo.item_uuid
          ? {
              ...a,
              b: +data.b + parseInt(+data.p / +popupInfo.conversion),
              p: +data.p % +popupInfo.conversion,
            }
          : a
      ),
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
