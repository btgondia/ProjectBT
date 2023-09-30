import axios from "axios"
import React, { useEffect, useState } from "react"
import Header from "../../components/Header"
import { OrderDetails } from "../../components/OrderDetails"
import Sidebar from "../../components/Sidebar"
import Select from "react-select"
const InvoiceNumberWiseOrder = () => {
	const [popupOrder, setPopupOrder] = useState(null)
	const [items, setItems] = useState([])
	const [counter, setCounter] = useState([])
	const [invoiceNumberFilter, setInvoiceNumberFilter] = useState("")
	const [initial, setInitial] = useState(false)

	const getCounter = async () => {
		const response = await axios({
			method: "get",
			url: "/counters/GetCounterList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setCounter(response.data.result)
	}
	const getCompleteOrders = async () => {
		if (!invoiceNumberFilter) return

		const response = await axios({
			method: "post",
			url: "/orders/getOrderData",
			data: { invoice_number: invoiceNumberFilter },
			headers: {
				"Content-Type": "application/json",
			},
		})
		console.log("activity", response)
		if (response.data.success) setItems(response.data.result)
		else setItems([])
	}

	useEffect(() => {
		getCounter()
	}, [])
	useEffect(() => {
		if (initial) getCompleteOrders()
		else setInitial(true)
	}, [popupOrder])

	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading">
					<h2>Invoice Number Wise Order</h2>
				</div>
				<div id="item-sales-top">
					<div
						id="date-input-container"
						style={{
							overflow: "visible",
							display: "flex",
							alignItems: "center",
							width: "100%",
						}}>
						<input
							type="number"
							onChange={e => setInvoiceNumberFilter(e.target.value)}
							value={invoiceNumberFilter}
							placeholder="Search Invoice Number..."
							className="searchInput"
							onWheel={e => e.preventDefault()}
						/>

						<button className="theme-btn" onClick={() => getCompleteOrders()}>
							Search
						</button>
					</div>
				</div>
				<div className="table-container-user item-sales-container">
					<Table
						itemsDetails={items.filter(
							a =>
								!invoiceNumberFilter ||
								a.invoice_number
									?.toString()
									.toLocaleLowerCase()
									.includes(invoiceNumberFilter.toLocaleLowerCase())
						)}
						setPopupOrder={setPopupOrder}
						counter={counter}
					/>
				</div>
			</div>
			{popupOrder ? (
				<OrderDetails
					onSave={() => {
						setPopupOrder(null)
						getCompleteOrders()
					}}
					order_uuid={popupOrder.order_uuid}
					orderStatus="edit"
				/>
			) : (
				""
			)}
		</>
	)
}

export default InvoiceNumberWiseOrder

function Table({ itemsDetails, setPopupOrder, counter }) {
	function formatAMPM(date) {
		var hours = date.getHours()
		var minutes = date.getMinutes()
		var ampm = hours >= 12 ? "pm" : "am"
		hours = hours % 12
		hours = hours ? hours : 12 // the hour '0' should be '12'
		minutes = minutes < 10 ? "0" + minutes : minutes
		var strTime = hours + ":" + minutes + " " + ampm
		return strTime
	}

	return (
		<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead>
				<tr>
					<th>S.N</th>
					<th colSpan={2}>Order Date</th>
					<th colSpan={3}>Counter</th>
					<th colSpan={2}>Invoice</th>
					<th colSpan={2}>Qty</th>
					<th colSpan={2}>Amount</th>
				</tr>
			</thead>
			<tbody className="tbody">
				{itemsDetails
					?.sort((a, b) => a.order_date - b.order_date)
					?.map((item, i, array) => (
						<tr key={Math.random()} style={{ height: "30px" }} onClick={() => setPopupOrder(item)}>
							<td>{i + 1}</td>
							<td colSpan={2}>
								{new Date(+item.status[0].time).toDateString()} -{" "}
								{formatAMPM(new Date(+item.status[0].time))}
							</td>

							<td colSpan={3}>
								{counter.find(a => a.counter_uuid === item.counter_uuid)?.counter_title || ""}
							</td>
							<td colSpan={2}>{item.invoice_number || ""}</td>
							<td colSpan={2}>{item?.item_details?.length || ""}</td>
							<td colSpan={2}>{item.order_grandtotal || ""}</td>
						</tr>
					))}
			</tbody>
		</table>
	)
}
