import axios from "axios"
import React, { useState, useEffect, useCallback, useRef, useMemo, useContext } from "react"
import { useReactToPrint } from "react-to-print"
import PopupTripOrderTable from "../../components/PopupTripOrderTable"
import TripPage from "../../components/TripPage"
import { ArrowDropDown, ArrowDropUp } from "@mui/icons-material"
import Select from "react-select"
import context from "../../context/context"
import { useLocation } from "react-router-dom"
export default function ItemAvilibility() {
	const [itemsData, setItemsData] = useState([])
	const [popup, setPopup] = useState(null)
	const [users, setUsers] = useState([])
	const [btn, setBtn] = useState(false)
	const [itemFilter, setItemFilter] = useState("")
	const [statementTrip_uuid, setStatementTrip_uuid] = useState()
	const [statementTrip, setStatementTrip] = useState()
	const [detailsPopup, setDetailsPopup] = useState(false)
	const [warehousePopup, setWarehousePopup] = useState(false)
	const componentRef = useRef(null)
	const [counterPopup, setCounterPopup] = useState(false)

	const reactToPrintContent = useCallback(() => {
		return componentRef.current
	}, [])
	const { setIsItemAvilableOpen, isItemAvilableOpen } = useContext(context)

	const handlePrint = useReactToPrint({
		content: reactToPrintContent,
		
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
			url: "/trips/GetTripListSummary/" + localStorage.getItem("user_uuid"),

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			setItemsData(
				response.data.result
					.filter(a => a.status)
					.map(b => ({
						...b,

						users_name:
							b?.users?.map(a => {
								let data = users.find(c => a === c.user_uuid)?.user_title
								
								return data
							}) || [],
					}))
			)
		}
	}
	const getTripDetails = async () => {
		const response = await axios({
			method: "get",
			url: "/trips/GetTripSummaryDetails/" + statementTrip_uuid,

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			
			setStatementTrip(response.data.result)
			setStatementTrip_uuid(false)
			setTimeout(handlePrint, 2000)
		}
	}
	useEffect(() => {
		if (statementTrip_uuid) {
			getTripDetails()
		}
	}, [statementTrip_uuid])
	useEffect(() => {
		getTripData()
	}, [btn, warehousePopup, users])
	useEffect(() => {
		getUsers()
	}, [])
	const completeFunction = async data => {
		const response = await axios({
			method: "put",
			url: "/trips/putTrip",
			data,
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			setBtn(prev => !prev)
		}
	}

	return (
		<>
			<div className="itemavilablelity">
				<div className="itemavilabelitycontainer" style={{ position: "relative" }}>
					<div className="itemavilablelity_header">
						<h2>Trips</h2>
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
												Warehouse
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
										{itemsData
											.sort((a, b) => a.created_at - b.created_at)
											.filter(
												a =>
													(itemFilter !== ""
														? a.trip_title.toLowerCase().includes(itemFilter.toLowerCase())
														: true) && a.trip_title
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
														{item.trip_title}
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
														{item?.warehouse_title || ""}
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
																		a.trip_uuid === item.trip_uuid
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
																	top: "-70px",
																	flexDirection: "column",
																	left: "-200px",
																	zIndex: "200",
																	width: "200px",
																	height: "300px",
																	justifyContent: "space-between",
																}}
																onMouseLeave={() =>
																	setItemsData(prev =>
																		prev.map(a =>
																			a.trip_uuid === item.trip_uuid
																				? { ...a, dropdown: false }
																				: a
																		)
																	)
																}>
																<button
																	className="theme-btn"
																	style={{
																		display: "inline",
																		cursor: "pointer",
																		width: "100%",
																	}}
																	type="button"
																	onClick={() => {
																		setWarehousePopup(item)
																	}}>
																	Warehouse
																</button>
																<button
																	className="theme-btn"
																	style={{
																		display: "inline",
																		cursor: item?.orderLength
																			? "not-allowed"
																			: "pointer",
																		width: "100%",
																	}}
																	type="button"
																	onClick={() => {
																		completeFunction({
																			...item,
																			status: 0,
																		})
																	}}
																	disabled={item?.orderLength}>
																	Complete
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
																		setStatementTrip_uuid(item.trip_uuid)
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

																<button
																	className="theme-btn"
																	style={{
																		display: "inline",
																		width: "100%",
																	}}
																	type="button"
																	onClick={() => {
																		setDetailsPopup(item.trip_uuid)
																	}}>
																	Details
																</button>
																<button
																	className="theme-btn"
																	style={{
																		display: "inline",
																		width: "100%",
																	}}
																	type="button"
																	onClick={() => {
																		setCounterPopup(item.trip_uuid)
																	}}>
																	Counters
																</button>
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
			{detailsPopup ? <PopupTripOrderTable trip_uuid={detailsPopup} onSave={() => setDetailsPopup("")} /> : ""}
			{statementTrip?.trip_uuid ? (
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
						<TripPage
							trip_title={statementTrip?.trip_title || ""}
							users={statementTrip?.users.map(a => users.find(b => b.user_uuid === a)) || []}
							trip_uuid={statementTrip?.trip_uuid || ""}
							created_at={formatAMPM(new Date(statementTrip?.created_at || ""))}
							amt={statementTrip?.amt || 0}
							coin={statementTrip?.coin || 0}
							cash={statementTrip?.cash || 0}
							formatAMPM={formatAMPM}
							cheque={statementTrip?.cheque}
							replacement={statementTrip?.replacement}
							sales_return={statementTrip?.sales_return}
							unpaid_invoice={statementTrip?.unpaid_invoice}
						/>
					</div>
				</div>
			) : (
				""
			)}
			{counterPopup ? <CounterTable onSave={() => setCounterPopup(false)} trip_uuid={counterPopup} /> : ""}
		</>
	)
}
function NewUserForm({ onSave, popupInfo, users, completeFunction }) {
	const [data, setdata] = useState([])
	useEffect(() => {
		setdata(popupInfo?.users || [])
	}, [popupInfo?.users])

	const submitHandler = async e => {
		e.preventDefault()
		completeFunction({ ...popupInfo, users: data })
		onSave()
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
			url: "/trips/putTrip",
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
function CounterTable({ trip_uuid, onSave }) {
	const [counter, setCounter] = useState([])
	const [filterCounterTitle, setFilterCounterTitle] = useState("")
	const [routesData, setRoutesData] = useState([])
	const [filterRouteTitle, setFilterRouteTitle] = useState("")

	const getCounter = async (controller = new AbortController()) => {
		const response = await axios({
			method: "post",
			url: "/counters/GetCounterData",
			signal: controller.signal,
			data: ["counter_uuid", "counter_title", "trip_uuid", "route_uuid"],
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			setCounter(
				response.data.result.sort((a, b) =>
					(a.trip_uuid === b.trip_uuid) === trip_uuid ? 0 : a.trip_uuid === trip_uuid ? -1 : 1
				)
			)
		}
	}
	const getRoutesData = async (controller = new AbortController()) => {
		const response = await axios({
			method: "get",
			url: "/routes/GetRouteList",
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setRoutesData(response.data.result)
	}
	useEffect(() => {
		let controller = new AbortController()
		getCounter(controller)
		getRoutesData(controller)
		return () => {
			controller.abort()
		}
	}, [])
	const submitHandler = async e => {
		e.preventDefault()
		const response = await axios({
			method: "put",
			url: "/counters/putCounter",
			data: counter.filter(a => a.edit),
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			onSave()
		}
	}
	const filterCounter = useMemo(
		() =>
			counter?.filter(
				a =>
					a.counter_uuid &&
					(!filterCounterTitle ||
						a.counter_title?.toLocaleLowerCase()?.includes(filterCounterTitle?.toLocaleLowerCase()))
			),
		[counter, filterCounterTitle]
	)

	const filterRoute = useMemo(
		() =>
			routesData
				.filter(
					a =>
						(!filterRouteTitle ||
							a.route_title?.toLocaleLowerCase()?.includes(filterRouteTitle?.toLocaleLowerCase())) &&
						a.route_uuid &&
						filterCounter?.filter(b => a.route_uuid === b.route_uuid)?.length
				)

				.sort((a, b) => a?.route_title?.localeCompare(b?.route_title)),
		[filterRouteTitle, filterCounter, routesData]
	)

	return (
		<div className="overlay" style={{ zIndex: 9999999 }}>
			<div
				className="modal"
				style={{
					height: "max-content",
					width: "fit-content",
					maxHeight: "90vh",
				}}>
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
								<h1>Counters</h1>
							</div>
							<div className="formGroup">
								<div className="flex">
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
										placeholder="Search route Title..."
										className="searchInput"
									/>
								</div>

								<div className="row">
									<div
										style={{
											overflowY: "scroll",
											height: "45vh",
											minWidth: "600px",
										}}>
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

																		setCounter(prev => {
																			let counter_trip_uuid =
																				filterCounter?.filter(
																					b =>
																						a.route_uuid === b.route_uuid &&
																						trip_uuid === b.trip_uuid
																				)?.length ===
																				filterCounter?.filter(
																					b => a.route_uuid === b.route_uuid
																				)?.length
																					? ""
																					: trip_uuid
																			return prev.map(count =>
																				count.route_uuid === a.route_uuid
																					? {
																							...count,
																							trip_uuid:
																								counter_trip_uuid,
																							edit: true,
																					  }
																					: count
																			)
																		})
																	}}
																	style={{ marginLeft: "10px" }}>
																	<input
																		type="checkbox"
																		checked={
																			filterCounter?.filter(
																				b =>
																					a.route_uuid === b.route_uuid &&
																					trip_uuid === b.trip_uuid
																			)?.length ===
																			filterCounter?.filter(
																				b => a.route_uuid === b.route_uuid
																			)?.length
																		}
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
																{filterCounter?.filter(
																	c =>
																		a.route_uuid === c.route_uuid &&
																		c.trip_uuid === trip_uuid
																).length +
																	"/" +
																	filterCounter?.filter(
																		c => a.route_uuid === c.route_uuid
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
															? filterCounter
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
																						setCounter(prev =>
																							prev.map(a =>
																								a.counter_uuid ===
																								item.counter_uuid
																									? {
																											...a,
																											trip_uuid:
																												a.trip_uuid ===
																												trip_uuid
																													? ""
																													: trip_uuid,
																											edit: true,
																									  }
																									: a
																							)
																						)
																					}}
																					className="flex"
																					style={{
																						justifyContent: "space-between",
																					}}>
																					<input
																						type="checkbox"
																						checked={
																							item.trip_uuid === trip_uuid
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
										{/* <table className="table">
                      <thead>
                        <tr>
                          <th className="description" style={{ width: "10%" }}>
                            S.r
                          </th>

                          <th className="description" style={{ width: "25%" }}>
                            Counter
                          </th>

                          <th style={{ width: "25%" }}>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filterCounter.map((item, index) => {
                          return (
                            <tr key={item.counter_uuid}>
                              <td>{index + 1}</td>

                              <td>{item?.counter_title}</td>

                              <td>
                                <button
                                  type="button"
                                  className="noBgActionButton"
                                  style={{
                                    backgroundColor:
                                      item.trip_uuid === trip_uuid
                                        ? "red"
                                        : "var(--mainColor)",
                                    width: "150px",
                                    fontSize: "large",
                                  }}
                                  onClick={(event) =>
                                    setCounter((prev) =>
                                      prev.map((a) =>
                                        a.counter_uuid === item.counter_uuid
                                          ? {
                                              ...a,
                                              trip_uuid:
                                                a.trip_uuid === trip_uuid
                                                  ? ""
                                                  : trip_uuid,
                                              edit: true,
                                            }
                                          : a
                                      )
                                    )
                                  }
                                >
                                  {item.trip_uuid === trip_uuid
                                    ? "Remove"
                                    : "Add"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table> */}
									</div>
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
