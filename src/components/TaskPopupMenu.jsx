import axios from "axios";
import React, { useEffect, useState } from "react";

const TaskPopupMenu = ({ onSave, taskData, counter, users }) => {
  const [data, setdata] = useState({});
  const [assign, setAssign] = useState(false);

  useEffect(() => {
    setdata({
      ...taskData,
      completed_by: localStorage.getItem("user_uuid"),
      status: 1,
      completed: true,
    });
  }, [taskData]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (assign) {
      setAssign(false);
      onSave()
      return;
    }

    const response = await axios({
      method: "put",
      url: "/tasks/putTask",
      data: [data],
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.result[0].success) {
      onSave();
    }

    if (response.data.success) {
      onSave();

    }
  };

 
  return (
    <div className="overlay" style={{ zIndex: "9999999999" }}>
      <div className="modal" style={{ width: "fit-content" }}>
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
                <h1>Pending Task</h1>
              </div>
              {counter?.counter_title ? <h3>{counter?.counter_title}</h3> : ""}

              {assign ? (
                <div className="formGroup">
                  <div className="row">
                    <label className="selectLabel">
                      Users
                      <div
                        className="formGroup"
                        style={{ height: "200px", overflow: "scroll" }}
                      >
                        {users.map((occ) => (
                          <div
                            style={{
                              marginBottom: "5px",
                              textAlign: "center",
                              backgroundColor: data?.assigned_to?.filter(
                                (a) => a === occ.user_uuid
                              )?.length
                                ? "#caf0f8"
                                : "#fff",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setdata((prev) => ({
                                ...prev,
                                assigned_to: prev?.assigned_to?.find(
                                  (a) => a === occ.user_uuid
                                )
                                  ? prev?.assigned_to.filter(
                                      (a) => a !== occ.user_uuid
                                    )
                                  : prev?.assigned_to?.length
                                  ? [...prev?.assigned_to, occ?.user_uuid]
                                  : [occ?.user_uuid],
                              }));
                            }}
                          >
                            {occ.user_title}
                          </div>
                        ))}
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="formGroup">
                  <div className="row">
                    <label className="selectLabel">
                      Task
                      <textarea
                        type="text"
                        name="route_title"
                        className="numberInput"
                        style={{ height: "150px" }}
                        value={data?.task}
                      />
                    </label>
                  </div>
                </div>
              )}

              {assign ? (
                <button type="submit" className="submit">
                  Save
                </button>
              ) : (
                <div
                  className="flex"
                  style={{ width: "400px", justifyContent: "space-between" }}
                >
                  <button type="submit" className="submit">
                    Complete
                  </button>
                  <button
                    type="button"
                    className="submit"
                    onClick={() => setAssign(true)}
                  >
                    Assign
                  </button>
                  <button type="button" className="submit" onClick={onSave}>
                    Later
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskPopupMenu;
