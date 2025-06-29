import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Select from "react-select";
import axios from "axios";
import context from "../../context/context";
import CloseIcon from "@mui/icons-material/Close";
import { useReactToPrint } from "react-to-print";
import TransactionsStatement from "../../components/prints/TransactionsStatement";
import { getLastWeekDates } from "../../utils/helperFunctions";
const CashRegisterReport = () => {
  const [searchData, setSearchData] = useState({
    startDate: "",
    endDate: "",
    user_uuid: 0,
    status: 0,
  });
  const [popupOrder, setPopupOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [initial, setInitial] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const [completePopup, setCompletePopup] = useState(false);
  const [statementData, setStatementData] = useState(null);
  const [newRegisterPopup, setNewRegisterPopup] = useState(false);
  const statementRef = useRef(null);
  const statementContent = useCallback(() => {
   
    if (statementData) return statementRef.current;
    else return <></>;
  }, [statementData]);
  const printStatement = useReactToPrint({
    content: statementContent,
    
    removeAfterPrint: true,
  });
  const { setNotification } = useContext(context);
  const getCounter = async () => {
    const response = await axios({
      method: "get",
      url: "/users/GetActiveUserList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setUsers(response.data.result);
  };
  const getStatement = async (cash_register) => {
    try {
      const response = await axios.get(
        `cashRegistrations/statement/${cash_register?.register_uuid}`
      );
      if (!response?.data?.result?.length) return;
      setStatementData({
        cash_register: {
          register_uuid: cash_register?.register_uuid,
          created_at: cash_register?.created_at,
        },
        data: {
          transactions: response.data.result,
          grand_total: response.data.result
            .filter((a) => a.type === "in")
            .reduce((sum, i) => sum + (+i.amount || 0), 0),
          expense_total: response.data.result
            .filter((a) => a.type === "out")
            .reduce((sum, i) => sum + (+i.amount || 0), 0),
        },
      });
      printStatement();
    } catch (error) {
      console.error(error);
    }
  };
  const getCounterStockReport = async () => {
    let startDate = new Date(
      new Date(searchData.startDate).setHours(0, 0, 0, 0)
    ).getTime();
    let endDate = new Date().setDate(
      new Date(searchData.endDate).getDate() + 1
    );
    endDate = new Date(new Date(endDate).setHours(0, 0, 0, 0)).getTime();

    const response = await axios({
      method: "post",
      url: "/cashRegistrations/GetAllCompleteCashRegistrations",
      data: {
        fromDate: startDate,
        toDate: endDate,
        user_uuid: searchData.user_uuid,
        status: searchData.status,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
   
    if (response.data.success) setItems(response.data.result);
    else setItems([]);
  };


	useEffect(() => {
		let time = new Date()
		let curTime = "yy-mm-dd"
			.replace("mm", ("00" + (time?.getMonth() + 1)?.toString()).slice(-2))
			.replace("yy", ("0000" + time?.getFullYear()?.toString()).slice(-4))
			.replace("dd", ("00" + time?.getDate()?.toString()).slice(-2))
		let sTime = getLastWeekDates()
		sTime=
		"yy-mm-dd"
			.replace("mm", ("00" + (sTime?.getMonth() + 1)?.toString()).slice(-2))
			.replace("yy", ("0000" + sTime?.getFullYear()?.toString()).slice(-4))
			.replace("dd", ("00" + sTime?.getDate()?.toString()).slice(-2))
			
		setSearchData(prev => ({
			...prev,
			startDate: sTime,
			endDate: curTime,
		}))
		getCounter()
	}, [])
 
  useEffect(() => {
    if (initial) getCounterStockReport();
    else setInitial(true);
  }, [popupOrder]);

  const deleteStock = async (session_uuid) => {
    const response = await axios({
      method: "post",
      url: "/counterStock/deleteCounterStock",
      data: { session_uuid },
      headers: {
        "Content-Type": "application/json",
      },
    });
   
    if (response.data.success) {
      setDeletePopup(false);
      getCounterStockReport();
    }
  };
  const filteredItems = useMemo(() => {
    return items?.map((a) => ({
      ...a,
      user_title:
        users.find((b) => b.user_uuid === a.created_by).user_title || "",
    }));
  }, [items, users]);
  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading">
          <h2>Cash Registers</h2>
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
              type="date"
              onChange={(e) =>
                setSearchData((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              value={searchData.startDate}
              placeholder="Search Counter Title..."
              className="searchInput"
              pattern="\d{4}-\d{2}-\d{2}"
            />
            <input
              type="date"
              onChange={(e) =>
                setSearchData((prev) => ({ ...prev, endDate: e.target.value }))
              }
              value={searchData.endDate}
              placeholder="Search Route Title..."
              className="searchInput"
              pattern="\d{4}-\d{2}-\d{2}"
            />
            <div className="inputGroup" style={{ width: "20%" }}>
              <Select
                options={[
                  { value: 0, label: "Completed" },
                  { value: 1, label: "Active" },
                ]}
                onChange={(doc) =>
                  setSearchData((prev) => ({
                    ...prev,
                    status: doc.value,
                  }))
                }
                value={{
                  value: searchData?.status,
                  label: searchData?.status ? "Active" : "Completed",
                }}
                openMenuOnFocus={true}
                menuPosition="fixed"
                menuPlacement="auto"
                placeholder="Select user"
              />
            </div>
            <div className="inputGroup" style={{ width: "50%" }}>
              <Select
                options={[
                  {
                    value: 0,
                    label: "All",
                  },
                  ...users.map((a) => ({
                    value: a.user_uuid,
                    label: a.user_title,
                  })),
                ]}
                onChange={(doc) =>
                  setSearchData((prev) => ({
                    ...prev,
                    user_uuid: doc.value,
                  }))
                }
                value={
                  searchData?.user_uuid
                    ? {
                        value: searchData?.user_uuid,
                        label: users?.find(
                          (j) => j.user_uuid === searchData.user_uuid
                        )?.user_title,
                      }
                    : { value: 0, label: "All" }
                }
                openMenuOnFocus={true}
                menuPosition="fixed"
                menuPlacement="auto"
                placeholder="Select user"
              />
            </div>
            <button
              className="theme-btn"
              onClick={() => getCounterStockReport()}
            >
              Search
            </button>
            <button
              className="theme-btn"
              onClick={() => setNewRegisterPopup(true)}
            >
              Add
            </button>
          </div>
        </div>
        <div className="table-container-user item-sales-container">
          <Table
            itemsDetails={filteredItems}
            getStatement={getStatement}
            users={users}
            setPopupForm={setCompletePopup}
          />
        </div>
      </div>
      {popupOrder ? (
        <ItemDetails
          onSave={() => {
            setPopupOrder(null);
            getCounterStockReport();
          }}
          data={popupOrder}
        />
      ) : (
        ""
      )}
      {deletePopup ? (
        <ConfirmPopup
          onSave={() => deleteStock(deletePopup)}
          onClose={() => setDeletePopup(false)}
        />
      ) : (
        ""
      )}
      {newRegisterPopup ? (
        <NewUserForm
          onSave={() => {
            setNewRegisterPopup(false);
            getCounterStockReport();
          }}
          users={users}
          setNotification={setNotification}
        />
      ) : (
        ""
      )}
      {completePopup ? (
        <NewRegisterForm
          onSave={() => {
            setCompletePopup(false);
            getCounterStockReport();
          }}
          popupInfo={completePopup}
          setNotification={setNotification}
        />
      ) : (
        ""
      )}

      <div style={{ display: "none" }}>
        <div ref={statementRef}>
          <TransactionsStatement {...statementData} />
        </div>
      </div>
    </>
  );
};

export default CashRegisterReport;

function Table({ itemsDetails, getStatement, setPopupForm }) {
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
  const estimated_price = (items) => {
    let sum = 0;
    if (items?.length) {
      for (let item of items) {
        sum += +item?.pcs * +item?.item_price;
      }
    }
    return sum.toFixed(2);
  };

  return (
    <table
      className="user-table"
      style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}
    >
      <thead>
        <tr>
          <th>S.N</th>
          <th colSpan={2}>Date</th>

          <th colSpan={3}>Users</th>
          <th colSpan={3}>Value</th>
          <th colSpan={2}></th>
        </tr>
      </thead>
      <tbody className="tbody">
        {itemsDetails
          ?.sort((a, b) => a.created_at - b.created_at)
          ?.map((item, i, array) => (
            <tr key={Math.random()} style={{ height: "30px" }}>
              <td>{i + 1}</td>
              <td colSpan={2}>{new Date(+item.created_at).toDateString()}</td>

              <td colSpan={3}>{item?.user_title || ""}</td>
              <td colSpan={3}>{item.balance || "0"}</td>
              <td>
                <button
                  className="theme-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    getStatement(item);
                  }}
                >
                  Statement
                </button>
              </td>
              <td>
                {item.status === 1 ? (
                  <button
                    className="theme-btn"
                    style={{
                      display: "inline",
                      cursor: item?.orderLength ? "not-allowed" : "pointer",
                      width: "100%",
                    }}
                    type="button"
                    onClick={() => {
                      setPopupForm({ ...item, status: 0 });
                    }}
                    disabled={item?.orderLength}
                  >
                    Complete
                  </button>
                ) : (
                  ""
                )}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

function ItemDetails({ onSave, data }) {
  const [items, setItems] = useState([]);

  const [filterItemTitle, setFilterItemTitle] = useState("");

  useEffect(() => {
    setItems(data?.details || []);
  }, [data]);

  const filterItem = useMemo(
    () =>
      items
        .filter(
          (a) =>
            !filterItemTitle ||
            a.item_title
              ?.toLocaleLowerCase()
              ?.includes(filterItemTitle?.toLocaleLowerCase())
        )

        .sort((a, b) => a?.item_title?.localeCompare(b?.item_title)),
    [items, filterItemTitle]
  );
  const estimated_price = useMemo(() => {
    let sum = 0;
    for (let item of items) {
      sum += +item?.pcs * +item?.item_price;
    }
    return sum.toFixed(2);
  }, [items]);
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
            padding: "10px",
            width: "fit-content",
          }}
        >
          <div
            className="flex"
            style={{ justifyContent: "flex-start", alignItems: "flex-start" }}
          >
            <div style={{ maxHeight: "400px", overflowY: "scroll" }}>
              <div>
                <input
                  type="text"
                  onChange={(e) => setFilterItemTitle(e.target.value)}
                  value={filterItemTitle}
                  placeholder="Search Item..."
                  className="searchInput"
                  style={{ width: "150px" }}
                />
                <table
                  className="user-table"
                  style={{
                    maxWidth: "300px",
                    height: "fit-content",
                    overflowX: "scroll",
                  }}
                >
                  <thead>
                    <tr style={{ zIndex: "999999999999" }}>
                      <th>S.N</th>
                      <th colSpan={2}> Title</th>
                      <th colSpan={2}> Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="tbody">
                    {filterItem

                      ?.sort((a, b) =>
                        a.item_title?.localeCompare(b.item_title)
                      )
                      ?.map((item, i, array) => {
                        return (
                          <tr key={Math.random()} style={{ height: "30px" }}>
                            <td
                              className="flex"
                              style={{
                                justifyContent: "space-between",
                              }}
                            >
                              {i + 1}
                            </td>

                            <td colSpan={2}>{item.item_title || ""}</td>
                            <td colSpan={2}>{item.pcs || ""}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
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
            <button className="fieldEditButton">
              Estimated Price: {estimated_price || ""}
            </button>
            <button className="fieldEditButton" onClick={() => onSave()}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmPopup({ onSave, onClose, selectedOrder, Navigate }) {
  return (
    <div className="overlay">
      <div
        className="modal"
        style={{ height: "fit-content", width: "300px", padding: "20px" }}
      >
        <h2 style={{ textAlign: "center" }}>Are you sure?</h2>
        <h2 style={{ textAlign: "center" }}>Delete Stock</h2>
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
                  onClick={(e) => {
                    e.preventDefault();
                    onSave();
                  }}
                >
                  Confirm
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
  );
}
function NewUserForm({ onSave, users, setNotification }) {
  const [user_uuid, setUserUuid] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();
    if (user_uuid === "" || user_uuid === undefined) {
      setNotification({ success: false, message: "Please Select User" });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    const response = await axios({
      method: "post",
      url: "/cashRegistrations/PostCashRegister",
      data: {
        created_by: user_uuid,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      onSave();
      setNotification({
        success: true,
        message: "Register Added Successfully",
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  return (
    <div className="overlay" style={{ zIndex: 9999999 }}>
      <div className="modal" style={{ height: "35vh", width: "fit-content" }}>
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
                <h1>Add New Register</h1>
              </div>

              <div className="formGroup">
                <div className="row">
                  <label className="selectLabel">
                    Company
                    <select
                      name="user_type"
                      className="select"
                      value={user_uuid}
                      onChange={(e) => setUserUuid(e.target.value)}
                    >
                      <option value="" disabled>
                        None
                      </option>
                      {users
                        ?.sort((a, b) =>
                          a.user_title?.localeCompare(b.user_title)
                        )
                        ?.map((a) => (
                          <option value={a.user_uuid}>{a.user_title}</option>
                        ))}
                    </select>
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
function NewRegisterForm({
  onSave,
  popupInfo,

  setNotification,
}) {
  const [data, setData] = useState({ amt: 0, expense_uuid: "", remarks: "" });
  const [expense, setExpense] = useState([]);
  const [loader, setLoader] = useState(false);

  const submitHandler = async (e) => {
    let obj = { created_by: localStorage.getItem("user_uuid") };
    e.preventDefault();

    if (popupInfo?.expense) {
      if (data.expense_uuid === "") {
        setNotification({ success: false, message: "Please select expense" });
        setTimeout(() => setNotification(null), 3000);
        return;
      }
      obj = { register_uuid: popupInfo.register_uuid, ...data };
      const response = await axios({
        method: "put",
        url: "/cashRegistrations/PutExpenseCashRegister",
        data: obj,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        onSave();
      }
    } else if (popupInfo?.register_uuid) {
      obj = { register_uuid: popupInfo.register_uuid, status: 0 };
      const response = await axios({
        method: "put",
        url: "/cashRegistrations/PutCashRegister",
        data: obj,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        onSave();
      }
    } else {
      const response = await axios({
        method: "post",
        url: "/cashRegistrations/PostCashRegister",
        data: obj,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        onSave();
      } else {
        setNotification(response.data);
        setTimeout(() => setNotification(null), 3000);
      }
    }
  };
  const getItemsData = async (controller = new AbortController()) => {
    setLoader(true);
    const response = await axios({
      method: "get",
      url: "/expense/GetAllExpenses",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setExpense(response.data.result);
    setLoader(false);
  };
  useEffect(() => {
    const controller = new AbortController();
    if (popupInfo?.expense) getItemsData(controller);
    return () => {
      controller.abort();
    };
  }, [popupInfo?.expense]);
  return (
    <div className="overlay" style={{ zIndex: 9999999 }}>
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
          {loader ? (
            <div className="loader">
              <div className="loader-spinner"></div>
            </div>
          ) : (
            <div style={{ overflowY: "scroll" }}>
              <form className="form" onSubmit={submitHandler}>
                <div className="row">
                  <h1>
                    {popupInfo.expense
                      ? "Expense"
                      : popupInfo.register_uuid
                      ? "Complete"
                      : "Add"}{" "}
                    Register
                  </h1>
                </div>

                {popupInfo.expense ? (
                  <div className="row">
                    <label className="selectLabel">
                      Expense
                      <select
                        name="user_type"
                        className="select"
                        value={data?.expense_uuid}
                        onChange={(e) =>
                          setData({
                            ...data,
                            expense_uuid: e.target.value,
                            expense_title:
                              expense.find(
                                (a) => a.company_uuid === e.target.value
                              )?.expense_title ?? "",
                          })
                        }
                      >
                        <option value="" disabled>
                          None
                        </option>
                        {expense
                          .sort((a, b) =>
                            a.expense_title?.localeCompare(b.expense_title)
                          )
                          .map((a) => (
                            <option value={a.expense_uuid}>
                              {a.expense_title}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="selectLabel">
                      Amount
                      <input
                        type="number"
                        name="one_pack"
                        className="numberInput"
                        value={data.amt}
                        onChange={(e) =>
                          setData((prev) => ({ ...prev, amt: e.target.value }))
                        }
                      />
                    </label>
                    <label className="selectLabel">
                      Remarks
                      <input
                        type="text"
                        name="one_pack"
                        className="numberInput"
                        placeholder="Remarks"
                        value={data.remarks}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            remarks: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                ) : (
                  ""
                )}

                <button type="submit" className="submit">
                  {popupInfo.expense
                    ? "Save"
                    : popupInfo.register_uuid
                    ? "Complete"
                    : " Save"}
                </button>
              </form>
            </div>
          )}
          <button onClick={onSave} className="closeButton">
            x
          </button>
        </div>
      </div>
    </div>
  );
}
