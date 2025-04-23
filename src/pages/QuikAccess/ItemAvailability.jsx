import axios from "axios"
import React, { useState, useEffect, useCallback, useRef, useMemo, useContext, forwardRef } from "react"
import { useReactToPrint } from "react-to-print"
import PopupTripOrderTable from "../../components/PopupTripOrderTable"
import TripPage from "../../components/TripPage"
import { ArrowDropDown, ArrowDropUp } from "@mui/icons-material"
import Select from "react-select"
import context from "../../context/context"
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable"
import { ViewGridIcon } from "@heroicons/react/solid"
import { CSS } from "@dnd-kit/utilities"
import { debounce } from "../../utils/helperFunctions"

export default function ItemAvailability() {
	const [itemsIdList, setItemsIdList] = useState([])
	const [activeId, setActiveId] = useState()
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
	const [loading, setLoading] = useState(false)
	const [initialIds, setInitialIds] = useState()

	const reactToPrintContent = useCallback(() => {
		return componentRef.current
	}, [])

	const { setIsItemAvilableOpen } = useContext(context)

	const handlePrint = useReactToPrint({
		content: reactToPrintContent,
		removeAfterPrint: true,
	})

	function formatAMPM(date) {
		var hours = date.getHours()
		var minutes = date.getMinutes()
		var ampm = hours >= 12 ? "pm" : "am"
		hours = hours % 12
		hours = hours ? hours : 12
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
			const data = response.data.result.filter(a => a.status).sort((a,b) => +a.sort_order - +b.sort_order)
			setInitialIds(data.map(i => i.trip_uuid).join())
			setItemsData(
				data.map(b => ({
					...b,
					users_name: b?.users?.map(a => users.find(c => a === c.user_uuid)?.user_title) || [],
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

	const onFilter = debounce((val) => {
		const valLow = val.toLowerCase()
		setItemsIdList(itemsData?.filter(a => (valLow?.length > 0 ? a.trip_title.toLowerCase().includes(valLow) : true) && a.trip_title).map(i => i.trip_uuid))
	}, 500)

	useEffect(() => setItemsIdList(itemsData?.sort((a, b) => +a.sort_order - b.sort_order)?.map(i => i.trip_uuid)), [itemsData])
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
		  coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const updateData = async () => {
		setLoading(true)
		try {
			console.log(initialIds, itemsData.map(i => i.trip_uuid).join())
			if (initialIds !== itemsData.map(i => i.trip_uuid).join()) {
				await axios.post('/trips/update_sort_order',
					itemsData.map(i => ({
						trip_uuid: i.trip_uuid,
						sort_order: i.sort_order
					}))
				)
			}
			setIsItemAvilableOpen(false)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
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
									onFilter(e.target.value)
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
												S/O
											</th>
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
										<DndContext
											sensors={sensors}
											collisionDetection={closestCenter}
											onDragStart={handleDragStart}
											onDragEnd={handleDragEnd}
										>
											<SortableContext
												items={itemsIdList}
												strategy={rectSortingStrategy}
											>
												{itemsIdList?.map((id, i) =>
													<SortableItem
														key={id}
														id={id}
														activeId={activeId}
														setActiveId={setActiveId}
														item={itemsData?.find(i => i.trip_uuid === id)}
														setStateProps={{
															setWarehousePopup,
															completeFunction,
															setStatementTrip_uuid,
															setPopup,
															setDetailsPopup,
															setCounterPopup
														}}
													/>
												)}
											</SortableContext>
										</DndContext>
									</tbody>
								</table>
							</div>
						</div>
					</div>
					<button onClick={() => setIsItemAvilableOpen(false)} className="closeButton">x</button>
					<div>
						<button className="savebtn" onClick={updateData} disabled={loading} style={{ pointerEvents: loading ? 'none' : 'all' }}>
							{loading ? "In Progress...": "Done"}
						</button>
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
	function handleDragStart(event) {
		const { active } = event;
		setActiveId(active?.id);
	}
	function handleDragEnd(event) {
		const { active, over } = event;
		if (active?.id !== over?.id) {
			const oldIndex = itemsIdList?.indexOf(active.id);
			const newIndex = itemsIdList?.indexOf(over.id);

			const updatedIds = arrayMove(itemsIdList, oldIndex, newIndex);
			setItemsData(prev => updatedIds?.map((id, i) => {
				const doc = prev?.find(trip => trip.trip_uuid === id)
				return { ...doc, sort_order: i + 1 }
			}).sort((a,b) => a.sort_order - b.sort_order))
		}
		setActiveId(null);
	}
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
const SortableItem = (props) => {
	const { attributes, listeners, setNodeRef, transform, transition, } = useSortable({ id: props?.id });
	const style = { transform: CSS?.Transform?.toString(transform), transition };
	return (<Item {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />);
};
const Item = forwardRef(({
	activeId,
	style,
	item,
	...props
}, ref) => {
  
	if (!item) return null
	return (
		<tr
			key={item.trip_uuid}
			ref={ref}
			style={activeId === item.trip_uuid ? {
				background: 'lightgray',
				...style
			} : style}
		>
			<td>
				<ViewGridIcon {...props} style={{ width: '16px', height: '16px', opacity: '0.7', marginLeft: '10px',marginRight:'5px' }} />
				{item?.sort_order}
			</td>
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
				<RowMenu item={item} {...props} />
			</td>
		</tr>
	)
});
function RowMenu({
	item,
	setStateProps: {
		setWarehousePopup,
		completeFunction,
		setStatementTrip_uuid,
		setPopup,
		setDetailsPopup,
		setCounterPopup
	}
}) {
	const [visible, setVisible] = useState(false)
	return <>
		<div
			id="customer-dropdown-trigger"
			className={"active"}
			style={{
				transform: item.dropdown ? "rotate(0deg)" : "rotate(180deg)",
				width: "30px",
				height: "30px",
				backgroundColor: "#000",
				color: "#fff",
			}}
			onClick={() => setVisible(prev => !prev)}>
			<ArrowDropDown />
		</div>
		{visible && <div
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
			onMouseLeave={() => setVisible(prev => false)}>
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
		}
	</>
}