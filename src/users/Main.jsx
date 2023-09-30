import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PullToRefresh from "react-simple-pull-to-refresh";
import "./style.css";
import { Link, useLocation } from "react-router-dom";
import { deleteDB } from "idb";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import axios from "axios";
import { refreshDb } from "../Apis/functions";
import { Version } from "../App";
const Main = () => {
  const [userRole, setUserRole] = useState([]);
  const [popupForm, setPopupForm] = useState(false);
  const [isSideMenuOpen, setSideMenuOpen] = useState(false);
  const [user_bal, setUserBal] = useState({});
  const { pathname } = useLocation();
  const Navigate = useNavigate();
  const rolesArray = [
    {
      type: 1,
      name: "Order",
      link: "/orders",
      img: "dinein.png",
    },
    {
      type: 2,
      name: "Processing",
      link: "/processing",
      img: "dinein.png",
    },
    {
      type: 3,
      name: "Checking",
      link: "/checking",
      img: "dinein.png",
    },
    {
      type: 4,
      name: "Delivery",
      link: "/delivery",
      img: "dinein.png",
    },
    {
      type: 5,
      name: "Stock Transfer",
      link: "/stock-transfer",
      img: "dinein.png",
    },
    {
      type: 6,
      name: "Collection",
      link: "/outstandingCollection",
      img: "dinein.png",
    },
  ];

  useEffect(() => {
    let user_uuid = localStorage.getItem("user_uuid");

    if (!user_uuid) {
      Navigate("/login");
    }
    let user_roles = localStorage.getItem("user_role");
    console.log("user_roles", typeof user_roles);
    if (user_roles) {
      user_roles = JSON.parse(user_roles);
    }
    console.log("user_roles", user_roles);
    setUserRole(user_roles || []);
    return () => setUserRole([]);
  }, []);
  useEffect(() => {
    if (isSideMenuOpen) {
      axios({
        method: "get",
        url: "/users/GetUser/" + localStorage.getItem("user_uuid"),

        headers: {
          "Content-Type": "application/json",
        },
      }).then((response) => {
        if (response.data.success) setUserBal(response.data.result);
      });
    }
  }, [isSideMenuOpen]);
  console.log(typeof userRole);
  return (
    <>
      <PullToRefresh onRefresh={() => window.location.reload(true)}>
        <div className="servicePage" style={{ maxHeight: "100vh",minHeight: "-webkit-fill-available", }}>
          <button
            className="time-icon"
            type="button"
            onClick={() => setSideMenuOpen(true)}
            style={{ color: "#000", left: "2rem" }}
          >
            <MenuIcon />
          </button>
          <div className="servicesContainer">
            {userRole?.map((data, i) => (
              <Link
                key={i}
                to={pathname + rolesArray.find((a) => +a.type === +data)?.link}
                onClick={() => {}}
                className="linkDecoration"
                style={{ textDecoration: "none", height: "fit-content" }}
              >
                <div className="service">
                  <span>{rolesArray.find((a) => +a.type === +data)?.name}</span>
                </div>
              </Link>
            ))}
          </div>
          <div
            style={{
              position: "fixed",
              bottom: "60px",
              right: "20vw",
              fontSize: "20px",
            }}
          >
            Version {Version}.{localStorage.getItem("IDBVersion")}
          </div>

          <button
            type="button"
            className="cartBtn"
            onClick={() => setPopupForm("refresh")}
          >
            Refresh
          </button>
        </div>
      </PullToRefresh>
      {popupForm ? (
        <Logout onSave={() => setPopupForm(false)} popupForm={popupForm} />
      ) : (
        ""
      )}
      <div
        className="overlay"
        style={
          isSideMenuOpen
            ? { justifyContent: "center" }
            : { justifyContent: "flex-start", left: "-9999", display: "none" }
        }
        //  className={`sidebar ${isSideMenuOpen ? "sideopen" : ""}`}
      >
        <div
          className="sidebarContainer"
          style={{
            height: "100vh",
            width: "100vw",
            maxWidth: "500px",
            minHeight: "-webkit-fill-available",
          }}
        >
          <button
            className="time-icon"
            type="button"
            onClick={() => setSideMenuOpen(false)}
            style={{ right: "1rem" }}
          >
            <CloseIcon />
          </button>
          <div className="links">
            <h1 style={{ color: "#fff" }}>
              {user_bal.user_title || "Bharat Traders"}
            </h1>
            <h2>Balance Incentive: Rs {user_bal.incentive_balance}</h2>

            <button
              className="sidebar-btn"
              type="button"
              onClick={() => setPopupForm(true)}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Main;

function Logout({ onSave, popupForm }) {
  const [isLoading, setIsLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log(popupForm);
    if (popupForm === "refresh") {
      setTimeout(() => setIsLoading(false), 10000);
      await refreshDb();
      setIsLoading(false);
      onSave();
    } else {
      deleteDB("BT", {
        blocked(currentVersion, blockedVersion, event) {
          console.log("IDB DELETE REQUEST BLOCKED.", {
            currentVersion,
            blockedVersion,
          });
          window.location.reload();
        },
      });
      localStorage.clear();
      sessionStorage.clear();
      window.location.assign("/login");
    }
    setIsLoading(false);
  };

  return (
    <div className="overlay" style={{ zIndex: 9999999999 }}>
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
            <form className="form">
              <div className="row">
                <h1>Are you Confirm </h1>
              </div>
              {!isLoading ? (
                <button
                  type="submit"
                  onClick={submitHandler}
                  className="submit"
                >
                  {popupForm === "refresh" ? "Refresh" : "Logout"}
                </button>
              ) : (
                <button className="submit" id="loading-screen">
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
                </button>
              )}
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
