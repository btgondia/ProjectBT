import axios from "axios";
import React, { useState } from "react";
const orderStages = [
  { title: "Processing", id: 1 },
  { title: "Checking", id: 2 },
  { title: "Out For Delivery", id: 3 },
];
const SkipStagesPopup = ({ onClose }) => {
  const [list, setList] = useState([]);
  const getDetails = async (controller) => {
    const response = await axios({
      method: "get",
      url: "/details/GetDetails",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success)
      setList(response.data.result[0]?.skip_stages || []);
  };
  useState(() => {
    const controller = new AbortController();
    getDetails(controller);
    return () => {
      controller.abort();
    };
  }, []);

  const updateDetails = async (controller) => {
    const response = await axios({
      method: "post",
      url: "/details/postSkipStages",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        skip_stages: list,
      },
    });
    if (response.data.success) {
      onClose();
    }
  };
 
  return (
    <div
      className="overlay"
      style={{ position: "fixed", top: 0, left: 0, zIndex: 9999999 }}
    >
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
                const controller = new AbortController();
                updateDetails(controller);
                return () => {
                  controller.abort();
                };
              }}
            >
              <div className="formGroup">
                <div className="row">
                  <label className="selectLabel" style={{ width: "100%" }}>
                    Select Skip Stages
                    <div
                      className="formGroup"
                      style={{ height: "200px", overflow: "scroll" }}
                    >
                      {orderStages.map((stage) => (
                        <div
                          style={{
                            marginBottom: "5px",
                            textAlign: "center",
                            backgroundColor: list?.filter((a) => a === stage.id)
                              .length
                              ? "#caf0f8"
                              : "#fff",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setList((prev) =>
                              prev?.find((a) => a === stage.id)
                                ? prev?.filter((a) => a !== stage.id)
                                : prev?.length
                                ? [...prev, stage?.id]
                                : [stage?.id]
                            );
                          }}
                        >
                          {stage.title}
                        </div>
                      ))}
                    </div>
                  </label>
                </div>

                <div className="row">
                  <button className="simple_Logout_button" type="submit">
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        <button onClick={onClose} className="closeButton">
          x
        </button>
      </div>
    </div>
  );
};

export default SkipStagesPopup;
