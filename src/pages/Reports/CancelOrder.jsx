import axios from "axios"
import React, { useEffect, useState } from "react"
import Header from "../../components/Header"
import { OrderDetails } from "../../components/OrderDetails"
import Sidebar from "../../components/Sidebar"
import { getLastMonthDate } from "../../utils/helperFunctions"

const getDefaultDates = () => {
	let time = new Date()
	let curTime = "yy-mm-dd"
		.replace("mm", ("00" + (time?.getMonth() + 1)?.toString()).slice(-2))
		.replace("yy", ("0000" + time?.getFullYear()?.toString()).slice(-4))
		.replace("dd", ("00" + time?.getDate()?.toString()).slice(-2))
	let sTime = getLastMonthDate()
	sTime = "yy-mm-dd"
		.replace("mm", ("00" + (sTime?.getMonth() + 1)?.toString()).slice(-2))
		.replace("yy", ("0000" + sTime?.getFullYear()?.toString()).slice(-4))
		.replace("dd", ("00" + sTime?.getDate()?.toString()).slice(-2))

	return { startDate: sTime, endDate: curTime }
}

const DEFUALT_DATES = getDefaultDates()

const CancelOrders = () => {
	const [searchData, setSearchData] = useState(DEFUALT_DATES)
	const [popupOrder, setPopupOrder] = useState(null)
	const [items, setItems] = useState([])
	const [counter, setCounter] = useState([])

	const getCounter = async () => {
		const response = await axios({
			method: "get",
			url: "/counters/GetCounterList",

			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setCounter(response.data.result)
	}

	const getCompleteOrders = async () => {
		const response = await axios({
			method: "post",
			url: "/cancelOrders/GetCancelOrdersList",
			data: searchData,
			headers: {
				"Content-Type": "application/json"
			}
		})

		if (response.data.success) setItems(response.data.result)
		else setItems([])
	}

	useEffect(() => {
		getCompleteOrders()
		getCounter()
	}, [])

	return (
		<>
			<Sidebar />
			<Header />
			<div className='item-sales-container orders-report-container'>
				<div id='heading'>
					<h2>Canceled Order</h2>
				</div>
				<div id='item-sales-top'>
					<div
						id='date-input-container'
						style={{
							overflow: "visible",
							display: "flex",
							alignItems: "center",
							justifyContent: "flex-start",
							width: "100%"
						}}
					>
						<input
							type='date'
							onChange={(e) =>
								setSearchData((prev) => ({
									...prev,
									startDate: e.target.value
								}))
							}
							value={searchData.startDate}
							placeholder='Search Counter Title...'
							className='searchInput'
							pattern='\d{4}-\d{2}-\d{2}'
						/>
						<input
							type='date'
							onChange={(e) => setSearchData((prev) => ({ ...prev, endDate: e.target.value }))}
							value={searchData.endDate}
							placeholder='Search Route Title...'
							className='searchInput'
							pattern='\d{4}-\d{2}-\d{2}'
						/>
						<button className='theme-btn' onClick={() => getCompleteOrders()}>
							Search
						</button>
					</div>
				</div>
				<div className='table-container-user item-sales-container'>
					<Table itemsDetails={items} setPopupOrder={setPopupOrder} counter={counter} />
				</div>
			</div>
			{popupOrder ? (
				<OrderDetails
					onSave={() => {
						setPopupOrder(null)
						getCompleteOrders()
					}}
					order_uuid={popupOrder.order_uuid}
					orderStatus='edit'
				/>
			) : (
				""
			)}
		</>
	)
}

export default CancelOrders

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
		<table className='user-table' style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead>
				<tr>
					<th>S.N</th>
					<th colSpan={2}>Order Date</th>
					<th colSpan={2}>Cancel Date</th>
					<th colSpan={3}>Counter</th>
					<th colSpan={2}>Invoice</th>
				</tr>
			</thead>
			<tbody className='tbody'>
				{itemsDetails
					?.sort((a, b) => a.order_date - b.order_date)
					?.map((item, i, array) => (
						<tr key={Math.random()} style={{ height: "30px" }} onClick={() => setPopupOrder(item)}>
							<td>{i + 1}</td>
							<td colSpan={2}>
								{new Date(+item?.status[0]?.time).toDateString()} -{" "}
								{formatAMPM(new Date(+item?.status[0]?.time))}
							</td>

							<td colSpan={2}>
								{+item?.status.filter((a) => +a.stage === 5).length
									? new Date(+item?.status.find((a) => +a.stage === 5)?.time).toDateString() +
									  " - " +
									  formatAMPM(new Date(+item?.status.find((a) => +a.stage === 5)?.time))
									: ""}
							</td>
							<td colSpan={3}>
								{counter.find((a) => a.counter_uuid === item.counter_uuid)?.counter_title || ""}
							</td>
							<td colSpan={2}>{item.invoice_number || ""}</td>
						</tr>
					))}
			</tbody>
		</table>
	)
}
