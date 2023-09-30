import React, { useState } from "react";

const SalesPersoneFilterPopup = ({ onClose, users, setSalesPersoneList }) => {
  const [list, setList] = useState([]);
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
                setSalesPersoneList(list);
                onClose();
              }}
            >
              <div className="formGroup">
                <div className="row">
                  <label className="selectLabel" style={{ width: "100%" }}>
                    Sales Persons
                    <div
                      className="formGroup"
                      style={{ height: "350px", overflow: "scroll" }}
                    >
                      {users
                        .filter((a) => a.status)
                        .sort((a, b) =>
                          a?.user_title?.localeCompare(b.user_title)
                        )
                        .map((occ) => (
                          <div
                            style={{
                              marginBottom: "5px",
                              textAlign: "center",
                              backgroundColor: list?.filter(
                                (a) => a === occ.user_uuid
                              ).length
                                ? "#caf0f8"
                                : "#fff",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setList((prev) =>
                                prev?.find((a) => a === occ.user_uuid)
                                  ? prev?.filter((a) => a !== occ.user_uuid)
                                  : prev?.length &&
                                    !prev.filter((a) => +a === 1 || +a === 0)
                                      .length
                                  ? [...prev, occ?.user_uuid]
                                  : [occ?.user_uuid]
                              );
                            }}
                          >
                            {occ.user_title}
                          </div>
                        ))}
                    </div>
                  </label>
                </div>

                <div className="row">
                  <button className="simple_Logout_button" type="submit">
                    Filter
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

export default SalesPersoneFilterPopup;
