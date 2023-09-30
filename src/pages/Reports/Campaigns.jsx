import React, { useState, useEffect, useMemo, useContext } from "react"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid"
import { v4 as uuid } from "uuid"
import axios from "axios"
import { Add, ArrowDropDown, ArrowDropUp, CopyAll, DeleteOutline } from "@mui/icons-material"

import Context from "../../context/context"
import { server } from "../../App"
import noimg from "../../assets/noimg.jpg"

const Campaigns = () => {
	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading">
					<h2 style={{ width: "100%" }}>Campaigns</h2>
				</div>
				<CampaignBody />
			</div>
		</>
	)
}
const CampaignBody = () => {
	const [popupForm, setPopupForm] = useState(false)
	const [popupOrderForm, setPopupOrderForm] = useState(false)
	const [itemsData, setItemsData] = useState([])
	const [deletePopup, setDeletePopup] = useState(false)
	const context = useContext(Context)

	const { setNotification } = context
	const getItemsData = async () => {
		const response = await axios({
			method: "get",
			url: "/Campaigns/getCampaigns",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setItemsData(response.data.result)
	}
	useEffect(() => {
		getItemsData()
	}, [popupForm])
	const DeleteAutoAdd = async data => {
		const response = await axios({
			method: "delete",
			url: "/Campaigns/DeleteCampaigns",
			data,
			headers: {
				"Content-Type": "application/json",
			},
		})
		console.log(response)
		if (response.data.success) {
			setDeletePopup(false)
			getItemsData()
		}
	}
	const sendMsg = async data => {
		const response = await axios({
			method: "post",
			url: "/Campaigns/sendMsg",
			data,
			headers: {
				"Content-Type": "application/json",
			},
		})
		console.log(response)
		setNotification(response.data)
		setTimeout(() => setNotification(null), 5000)
		if (response.data.success) {
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
						width: "100%",
					}}>
					<button className="theme-btn" onClick={() => setPopupForm(true)}>
						Add
					</button>
				</div>
			</div>
			<div className="table-container-user item-sales-container">
				<Table
					itemsDetails={itemsData}
					setPopupForm={setPopupForm}
					setDeletePopup={setDeletePopup}
					getItemsData={getItemsData}
					sendMsg={sendMsg}
					setPopupOrderForm={setPopupOrderForm}
				/>
			</div>

			{popupForm ? <AddIncentives onSave={() => setPopupForm(false)} popupForm={popupForm} /> : ""}
			{popupOrderForm ? (
				<IncentiveOrderPopup
					onSave={() => setPopupOrderForm(false)}
					popupForm={popupOrderForm}
					sendMsg={sendMsg}
				/>
			) : (
				""
			)}
			{deletePopup ? (
				<div className="overlay">
					<div className="modal" style={{ height: "fit-content", width: "fit-content" }}>
						<div
							className="content"
							style={{
								height: "fit-content",
								paddingTop: "40px",
								width: "fit-content",
							}}>
							<div style={{ overflowY: "scroll" }}>Sure You Want to Delete</div>

							<div
								style={{
									width: "100%",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}>
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

export default Campaigns
function Table({ itemsDetails = [], setPopupForm, sendMsg, setDeletePopup, setPopupOrderForm }) {
	const [items, setItems] = useState("incentive_title")
	const [order, setOrder] = useState("asc")

	return (
		<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead>
				<tr>
					<th>S.N</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>Type</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("type")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("type")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>Campaign Title</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("campaign_title")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("campaign_title")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th>Counter</th>
					<th>Counter Groups</th>
					<th colSpan={2}></th>
				</tr>
			</thead>
			<tbody className="tbody">
				{itemsDetails
					?.filter(a => a.campaign_title)
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
						<tr
							key={item.counter_uuid}
							style={{ height: "30px" }}
							onClick={e => {
								e.stopPropagation()
								setPopupForm({ type: "edit", data: item })
							}}>
							<td>{i + 1}</td>
							<td colSpan={2}>{item.type?.toLocaleUpperCase()}</td>
							<td colSpan={2}>{item.campaign_title}</td>
							<td>
								{item.type === "general"
									? item.counters.length
									: item.counter_status?.length
									? item.counter_status?.filter(a => +a.status).length +
									  "/" +
									  item.counter_status?.length
									: 0}
							</td>
							<td>{item?.counter_groups?.length || 0}</td>
							<td>
								<button
									className="theme-btn"
									onClick={e => {
										e.stopPropagation()
										if (item.type === "order") {
											setPopupOrderForm(item)
										} else {
											sendMsg(item)
										}
									}}>
									Shoot
								</button>
							</td>
							<td
								onClick={e => {
									e.stopPropagation()

									setDeletePopup(item)
								}}>
								<DeleteOutline />
							</td>
						</tr>
					))}
			</tbody>
		</table>
	)
}

function AddIncentives({ onSave, popupForm }) {
	const [objData, setObgData] = useState({
		type: "general",
		message: [],
		created_by: localStorage.getItem("user_uuid"),
		campaign_title: "",
		counters: [],
		counter_status: [],
	})
	const [counters, setCounter] = useState([])
	const [active, setActive] = useState("")
	const [copied, setCopied] = useState("")
	const [orderForm, setOrderForm] = useState([])
	const [routesData, setRoutesData] = useState([])
	const [filterCounterTitle, setFilterCounterTitle] = useState("")
	const [filterRouteTitle, setFilterRouteTitle] = useState("")
	const getRoutesData = async () => {
		const response = await axios({
			method: "get",
			url: "/routes/GetRouteList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setRoutesData(response.data.result.map(a => ({ ...a, expand: false })))
	}
	const getCounter = async () => {
		const response = await axios({
			method: "post",
			url: "/counters/GetCounterData",
			data: ["counter_uuid", "counter_title", "status", "route_uuid"],
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setCounter(response.data.result)
	}
	const getOrderForm = async () => {
		const response = await axios({
			method: "post",
			url: "orderForm/GetFormList",
			data: ["form_uuid", "form_title"],
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setOrderForm(response.data.result)
	}

	useEffect(() => {
		getOrderForm()
		getRoutesData()
		getCounter()
		if (popupForm?.type === "edit") {
			setSelectedCounterGroups(popupForm?.data?.counter_groups)
			setObgData(popupForm.data)
		}
	}, [])

	const submitHandler = async e => {
		e.preventDefault()

		let data = objData
		data.counter_groups = await selectedCounterGroups

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
					"Content-Type": "multipart/form-data",
				},
			})
		}
		if (popupForm?.type === "edit") {
			const response = await axios({
				method: "put",
				url: "/Campaigns/UpdateCampaigns",
				data,
				headers: {
					"Content-Type": "application/json",
				},
			})
			console.log(response)
			if (response.data.success) {
				onSave()
			}
		} else {
			const response = await axios({
				method: "post",
				url: "/Campaigns/CreateCampaigns",
				data,
				headers: {
					"Content-Type": "application/json",
				},
			})
			console.log(response)
			if (response.data.success) {
				onSave()
			}
		}
	}
	const filteredCounter = useMemo(
		() =>
			counters.filter(
				a =>
					!filterCounterTitle ||
					a.counter_title?.toLocaleLowerCase()?.includes(filterCounterTitle?.toLocaleLowerCase())
			),
		[counters, filterCounterTitle]
	)
	const filterRoute = useMemo(
		() =>
			routesData
				.filter(
					a =>
						(!filterRouteTitle ||
							a.route_title?.toLocaleLowerCase()?.includes(filterRouteTitle?.toLocaleLowerCase())) &&
						a.route_uuid &&
						filteredCounter?.filter(b => a.route_uuid === b.route_uuid).length
				)

				.sort((a, b) => a?.route_title?.localeCompare(b?.route_title)),
		[filterRouteTitle, filteredCounter, routesData]
	)
	const objcounters = useMemo(() => {
		console.count("counter")
		return objData.counters
	}, [objData.counters])
	const objcounter_status = useMemo(() => {
		console.count("counter")
		return objData.counter_status
	}, [objData.counter_status])
	const addVariable = name => {
		let element = document.getElementById(active)
		console.log(element.selectionStart)
		setObgData(prev => ({
			...prev,
			message: prev.message.map(a =>
				a.uuid === active
					? {
							...a,
							text:
								(a.text || "")?.slice(0, element.selectionStart) +
								`{${name}}` +
								(a.text || "")?.slice(element.selectionStart, (a.text || "").length),
					  }
					: a
			),
		}))
	}

	const [selectedSection, setSelectedSection] = useState(0)
	const [counterGroups, setCounterGroups] = useState([])
	const [selectedCounterGroups, setSelectedCounterGroups] = useState([])
	const [counterGroupsFilter, setCounterGroupsFilter] = useState("")

	useEffect(() => {
		const getCounterGroups = async () => {
			try {
				const response = await axios({
					method: "get",
					url: "/counterGroup/GetCounterGroupList",
					headers: { "Content-Type": "application/json" },
				})

				if (response.data?.success) setCounterGroups(sortCounterGroups(response.data.result))
				console.log({ objData, cgroups: response?.data?.result })
			} catch (error) {
				console.log({ error })
			}
		}
		getCounterGroups()
	}, [])

	const sortCounterGroups = i =>
		i
			.filter(_i => !_i?.counter_group_title)
			.concat(
				i
					.filter(
						_i => _i?.counter_group_title && selectedCounterGroups.indexOf(_i?.counter_group_uuid) !== -1
					)
					.sort((a, b) => a?.counter_group_title?.localeCompare(b?.counter_group_title))
					.concat(
						i
							.filter(
								_i =>
									_i?.counter_group_title &&
									selectedCounterGroups.indexOf(_i?.counter_group_uuid) === -1
							)
							.sort((a, b) => a?.counter_group_title?.localeCompare(b?.counter_group_title))
					)
			)

	const handleGroupSelection = group =>
		setSelectedCounterGroups(_x =>
			_x.includes(group?.counter_group_uuid)
				? _x.filter(__x => __x !== group?.counter_group_uuid)
				: _x.concat([group?.counter_group_uuid])
		)

	const filteredCounterGroups = () =>
		counterGroups?.filter(
			i =>
				!counterGroupsFilter ||
				i.counter_group_title?.toLocaleLowerCase()?.includes(counterGroupsFilter?.toLocaleLowerCase())
		)

	useEffect(() => {
		if (selectedSection === 0) setCounterGroups(sortCounterGroups)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedSection])

	return (
		<div className="overlay">
			<div className="modal" style={{ height: "fit-content", width: "fit-content" }}>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content",
					}}>
					<div className="flex" style={{ justifyContent: "flex-start", alignItems: "flex-start" }}>
						<div style={{ maxHeight: "400px", overflowY: "scroll" }}>
							<table
								className="user-table"
								style={{
									width: "fit-content",
								}}>
								<tbody>
									<tr>
										<td
											colSpan={2}
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "flex-start",
												width: "400px",
											}}>
											<b style={{ width: "100px" }}>Type : </b>
											<select
												onWheel={e => e.target.blur()}
												type="text"
												className="searchInput"
												style={{
													border: "none",
													borderBottom: "2px solid black",
													borderRadius: "0px",
												}}
												placeholder=""
												value={objData.type}
												disabled={popupForm?.type === "edit"}
												onChange={e =>
													setObgData(prev => ({
														...prev,
														type: e.target.value,
														form_uuid: e.target.value === "order" ? "d" : "",
													}))
												}>
												<option value="general">General</option>
												<option value="order">Order</option>
											</select>
										</td>
									</tr>
									<tr>
										<td
											colSpan={2}
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "flex-start",
												width: "600px",
											}}>
											<b style={{ width: "100px" }}>Campaign Title : </b>
											<input
												onWheel={e => e.target.blur()}
												type="text"
												className="searchInput"
												style={{
													border: "none",
													borderBottom: "2px solid black",
													borderRadius: "0px",
												}}
												placeholder=""
												value={objData.campaign_title}
												onChange={e =>
													setObgData(prev => ({
														...prev,
														campaign_title: e.target.value,
													}))
												}
											/>
										</td>
									</tr>
									{objData.type === "general" ? (
										<>
											<tr>
												<td
													colSpan={2}
													style={{
														display: "flex",
														alignItems: "center",
														justifyContent: "flex-start",
													}}>
													<b style={{ width: "100px" }}>Message : </b>
													<span
														onClick={e => {
															console.log(objData)
															setObgData(prev => ({
																...prev,
																message: [
																	...(prev.message || []),
																	{ type: "text", uuid: uuid() },
																],
															}))
														}}
														className="fieldEditButton">
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
																	justifyContent: "flex-start",
																}}>
																{i + 1})
																<span
																	onClick={() =>
																		setObgData(prev => ({
																			...prev,
																			message: prev.message.map(a =>
																				a.uuid === item.uuid
																					? { ...a, delete: true }
																					: a
																			),
																		}))
																	}>
																	<DeleteOutline />
																</span>
																<select
																	className="searchInput"
																	value={item.type}
																	onChange={e => {
																		setObgData(prev => ({
																			...prev,
																			message: prev.message.map(a =>
																				a.uuid === item.uuid
																					? {
																							...a,
																							type: e.target.value,
																					  }
																					: a
																			),
																		}))
																	}}>
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
																			height: "100px",
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
																				message: prev.message.map(a =>
																					a.uuid === item.uuid
																						? {
																								...a,
																								text: e.target.value,
																						  }
																						: a
																				),
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
																							a.uuid === item.uuid
																								? {
																										...a,
																										img: e.target
																											.files[0],
																								  }
																								: a
																						),
																					}))
																				}
																			/>
																			<img
																				style={{
																					width: "100px",
																					height: "100px",
																					objectFit: "contain",
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
																				borderRadius: "0px",
																			}}
																			placeholder="caption"
																			value={item.caption}
																			onChange={e => {
																				setObgData(prev => ({
																					...prev,
																					message: prev.message.map(a =>
																						a.uuid === item.uuid
																							? {
																									...a,
																									caption:
																										e.target.value,
																							  }
																							: a
																					),
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
														justifyContent: "flex-start",
													}}>
													<button
														className="theme-btn"
														onClick={e => addVariable("counter_title")}>
														Counter Title
													</button>
													<button
														className="theme-btn"
														onClick={e => addVariable("short_link")}>
														Counter Link
													</button>
												</td>
											</tr>
											<tr>
												<td
													colSpan={2}
													style={{
														display: "flex",
														alignItems: "center",
														justifyContent: "flex-start",
													}}>
													<button
														className="theme-btn"
														onClick={e => addVariable("invoice_number")}>
														Invoice Number
													</button>
													<button className="theme-btn" onClick={e => addVariable("amount")}>
														Amount
													</button>
												</td>
											</tr>
											<tr>
												<td
													colSpan={2}
													style={{
														display: "flex",
														alignItems: "center",
														justifyContent: "flex-start",
													}}>
													<b style={{ width: "100px" }}>Mobile : </b>
													<textarea
														onWheel={e => e.target.blur()}
														className="searchInput"
														style={{
															border: "none",
															borderBottom: "2px solid black",
															borderRadius: "0px",
															height: "100px",
														}}
														placeholder=""
														value={objData?.mobile?.toString()?.replace(/,/g, "\n")}
														onChange={e =>
															setObgData(prev => ({
																...prev,
																mobile: e.target.value.split("\n"),
															}))
														}
													/>
												</td>
											</tr>
										</>
									) : (
										<>
											<tr>
												<td
													colSpan={2}
													style={{
														display: "flex",
														alignItems: "center",
														justifyContent: "flex-start",
														width: "400px",
													}}>
													<b style={{ width: "100px" }}>Order Form : </b>
													<select
														onWheel={e => e.target.blur()}
														type="text"
														className="searchInput"
														style={{
															border: "none",
															borderBottom: "2px solid black",
															borderRadius: "0px",
														}}
														placeholder=""
														value={objData.form_uuid}
														onChange={e =>
															setObgData(prev => ({
																...prev,

																form_uuid: e.target.value,
															}))
														}>
														<option value="d">Default</option>
														{orderForm.map(a => (
															<option value={a.form_uuid}>{a.form_title}</option>
														))}
													</select>
												</td>
											</tr>
											{objData.campaign_short_link ? (
												<tr>
													<td
														colSpan={2}
														style={{
															display: "flex",
															alignItems: "center",
															justifyContent: "flex-start",
														}}>
														<b style={{ width: "100px" }}>Campaign Short Link : </b>
														<input
															onWheel={e => e.target.blur()}
															className="searchInput"
															style={{
																border: "none",
																borderBottom: "2px solid black",
																borderRadius: "0px",
															}}
															placeholder=""
															value={"cam-" + objData?.campaign_short_link}
															disabled
														/>
														<span
															onClick={e => {
																e.stopPropagation()
																navigator.clipboard.writeText(
																	"cam-" + objData.campaign_short_link
																)
																setCopied(true)
																setTimeout(() => setCopied(""), 3000)
															}}>
															{copied ? (
																<div
																	style={{
																		// position: "absolute",
																		top: "-15px",
																		right: "10px",
																		fontSize: "10px",
																		backgroundColor: "#000",
																		color: "#fff",
																		padding: "3px",
																		borderRadius: "10px",
																		textAlign: "center",
																	}}>
																	Copied!
																</div>
															) : (
																<CopyAll />
															)}
														</span>
													</td>
												</tr>
											) : (
												""
											)}
										</>
									)}
								</tbody>
							</table>
						</div>
						<div style={{ maxHeight: "400px", overflowY: "scroll" }}>
							<div id="selection-area-switch">
								{["Counters", "Counter Groups"].map((i, idx) => (
									<button
										key={i}
										onClick={() => setSelectedSection(idx)}
										className={selectedSection === idx ? "selected" : ""}>
										{i}
									</button>
								))}
							</div>
							{selectedSection === 0 ? (
								<div>
									<input
										type="text"
										onChange={e => setFilterCounterTitle(e.target.value)}
										value={filterCounterTitle}
										placeholder="Search Counter Title..."
										className="searchInput"
									/>
									<input
										type="text"
										onChange={e => setFilterRouteTitle(e.target.value)}
										value={filterRouteTitle}
										placeholder="Search Route Title..."
										className="searchInput"
									/>
									<table
										className="user-table"
										style={{
											maxWidth: "500px",
											height: "fit-content",
											overflowX: "scroll",
										}}>
										<thead>
											<tr>
												<th>S.N</th>
												<th colSpan={2}>Counter Title</th>
											</tr>
										</thead>
										<tbody className="tbody">
											{filterRoute.map(a => (
												<>
													<tr style={{ pageBreakAfter: "auto", width: "100%" }}>
														<td colSpan={2}>
															{a.route_title}
															<span
																onClick={e => {
																	e.stopPropagation()
																	if (objData.type === "general") {
																		setObgData(prev => ({
																			...prev,
																			counters: prev.counters.filter(c =>
																				filteredCounter?.find(
																					b =>
																						a.route_uuid === b.route_uuid &&
																						c === b.counter_uuid
																				)
																			).length
																				? prev.counters.filter(
																						c =>
																							!filteredCounter?.find(
																								b =>
																									a.route_uuid ===
																										b.route_uuid &&
																									c === b.counter_uuid
																							)
																				  )
																				: [
																						...(prev.counters || []),
																						...filteredCounter
																							?.filter(
																								b =>
																									a.route_uuid ===
																									b.route_uuid
																							)
																							.map(c => c.counter_uuid),
																				  ],
																		}))
																	} else {
																		setObgData(prev => ({
																			...prev,
																			counter_status: prev.counter_status.filter(
																				c =>
																					filteredCounter?.find(
																						b =>
																							a.route_uuid ===
																								b.route_uuid &&
																							c.counter_uuid ===
																								b.counter_uuid
																					)
																			).length
																				? prev.counter_status.filter(
																						c =>
																							!filteredCounter?.find(
																								b =>
																									a.route_uuid ===
																										b.route_uuid &&
																									c.counter_uuid ===
																										b.counter_uuid
																							)
																				  )
																				: [
																						...(prev.counter_status || []),
																						...filteredCounter?.filter(
																							b =>
																								a.route_uuid ===
																								b.route_uuid
																						),
																				  ],
																		}))
																	}
																}}
																style={{ marginLeft: "10px" }}>
																<input
																	type="checkbox"
																	checked={
																		objData.type === "general"
																			? objcounters?.filter(c =>
																					filteredCounter?.find(
																						b =>
																							a.route_uuid ===
																								b.route_uuid &&
																							c === b.counter_uuid
																					)
																			  ).length ===
																			  filteredCounter?.filter(
																					b => a.route_uuid === b.route_uuid
																			  ).length
																			: objcounter_status?.filter(c =>
																					filteredCounter?.find(
																						b =>
																							a.route_uuid ===
																								b.route_uuid &&
																							c.counter_uuid ===
																								b.counter_uuid
																					)
																			  ).length ===
																			  filteredCounter?.filter(
																					b => a.route_uuid === b.route_uuid
																			  ).length
																	}
																	onChange={() => {}}
																	style={{ transform: "scale(1.3)" }}
																/>
															</span>
														</td>
														<td
															onClick={() =>
																setRoutesData(prev =>
																	prev.map(b =>
																		b.route_uuid === a.route_uuid
																			? { ...b, expand: !b.expand }
																			: b
																	)
																)
															}
															style={{
																// fontSize: "20px",
																// width: "20px",
																transition: "all ease 1s",
															}}>
															{objData.type === "general"
																? objcounters?.filter(c =>
																		filteredCounter?.find(
																			b =>
																				a.route_uuid === b.route_uuid &&
																				c === b.counter_uuid
																		)
																  ).length +
																  "/" +
																  filteredCounter?.filter(
																		b => a.route_uuid === b.route_uuid
																  ).length
																: objcounter_status?.filter(c =>
																		filteredCounter?.find(
																			b =>
																				a.route_uuid === b.route_uuid &&
																				c.counter_uuid === b.counter_uuid
																		)
																  ).length +
																  "/" +
																  filteredCounter?.filter(
																		b => a.route_uuid === b.route_uuid
																  ).length}
															{a.expand ? (
																<ArrowDropUp
																	style={{
																		fontSize: "20px",
																		width: "20px",
																	}}
																/>
															) : (
																<ArrowDropDown
																	style={{
																		fontSize: "20px",
																		width: "20px",
																	}}
																/>
															)}
														</td>
													</tr>
													{a.expand
														? filteredCounter
																?.filter(b => a.route_uuid === b.route_uuid)
																?.sort((a, b) =>
																	a.counter_title?.localeCompare(b.counter_title)
																)
																?.map((item, i, array) => {
																	return (
																		<tr
																			key={Math.random()}
																			style={{ height: "30px" }}>
																			<td
																				onClick={e => {
																					e.stopPropagation()
																					if (objData.type === "general") {
																						setObgData(prev => ({
																							...prev,
																							counters:
																								prev.counters.filter(
																									a =>
																										a ===
																										item.counter_uuid
																								).length
																									? prev.counters.filter(
																											a =>
																												a !==
																												item.counter_uuid
																									  )
																									: [
																											...(prev.counters ||
																												[]),
																											item.counter_uuid,
																									  ],
																						}))
																					} else {
																						setObgData(prev => ({
																							...prev,
																							counter_status:
																								prev.counter_status.filter(
																									a =>
																										a.counter_uuid ===
																										item.counter_uuid
																								).length
																									? prev.counter_status.filter(
																											a =>
																												a.counter_uuid !==
																												item.counter_uuid
																									  )
																									: [
																											...(prev.counter_status ||
																												[]),
																											item,
																									  ],
																						}))
																					}
																				}}
																				className="flex"
																				style={{
																					justifyContent: "space-between",
																				}}>
																				<input
																					type="checkbox"
																					checked={
																						objData.type === "general"
																							? objcounters.find(
																									a =>
																										a ===
																										item.counter_uuid
																							  )
																							: objcounter_status.find(
																									a =>
																										a.counter_uuid ===
																										item.counter_uuid
																							  )
																					}
																					style={{
																						transform: "scale(1.3)",
																					}}
																				/>
																				{i + 1}
																			</td>

																			<td colSpan={2}>
																				{item.counter_title || ""}
																			</td>
																		</tr>
																	)
																})
														: ""}
												</>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<div>
									<input
										type="text"
										onChange={e => setCounterGroupsFilter(e.target.value)}
										value={counterGroupsFilter}
										placeholder="Search Counter Groups..."
										className="searchInput"
										style={{
											width: "100%",
											borderRadius: 0,
											border: "1px solid lightgrey",
										}}
									/>
									<table
										className="user-table"
										style={{
											maxWidth: "500px",
											height: "fit-content",
											overflowX: "scroll",
										}}>
										<thead>
											<tr style={{ width: "100%" }}>
												<th style={{ borderRight: 0, width: "10%" }}></th>
												<th style={{ borderRight: 0, width: "90%" }}>Counter Group Title</th>
											</tr>
										</thead>
										<tbody className="tbody">
											{filteredCounterGroups()?.map(group => (
												<tr
													key={group?.counter_group_uuid}
													style={{ width: "100%" }}
													onClick={() => handleGroupSelection(group)}>
													<td>
														<input
															type="checkbox"
															onChange={() => {}}
															checked={selectedCounterGroups?.includes(
																group.counter_group_uuid
															)}
														/>
													</td>
													<td colSpan={2}>{group?.counter_group_title}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</div>

					<div
						style={{
							width: "100%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}>
						<button className="fieldEditButton" onClick={submitHandler}>
							{popupForm?.type === "edit" ? "Update" : "Save"}
						</button>

						<div id="selection-info">
							<div>
								<span>Counter Groups</span>
								<span>
									{selectedCounterGroups?.length}/{counterGroups?.length}
								</span>
							</div>
						</div>
					</div>

					<button onClick={onSave} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}
function IncentiveOrderPopup({ onSave, popupForm, sendMsg }) {
	const [type, setType] = useState("all")
	const [message, setMessage] = useState([])
	const [counters, setCounter] = useState([])
	const [active, setActive] = useState("")
	const [orderForm, setOrderForm] = useState([])
	const [routesData, setRoutesData] = useState([])
	const [filterCounterTitle, setFilterCounterTitle] = useState("")
	const [filterRouteTitle, setFilterRouteTitle] = useState("")
	const getRoutesData = async () => {
		const response = await axios({
			method: "get",
			url: "/routes/GetRouteList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setRoutesData(response.data.result.map(a => ({ ...a, expand: false })))
	}
	const getCounter = async () => {
		const response = await axios({
			method: "post",
			url: "/counters/GetCounterData",
			data: ["counter_uuid", "counter_title", "status", "route_uuid"],
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setCounter(response.data.result)
	}
	const getOrderForm = async () => {
		const response = await axios({
			method: "post",
			url: "orderForm/GetFormList",
			data: ["form_uuid", "form_title"],
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setOrderForm(response.data.result)
	}

	useEffect(() => {
		getOrderForm()
		getRoutesData()
		getCounter()
	}, [])

	const submitHandler = async e => {
		e.preventDefault()

		let data = message
		for (let message of data?.filter(a => a.img)) {
			const previousFile = message.img
			const newFile = new File([previousFile], message.uuid + ".png")
			const form = new FormData()
			form.append("file", newFile)
			await axios({
				method: "post",
				url: "/uploadImage",
				data: form,
				headers: {
					"Content-Type": "multipart/form-data",
				},
			})
		}
		sendMsg({ ...popupForm, message, all: type })
		onSave()
	}
	const filteredCounter = useMemo(
		() =>
			counters.filter(
				a =>
					!filterCounterTitle ||
					a.counter_title?.toLocaleLowerCase()?.includes(filterCounterTitle?.toLocaleLowerCase())
			),
		[counters, filterCounterTitle]
	)
	const filterRoute = useMemo(
		() =>
			routesData
				.filter(
					a =>
						(!filterRouteTitle ||
							a.route_title?.toLocaleLowerCase()?.includes(filterRouteTitle?.toLocaleLowerCase())) &&
						a.route_uuid &&
						filteredCounter?.filter(b => a.route_uuid === b.route_uuid).length
				)

				.sort((a, b) => a?.route_title?.localeCompare(b?.route_title)),
		[filterRouteTitle, filteredCounter, routesData]
	)

	const addVariable = name => {
		let element = document.getElementById(active)
		console.log(element.selectionStart)
		setMessage(prev =>
			prev.message.map(a =>
				a.uuid === active
					? {
							...a,
							text:
								(a.text || "")?.slice(0, element.selectionStart) +
								`{${name}}` +
								(a.text || "")?.slice(element.selectionStart, (a.text || "").length),
					  }
					: a
			)
		)
	}
	return (
		<div className="overlay">
			<div className="modal" style={{ height: "fit-content", width: "fit-content" }}>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content",
					}}>
					<div className="flex" style={{ justifyContent: "flex-start", alignItems: "flex-start" }}>
						<div style={{ maxHeight: "500px", overflowY: "scroll" }}>
							<table
								className="user-table"
								style={{
									width: "fit-content",
								}}>
								<tbody>
									<tr>
										<td
											colSpan={2}
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "flex-start",
												width: "400px",
											}}>
											<input
												onWheel={e => e.target.blur()}
												type="checkbox"
												className="searchInput"
												style={{
													border: "none",
													borderBottom: "2px solid black",
													borderRadius: "0px",
												}}
												placeholder=""
												checked={type}
												onChange={e => setType(e.target.checked)}
											/>
											<b style={{ width: "100px" }}>All </b>
											<input
												onWheel={e => e.target.blur()}
												type="checkbox"
												className="searchInput"
												style={{
													border: "none",
													borderBottom: "2px solid black",
													borderRadius: "0px",
												}}
												placeholder=""
												checked={!type}
												onChange={e => setType(!e.target.checked)}
											/>
											<b style={{ width: "100px" }}>Not Ordered </b>
										</td>
									</tr>

									<tr>
										<td
											colSpan={2}
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "flex-start",
											}}>
											<b style={{ width: "100px" }}>Message : </b>
											<span
												onClick={e => {
													setMessage(prev => [
														...(prev.message || []),
														{ type: "text", uuid: uuid() },
													])
												}}
												className="fieldEditButton">
												<Add />
											</span>
										</td>
									</tr>
									<div style={{ overflowY: "scroll", maxHeight: "150px" }}>
										{message
											?.filter(item => !item.delete)
											?.map((item, i) => (
												<tr key={item.uuid}>
													<td
														colSpan={2}
														style={{
															display: "flex",
															alignItems: "center",
															justifyContent: "flex-start",
														}}>
														{i + 1})
														<span
															onClick={() =>
																setMessage(prev =>
																	prev.map(a =>
																		a.uuid === item.uuid
																			? { ...a, delete: true }
																			: a
																	)
																)
															}>
															<DeleteOutline />
														</span>
														<select
															className="searchInput"
															value={item.type}
															onChange={e => {
																setMessage(prev =>
																	prev.map(a =>
																		a.uuid === item.uuid
																			? { ...a, type: e.target.value }
																			: a
																	)
																)
															}}>
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
																	height: "100px",
																}}
																id={item.uuid}
																onFocus={() => {
																	setActive(item.uuid)
																}}
																placeholder=""
																value={item.text}
																onChange={e => {
																	setMessage(prev =>
																		prev.map(a =>
																			a.uuid === item.uuid
																				? {
																						...a,
																						text: e.target.value,
																				  }
																				: a
																		)
																	)
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
																			setMessage(prev =>
																				prev.map(a =>
																					a.uuid === item.uuid
																						? {
																								...a,
																								img: e.target.files[0],
																						  }
																						: a
																				)
																			)
																		}
																	/>
																	<img
																		style={{
																			width: "100px",
																			height: "100px",
																			objectFit: "contain",
																		}}
																		src={
																			item.img
																				? URL.createObjectURL(item.img)
																				: noimg
																		}
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
																		borderRadius: "0px",
																	}}
																	placeholder="caption"
																	value={item.caption}
																	onChange={e => {
																		setMessage(prev =>
																			prev.map(a =>
																				a.uuid === item.uuid
																					? {
																							...a,
																							caption: e.target.value,
																					  }
																					: a
																			)
																		)
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
												justifyContent: "flex-start",
											}}>
											<button className="theme-btn" onClick={e => addVariable("counter_title")}>
												Counter Title
											</button>
											<button className="theme-btn" onClick={e => addVariable("short_link")}>
												Counter Link
											</button>
										</td>
									</tr>
									<tr>
										<td
											colSpan={2}
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "flex-start",
											}}>
											<button className="theme-btn" onClick={e => addVariable("invoice_number")}>
												Invoice Number
											</button>
											<button className="theme-btn" onClick={e => addVariable("amount")}>
												Amount
											</button>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					<div
						style={{
							width: "100%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}>
						<button className="fieldEditButton" onClick={submitHandler}>
							Shoot
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
