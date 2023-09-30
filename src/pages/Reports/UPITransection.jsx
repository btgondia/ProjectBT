import axios from "axios"
import React, { useContext, useEffect, useState } from "react"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"
import { OrderDetails } from "../../components/OrderDetails"
import * as XLSX from "xlsx"
import Context from "../../context/context"
import * as FileSaver from "file-saver"
import { WhatsApp } from "@mui/icons-material"
const fileExtension = ".xlsx"
const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"
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
const UPITransection = () => {
	const [popupOrder, setPopupOrder] = useState(null)
	const [loading, setLoading] = useState(false)
	const [remarksPopup, setRemarksPoup] = useState()

	const [items, setItems] = useState([])
	const getActivityData = async (controller = new AbortController()) => {
		const response = await axios({
			method: "get",
			url: "/receipts/getReceipt",
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json",
			},
		})
		console.log("transactions", response)
		if (response.data.success) setItems(response.data.result)
		setLoading(false)
	}
	const getOrderData = async order_uuid => {
		const response = await axios({
			method: "get",
			url: "/orders/GetOrder/" + order_uuid,
			headers: {
				"Content-Type": "application/json",
			},
		})
		console.log("transactions", response)
		if (response.data.success) setPopupOrder(response.data.result)
	}
	const putActivityData = async (order_uuid, mode_uuid, invoice_number) => {
		const response = await axios({
			method: "put",
			url: "/receipts/putReceiptUPIStatus",
			data: { order_uuid, status: 1, mode_uuid, invoice_number },
			headers: {
				"Content-Type": "application/json",
			},
		})
		console.log("transactions", response)
		if (response.data.success) {
			getActivityData()
		}
	}
	useEffect(() => {
		const controller = new AbortController()
		getActivityData(controller)
		return () => {
			controller.abort()
		}
	}, [])
	const downloadHandler = async () => {
		let sheetData = items.map(a => {
			// console.log(a)
			return {
				"Counter Title": a.counter_title,
				Amount: a.amt,
				"Invoice Number": a.invoice_number,
				"Order Date": new Date(a.order_date).toDateString() + " - " + formatAMPM(new Date(a.order_date)),
				"Payment Date": new Date(a.payment_date).toDateString() + " - " + formatAMPM(new Date(a.payment_date)),

				User: a.user_title,
				type: a.mode_title,
			}
		})
		// console.log(sheetData)

		const ws = XLSX.utils.json_to_sheet(sheetData)
		const wb = { Sheets: { data: ws }, SheetNames: ["data"] }
		const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
		const data = new Blob([excelBuffer], { type: fileType })
		FileSaver.saveAs(data, "TripOrders" + fileExtension)
	}
	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading">
					<h2>UPI and Cheque Transaction </h2>
					{/* <button type="button" onClick={downloadHandler}>
            Exels
          </button> */}
				</div>

				<div className="table-container-user item-sales-container">
					<Table
						itemsDetails={items}
						putActivityData={putActivityData}
						getOrderData={getOrderData}
						setRemarksPoup={setRemarksPoup}
						loading={loading}
						setLoading={setLoading}
					/>
				</div>
			</div>
			{popupOrder ? (
				<OrderDetails
					onSave={() => {
						setPopupOrder(null)
						getActivityData()
					}}
					order_uuid={popupOrder.order_uuid}
					orderStatus="edit"
				/>
			) : (
				""
			)}
			{remarksPopup ? (
				<NotesPopup
					onSave={() => {
						setRemarksPoup(false)
						getActivityData()
					}}
					notesPopup={remarksPopup}
					setItems={setItems}
					// postOrderData={() => onSubmit({ stage: 5 })}
				/>
			) : (
				""
			)}
		</>
	)
}

export default UPITransection
function Table({ itemsDetails, putActivityData, getOrderData, setRemarksPoup, loading, setLoading, Counters }) {
	const context = useContext(Context)

	const { setNotification } = context
	const sendMessage = async item => {
		let response = await axios({
			method: "post",
			url: "/orders/sendMsg",
			data: { ...item, notification_uuid: "payment-reminder-manual", consolidated_payment_reminder: true },
		})

		console.log(response.data)
		setNotification(response.data)
		setTimeout(() => setNotification(null), 3000)
	}
	return (
		<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead>
				<tr>
					<th>S.N</th>
					<th colSpan={3}>Counter Title</th>
					<th colSpan={2}>Amount</th>
					<th colSpan={2}>Invoice Number</th>
					<th colSpan={2}>Order Date</th>
					<th colSpan={2}>Payment Date</th>
					<th colSpan={3}>User</th>
					<th colSpan={3}>Type</th>
					<th colSpan={5}>Action</th>
				</tr>
			</thead>
			<tbody className="tbody">
				{itemsDetails
					// ?.sort((a, b) => a.timestamp - b.timestamp)
					?.map((item, i, array) => (
						<tr
							key={Math.random()}
							style={{ height: "30px" }}
							onClick={e => {
								e.stopPropagation()
								getOrderData(item.order_uuid)
							}}>
							<td>{i + 1}</td>

							<td colSpan={3}>{item.counter_title || ""}</td>
							<td colSpan={2}>{item.amt || ""}</td>
							<td colSpan={2}>N{item.invoice_number || ""}</td>

							<td colSpan={2}>
								{new Date(item.order_date).toDateString()} -
								{formatAMPM(new Date(item.order_date)) || ""}
							</td>
							<td colSpan={2}>
								{new Date(item.payment_date).toDateString()} -
								{formatAMPM(new Date(item.payment_date)) || ""}
							</td>
							<td colSpan={3}>{item.user_title || ""}</td>
							<td colSpan={3}>{item.mode_title || ""}</td>
							<td
								style={{ color: "green" }}
								onClick={e => {
									e.stopPropagation()
									sendMessage(item)
								}}>
								<WhatsApp />
							</td>
							<td colSpan={2}>
								<button
									type="button"
									className="theme-btn"
									onClick={e => {
										e.stopPropagation()
										setRemarksPoup(item)
									}}>
									Remarks
								</button>
							</td>
							<td colSpan={2}>
								{loading?.order_uuid === item.order_uuid && loading?.mode_uuid === item?.mode_uuid ? (
									<button className="theme-btn" id="loading-screen">
										<svg viewBox="0 0 100 100">
											<path
												d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50"
												fill="#ffffff"
												stroke="none">
												<animateTransform
													attributeName="transform"
													type="rotate"
													dur="1s"
													repeatCount="indefinite"
													keyTimes="0;1"
													values="0 50 51;360 50 51"></animateTransform>
											</path>
										</svg>
									</button>
								) : (
									<button
										type="button"
										className="theme-btn"
										onClick={e => {
											e.stopPropagation()
											setLoading({
												order_uuid: item.order_uuid,
												mode_uuid: item.mode_uuid,
											})
											putActivityData(item.order_uuid, item.mode_uuid, item.invoice_number)
										}}>
										Complete
									</button>
								)}
							</td>
						</tr>
					))}
			</tbody>
		</table>
	)
}
function NotesPopup({ onSave, setItems, notesPopup }) {
	const [notes, setNotes] = useState([])
	const [edit, setEdit] = useState(false)

	useEffect(() => {
		console.log(notesPopup?.remarks)
		setNotes(notesPopup?.remarks || [])
	}, [notesPopup])
	const submitHandler = async () => {
		const response = await axios({
			method: "put",
			url: "/receipts/putRemarks",
			data: {
				remarks: notes,
				invoice_number: notesPopup.invoice_number,
				mode_uuid: notesPopup.mode_uuid,
			},
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			onSave()
		}
	}
	return (
		<>
			<div className="overlay" style={{ zIndex: 9999999999 }}>
				<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
					<div className="flex" style={{ justifyContent: "space-between" }}>
						<h3>Please Enter Remarks</h3>
					</div>
					<div
						className="content"
						style={{
							height: "fit-content",
							padding: "10px",
							width: "fit-content",
						}}>
						<div style={{ overflowY: "scroll" }}>
							<form className="form">
								<div className="formGroup">
									<div className="row" style={{ flexDirection: "row", alignItems: "start" }}>
										<div style={{ width: "50px" }}>Remarks</div>
										<label className="selectLabel flex" style={{ width: "200px" }}>
											<textarea
												name="route_title"
												className="numberInput"
												style={{ width: "200px", height: "200px" }}
												value={notes?.toString()?.replace(/,/g, "\n")}
												onChange={e => {
													setNotes(e.target.value.split("\n"))
													setEdit(true)
												}}
											/>
										</label>
									</div>
								</div>

								<div className="flex" style={{ justifyContent: "space-between" }}>
									<button onClick={onSave} className="closeButton">
										x
									</button>
									{edit ? (
										<button type="button" className="submit" onClick={submitHandler}>
											Save
										</button>
									) : (
										""
									)}
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
