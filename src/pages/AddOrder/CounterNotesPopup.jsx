import axios from "axios";
import React, { useState, useContext, useEffect, useMemo } from "react";
import context from "../../context/context";
import { AddCircle as AddIcon } from "@mui/icons-material";
import { v4 as uuid } from "uuid";
import Select from "react-select";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { compareObjects, getFormateDate } from "../../utils/helperFunctions";
export default function CounterNotesPopup() {
  const [data, setData] = useState({});
  const [counters, setCounters] = useState([]);
  const { setNotification, setCounterNotesPopup } = useContext(context);
  const [confirm, setConfirm] = useState(false);
  const getCounter = async () => {
    const response = await axios({
      method: "post",
      url: "/counters/GetCounterData",
      data: ["counter_uuid", "counter_title", "counter_notes", "route_title", "route_uuid"],

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setCounters(response.data.result);
  };
  //post request to save bank statement import

  //get request to get bank statement import

  useEffect(() => {
    getCounter();
  }, []);
  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.data.isHighlighted
        ? "red"
        : provided.backgroundColor,
      color: state.data.isHighlighted ? "white" : provided.color,
    }),
  };
  const submitHandler = async () => {
    const response = await axios({
      method: "put",
      url: "/counters/putCounter",
      data: [data],
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      setCounterNotesPopup(null);
    }
  };
  let prevData =useMemo(()=> counters?.find(
    (a) => a?.counter_uuid === data?.counter_uuid
  )
  ,[data.counter_uuid,counters])
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
              minWidth: "500px",
            }}
          >
            <div style={{ overflowY: "scroll" }}>
              <div className="form">
                <div className="row">
                  <h1>Counter Notes</h1>
                </div>

                <div className="form">
                  <div className="row">
                    <label className="selectLabel">
                      Counter
                      <Select
                        options={counters.map((a) => ({
                          value: a.counter_uuid,
                          label: a.counter_title + " , " + a.route_title,
                          counter_notes: a.counter_notes,
                        }))}
                        onChange={(doc) => {
                          let prevData = counters.find(
                            (a) => a.counter_uuid === doc.value
                          );
                          setData({
                            ...prevData,
                            counter_notes: prevData?.counter_notes?.sort((a, b) =>
                              new Date(a.date) > new Date(b.date) ? 1 : -1
                            ),
                          });

                        }}
                        styles={customStyles}
                        value={
                          data?.counter_uuid
                            ? {
                                value: data?.counter_uuid,
                                label: counters?.find(
                                  (j) => j.counter_uuid === data.counter_uuid
                                )?.counter_title,
                              }
                            : ""
                        }
                        autoFocus={!data?.counter_uuid}
                        openMenuOnFocus={true}
                        menuPosition="fixed"
                        menuPlacement="auto"
                        placeholder="Select"
                      />
                    </label>
                  </div>
                </div>
                <div
                  className="items_table"
                  style={{ flex: "1", height: "75vh", overflow: "scroll" }}
                >
                  <table className="f6 w-100 center" cellSpacing="0">
                    <thead className="lh-copy" style={{ position: "static" }}>
                      <tr className="white">
                        <th className="pa2 tl bb b--black-20 w-30">Date</th>
                        <th className="pa2 tc bb b--black-20">Notes</th>
                        <th className="pa2 tc bb b--black-20">Created At</th>
                        <th></th>
                      </tr>
                    </thead>
                    {data.counter_uuid ? (
                      <tbody className="lh-copy">
                        {data?.counter_notes?.map((item, i) => (
                          <tr
                            key={item.uuid}
                            item-billing-type={item?.billing_type}
                          >
                            <td>
                              <input
                                type="date"
                                style={{marginLeft:"10px",marginRight:"10px"}}
                                onChange={(e) =>
                                  setData((prev) => ({
                                    ...prev,
                                    counter_notes: prev.counter_notes.map((a) =>
                                      a.uuid === item.uuid
                                        ? {
                                            ...a,
                                            date: new Date(
                                              e.target.value
                                            ).toUTCString(),
                                          }
                                        : a
                                    ),
                                  }))
                                }
                                value={getFormateDate(new Date(item.date))}
                                placeholder="Search Counter Title..."
                                className="searchInput"
                                pattern="\d{4}-\d{2}-\d{2}"
                              />
                            </td>
                            <td
                              className="ph2 pv1 tc bb b--black-20 bg-white"
                              style={{ textAlign: "center" }}
                            >
                              <input
                                id={"p" + item.uuid}
                                style={{ width: "50vw" ,marginLeft:"10px",marginRight:"10px"}}
                                type="text"
                                className="numberInput"
                                onWheel={(e) => e.preventDefault()}
                                value={item.note || ""}
                                onChange={(e) => {
                                  setData((prev) => ({
                                    ...prev,
                                    counter_notes: prev.counter_notes.map((a) =>
                                      a.uuid === item.uuid
                                        ? { ...a, note: e.target.value }
                                        : a
                                    ),
                                  }));
                                }}
                                onFocus={(e) => e.target.select()}
                              />
                            </td>
                            <td>
                              {new Date(item.created_at).toLocaleDateString()}
                            </td>

                            <td
                              className="ph2 pv1 tc bb b--black-20 bg-white"
                              style={{ textAlign: "center" }}
                            >
                              <DeleteOutlineIcon
                                style={{ color: "red",marginLeft:"10px",marginRight:"10px" }}
                                className="table-icon"
                                onClick={() => {
                                  setData((prev) => ({
                                    ...prev,
                                    counter_notes: prev.counter_notes.filter(
                                      (a) => a.uuid !== item.uuid
                                    ),
                                  }));
                                  
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td
                            onClick={() =>
                              setData((prev) => ({
                                ...prev,
                                counter_notes: [
                                  ...(prev.counter_notes || []),
                                  {
                                    uuid: uuid(),
                                    date: new Date().toUTCString(),
                                    created_at: new Date().toUTCString(),
                                    note: "",
                                  },
                                ],
                              }))
                            }
                          >
                            <AddIcon
                              sx={{ fontSize: 40 }}
                              style={{ color: "#32bd33", cursor: "pointer" }}
                            />
                          </td>
                        </tr>
                      </tbody>
                    ) : (
                      ""
                    )}
                  </table>
                </div>
                {
          
                compareObjects(prevData,data)?<button type="button" className="submit" style={{
                  maxWidth: "250px",
                }} onClick={()=>{
                  submitHandler();
                
                }}>
                Save changes
              </button>:""}
              </div>
            </div>
            <button
              onClick={() => {
                setCounterNotesPopup(null);
              }}
              className="closeButton"
            >
              x
            </button>
          </div>
        </div>
     
    </div>
  );
}
