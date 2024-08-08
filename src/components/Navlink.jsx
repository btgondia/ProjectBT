import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { ViewGridIcon } from "@heroicons/react/solid";
import context from "../context/context";

const NavLink = ({
  title,
  icon,
  menuList,
  draggable,
  setCollectionTags,
  setcalculationPopup,
  options,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const {
    setCashRegisterPopup,
    setIsItemAvilableOpen,
    setSkipStages,
    view,
    setBankStatementImport,
    setOpeningBalanceDatePopup,
    getAccountingBalanceDetails,
    getDebitCreditBalanceDetails,
    setGstReportPopup,
  } = useContext(context);
  const [searchFilter, setSearchFilter] = useState();
  const [subMenuList, setSubMenuList] = useState();
  const sortList = (_list) => {
    let data = _list.filter(
      (i) =>
        i &&
        (!searchFilter ||
          i.name.toLowerCase().includes(searchFilter.toLowerCase()))
    );
    if (options?.sort)
      data = data?.sort((a, b) => a.name.localeCompare(b.name));
    return data;
  };
  return (
    <div className="nav_link_container">
      <div
        className={`nav-link`}
        draggable={draggable}
        onClick={() => {
          if (menuList && !subMenuList?.length) {
            setMenuVisible(true);
          }
        }}
        onMouseLeave={(e) => {
          setMenuVisible(false);
          setSubMenuList(null);
        }}
        id={`item-category-${title?.toLowerCase()}`}
      >
        {icon}
        <p>
          {draggable && (
            <ViewGridIcon
              style={{
                minWidth: "1rem",
                maxWidth: "1rem",
                marginRight: 10,
                cursor: "move",
              }}
            />
          )}
          <span className={`nav_title`}>
            {title?.slice(0, 31)}
            {title?.length > 32 && "..."}
          </span>
        </p>
        {menuList && (
          <div
            className="menu"
            style={{
              display: menuVisible ? "block" : "none",
              top:
                title === "Report"
                  ? "-300px"
                  : title === "Setup"
                  ? view
                    ? "0px"
                    : "-190px"
                  : "-10px",
              width: title === "Report" ? "300px" : "200px",
              minHeight: options?.searchBar ? "90vh" : "unset",
            }}
          >
            <div>
              {options?.searchBar && (
                <div className="nav-menu-search">
                  <input
                    type="text"
                    placeholder="Search"
                    onClick={(e) => e.stopPropagation()}
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    autoFocus={true}
                  />
                </div>
              )}
              {sortList(menuList).map((menu) => (
                <div
                  className="item"
                  key={Math.random()}
                  onClick={() => {
                    if (menu.name === "Cash Register") {
                      setCashRegisterPopup(true);
                    } else if (menu.name === "Trips") {
                      setIsItemAvilableOpen((prev) => !prev);
                    } else if (menu.name === "Calculate Lines") {
                      setcalculationPopup((prev) => !prev);
                    } else if (menu.name === "Collection Tags") {
                      setCollectionTags(true);
                    } else if (menu.name === "Skip Stage") {
                      setSkipStages(true);
                    } else if (menu.name === "Bank Statement Import") {
                      setBankStatementImport(true);
                    } else if (menu.name === "Current Financial Year") {
                      setOpeningBalanceDatePopup(true);
                    } else if (menu.name === "Error Checking") {
                      setSubMenuList(menu.submenu);
                    } else if (menu.name === "GST Report") {
                      setGstReportPopup(true);
                    }
                    if (!menu.submenu) {
                      setMenuVisible(false);
                    }
                  }}
                >
                  {<Link to={menu.link}>{menu.name}</Link>}
                </div>
              ))}
            </div>
          </div>
        )}
        {subMenuList && (
          <div
            className="menu"
            style={{
              display: "block",
              top: "35px",
              width: "200px",
              minHeight: "unset",
              left: "285px",
            }}
          >
            <div>
              {sortList(subMenuList).map((menu) => (
                <div
                  className="item"
                  key={Math.random()}
                  onClick={() => {
                    setSubMenuList(null);
                    setMenuVisible(false);
                    if (menu.name === "Closing Balance") {
                      getAccountingBalanceDetails();
                    } else if (menu.name === "Debit/Credit") {
                      getDebitCreditBalanceDetails();
                    }
                  }}
                >
                  {<Link to={menu.link}>{menu.name}</Link>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavLink;
