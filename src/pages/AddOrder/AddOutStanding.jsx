import axios from "axios";
import React, { useEffect, useRef, useState } from "react";

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { DeleteOutline } from "@mui/icons-material";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import Select from "react-select";
const AddOutStanding = () => {
  const [order, setOrder] = useState({});
  const [images, setImages] = useState([]);
  const reactInputsRef = useRef({});
  const [counters, setCounters] = useState([]);
  const [errMassage, setErrorMassage] = useState("");
  const params = useParams();
  const location = useLocation();
  const [focusedInputId, setFocusedInputId] = useState(0);
  const [counterFilter] = useState("");
  const navigate = useNavigate();
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
  }, []);

  const submitHandler = async (e, published) => {
    e.preventDefault();
    let postData = {
      ...order,
      user_uuid: localStorage.getItem("user_uuid"),
      order_uuid: "Manual",
      reminder: order.reminder ? new Date(order.reminder).getTime() : "",
    };
    if (!postData.counter_uuid || !postData.amount) {
      setErrorMassage("Please insert Counter And Amount");
      return;
    }

    const response = await axios({
      method: "post",
      url: "/outstanding/postMenualOutstanding",
      data: postData,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      setOrder({});
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
              <h2>Add Outstanding</h2>
            </div>
            <form className={"form"} onSubmit={submitHandler}>
              <div
                className={"formGroup"}
                style={{ maxWidth: "90%", overflowX: "scroll" }}
              >
                <div className={"row"} style={{ position: "relative" }}>
                  <label className={"selectLabel"}>
                    News Title
                    <div className="inputGroup" style={{ width: "500px" }}>
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
                            type: a.outstanding_type||0,
                          }))}
                        onChange={(doc) =>
                          setOrder((prev) => ({
                            ...prev,
                            counter_uuid: doc.value,
                            type:doc.type
                          }))
                        }
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
                  </label>
                </div>
                <div className={"row"} style={{ position: "relative" }}>
                  <label className={"selectLabel"}>
                    Invoice Number
                    <input
                      type="text"
                      name="category_title"
                      className={"numberInput"}
                      value={order?.invoice_number || ""}
                      onChange={(e) =>
                        setOrder((prev) => ({
                          ...prev,
                          invoice_number: e.target.value,
                        }))
                      }
                      style={{ width: "250px" }}
                      // maxLength={60}
                    />
                  </label>

                  <label className={"selectLabel"}>
                    Amount
                    <input
                      type="number"
                      name="category_title"
                      className={"numberInput"}
                      value={order?.amount || ""}
                      onChange={(e) =>
                        setOrder((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      style={{ width: "250px" }}
                      // maxLength={60}
                    />
                  </label>
                  <label className={"selectLabel"}>
                    Reminder
                    <input
                      type="date"
                      name="category_title"
                      className={"numberInput"}
                      value={order?.reminder || ""}
                      onChange={(e) =>
                        setOrder((prev) => ({
                          ...prev,
                          reminder: e.target.value,
                        }))
                      }
                      style={{ width: "250px" }}
                      // maxLength={60}
                    />
                  </label>
                </div>
                <div className="row">
                  <label className="selectLabel">
                    Outstanding Type
                    <select
                      className="numberInput"
                      value={order?.type || ""}
                      onChange={(e) =>
                        setOrder((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                    >
                      {/* <option selected={occasionsTemp.length===occasionsData.length} value="all">All</option> */}

                      <option value={0}>None</option>
                      <option value={1}>Visit</option>
                      <option value={2}>Call</option>
                      <option value={3}>Self</option>
                    </select>
                  </label>
                </div>
              </div>
              <i style={{ color: "red" }}>
                {errMassage === "" ? "" : "Error: " + errMassage}
              </i>
              <div className="flex">
                <button
                  type="button"
                  className={"submit"}
                  onClick={(e) => submitHandler(e, true)}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddOutStanding;
