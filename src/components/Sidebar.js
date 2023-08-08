import React, { useContext, useMemo, useState } from "react"
import "./style.css"
import NavLink from "./Navlink"
import {
	AutoAwesomeMosaicOutlined as MasterIcon,
	AssessmentOutlined as ReportsIcon,
	FlashOn as QuickAccessIcon,
	SettingsOutlined as SettingsIcon,
	UpgradeOutlined
} from "@mui/icons-material"
import AssessmentIcon from "@mui/icons-material/Assessment"
import AddIcon from "@mui/icons-material/Add"
import axios from "axios"
import { useLocation } from "react-router-dom"
import context from "../context/context"
import { Version } from "../App"
let titleData = [
	{ value: "RetailerMarginReport", name: "Retailer Margin Report" },
	{ value: "SalesmanItemSuggestion", name: "Salesman Item Suggestion" },
	{ value: "InvoiceNumberWiseOrder", name: "Invoice Number Wise Order" },
	{ value: "PartyWiseCompanyDiscount", name: "Party Wise Company Discount" },
	{ value: "trip", name: "DASHBOARD - Trip" },
	{ value: "itemCategories", name: "Item Categories" },
	{ value: "counterGroup", name: "Counter Group" },
	{ value: "itemGroup", name: "Item Group" },
	{ value: "adminUsers", name: "Users" },
	{ value: "warehouse", name: "Warehouse" },
	{ value: "autoIncreaseQty", name: "Auto Increase Quantity" },
	{ value: "autoIncreaseItem", name: "Auto Add Items" },
	{ value: "OrderRangeIncentive", name: "Order Range Incentive" },
	{ value: "DeliveryIncentive", name: "Delivery Incentive" },
	{ value: "ItemIncentive", name: "Item Incentive" },
	{ value: "upiTransactionReport", name: "UPI & Cheque Transaction" },
	{ value: "completeOrderReport", name: "Complete Order" },
	{ value: "cancelOrders", name: "cancel Order" },
	{ value: "CompletedTripsReport", name: "Completed Trips Report" },
	{ value: "CounterLeger", name: "Counter Leger" },
	{ value: "Outstandings", name: "Outstandings" },
	{ value: "pendingEntry", name: "Pending Order Entry" },
	{ value: "pendingReciptsEntry", name: "Pending Recipt Entry" },
	{ value: "stockTransferVochers", name: "Vochers" },
	{ value: "currentStock", name: "Current Stock" },
	{ value: "signedBills", name: "Signed Bills" },
	{ value: "addOrder", name: "New Order" },
	{ value: "addStock", name: "New Stock Tranfer" },
	{ value: "adjustStock", name: "Adjust Stock" },
	{ value: "OrderItemReport", name: "Order Item Report" },
	{ value: "userActivity", name: "User Activities" },
	{ value: "tasks", name: "Taskss" },
	{ value: "counter", name: "Counters" },
	{ value: "routes", name: "Routes" },
	{ value: "items", name: "Items" },
	{ value: "admin", name: "DASHBOARD - Route" }
]
const Sidebar = ({ setCollectionTags }) => {
	const [loading, setLoading] = useState(false)
	const { setcalculationPopup } = useContext(context)

	const location = useLocation()
	const updateMinLevel = async () => {
		if (loading) return
		setLoading(true)
		const response = await axios({
			method: "get",
			url: "MinLevelUpdate",

			headers: {
				"Content-Type": "application/json"
			}
		})
		console.log(response.data.result.user_type)
		setLoading(false)
	}
	document.title = useMemo(() => {
		let title = titleData.find(a => location.pathname.includes(a.value))

		return title.name || "BT"
	}, [location])
	return (
		<div className="left-panel" style={{ position: "relative", zIndex: "9000000" }}>
			<div className="nav" style={{ height: "100vh" }}>
				<NavLink
					title="New"
					icon={<AddIcon sx={{ fontSize: 50 }} />}
					// href="/admin/addOrder"
					isActive={false}
					menuList={[
						{
							name: "Add Order",
							link: "/admin/addOrder"
						},
						{
							name: "Stock Transfer",
							link: "/admin/addStock"
						},
						{
							name: "Adjust Stock",
							link: "/admin/adjustStock"
						},
						{
							name: "Add Outstanding",
							link: "/admin/AddOutStanding"
						}
					]}
				/>
				<NavLink
					title={"Master"}
					icon={<MasterIcon sx={{ fontSize: 50 }} />}
					isActive={true}
					menuList={[
						{
							name: "Items",
							link: "/admin/items"
						},
						{
							name: "Categories",
							link: "/admin/itemCategories"
						},
						{
							name: "Counter",
							link: "/admin/counter"
						},
						{
							name: "Companies",
							link: "/admin/companies"
						},
						// {
						//   name: "Test Counter",
						//   link: "/admin/TestCounter",
						// },
						{
							name: "Routes",
							link: "/admin/routes"
						},
						{
							name: "Counter Group",
							link: "/admin/counterGroup"
						},
						{
							name: "Item Group",
							link: "/admin/itemGroup"
						},
						{
							name: "Users",
							link: "/admin/adminUsers"
						},
						{
							name: "Warehouse",
							link: "/admin/warehouse"
						}
					]}
				/>

				<NavLink
					title={"Quick Access"}
					setCollectionTags={setCollectionTags}
					icon={<QuickAccessIcon sx={{ fontSize: 50 }} />}
					isActive={false}
					menuList={[
						{
							name: "Cash Register",
							link: "#"
						},
						{
							name: "Trips",
							link: "#"
						},
						{
							name: "Signed Bills",
							link: "/admin/signedBills"
						},
						{
							name: "Tasks",
							link: "/admin/tasks"
						},
						{
							name: "Collection Tags",
							link: "#"
						}
					]}
				/>
				<NavLink
					title={"Report"}
					icon={<AssessmentIcon sx={{ fontSize: 50 }} />}
					isActive={false}
					menuList={[
						{
							name: "User Activity",
							link: "/admin/userActivity"
						},
						{
							name: "UPI and Cheque Transaction",
							link: "/admin/upiTransactionReport"
						},
						{
							name: "Completed Orders",
							link: "/admin/completeOrderReport"
						},
						{
							name: "Items Wise",
							link: "/admin/OrderItemReport"
						},
						{
							name: "Completed Trips",
							link: "/admin/CompletedTripsReport"
						},
						{
							name: "Ledger",
							link: "/admin/CounterLeger"
						},
						{
							name: "Outstandings",
							link: "/admin/Outstandings"
						},
						{
							name: "Performance Summary",
							link: "/admin/performanceSummary"
						},
						{
							name: "Pending Order Entry",
							link: "/admin/pendingEntry"
						},
						{
							name: "Pending Recipts Entry",
							link: "/admin/pendingReciptsEntry"
						},
						{
							name: "Current Stock",
							link: "/admin/currentStock"
						},
						{
							name: "Vochers",
							link: "/admin/stockTransferVochers"
						},
						{
							name: "Cancel Order",
							link: "/admin/cancelOrders"
						},
						{
							name: "Invoice Number Wise Order",
							link: "/admin/InvoiceNumberWiseOrder"
						},
						{
							name: "Party Wise Company Discount",
							link: "/admin/PartyWiseCompanyDiscount"
						},
						{
							name: "Retailer Margin Report",
							link: "/admin/RetailerMarginReport"
						},
						{
							name: "Campaigns",
							link: "/admin/Campaigns"
						},
						{
							name: "OrderForm",
							link: "/admin/OrderForm"
						}
					]}
				/>
				<NavLink
					title={"Setup"}
					icon={<SettingsIcon sx={{ fontSize: 50 }} />}
					isActive={false}
					setcalculationPopup={setcalculationPopup}
					menuList={[
						{
							name: "Auto Increase Quantity",
							link: "/admin/autoIncreaseQty"
						},
						{
							name: "Auto Add Item",
							link: "/admin/autoIncreaseItem"
						},
						{
							name: "Order Range Incentive / Discount",
							link: "/admin/OrderRangeIncentive"
						},
						{
							name: "Delivery Incentive",
							link: "/admin/DeliveryIncentive"
						},
						{
							name: "Order Item Incentive",
							link: "/admin/ItemIncentive"
						},
						{
							name: "Salesman Item Suggestion",
							link: "/admin/SalesmanItemSuggestion"
						},
						{
							name: "Calculate Lines",
							link: "#"
						},
						{
							name: "WhatsApp Notifications",
							link: "/admin/WhatsAppNotifications"
						}
					]}
				/>
				{/* <div
          className="nav_link_container"
          onClick={updateMinLevel}
          style={{ width: "100%" }}
        >
          <div className={`nav-link`}>
            <>
              <UpgradeOutlined sx={{ fontSize: 50 }} />
              <p>
                <span className={`nav_title`}>Update MinLevel</span>
              </p>
            </>
             Submenu popup
          </div>
        </div>*/}
			</div>
			<div style={{ position: "absolute", bottom: "5px", left: "25px" }}>
				<b>V: {Version}</b>
			</div>
		</div>
	)
}

export default Sidebar
