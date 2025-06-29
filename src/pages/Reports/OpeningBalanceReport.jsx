import axios from "axios";
import React, { useContext, useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import { OrderDetails } from "../../components/OrderDetails";
import Sidebar from "../../components/Sidebar";
import { useNavigate } from "react-router-dom";
import {
  getFormateDate,
  getMidnightTimestamp,
} from "../../utils/helperFunctions";
import context from "../../context/context";
import { v4 as uuid } from "uuid";
import { AddCircle, DeleteOutlineOutlined } from "@mui/icons-material";
const OpeningBalanceReport = () => {
  const [date, setDate] = useState(0);
  const [popupOrder, setPopupOrder] = useState(null);
  const [popupRecipt, setPopupRecipt] = useState(null);
  const [filterItemTitle, setFilterItemTitle] = useState("");
  const [items, setItems] = useState([]);
  const { loading, setLoading } = useContext(context);
  const [datePopup, setDatePopup] = useState(true);
  const [balanceOnly, setBalanceOnly] = useState(false);

  const navigate = useNavigate();

  const getOpeningBalanceReport = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true);

    const response = await axios({
      method: "post",
      url: "/ledger/getOpeningBalanceReport",
      data: { date },
      headers: {
        "Content-Type": "application/json",
      },
    });
   
    if (response.data.success) {
      setItems(response.data.result);
      setDatePopup(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    let controller = new AbortController();
    let time = new Date();

    setDate(getMidnightTimestamp(time));

    return () => {
      controller.abort();
    };
  }, []);
  const filterItems = useMemo(
    () =>
      items.filter(
        (a) =>
          (!filterItemTitle ||
            a.title
              ?.toLocaleLowerCase()
              ?.includes(filterItemTitle?.toLocaleLowerCase())) &&
          (balanceOnly ? a.opening_balance !== 0 : true)
      ),
    [balanceOnly, filterItemTitle, items]
  );

  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading">
          <h2>Opening Balance Report</h2>
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
            {items.length ? (
              <label className="selectLabel">
                Ledger Title
                <input
                  type="text"
                  name="route_title"
                  className="numberInput"
                  value={filterItemTitle}
                  onChange={(e) => setFilterItemTitle(e.target.value)}
                  maxLength={42}
                />
              </label>
            ) : (
              ""
            )}
            {date !== 0 && items.length ? (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  onChange={(e) => setBalanceOnly(e.target.checked)}
                  value={balanceOnly}
                  className="searchInput"
                  style={{ scale: "1.2" }}
                />
                <span>Balance Only</span>
              </label>
            ) : (
              ""
            )}
          </div>
        </div>
        <div className="table-container-user item-sales-container">
          <Table
            itemsDetails={filterItems}
            setPopupOrder={setPopupOrder}
            setPopupRecipt={setPopupRecipt}
            navigate={navigate}
            date={date}
          />
        </div>
      </div>
      {popupOrder ? (
        <OrderDetails
          onSave={() => {
            setPopupOrder(null);
            getOpeningBalanceReport();
          }}
          order_uuid={popupOrder.order_uuid}
          orderStatus="edit"
        />
      ) : (
        ""
      )}
      {popupRecipt ? (
        <DiliveryPopup
          onSave={() => {
            setPopupRecipt(null);
            getOpeningBalanceReport();
          }}
          order={popupRecipt}
          date={date}
          loading={loading}
          setLoading={setLoading}
          getCompleteOrders={getOpeningBalanceReport}
        />
      ) : (
        ""
      )}
      {datePopup ? (
        <OpeningBalanceDate
          date={date}
          setDate={setDate}
          getOpeningBalanceReport={getOpeningBalanceReport}
        />
      ) : (
        ""
      )}
    </>
  );
};

export default OpeningBalanceReport;

function Table({ itemsDetails, setPopupRecipt, date }) {
  return (
    <table
      className="user-table"
      style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}
    >
      <thead>
        <tr>
          <th>S.N</th>
          <th colSpan={3}>Ledger</th>

          {date === 0 ? (
            <th colSpan={1}>Opening Balance Count</th>
          ) : (
            <th colSpan={1}>Balance</th>
          )}
        </tr>
      </thead>
      <tbody className="tbody">
        {itemsDetails
          ?.sort((a, b) => a.order_date - b.order_date)
          ?.map((item, i, array) => (
            <tr
              key={Math.random()}
              style={{ height: "30px" }}
              onClick={() => {
                setPopupRecipt(item);
              }}
            >
              <td>{i + 1}</td>
              <td colSpan={3}>{item.title || ""}</td>

              <td colSpan={1}>
                {date === 0
                  ? item.opening_balance.length || "0"
                  : item.opening_balance || "0"}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
function DiliveryPopup({
  onSave,

  order,

  date,
  loading,
  setLoading,
  getCompleteOrders,
}) {
  const [error, setError] = useState("");
  const [default_opening_balance_date, setDefaultOpeningBalanceDate] = useState(
    new Date().getTime()
  );
  const [openingBalance, setOpeningBalance] = useState();
  const getBankStatementImport = async () => {
    try {
      const res = await axios.get("/details/getOpeningBalanceDate");
      setDefaultOpeningBalanceDate(res.data.result);
    } catch (error) {
     
    }
  };
  useEffect(() => {
    getBankStatementImport();
  }, []);
  useEffect(() => {
    if (date === 0) {
      setOpeningBalance(
        order?.opening_balance?.map((a) => ({
          ...a,
          uuid: a.uuid || uuid(),
        }))
      );
    } else setOpeningBalance(order?.opening_balance || 0);
  }, [date, order?.opening_balance]);

  const submitHandler = async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    //update updateOpeningBalance
    const response = await axios({
      method: "put",
      url: "/ledger/updateOpeningBalance",
      data: {
        ...order,
        date,
        opening_balance: openingBalance,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      getCompleteOrders();
      onSave();
    } else {
      setError(response.data.message);
    }

    setLoading(false);
  };

  return (
    <>
      <div className="overlay" style={{ zIndex: 9999999999 }}>
        <div
          className="modal"
          style={{ height: "fit-content", width: "max-content" }}
        >
          <div className="flex" style={{ justifyContent: "space-between" }}>
            <h3>Opening Balance</h3>
            <h3>{order.title}</h3>
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
                  {date === 0 ? (
                    <div className="row">
                      <label className="selectLabel" style={{ width: "50%" }}>
                        <span
                          onClick={() => {
                            setOpeningBalance((prev) => [
                              ...prev,
                              {
                                uuid: uuid(),
                                date: default_opening_balance_date,
                                amount: "",
                              },
                            ]);
                          }}
                        >
                          <AddCircle
                            sx={{ fontSize: 40 }}
                            style={{ color: "#32bd33", cursor: "pointer" }}
                          />
                        </span>
                        <div>
                          {openingBalance?.map((a) => (
                            <div
                              key={a.uuid}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                margin: "5px 0",
                              }}
                            >
                              <div style={{ width: "200px" }}>
                                <input
                                  type="date"
                                  onChange={(e) =>
                                    setOpeningBalance((prev) =>
                                      prev.map((b) =>
                                        b.uuid === a.uuid
                                          ? {
                                              ...b,
                                              date: new Date(
                                                e.target.value
                                              ).getTime(),
                                            }
                                          : b
                                      )
                                    )
                                  }
                                  value={getFormateDate(new Date(a.date))}
                                  placeholder="Search Counter Title..."
                                  className="searchInput"
                                  pattern="\d{4}-\d{2}-\d{2}"
                                />
                              </div>
                              <input
                                type="number"
                                name="route_title"
                                className="numberInput"
                                value={a?.amount}
                                style={{ width: "15ch" }}
                                onChange={(e) => {
                                  setOpeningBalance((prev) =>
                                    prev.map((b) =>
                                      b.uuid === a.uuid
                                        ? { ...b, amount: e.target.value }
                                        : b
                                    )
                                  );
                                }}
                                maxLength={10}
                                placeholder="Amount"
                              />
                              <span
                                style={{
                                  color: "red",

                                  cursor: "pointer",
                                }}
                                onClick={(e) => {
                                  setOpeningBalance((prev) =>
                                    prev.filter((b) => b.uuid !== a.uuid)
                                  );
                                }}
                              >
                                <DeleteOutlineOutlined
                                  style={{ color: "red" }}
                                  className="table-icon"
                                />
                              </span>
                            </div>
                          ))}
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div
                      className="row"
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <div style={{ width: "50px" }}>Opening Balance</div>
                      <label
                        className="selectLabel flex"
                        style={{ width: "80px" }}
                      >
                        <input
                          type="number"
                          name="route_title"
                          className="numberInput"
                          value={openingBalance}
                          style={{ width: "80px" }}
                          onChange={(e) => setOpeningBalance(e.target.value)}
                          maxLength={42}
                          onWheel={(e) => e.preventDefault()}
                        />
                        {/* {popupInfo.conversion || 0} */}
                      </label>
                    </div>
                  )}
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
    </>
  );
}
const OpeningBalanceDate = ({ date, setDate, getOpeningBalanceReport }) => {
  return (
    <div className="overlay" style={{ zIndex: "999999" }}>
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
            <form className="form" onSubmit={getOpeningBalanceReport}>
              <div className="row">
                <h1>Opening Balance </h1>
              </div>

              <div className="form">
                <div className="row">
                  <label className="selectLabel">
                    Date
                    <input
                      type="date"
                      onChange={(e) =>
                        setDate(getMidnightTimestamp(new Date(e.target.value).getTime()))
                      }
                      value={date !== 0 ? getFormateDate(new Date(+date)) : ""}
                      placeholder="Search Counter Title..."
                      className="searchInput"
                      pattern="\d{4}-\d{2}-\d{2}"
                    />
                  </label>
                  <label
                    className="selectLabel flex"
                    style={{ flexDirection: "row" }}
                  >
                    <input
                      type="checkbox"
                      onChange={(e) => setDate(0)}
                      checked={date === 0}
                      placeholder="Search Counter Title..."
                      pattern="\d{4}-\d{2}-\d{2}"
                      style={{ width: "20px" }}
                    />
                    All
                  </label>
                </div>
              </div>

              <button type="submit" className="submit">
                Save changes
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
