import axios from "axios"
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useReactToPrint } from "react-to-print"
import PopupTripOrderTable from "../../components/PopupTripOrderTable"
import TripPage from "../../components/TripPage"
import { Add, ArrowDropDown } from "@mui/icons-material"
import Select from "react-select"
export default function CollectionTag({ setIsItemAvilableOpen }) {
	const [itemsData, setItemsData] = useState([])
	const [popup, setPopup] = useState(null)
	const [users, setUsers] = useState([])
	const [btn, setBtn] = useState(false)
	const [itemFilter, setItemFilter] = useState("")
	const [statementcollection_tag_uuid, setStatementcollection_tag_uuid] = useState()
	const [statementTrip, setStatementTrip] = useState()
	const [detailsPopup, setDetailsPopup] = useState(false)
	const [warehousePopup, setWarehousePopup] = useState(false)
	const componentRef = useRef(null)
	const [assignTagPopup, setAssignTagPopup] = useState(false)
	const reactToPrintContent = useCallback(() => {
		return componentRef.current
	}, [])

	const handlePrint = useReactToPrint({
		content: reactToPrintContent,
		documentTitle: "Statement",
		removeAfterPrint: true,
	})

	function formatAMPM(date) {
		var hours = date.getHours()
		var minutes = date.getMinutes()
		var ampm = hours >= 12 ? "pm" : "am"
		hours = hours % 12
		hours = hours ? hours : 12 // the hour '0' should be '12'
		minutes = minutes < 10 ? "0" + minutes : minutes
		var strTime = date.toDateString() + " - " + hours + ":" + minutes + " " + ampm
		return strTime
	}
	const getUsers = async () => {
		const response = await axios({
			method: "get",
			url: "/users/GetUserList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		console.log("users", response)
		if (response.data.success)
			setUsers(
				response.data.result
					.filter(a => a.status && +a.user_type)
					.sort((a, b) => a.user_title?.localeCompare(b.user_title))
			)
	}
	const getTripData = async () => {
		const response = await axios({
			method: "get",
			url: "/collectionTags/getTag",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			setItemsData(response.data.result)
		}
	}
	const tripDataList = useMemo(
		() =>
			itemsData.map(b => ({
				...b,

				users_name:
					b?.assigned_to
						?.filter(a => a)
						.map(a => {
							let data = users.find(c => a === c.user_uuid)?.user_title

							return data ? data : ""
						}) || [],
			})),
		[itemsData, users]
	)
	const getTripDetails = async () => {
		const response = await axios({
			method: "get",
			url: "/collectionTags/GetTagSummaryDetails/" + statementcollection_tag_uuid,

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			console.log(response)
			setStatementTrip(response.data.result)
			setStatementcollection_tag_uuid(false)
			setTimeout(handlePrint, 2000)
		}
	}
	useEffect(() => {
		if (statementcollection_tag_uuid) {
			getTripDetails()
		}
	}, [statementcollection_tag_uuid])
	useEffect(() => {
		getTripData()
	}, [btn, warehousePopup, users])
	useEffect(() => {
		getUsers()
	}, [])
	const completeFunction = async (data, complete) => {
		if (data?.outstandings?.length && complete) {
			setAssignTagPopup(data)
			return
		}
		const response = await axios({
			method: "put",
			url: "/collectionTags/putTags",
			data,
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			setBtn(prev => !prev)
		}
	}
	console.log(statementTrip)
	return (
		<>
			<div className="itemavilablelity">
				<div className="itemavilabelitycontainer" style={{ position: "relative" }}>
					<div className="itemavilablelity_header">
						<h2>Collection Tags</h2>
					</div>

					<div className="availablecontainer">
						<div className="itemavilablelitybox">
							<input
								className="numberInput"
								type="text"
								name="item_filter"
								value={itemFilter}
								onChange={e => {
									setItemFilter(e.target.value)
								}}
								placeholder="Items Filter"
								style={{ width: "200px", margin: "10px 0" }}
							/>
							<div className="items_table">
								<table className="f6 w-100 center" cellSpacing="0">
									<thead className="lh-copy">
										<tr className="white">
											<th
												className="pa3 bb b--black-20 "
												style={{ borderBottom: "2px solid rgb(189, 189, 189)" }}>
												Created At
											</th>
											<th
												className="pa3 bb b--black-20 "
												style={{ borderBottom: "2px solid rgb(189, 189, 189)" }}>
												Title
											</th>
											<th
												className="pa3 bb b--black-20 "
												style={{ borderBottom: "2px solid rgb(189, 189, 189)" }}>
												Users
											</th>

											<th
												className="pa3 bb b--black-20 "
												style={{ borderBottom: "2px solid rgb(189, 189, 189)" }}>
												Order
											</th>
											<th
												className="pa3 bb b--black-20 "
												style={{ borderBottom: "2px solid rgb(189, 189, 189)" }}>
												Action
											</th>
										</tr>
									</thead>
									<tbody className="lh-copy">
										{tripDataList

											.filter(
												a =>
													(itemFilter !== ""
														? a.collection_tag_title
																.toLowerCase()
																.includes(itemFilter.toLowerCase())
														: true) && a.collection_tag_title
											)
											.map((item, index) => (
												<tr
													key={index}
													style={{
														borderBottom: "2px solid rgb(189, 189, 189)",
														height: "50px",
													}}>
													<td
														className="ph3 bb b--black-20 tc bg-white"
														style={{ textAlign: "center" }}>
														{new Date(item.created_at).toDateString()}
													</td>
													<td
														className="ph3 bb b--black-20 tc bg-white"
														style={{ textAlign: "center" }}>
														{item.collection_tag_title}
													</td>
													<td
														className="ph3 bb b--black-20 tc bg-white"
														style={{ textAlign: "center" }}>
														{item?.users_name?.length
															? item.users_name.map((a, i) => (i === 0 ? a : ", " + a))
															: ""}
													</td>

													<td
														className="ph3 bb b--black-20 tc bg-white"
														style={{ textAlign: "center" }}>
														{item.orderLength}
													</td>
													<td
														className="ph3 bb b--black-20 tc bg-white"
														style={{
															textAlign: "center",
															position: "relative",
														}}>
														<div
															id="customer-dropdown-trigger"
															className={"active"}
															style={{
																transform: item.dropdown
																	? "rotate(0deg)"
																	: "rotate(180deg)",
																width: "30px",
																height: "30px",
																backgroundColor: "#000",
																color: "#fff",
															}}
															onClick={e => {
																setItemsData(prev =>
																	prev.map(a =>
																		a.collection_tag_uuid ===
																		item.collection_tag_uuid
																			? { ...a, dropdown: !a.dropdown }
																			: { ...a, dropdown: false }
																	)
																)
															}}>
															<ArrowDropDown />
														</div>
														{item.dropdown ? (
															<div
																id="customer-details-dropdown"
																className={"page1 flex"}
																style={{
																	top: "-0px",
																	flexDirection: "column",
																	left: "-200px",
																	zIndex: "200",
																	width: "200px",
																	height: "max-content",
																	justifyContent: "space-between",
																}}
																onMouseLeave={() =>
																	setItemsData(prev =>
																		prev.map(a =>
																			a.collection_tag_uuid ===
																			item.collection_tag_uuid
																				? { ...a, dropdown: false }
																				: a
																		)
																	)
																}>
																{/* <button
                                  className="theme-btn"
                                  style={{
                                    display: "inline",
                                    cursor: "pointer",
                                    width: "100%",
                                  }}
                                  type="button"
                                  onClick={() => {
                                    setWarehousePopup(item);
                                  }}
                                >
                                  Warehouse
                                </button> */}
																<button
																	className="theme-btn"
																	style={{
																		display: "inline",
																		cursor: "pointer",
																		width: "100%",
																	}}
																	type="button"
																	onClick={() => {
																		completeFunction({ ...item, status: 0 }, true)
																	}}
																	//   disabled={item?.orderLength}
																>
																	{item?.outstandings?.length
																		? "Change Tag"
																		: "Complete"}
																</button>

																<button
																	className="theme-btn"
																	style={{
																		display: "inline",
																		cursor: "pointer",
																		width: "100%",
																	}}
																	type="button"
																	onClick={() => {
																		setStatementcollection_tag_uuid(
																			item.collection_tag_uuid
																		)
																	}}>
																	Statement
																</button>

																<button
																	className="theme-btn"
																	style={{
																		display: "inline",
																		width: "100%",
																	}}
																	type="button"
																	onClick={() => {
																		setPopup(item)
																	}}>
																	Users
																</button>

																{/* <button
                                  className="theme-btn"
                                  style={{
                                    display: "inline",
                                    width: "100%",
                                  }}
                                  type="button"
                                  onClick={() => {
                                    setDetailsPopup(item.collection_tag_uuid);
                                  }}
                                >
                                  Details
                                </button> */}
															</div>
														) : (
															""
														)}
													</td>
												</tr>
											))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
					<button
						onClick={() => {
							setIsItemAvilableOpen(false)
						}}
						className="closeButton">
						x
					</button>

					<div
						onClick={() => {
							setIsItemAvilableOpen(false)
						}}>
						<button className="savebtn">Done</button>
					</div>
				</div>
			</div>
			{popup ? (
				<NewUserForm
					onSave={() => setPopup(false)}
					popupInfo={popup}
					users={users}
					completeFunction={completeFunction}
				/>
			) : (
				""
			)}
			{warehousePopup ? <WarehousePopup onSave={() => setWarehousePopup(false)} tripData={warehousePopup} /> : ""}
			{detailsPopup ? (
				<PopupTripOrderTable collection_tag_uuid={detailsPopup} onSave={() => setDetailsPopup("")} />
			) : (
				""
			)}
			{statementTrip?.collection_tag_uuid ? (
				<div style={{ position: "fixed", top: -100, left: -180, zIndex: "-1000" }}>
					<div
						ref={componentRef}
						style={{
							width: "21cm",
							height: "29.7cm",

							textAlign: "center",

							// padding: "100px",
							pageBreakInside: "auto",
						}}>
						<TagPage
							collection_tag_title={statementTrip?.collection_tag_title || ""}
							users={statementTrip?.assigned_to.map(a => users.find(b => b.user_uuid === a)) || []}
							collection_tag_uuid={statementTrip?.collection_tag_uuid || ""}
							created_at={formatAMPM(new Date(statementTrip?.created_at || ""))}
							amt={statementTrip?.amt || 0}
							coin={statementTrip?.coin || 0}
							cash={statementTrip?.cash || 0}
							formatAMPM={formatAMPM}
							cheque={statementTrip?.cheque}
							replacement={statementTrip?.replacement}
							sales_return={statementTrip?.sales_return}
							unpaid_invoice={statementTrip?.unpaid_invoice}
							receipts={statementTrip?.receipts}
						/>
					</div>
				</div>
			) : (
				""
			)}
			{assignTagPopup ? (
				<AssignTagPopup
					onSave={() => {
						getTripData()

						setAssignTagPopup(false)
					}}
					selectedOrders={assignTagPopup.outstandings}
				/>
			) : (
				""
			)}
		</>
	)
}
function NewUserForm({ onSave, popupInfo, users, completeFunction }) {
	const [data, setdata] = useState([])
	console.log(data)
	useEffect(() => {
		setdata(popupInfo?.assigned_to.filter(a => a) || [])
	}, [popupInfo?.assigned_to])

	const submitHandler = async e => {
		e.preventDefault()
		completeFunction({ ...popupInfo, assigned_to: data })
		onSave()
	}

	return (
		<div className="overlay" style={{ zIndex: "999999" }}>
			<div className="modal" style={{ height: "fit-content", width: "fit-content" }}>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content",
					}}>
					<div style={{ overflowY: "scroll" }}>
						<form className="form" onSubmit={submitHandler}>
							<div className="row">
								<h1>{popupInfo.type === "edit" ? "Edit" : "Add"} Counter </h1>
							</div>

							<div className="form">
								<div className="row">
									<label className="selectLabel">
										Users
										<div className="formGroup" style={{ height: "200px", overflow: "scroll" }}>
											{users.map(occ => (
												<div
													style={{
														marginBottom: "5px",
														textAlign: "center",
														backgroundColor: data?.filter(a => a === occ.user_uuid).length
															? "#caf0f8"
															: "#fff",
													}}
													onClick={e => {
														e.stopPropagation()
														setdata(prev =>
															prev?.find(a => a === occ.user_uuid)
																? prev.filter(a => a !== occ.user_uuid)
																: [...prev, occ?.user_uuid]
														)
													}}>
													{occ.user_title}
												</div>
											))}
										</div>
									</label>
								</div>
							</div>

							<button type="submit" className="submit">
								Save changes
							</button>
						</form>
					</div>
					<button onClick={onSave} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}
function WarehousePopup({ onSave, tripData }) {
	const [data, setdata] = useState([])
	const [warehouse, setWarehouse] = useState([])
	const getItemsData = async () => {
		const response = await axios({
			method: "get",
			url: "/warehouse/GetWarehouseList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setWarehouse(response.data.result)
	}
	useEffect(() => {
		setdata(tripData)
		getItemsData()
	}, [tripData])

	const submitHandler = async e => {
		e.preventDefault()
		const response = await axios({
			method: "put",
			url: "/collectionTags/putTags",
			data,
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			onSave()
		}
	}

	return (
		<div className="overlay" style={{ zIndex: "999999" }}>
			<div className="modal" style={{ height: "fit-content", width: "fit-content" }}>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content",
					}}>
					<div style={{ overflowY: "scroll" }}>
						<form className="form" onSubmit={submitHandler}>
							<div className="row">
								<h1>Warehouse </h1>
							</div>

							<div className="form">
								<div className="row">
									<label className="selectLabel">
										Warehouse
										<div className="inputGroup" style={{ width: "500px" }}>
											<Select
												options={warehouse.map(a => ({
													value: a.warehouse_uuid,
													label: a.warehouse_title,
												}))}
												onChange={doc =>
													setdata(prev => ({
														...prev,
														warehouse_uuid: doc.value,
													}))
												}
												value={
													data?.warehouse_uuid
														? {
																value: data?.counter_uuid,
																label: warehouse?.find(
																	j => j.warehouse_uuid === data.warehouse_uuid
																)?.warehouse_title,
														  }
														: ""
												}
												autoFocus={!data?.counter_uuid}
												openMenuOnFocus={true}
												menuPosition="fixed"
												menuPlacement="auto"
												placeholder="Select"
											/>
										</div>
									</label>
								</div>
							</div>

							<button type="submit" className="submit">
								Save changes
							</button>
						</form>
					</div>
					<button onClick={onSave} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}
function AssignTagPopup({ onSave, selectedOrders }) {
	const [error, setError] = useState("")
	const [tagPopup, setTagPopup] = useState(false)
	const [waiting, setWaiting] = useState(false)
	const [tags, setTags] = useState([])

	// const [coinPopup, setCoinPopup] = useState(false);
	const [data, setData] = useState("")
	const getUsers = async () => {
		let response = await axios({
			method: "get",
			url: "/collectionTags/getActiveTag",
			data,
			headers: {
				"Content-Type": "application/json",
			},
		})
		console.log("users", response)
		if (response.data.success) setTags(response.data.result)
	}

	useEffect(() => {
		getUsers()
	}, [])
	const submitHandler = async () => {
		setWaiting(true)

		let response = await axios({
			method: "put",
			url: "/receipts/putReciptTag",
			data: {
				selectedOrders: selectedOrders.map(a => a.outstanding_uuid),
				collection_tag_uuid: data,
			},
			headers: {
				"Content-Type": "application/json",
			},
		})

		if (response.data.success) {
			onSave()
		}

		setWaiting(false)
	}

	return (
		<>
			<div className="overlay" style={{ zIndex: 9999999999 }}>
				<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
					<div className="flex" style={{ justifyContent: "space-between" }}>
						<h3>Change Tag</h3>
						<span style={{ cursor: "pointer" }} onClick={() => setTagPopup(true)}>
							<Add />
						</span>
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
									<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
										<label className="selectLabel">
											Collection Tags
											<select
												className="numberInput"
												value={data}
												onChange={e => setData(e.target.value)}>
												{/* <option selected={occasionsTemp.length===occasionsData.length} value="all">All</option> */}

												<option value={0}>None</option>
												{tags.map(a => (
													<option value={a.collection_tag_uuid}>
														{a.collection_tag_title}
													</option>
												))}
											</select>
										</label>
									</div>
									<i style={{ color: "red" }}>{error}</i>
								</div>

								<div className="flex" style={{ justifyContent: "space-between" }}>
									<button
										type="button"
										style={{ backgroundColor: "red" }}
										className="submit"
										onClick={onSave}>
										Cancel
									</button>
									<button type="button" className="submit" onClick={submitHandler}>
										Save
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
			{waiting ? (
				<div className="overlay" style={{ zIndex: "999999999999999999" }}>
					<div className="flex" style={{ width: "40px", height: "40px" }}>
						<svg viewBox="0 0 100 100">
							<path d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50" fill="#ffffff" stroke="none">
								<animateTransform
									attributeName="transform"
									type="rotate"
									dur="1s"
									repeatCount="indefinite"
									keyTimes="0;1"
									values="0 50 51;360 50 51"></animateTransform>
							</path>
						</svg>
					</div>
				</div>
			) : (
				""
			)}
			{tagPopup ? (
				<TagPopup
					onSave={() => {
						setTagPopup(false)
						getUsers()
					}}
				/>
			) : (
				""
			)}
		</>
	)
}
function TagPopup({ onSave }) {
	const [error, setError] = useState("")
	const [users, setUsers] = useState([])
	const [waiting, setWaiting] = useState(false)

	// const [coinPopup, setCoinPopup] = useState(false);
	const [data, setData] = useState({
		collection_tag_title: "",
		assigned_to: [],
	})

	const submitHandler = async () => {
		setWaiting(true)

		let response = await axios({
			method: "post",
			url: "/collectionTags/postTag",
			data,
			headers: {
				"Content-Type": "application/json",
			},
		})

		if (response.data.success) {
			onSave()
		}

		setWaiting(false)
	}
	const getUsers = async () => {
		const response = await axios({
			method: "get",
			url: "/users/GetUserList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		console.log("users", response)
		if (response.data.success) setUsers(response.data.result)
	}

	useEffect(() => {
		getUsers()
	}, [])
	return (
		<>
			<div className="overlay" style={{ zIndex: 9999999999 }}>
				<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
					<div className="flex" style={{ justifyContent: "space-between" }}>
						<h3>New Tag</h3>
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
									<div className="row">
										<label className="selectLabel">
											Title
											<input
												type="text"
												name="route_title"
												className="numberInput"
												value={data?.collection_tag_title}
												onChange={e =>
													setData({
														...data,
														collection_tag_title: e.target.value,
													})
												}
												maxLength={42}
											/>
										</label>
									</div>
									<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
										<label className="selectLabel" style={{ width: "100%" }}>
											Assigned to
											<div className="formGroup" style={{ height: "200px", overflow: "scroll" }}>
												<div
													style={{
														marginBottom: "5px",
														textAlign: "center",
														backgroundColor: data.assigned_to?.filter(a => a === "none")
															.length
															? "#caf0f8"
															: "#fff",
													}}
													onClick={e => {
														e.stopPropagation()
														setData(prev => ({
															...prev,
															assigned_to: prev?.assigned_to?.find(a => a === "none")
																? prev?.assigned_to?.filter(a => a !== "none")
																: prev?.assigned_to?.length &&
																  !prev.assigned_to.filter(a => +a === 1).length
																? [...prev?.assigned_to, "none"]
																: ["none"],
														}))
													}}>
													None
												</div>
												<div
													style={{
														marginBottom: "5px",
														textAlign: "center",
														backgroundColor: data.assigned_to?.filter(a => +a === 1).length
															? "#caf0f8"
															: "#fff",
													}}
													onClick={e => {
														e.stopPropagation()
														setData(prev => ({
															...prev,
															assigned_to: [1],
														}))
													}}>
													All
												</div>
												{users.map(occ => (
													<div
														style={{
															marginBottom: "5px",
															textAlign: "center",
															backgroundColor: data.assigned_to?.filter(
																a => a === occ.user_uuid
															).length
																? "#caf0f8"
																: "#fff",
														}}
														onClick={e => {
															e.stopPropagation()
															setData(prev => ({
																...prev,
																assigned_to: prev?.assigned_to?.find(
																	a => a === occ.user_uuid
																)
																	? prev?.assigned_to?.filter(
																			a => a !== occ.user_uuid
																	  )
																	: prev?.assigned_to?.length &&
																	  !prev.assigned_to.filter(a => +a === 1).length
																	? [...prev?.assigned_to, occ?.user_uuid]
																	: [occ?.user_uuid],
															}))
														}}>
														{occ.user_title}
													</div>
												))}
											</div>
										</label>
									</div>
									<i style={{ color: "red" }}>{error}</i>
								</div>

								<div className="flex" style={{ justifyContent: "space-between" }}>
									<button
										type="button"
										style={{ backgroundColor: "red" }}
										className="submit"
										onClick={onSave}>
										Cancel
									</button>
									<button type="button" className="submit" onClick={submitHandler}>
										Save
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
			{waiting ? (
				<div className="overlay" style={{ zIndex: "999999999999999999" }}>
					<div className="flex" style={{ width: "40px", height: "40px" }}>
						<svg viewBox="0 0 100 100">
							<path d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50" fill="#ffffff" stroke="none">
								<animateTransform
									attributeName="transform"
									type="rotate"
									dur="1s"
									repeatCount="indefinite"
									keyTimes="0;1"
									values="0 50 51;360 50 51"></animateTransform>
							</path>
						</svg>
					</div>
				</div>
			) : (
				""
			)}
		</>
	)
}
const TagPage = ({
	collection_tag_title,
	users,
	collection_tag_uuid,
	created_at,

	formatAMPM,

	receipts,
}) => {
	if (!collection_tag_title) return <div />
	return (
		<>
			<table style={{ width: "100%", margin: "10px" }}>
				<tr style={{ width: "100%" }}>
					<td
						colSpan={2}
						style={{
							width: "100%",
							fontSize: "xx-large",
							fontWeight: "bolder",
						}}>
						{collection_tag_title}
					</td>
				</tr>
				<tr>
					<td
						colSpan={2}
						style={{
							fontWeight: "600",
							fontSize: "larger",
						}}>
						{users.filter(a => a).map((a, i) => (i === 0 ? a?.user_title : ", " + a?.user_title))}
					</td>{" "}
				</tr>
				<tr>
					<td style={{ fontWeight: "600", fontSize: "small", textAlign: "left" }}></td>
					<td></td>
				</tr>
				<tr>
					<td style={{ fontWeight: "600", fontSize: "small", textAlign: "left" }}>
						Tag UUID : {collection_tag_uuid}
					</td>
					<td></td>
				</tr>
				<tr>
					<td style={{ fontWeight: "600", fontSize: "small", textAlign: "left" }}>
						Tag Created At : {created_at}
					</td>
					<td></td>
				</tr>
				<tr>
					<td style={{ fontWeight: "600", fontSize: "small", textAlign: "left" }}>
						Statement Printed At : {formatAMPM(new Date())}
					</td>
					<td></td>
				</tr>
			</table>

			{receipts?.length ? (
				<table style={{ margin: "10px", width: "100%" }}>
					<tr>
						<td
							style={{
								fontWeight: "600",
								fontSize: "small",
								textAlign: "left",
							}}>
							Receipts Details
						</td>
					</tr>
					<tr>
						<th style={{ border: "1px solid #000" }}>Rpt. No.</th>
						<th style={{ border: "1px solid #000" }}>Counter</th>
						<th style={{ border: "1px solid #000" }}>Inv. No.</th>
						<th style={{ border: "1px solid #000" }}>Time</th>
						<th style={{ border: "1px solid #000", width: "100px" }}>Cash</th>
						<th style={{ border: "1px solid #000", width: "100px" }}>Cheque</th>
						<th style={{ border: "1px solid #000", width: "100px" }}>UPI</th>
					</tr>
					{receipts.map(item => (
						<tr>
							<td style={{ border: "1px solid #000" }}>{item.receipt_number}</td>
							<td style={{ border: "1px solid #000" }}>{item.counter_title}</td>
							<td style={{ border: "1px solid #000" }}>{item.invoice_number}</td>
							<td style={{ border: "1px solid #000" }}>{formatAMPM(new Date(item.time))}</td>
							<td style={{ border: "1px solid #000" }}>{item.cash}</td>
							<td style={{ border: "1px solid #000" }}>{item.cheque}</td>
							<td style={{ border: "1px solid #000" }}>{item.upi}</td>
						</tr>
					))}
					<tr style={{ fontWeight: "bolder" }}>
						<td style={{ border: "1px solid #000" }}>Total</td>
						<td style={{ border: "1px solid #000" }}></td>
						<td style={{ border: "1px solid #000" }}></td>
						<td style={{ border: "1px solid #000" }}></td>
						<td style={{ border: "1px solid #000" }}>
							{receipts?.length > 1
								? receipts.map(a => a.cash || 0).reduce((a, b) => a + b)
								: receipts[0]?.cash || 0}
						</td>
						<td style={{ border: "1px solid #000" }}>
							{receipts?.length > 1
								? receipts.map(a => a.cheque || 0).reduce((a, b) => a + b)
								: receipts[0]?.cheque || 0}
						</td>
						<td style={{ border: "1px solid #000" }}>
							{receipts?.length > 1
								? receipts.map(a => a.upi || 0).reduce((a, b) => a + b)
								: receipts[0]?.upi || 0}
						</td>
					</tr>
				</table>
			) : (
				""
			)}
		</>
	)
}
