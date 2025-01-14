import React, { useState, useEffect, useMemo, useRef } from "react"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"
import { ChevronUpIcon, ChevronDownIcon, MenuAlt2Icon } from "@heroicons/react/solid"
import { v4 as uuid } from "uuid"
import axios from "axios"
import { Add, Delete, DeleteOutline } from "@mui/icons-material"
import { Switch } from "@mui/material"
import { green } from "@mui/material/colors"
import { alpha, styled } from "@mui/material/styles"
import { server } from "../../App"
import noimg from "../../assets/noimg.jpg"
import { IoIosCloseCircle } from "react-icons/io"
import { useContext } from "react"
import Context from "../../context/context"

const GreenSwitch = styled(Switch)(({ theme }) => ({
	"& .MuiSwitch-switchBase.Mui-checked": {
		"color": green[500],
		"&:hover": {
			backgroundColor: alpha(green[500], theme.palette.action.hoverOpacity)
		}
	},
	"& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
		backgroundColor: green[500]
	}
}))
const WhatsAppNotifications = () => {
	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading">
					<h2 style={{ width: "100%" }}>WhatsApp Notifications</h2>
				</div>
				<Incetives />
			</div>
		</>
	)
}
const Incetives = () => {
	const [popupForm, setPopupForm] = useState(false)
	const [itemsData, setItemsData] = useState([])
	const [deletePopup, setDeletePopup] = useState(false)
	const getItemsData = async () => {
		const response = await axios({
			method: "get",
			url: "/whatsapp_notifications/getWhatsapp_notifications",

			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setItemsData(response.data.result)
	}
	useEffect(() => {
		getItemsData()
	}, [popupForm])
	const DeleteAutoAdd = async data => {
		const response = await axios({
			method: "delete",
			url: "/whatsapp_notifications/DeleteWhatsapp_notifications",
			data,
			headers: {
				"Content-Type": "application/json"
			}
		})
		
		if (response.data.success) {
			setDeletePopup(false)
			getItemsData()
		}
	}
	return (
		<>
			<div id="item-sales-top">
				<div
					id="date-input-container"
					style={{
						overflow: "visible",
						display: "flex",
						alignItems: "center",
						justifyContent: "flex-end",
						width: "100%"
					}}
				>
					<button className="theme-btn" onClick={() => setPopupForm(true)}>
						Add
					</button>
				</div>
			</div>
			<div className="table-container-user item-sales-container">
				<Table itemsDetails={itemsData} setPopupForm={setPopupForm} setDeletePopup={setDeletePopup} getItemsData={getItemsData} />
			</div>

			{popupForm ? <IncentivePopup onSave={() => setPopupForm(false)} popupForm={popupForm} /> : ""}
			{deletePopup ? (
				<div className="overlay">
					<div className="modal" style={{ height: "fit-content", width: "fit-content" }}>
						<div
							className="content"
							style={{
								height: "fit-content",
								paddingTop: "40px",
								width: "fit-content"
							}}
						>
							<div style={{ overflowY: "scroll" }}>Sure You Want to Delete</div>

							<div
								style={{
									width: "100%",
									display: "flex",
									alignItems: "center",
									justifyContent: "center"
								}}
							>
								<button className="fieldEditButton" onClick={() => DeleteAutoAdd(deletePopup)}>
									Confirm
								</button>
							</div>

							<button onClick={() => setDeletePopup(false)} className="closeButton">
								x
							</button>
						</div>
					</div>
				</div>
			) : (
				""
			)}
		</>
	)
}

export default WhatsAppNotifications

function Table({ itemsDetails = [], setPopupForm, setDeletePopup, getItemsData }) {
	const context = useContext(Context)
	const { PAYMENT_REMINDER_NOTIFICATION, sendPaymentReminders } = context

	const [items, setItems] = useState("incentive_title")
	const [order, setOrder] = useState("asc")
	const updateStatus = async data => {
		const response = await axios({
			method: "put",
			url: "/whatsapp_notifications/UpdateWhatsapp_notifications",
			data,
			headers: {
				"Content-Type": "application/json"
			}
		})
		
		if (response.data.success) {
			getItemsData()
		}
	}

	const [counterListState, setCounterListState] = useState()

	const getPendingPaymentCounters = async () => {
		const response = await axios("/whatsapp_notifications/pending_payments_counters/" + localStorage.getItem("user_uuid"))
		if (response?.data?.length)
			setCounterListState({
				active: true,
				counters: response?.data?.sort((a, b) => a.counter_title.localeCompare(b.counter_title))
			})
	}

	return (
		<>
			<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
				<thead>
					<tr>
						<th>S.N</th>
						<th colSpan={4}>Notification Title</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody className="tbody">
					{itemsDetails
						?.filter(a => a.type)
						.sort((a, b) =>
							order === "asc"
								? typeof a[items] === "string"
									? a[items].localeCompare(b[items])
									: a[items] - b[items]
								: typeof a[items] === "string"
								? b[items].localeCompare(a[items])
								: b[items] - a[items]
						)
						?.map((item, i) => (
							<tr key={item.item_uuid} style={{ height: "30px" }}>
								<td>{i + 1}</td>
								<td
									colSpan={4}
									onClick={e => {
										e.stopPropagation()
										setPopupForm({ type: "edit", data: item })
									}}
								>
									{item.type}
								</td>
								<td>
									<div style={{ display: "flex", justifyContent: "center" }}>
										<GreenSwitch
											checked={item?.status}
											onChange={e => {
												e.stopPropagation()
												updateStatus({ ...item, status: item.status ? 0 : 1 })
											}}
										/>
									</div>
								</td>
								<td>
									<div style={{ display: "flex", justifyContent: "flex-end" }}>
										{item?.notification_uuid === PAYMENT_REMINDER_NOTIFICATION ? (
											<button className="theme-btn" onClick={getPendingPaymentCounters}>
												Shoot Now
											</button>
										) : (
											""
										)}
									</div>
								</td>
							</tr>
						))}
				</tbody>
			</table>

			{counterListState?.active && (
				<CounterSelection
					close={() => setCounterListState(null)}
					onclick={sendPaymentReminders}
					counters={counterListState?.counters}
				/>
			)}
		</>
	)
}

const CounterSelection = ({ counters, onclick, close }) => {
	const [selection, setSelection] = useState(counters?.map(i => i.counter_uuid))
	const [search, setSearch] = useState("")

	return (
		<div className="overlay">
			<div id="counters-list">
				<h2>Counters</h2>
				<span id="close" onClick={close}>
					<IoIosCloseCircle />
				</span>
				<div>
					<input type="text" value={search} placeholder="Search" onChange={e => setSearch(e.target.value)} />
					<div className="list">
						<div>
							<input
								id="all-counteres"
								type="checkbox"
								checked={selection?.length === counters?.length}
								onChange={() => setSelection(selection?.length === counters?.length ? [] : counters.map(_i => _i?.counter_uuid))}
							/>
							<label htmlFor="all-counteres">Counter Title</label>
						</div>
						<hr />
						{counters
							?.filter(i => i?.counter_title?.toLowerCase()?.includes(search?.toLowerCase()))
							?.map(i => (
								<div key={i?.counter_uuid}>
									<input
										type="checkbox"
										id={i?.counter_uuid}
										checked={selection?.includes(i?.counter_uuid)}
										onChange={e =>
											setSelection(state =>
												state
													.filter(_i => _i !== i?.counter_uuid)
													.concat(state?.includes(i?.counter_uuid) ? [] : [i?.counter_uuid])
											)
										}
									/>
									<label htmlFor={i?.counter_uuid}>{i?.counter_title}</label>
								</div>
							))}
					</div>

					<button className="theme-btn" onClick={() => onclick(selection)}>
						Send
					</button>
				</div>
			</div>
		</div>
	)
}

function IncentivePopup({ onSave, popupForm }) {
	const [objData, setObgData] = useState({
		type: "",
		message: []
	})
	const [active, setActive] = useState("")

	useEffect(() => {
		if (popupForm?.type === "edit") setObgData(popupForm.data)
	}, [])

	const submitHandler = async e => {
		e.preventDefault()

		let data = objData
		for (let message of data.message?.filter(a => a.img)) {
			const previousFile = message.img
			const newFile = new File([previousFile], message.uuid + ".png")
			const form = new FormData()
			form.append("file", newFile)
			await axios({
				method: "post",
				url: "/uploadImage",
				data: form,
				headers: {
					"Content-Type": "multipart/form-data"
				}
			})
		}

		if (popupForm?.type === "edit") {
			const response = await axios({
				method: "put",
				url: "/whatsapp_notifications/UpdateWhatsapp_notifications",
				data,
				headers: {
					"Content-Type": "application/json"
				}
			})
			
			if (response.data.success) {
				onSave()
			}
		} else {
			const response = await axios({
				method: "post",
				url: "/whatsapp_notifications/CreateWhatsapp_notifications",
				data,
				headers: {
					"Content-Type": "application/json"
				}
			})
			
			if (response.data.success) {
				onSave()
			}
		}
	}
	const addVariable = name => {
		let element = document.getElementById(active)
		setObgData(prev => ({
			...prev,
			message: prev.message.map(a =>
				a.uuid === active
					? {
							...a,
							text:
								(a.text || "")?.slice(0, element.selectionStart) +
								`{${name}}` +
								(a.text || "")?.slice(element.selectionStart, (a.text || "").length)
					  }
					: a
			)
		}))
	}
	return (
		<div className="overlay">
			<div className="modal" style={{ height: "fit-content", width: "fit-content" }}>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content"
					}}
				>
					<div style={{ overflowY: "scroll", maxHeight: "500px" }}>
						<table
							className="user-table whatsapp-notification-vars"
							style={{
								width: "fit-content"
							}}
						>
							<tbody>
								<tr>
									<td
										colSpan={2}
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "flex-start",
											width: "400px"
										}}
									>
										<b style={{ width: "100px" }}>Type : </b>
										<input
											onWheel={e => e.target.blur()}
											type="text"
											className="searchInput"
											style={{
												border: "none",
												borderBottom: "2px solid black",
												borderRadius: "0px"
											}}
											placeholder=""
											value={objData.type}
											onChange={e =>
												setObgData(prev => ({
													...prev,
													type: e.target.value
												}))
											}
										/>
									</td>
								</tr>
								{objData?.notification_uuid === "out-for-delivery" ||
								objData?.notification_uuid === "payment-reminder-manual" ||
								objData?.notification_uuid === "outstanding-manual-reminder" ? (
									<tr>
										<td
											colSpan={2}
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												width: "400px"
											}}
										>
											<input
												onWheel={e => e.target.blur()}
												type="checkbox"
												className="searchInput"
												style={{
													border: "none",
													borderBottom: "2px solid black",
													borderRadius: "0px",
													scale: "2"
												}}
												placeholder=""
												checked={objData.checkbox}
												onChange={e =>
													setObgData(prev => ({
														...prev,
														checkbox: e.target.checked ? 1 : 0
													}))
												}
											/>
											<b style={{ width: "300px" }}>Send invoice pdf </b>
										</td>
									</tr>
								) : (
									""
								)}
								<tr>
									<td
										colSpan={2}
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "flex-start"
										}}
									>
										<b style={{ width: "100px" }}>Message : </b>
										<span
											onClick={e => {
												
												setObgData(prev => ({
													...prev,
													message: [...(prev.message || []), { type: "text", uuid: uuid() }]
												}))
											}}
											className="fieldEditButton"
										>
											<Add />
										</span>
									</td>
								</tr>
								<div style={{ overflowY: "scroll", maxHeight: "150px" }}>
									{objData?.message
										?.filter(item => !item.delete)
										?.map((item, i) => (
											<tr key={item.uuid}>
												<td
													colSpan={2}
													style={{
														display: "flex",
														alignItems: "center",
														justifyContent: "flex-start"
													}}
												>
													{i + 1})
													<span
														onClick={() =>
															setObgData(prev => ({
																...prev,
																message: prev.message.map(a => (a.uuid === item.uuid ? { ...a, delete: true } : a))
															}))
														}
													>
														<DeleteOutline />
													</span>
													<select
														className="searchInput"
														value={item.type}
														onChange={e => {
															setObgData(prev => ({
																...prev,
																message: prev.message.map(a => (a.uuid === item.uuid ? { ...a, type: e.target.value } : a))
															}))
														}}
													>
														<option value="text">Text</option>
														<option value="img">Image</option>
													</select>
													{item?.type === "text" ? (
														<textarea
															onWheel={e => e.target.blur()}
															className="searchInput"
															style={{
																border: "none",
																borderBottom: "2px solid black",
																borderRadius: "0px",
																height: "100px"
															}}
															id={item.uuid}
															onFocus={() => {
																setActive(item.uuid)
															}}
															placeholder=""
															value={item.text}
															onChange={e => {
																setObgData(prev => ({
																	...prev,
																	message: prev.message.map(a => (a.uuid === item.uuid ? { ...a, text: e.target.value } : a))
																}))
															}}
														/>
													) : (
														<div>
															<label htmlFor={item.uuid} className="flex">
																Upload Image
																<input
																	className="searchInput"
																	type="file"
																	id={item.uuid}
																	style={{ display: "none" }}
																	onChange={e =>
																		setObgData(prev => ({
																			...prev,
																			message: prev.message.map(a =>
																				a.uuid === item.uuid ? { ...a, img: e.target.files[0] } : a
																			)
																		}))
																	}
																/>
																
																<img
																	style={{
																		width: "100px",
																		height: "100px",
																		objectFit: "contain"
																	}}
																	src={server + "/" + item.uuid + ".png"}
																	onError={({ currentTarget }) => {
																		currentTarget.onerror = null // prevents looping
																		currentTarget.src = noimg
																	}}
																	alt=""
																/>
															</label>
															<input
																type="text"
																onWheel={e => e.target.blur()}
																className="searchInput"
																style={{
																	border: "none",
																	borderBottom: "2px solid black",
																	borderRadius: "0px"
																}}
																placeholder="caption"
																value={item.caption}
																onChange={e => {
																	setObgData(prev => ({
																		...prev,
																		message: prev.message.map(a => (a.uuid === item.uuid ? { ...a, caption: e.target.value } : a))
																	}))
																}}
															/>
														</div>
													)}
												</td>
											</tr>
										))}
								</div>
								<tr>
									<td
										colSpan={2}
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "flex-start"
										}}
									>
										<button className="theme-btn" onClick={e => addVariable("counter_title")}>
											Counter Title
										</button>
										<button className="theme-btn" onClick={e => addVariable("short_link")}>
											Counter Link
										</button>
										{objData?.notification_uuid === "order_cancellation" && (
											<button className="theme-btn" onClick={e => addVariable("reason")}>
												Reason
											</button>
										)}
									</td>
								</tr>
								<tr>
									<td
										colSpan={2}
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "flex-start"
										}}
									>
										<button className="theme-btn" onClick={e => addVariable("invoice_number")}>
											Invoice Number
										</button>
										<button className="theme-btn" onClick={e => addVariable("amount")}>
											Amount
										</button>
										<button className="theme-btn" onClick={e => addVariable("details")}>
											Details
										</button>
									</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div
						style={{
							width: "100%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							position: "absolute",
							bottom: 0,
							left: 0
						}}
					>
						<button className="fieldEditButton" onClick={submitHandler}>
							{popupForm?.type === "edit" ? "Update" : "Save"}
						</button>
					</div>

					<button onClick={onSave} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}
