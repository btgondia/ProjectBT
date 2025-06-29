import React, { useState, useEffect, useMemo, useContext } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid";
import axios from "axios";
import Context from "../../context/context";
import { FaLaptopHouse } from "react-icons/fa";

const LedgerClosingBalance = () => {
  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading">
          <h2 style={{ width: "100%" }}>Closing and Current Balance</h2>
        </div>
        <CampaignBody />
      </div>
    </>
  );
};
const CampaignBody = () => {
  const [popupOrderForm, setPopupOrderForm] = useState(false);
  const [itemsData, setItemsData] = useState([]);
  const context = useContext(Context);
  const [filterTitle, setFilterTitle] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterRoute, setFilterRoute] = useState("");
  const [balanceOnly, setBalanceOnly] = useState(false);
  const [isOpeningBalance, setIsOpeningBalance] = useState(true);

  const { setNotification } = context;
  const getItemsData = async (controller = new AbortController()) => {
    const response = await axios({
      method: "get",
      url: "/ledger/getLedgerClosingBalance",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setItemsData(response.data.result);
  };
  useEffect(() => {
    const controller = new AbortController();
    getItemsData(controller);
    return () => controller.abort();
  }, []);
  const filteredItemData = useMemo(
    () =>
      itemsData.map((item, i) => ({
        ...item,
        closing_balance:isOpeningBalance === "closing_balance" ? item.closing_balance : +(item.closing_balance||0) + +(item.opening_balance||0),
      }))
        .filter(
          (a) =>
            (!filterTitle ||
              a.title
                ?.toLocaleLowerCase()
                ?.includes(filterTitle?.toLocaleLowerCase())) &&
            (!filterGroup ||
              a.ledger_group_title
                ?.toLocaleLowerCase()
                ?.includes(filterGroup?.toLocaleLowerCase())) &&
            (!filterRoute ||
              a.route_title
                ?.toLocaleLowerCase()
                ?.includes(filterRoute?.toLocaleLowerCase())) &&
            (!balanceOnly || a.closing_balance)
        )
        .sort((a, b) => a.title.localeCompare(b.title)),
    [itemsData, isOpeningBalance, filterTitle, filterGroup, filterRoute, balanceOnly]
  );

  return (
    <>
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <input
              type="text"
              onChange={(e) => setFilterTitle(e.target.value)}
              value={filterTitle}
              placeholder="Search Title..."
              className="searchInput"
            />
            <input
              type="text"
              onChange={(e) => setFilterGroup(e.target.value)}
              value={filterGroup}
              placeholder="Search Group..."
              className="searchInput"
            />
            <input
              type="text"
              onChange={(e) => setFilterRoute(e.target.value)}
              value={filterRoute}
              placeholder="Search Route..."
              className="searchInput"
            />
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
            <div> Total:{filteredItemData.length}</div>
          </div>
        </div>
      </div>
      <div className="table-container-user item-sales-container">
        <Table
          itemsDetails={filteredItemData}
          setPopupOrderForm={setPopupOrderForm}
          isOpeningBalance={isOpeningBalance}
        />
      </div>
      {popupOrderForm ? (
        <IncentiveOrderPopup
          onSave={() => {
            setPopupOrderForm(false);
            getItemsData();
          }}
          popupForm={popupOrderForm}
          setNotification={setNotification}
        />
      ) : (
        ""
      )}
      {isOpeningBalance === true ? (
        <OpeningBalanceDate setIsOpeningBalance={setIsOpeningBalance} />
      ) : (
        ""
      )}
    </>
  );
};

export default LedgerClosingBalance;
function Table({ itemsDetails = [], setPopupOrderForm }) {
  const [items, setItems] = useState("incentive_title");
  const [order, setOrder] = useState("asc");

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
              <span>Title</span>
              <div className="sort-buttons-container">
                <button
                  onClick={() => {
                    setItems("title");
                    setOrder("asc");
                  }}
                >
                  <ChevronUpIcon className="sort-up sort-button" />
                </button>
                <button
                  onClick={() => {
                    setItems("title");
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
              <span>Groups</span>
              <div className="sort-buttons-container">
                <button
                  onClick={() => {
                    setItems("ledger_group_title");
                    setOrder("asc");
                  }}
                >
                  <ChevronUpIcon className="sort-up sort-button" />
                </button>
                <button
                  onClick={() => {
                    setItems("ledger_group_title");
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
              <span>Route</span>
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
          <th>
            <div className="t-head-element">
              <span>Closing Balance</span>
              <div className="sort-buttons-container">
                <button
                  onClick={() => {
                    setItems("closing_balance");
                    setOrder("asc");
                  }}
                >
                  <ChevronUpIcon className="sort-up sort-button" />
                </button>
                <button
                  onClick={() => {
                    setItems("closing_balance");
                    setOrder("desc");
                  }}
                >
                  <ChevronDownIcon className="sort-down sort-button" />
                </button>
              </div>
            </div>
          </th>
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
              key={item.counter_uuid || item.ledger_uuid}
              style={{ height: "30px" }}
              onClick={(e) => {
                e.stopPropagation();
                setPopupOrderForm(item);
              }}
            >
              <td>{i + 1}</td>
              <td colSpan={2}>{item.title}</td>
              <td colSpan={2}>{item.ledger_group_title || ""}</td>
              <td colSpan={2}>{item.route_title || ""}</td>
              <td>{item.closing_balance || 0}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

function IncentiveOrderPopup({ onSave, popupForm, setNotification }) {
  const [closing_balance, setClosingBalance] = useState(0);

  useEffect(() => {
    setClosingBalance(popupForm.closing_balance);
  }, [popupForm.closing_balance]);

  const submitHandler = async (e) => {
    e.preventDefault();
    const response = await axios({
      method: "post",
      url: "/ledger/updateLedgerClosingBalance",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        closing_balance,
        ledger_uuid: popupForm.ledger_uuid,
        counter_uuid: popupForm.counter_uuid,
      },
    });
    if (response.data.success) {
      setNotification({
        message: "Closing Balance Updated",
        success: true,
      });

      onSave();
    } else {
      setNotification({
        message: "Error Updating Closing Balance",
        success: false,
      });
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
            className="flex"
            style={{ justifyContent: "flex-start", alignItems: "flex-start" }}
          >
            <div style={{ maxHeight: "500px", overflowY: "scroll" }}>
              <h2>{popupForm.title || ""}</h2>
              <br />
              <div className="flex">
                <label htmlFor="closing_balance">Closing Balance</label>
                <input
                  type="number"
                  name="closing_balance"
                  className="searchInput"
                  value={closing_balance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                />
              </div>
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
}
const OpeningBalanceDate = ({ setIsOpeningBalance }) => {
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
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <div className="form">
                <div className="row">
                  <label
                    className="selectLabel flex"
                    style={{ flexDirection: "row" }}
                  >
                    <input
                      type="checkbox"
                      onChange={(e) => setIsOpeningBalance("closing_balance")}
                      value={FaLaptopHouse}
                      placeholder="Search Counter Title..."
                      className="searchInput"
                    />{" "}
                    Closing Balance
                  </label>
                  <label
                    className="selectLabel flex"
                    style={{ flexDirection: "row" }}
                  >
                    <input
                      type="checkbox"
                      onChange={(e) => setIsOpeningBalance("current_balance")}
                      placeholder="Search Counter Title..."
                      pattern="\d{4}-\d{2}-\d{2}"
                      style={{ width: "20px" }}
                    />{" "}
                    Current Balance (Closing + Opening)
                  </label>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
