import axios from "axios"
import React, { useState, useEffect } from "react"
import * as XLSX from "xlsx"
import * as FileSaver from "file-saver"
const PopupTripOrderTable = ({ trip_uuid, onSave }) => {
	const [itemDetails, setItemDetails] = useState([])
	const [counter, setCounter] = useState([])
	const [total, setTotal] = useState({})
	const fileExtension = ".xlsx"
	const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"

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
	const getCompleteOrders = async () => {
		if (trip_uuid) {
			const response = await axios({
				method: "post",
				url: "/orders/getTripCompletedOrderList",
				data: { trip_uuid },
				headers: {
					"Content-Type": "application/json",
				},
			})
			console.log("activity", response)
			if (response.data.success) {
				setItemDetails(response.data.result)
				setTotal(response.data.total)
			}
		}
	}
	useEffect(() => {
		getCompleteOrders()
		getCounter()
	}, [trip_uuid])
	const downloadHandler = async () => {
		let sheetData = itemDetails.map(a => {
			// console.log(a)
			return {
				"Order Date": new Date(a.order_date).toDateString() + "-" + formatAMPM(new Date(a.order_date)),
				"Delivery Date": new Date(a.delivery_date).toDateString() + "-" + formatAMPM(new Date(a.delivery_date)),
				"Counter Title": counter.find(b => b.counter_uuid === a.counter_uuid)?.counter_title || "",
				"Invoice Number": a.invoice_number,
				Quantity: a.qty,
				Amount: a.amt || "",
				Cash: a.modes.find(a => a.mode_uuid === "c67b54ba-d2b6-11ec-9d64-0242ac120002")?.amt || 0,
				Cheque: a.modes.find(a => a.mode_uuid === "c67b5794-d2b6-11ec-9d64-0242ac120002")?.amt || 0,
				Upi: a.modes.find(a => a.mode_uuid === "c67b5988-d2b6-11ec-9d64-0242ac120002")?.amt || 0,
				Unpaid: a.unpaid || 0,
			}
		})
		// console.log(sheetData)
		sheetData = [
			...sheetData,
			{
				"Order Date": "Total",
				"Delivery Date": "",
				"Counter Title": "",
				"Invoice Number": "",
				Quantity: "",
				Amount:
					itemDetails.length > 1
						? itemDetails.map(a => +a?.amt || 0).reduce((a, b) => a + b)
						: itemDetails[0]?.amt || 0,
				Cash:
					itemDetails.length > 1
						? itemDetails
								.map(
									a =>
										+a?.modes.find(a => a.mode_uuid === "c67b54ba-d2b6-11ec-9d64-0242ac120002")
											?.amt || 0
								)
								.reduce((a, b) => a + b)
						: itemDetails[0]?.modes.find(a => a.mode_uuid === "c67b54ba-d2b6-11ec-9d64-0242ac120002")
								?.amt || 0,
				Cheque:
					itemDetails.length > 1
						? itemDetails
								.map(
									a =>
										+a?.modes.find(a => a.mode_uuid === "c67b5794-d2b6-11ec-9d64-0242ac120002")
											?.amt || 0
								)
								.reduce((a, b) => a + b)
						: itemDetails[0]?.modes.find(a => a.mode_uuid === "c67b5794-d2b6-11ec-9d64-0242ac120002")
								?.amt || 0,
				Upi:
					itemDetails.length > 1
						? itemDetails
								.map(
									a =>
										+a?.modes.find(a => a.mode_uuid === "c67b5988-d2b6-11ec-9d64-0242ac120002")
											?.amt || 0
								)
								.reduce((a, b) => a + b)
						: itemDetails[0]?.modes.find(a => a?.mode_uuid === "c67b5988-d2b6-11ec-9d64-0242ac120002")
								?.amt || 0,
				Unpaid:
					itemDetails.length > 1
						? itemDetails.map(a => +a?.unpaid || 0).reduce((a, b) => a + b)
						: itemDetails[0]?.unpaid || 0,
			},
		]
		const ws = XLSX.utils.json_to_sheet(sheetData)
		const wb = { Sheets: { data: ws }, SheetNames: ["data"] }
		const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
		const data = new Blob([excelBuffer], { type: fileType })
		FileSaver.saveAs(data, "TripOrders" + fileExtension)
	}
	return (
		<div className="overlay" style={{ zIndex: 999999999999 }}>
			<div
				className="modal"
				style={{
					height: "500px",
					width: "max-content",
					minWidth: "206px",
					padding: "10px",
					paddingTop: "40px",
				}}>
				<div
					className="content"
					style={{
						padding: "20px",
						width: "80vw",
						overflow: "scroll",
					}}>
					<table
						className="user-table"
						style={{
							maxWidth: "100vw",

							overflowX: "scroll",
						}}>
						<thead>
							<tr>
								<th>S.N</th>
								<th colSpan={4}>Order Date</th>
								<th colSpan={4}>Delivery Date</th>
								<th colSpan={4}>Counter</th>
								<th colSpan={2}>Invoice</th>
								<th colSpan={2}>Qty</th>
								<th colSpan={2}>Amount</th>
								<th colSpan={2}>Cash</th>
								<th colSpan={2}>Cheque</th>
								<th colSpan={2}>UPI</th>
								<th colSpan={2}>Unpaid</th>
							</tr>
						</thead>
						<tbody className="tbody">
							{itemDetails
								?.sort((a, b) => a.delivery_date - b.delivery_date)
								?.map((item, i) => (
									<tr key={Math.random()} style={{ height: "30px" }}>
										<td>{i + 1}</td>
										<td colSpan={4}>
											{new Date(item.order_date).toDateString()} -{" "}
											{formatAMPM(new Date(item.order_date))}
										</td>
										<td colSpan={4}>
											{new Date(item.delivery_date).toDateString()} -{" "}
											{formatAMPM(new Date(item.delivery_date))}
										</td>
										<td colSpan={4}>
											{counter.find(a => a.counter_uuid === item.counter_uuid)?.counter_title ||
												""}
										</td>
										<td colSpan={2}>{item.invoice_number || ""}</td>
										<td colSpan={2}>{item.qty || 0}</td>
										<td colSpan={2}>{item.amt || 0}</td>
										<td colSpan={2}>{item.cash || 0}</td>
										<td colSpan={2}>{item.cheque || 0}</td>
										<td colSpan={2}>{item.upi || 0}</td>
										<td colSpan={2}>{item.unpaid || 0}</td>
									</tr>
								))}
							<tr style={{ height: "30px" }}>
								<td></td>
								<td colSpan={4}>
									<b>Total</b>
								</td>
								<td colSpan={4}></td>
								<td colSpan={4}></td>
								<td colSpan={2}></td>
								<td colSpan={2}></td>
								<td colSpan={2}>
									<b>{total.total_amt || 0}</b>
								</td>
								<td colSpan={2}>
									<b>{total.total_cash || 0}</b>
								</td>
								<td colSpan={2}>
									<b>{total.total_cheque || 0}</b>
								</td>
								<td colSpan={2}>
									<b>{total.total_upi || 0}</b>
								</td>
								<td colSpan={2}>
									<b>{total.total_unpaid || 0}</b>
								</td>
							</tr>
						</tbody>
					</table>
					<button onClick={onSave} className="closeButton">
						x
					</button>
					<button
						onClick={downloadHandler}
						className="theme-btn"
						style={{ position: "absolute", top: "10px", left: "10px" }}>
						XLS
					</button>
				</div>
			</div>
		</div>
	)
}

export default PopupTripOrderTable
