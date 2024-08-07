import React, { useContext, useMemo } from "react";
import "./style.css";
import NavLink from "./Navlink";
import {
  AutoAwesomeMosaicOutlined as MasterIcon,
  FlashOn as QuickAccessIcon,
  SettingsOutlined as SettingsIcon,
} from "@mui/icons-material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AddIcon from "@mui/icons-material/Add";
import { useLocation } from "react-router-dom";
import context from "../context/context";
import { Version } from "../App";

let titleData = [
  { value: "LedgerClosingBalance", name: "Ledger Closing Balance" },
  { value: "SearchTransitionTags", name: "Search Transition Tags" },
  { value: "unknownEntry", name: "Unknown Entry" },
  { value: "ChequeNumberSearch", name: "Cheque Number Search" },
  { value: "RetailerMarginReport", name: "Retailer Margin Report" },
  { value: "accounting_dashboard", name: "Accounting Dashboard" },
  { value: "OpeningBalanceReport", name: "Opening Balance Report" },
  { value: "BankReconciliation", name: "Bank Reconciliation" },
  { value: "SalesmanItemSuggestion", name: "Salesman Item Suggestion" },
  { value: "InvoiceNumberWiseOrder", name: "Invoice Number Wise Order" },
  { value: "PartyWiseCompanyDiscount", name: "Party Wise Company Discount" },
  { value: "trip", name: "DASHBOARD - Trip" },
  { value: "itemCategories", name: "Item Categories" },
  { value: "counterGroup", name: "Counter Group" },
  { value: "itemGroup", name: "Item Group" },
  { value: "adminUsers", name: "Users" },
  { value: "performanceSummary", name: "Performance Summary" },
  { value: "warehouse", name: "Warehouse" },
  { value: "autoIncreaseQty", name: "Auto Increase Quantity" },
  { value: "autoIncreaseItem", name: "Auto Add Items" },
  { value: "OrderRangeIncentive", name: "Order Range Incentive" },
  { value: "DeliveryIncentive", name: "Delivery Incentive" },
  { value: "ItemIncentive", name: "Item Incentive" },
  { value: "upiTransactionReport", name: "UPI & Cheque Transaction" },
  { value: "completeOrderReport", name: "Complete Order" },
  { value: "stockTracker", name: "Stock Tracker" },
  { value: "counterStockReport", name: "Counter Stock Report" },
  { value: "StockAdjustmentReport", name: "Stock Adjustment Summary" },
  { value: "StockValuationReport", name: "Stock Valuation" },
  { value: "purchaseRate", name: "Purchase Rate" },
  { value: "cashRegisterReport", name: "Cash Registers" },
  { value: "cancelOrders", name: "cancel Order" },
  { value: "CompletedTripsReport", name: "Completed Trips Report" },
  { value: "CounterLeger", name: "Counter Leger" },
  { value: "BankStatementImport", name: "Bank Statement Import" },
  { value: "addVoucher", name: "Add Voucher" },
  { value: "Outstandings", name: "Outstandings" },
  { value: "pendingEntry", name: "Pending Order Entry" },
  { value: "pendingReciptsEntry", name: "Pending Recipt Entry" },
  { value: "stockTransferVouchers", name: "Voucher" },
  { value: "currentStock", name: "Current Stock" },
  { value: "signedBills", name: "Signed Bills" },
  { value: "addOrder", name: "New Order" },
  { value: "purchaseInvoice", name: "Purchase Invoice" },
  { value: "creditNote", name: "Credit Note" },
  { value: "addStock", name: "New Stock Tranfer" },
  { value: "adjustStock", name: "Adjust Stock" },
  { value: "ItemsReport", name: "Items Report" },
  { value: "userActivity", name: "User Activities" },
  { value: "tasks", name: "Taskss" },
  { value: "counter", name: "Counters" },
  { value: "routes", name: "Routes" },
  { value: "items", name: "Items" },
  { value: "ledgerGroup", name: "Ledger Group" },
  { value: "ledgers", name: "Ledgers" },
  { value: "admin", name: "DASHBOARD - Route" },
];
const Sidebar = ({ setCollectionTags, allAmountValue }) => {
  const { setcalculationPopup, view, setCounterNotesPopup } =
    useContext(context);
  const location = useLocation();
  document.title = useMemo(() => {
    let title = titleData.find((a) => location.pathname.includes(a.value));
    return title.name || "BT";
  }, [location]);

  return (
    <div
      className="left-panel"
      style={{ position: "relative", zIndex: "9000000" }}
    >
      <button
        className="submit"
        style={{ margin: 0, borderRadius: 0 }}
        onClick={() => {
          setCounterNotesPopup(true);
        }}
      >
        Notes
      </button>
      <div className="nav" style={{ height: "100vh" }}>
        <NavLink
          title="New"
          icon={<AddIcon sx={{ fontSize: 50 }} />}
          isActive={false}
          menuList={
            view
              ? [
                  {
                    name: "Purchase Invoice",
                    link: "/admin/purchaseInvoice",
                  },
                  {
                    name: "New Voucher",
                    link: "/admin/addVoucher",
                  },
                  {
                    name: "Credit Note",
                    link: "/admin/creditNote",
                  },
                ]
              : [
                  {
                    name: "Add Order",
                    link: "/admin/addOrder",
                  },
                  {
                    name: "Stock Transfer",
                    link: "/admin/addStock",
                  },
                  {
                    name: "Adjust Stock",
                    link: "/admin/adjustStock",
                  },
                ]
          }
        />
        <NavLink
          title={"Master"}
          icon={<MasterIcon sx={{ fontSize: 50 }} />}
          isActive={true}
          menuList={
            view
              ? [
                  {
                    name: "Ledgers",
                    link: "/admin/ledgers",
                  },
                  {
                    name: "Ledger Group",
                    link: "/admin/ledgerGroup",
                  },
                  {
                    name: "Counter",
                    link: "/admin/counter",
                  },
                ]
              : [
                  {
                    name: "Items",
                    link: "/admin/items",
                  },
                  {
                    name: "Categories",
                    link: "/admin/itemCategories",
                  },
                  {
                    name: "Counter",
                    link: "/admin/counter",
                  },
                  {
                    name: "Companies",
                    link: "/admin/companies",
                  },
                  {
                    name: "Routes",
                    link: "/admin/routes",
                  },
                  {
                    name: "Counter Group",
                    link: "/admin/counterGroup",
                  },
                  {
                    name: "Item Group",
                    link: "/admin/itemGroup",
                  },
                  {
                    name: "Users",
                    link: "/admin/adminUsers",
                  },
                  {
                    name: "Warehouse",
                    link: "/admin/warehouse",
                  },
                  {
                    name: "Expenses",
                    link: "/admin/expense",
                  },
                ]
          }
        />

        <NavLink
          title={"Quick Access"}
          setCollectionTags={setCollectionTags}
          icon={<QuickAccessIcon sx={{ fontSize: 50 }} />}
          isActive={false}
          menuList={
            view
              ? [
                  {
                    name: "Bank Reconciliation",
                    link: "/admin/BankReconciliation",
                  },
                ]
              : [
                  {
                    name: "Cash Register",
                    link: "#",
                  },
                  {
                    name: "Trips",
                    link: "#",
                  },
                  {
                    name: "Tasks",
                    link: "/admin/tasks",
                  },
                ]
          }
        />
        <NavLink
          title={"Report"}
          icon={<AssessmentIcon sx={{ fontSize: 50 }} />}
          isActive={false}
          options={{ searchBar: true, sort: true }}
          menuList={
            view
              ? [
                  {
                    name: "Ledger",
                    link: "/admin/CounterLeger",
                  },
                  {
                    name: "Stock Valuation",
                    link: "/admin/StockValuationReport",
                  },
                  {
                    name: "Opening Balance Report",
                    link: "/admin/OpeningBalanceReport",
                  },
                  {
                    name: "Closing and Current Balance",
                    link: "/admin/LedgerClosingBalance",
                  },
                  {
                    name: "Cheque Number Search",
                    link: "/admin/ChequeNumberSearch",
                  },
                  {
                    name: "Unknown Entry",
                    link: "/admin/unknownEntry",
                  },
                  {
                    name: "Search Transition Tags",
                    link: "/admin/SearchTransitionTags",
                  },
                  {
                    name:"GST Report",
                    link:"#"
                  },
                  {
                    name: "Purchase Rate",
                    link: "/admin/purchaseRate",
                  },
                ]
              : [
                  {
                    name: "User Activity",
                    link: "/admin/userActivity",
                  },
                  {
                    name: "UPI and Cheque Transaction",
                    link: "/admin/upiTransactionReport",
                  },
                  {
                    name: "Completed Orders",
                    link: "/admin/completeOrderReport",
                  },
                  {
                    name: "Counter Charges",
                    link: "/admin/counterCharges",
                  },
                  {
                    name: "Counter Stock Report",
                    link: "/admin/counterStockReport",
                  },
                  {
                    name: "Cash Registers",
                    link: "/admin/cashRegisterReport",
                  },
                  {
                    name: "Stock Adjustment Summary",
                    link: "/admin/StockAdjustmentReport",
                  },
                  {
                    name: "Items Report",
                    link: "/admin/ItemsReport",
                  },
                  {
                    name: "Completed Trips",
                    link: "/admin/CompletedTripsReport",
                  },
                  {
                    name: "Ledger",
                    link: "/admin/CounterLeger",
                  },
                  {
                    name: "Counter Report",
                    link: "/admin/counterReport",
                  },
                  {
                    name: "Outstandings",
                    link: "/admin/Outstandings",
                  },
                  {
                    name: "Performance Summary",
                    link: "/admin/performanceSummary",
                  },
                  {
                    name: "Deductions Report",
                    link: "/admin/deductionsReport",
                  },
                  {
                    name: "Pending Order Entry",
                    link: "/admin/pendingEntry",
                  },
                  {
                    name: "Pending Recipts Entry",
                    link: "/admin/pendingReciptsEntry",
                  },
                  {
                    name: "Current Stock",
                    link: "/admin/currentStock",
                  },
                  {
                    name: "Vouchers",
                    link: "/admin/stockTransferVouchers",
                  },
                  {
                    name: "Cancel Order",
                    link: "/admin/cancelOrders",
                  },
                  {
                    name: "Invoice Number Wise Order",
                    link: "/admin/InvoiceNumberWiseOrder",
                  },
                  {
                    name: "Party Wise Company Discount",
                    link: "/admin/PartyWiseCompanyDiscount",
                  },
                  {
                    name: "Retailer Margin Report",
                    link: "/admin/RetailerMarginReport",
                  },
                  {
                    name: "Campaigns",
                    link: "/admin/Campaigns",
                  },
                  {
                    name: "OrderForm",
                    link: "/admin/OrderForm",
                  },
                  {
                    name: "Stock Tracker",
                    link: "/admin/stockTracker",
                  },
                ]
          }
        />
        <NavLink
          title={"Setup"}
          icon={<SettingsIcon sx={{ fontSize: 50 }} />}
          isActive={false}
          setcalculationPopup={setcalculationPopup}
          menuList={
            view
              ? [
                  {
                    name: "Bank Statement Import",
                    link: "#",
                  },
                  {
                    name: "Current Financial Year",
                    link: "#",
                  },
                  {
                    name: "Error Checking",
                    link: "#",
                    submenu: [
                      {
                        name: "Closing Balance",
                        link: "#",
                      },
                      {
                        name: "Debit/Credit",
                        link: "#",
                      },
                    ],
                  },
                ]
              : [
                  {
                    name: "Auto Increase Quantity",
                    link: "/admin/autoIncreaseQty",
                  },
                  {
                    name: "Auto Add Item",
                    link: "/admin/autoIncreaseItem",
                  },
                  {
                    name: "Order Range Incentive / Discount",
                    link: "/admin/OrderRangeIncentive",
                  },
                  {
                    name: "Delivery Incentive",
                    link: "/admin/DeliveryIncentive",
                  },
                  {
                    name: "Order Item Incentive",
                    link: "/admin/ItemIncentive",
                  },
                  {
                    name: "Salesman Item Suggestion",
                    link: "/admin/SalesmanItemSuggestion",
                  },
                  {
                    name: "Calculate Lines",
                    link: "#",
                  },
                  {
                    name: "WhatsApp Notifications",
                    link: "/admin/WhatsAppNotifications",
                  },
                  {
                    name: "Skip Stage",
                    link: "#",
                  },
                ]
          }
        />
      </div>
      {allAmountValue ? (
        <div style={{ position: "absolute", bottom: "25px", left: "25px" }}>
          <b>{allAmountValue}</b>
        </div>
      ) : (
        ""
      )}
      <div style={{ position: "absolute", bottom: "5px", left: "25px" }}>
        <b>v{Version}</b>
      </div>
    </div>
  );
};

export default Sidebar;
