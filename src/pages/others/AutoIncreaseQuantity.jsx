import React, { useState, useEffect, useMemo } from "react"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"
import "./style.css"
import { ChevronUpIcon, ChevronDownIcon, MenuAlt2Icon } from "@heroicons/react/solid"
import { v4 as uuid } from "uuid"
import axios from "axios"
import { Delete } from "@mui/icons-material"
import { Switch } from "@mui/material"
import { green } from "@mui/material/colors"
import { alpha, styled } from "@mui/material/styles"
const DEFAULT = {
	base_qty: "",
	add_qty: "",
	unit: "p",
}
const GreenSwitch = styled(Switch)(({ theme }) => ({
	"& .MuiSwitch-switchBase.Mui-checked": {
		color: green[500],
		"&:hover": {
			backgroundColor: alpha(green[500], theme.palette.action.hoverOpacity),
		},
	},
	"& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
		backgroundColor: green[500],
	},
}))
const AutoIncreaseQuantity = () => {
	const [popupForm, setPopupForm] = useState(false)
	const [itemsData, setItemsData] = useState([])
	const [deletePopup, setDeletePopup] = useState(false)
	const getItemsData = async () => {
		const response = await axios({
			method: "get",
			url: "/autoBill/autoBillQty",

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
			url: "/autoBill/DeleteAutoQty",
			data,
			headers: {
				"Content-Type": "application/json",
			},
		})
		
		if (response.data.success) {
			setDeletePopup(false)
			getItemsData()
		}
	}
	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading">
					<h2 style={{ width: "100%" }}>Auto Increase Quantity </h2>
				</div>
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
					/>
				</div>
			</div>
			{popupForm ? <NewUserForm onSave={() => setPopupForm(false)} popupForm={popupForm} /> : ""}
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

export default AutoIncreaseQuantity
function Table({ itemsDetails = [], setPopupForm, setDeletePopup, getItemsData }) {
	const [items, setItems] = useState("auto_title")
	const [order, setOrder] = useState("asc")
	const updateStatus = async data => {
		const response = await axios({
			method: "put",
			url: "/autoBill/UpdateAutoQty",
			data,
			headers: {
				"Content-Type": "application/json",
			},
		})
		
		if (response.data.success) {
			getItemsData()
		}
	}
	return (
		<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead>
				<tr>
					<th>S.N</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>Auto Title</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("auto_title")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("auto_title")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={2}></th>
				</tr>
			</thead>
			<tbody className="tbody">
				{itemsDetails
					.filter(a => a.auto_title)
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
								colSpan={2}
								onClick={e => {
									e.stopPropagation()
									setPopupForm({ type: "edit", data: item })
								}}>
								{item.auto_title}
							</td>
							<td>
								<Delete
									onClick={e => {
										e.stopPropagation()
										setDeletePopup(item)
									}}
								/>
							</td>
							<td>
								<GreenSwitch
									checked={item?.status}
									onChange={e => {
										e.stopPropagation()
										updateStatus({ ...item, status: item.status ? 0 : 1 })
									}}
								/>
							</td>
						</tr>
					))}
			</tbody>
		</table>
	)
}

function NewUserForm({ onSave, popupForm }) {
	const [objData, setObgData] = useState({
		type: "auto-increase-qty",
		auto_title: "",
		items: [],
		item_groups: [],
		counters: [],
		counter_groups: [],
		qty_details: [{ ...DEFAULT, uuid: uuid() }],
	})
	
	useEffect(() => {
		if (popupForm?.type === "edit")
			setObgData({
				...popupForm.data,
				qty_details: popupForm.data.qty_details.map(a => ({
					...a,
					uuid: uuid(),
				})),
			})
	}, [])
	const [ui, setUi] = useState(1)
	const [items, setItems] = useState([])
	const [company, setCompany] = useState([])
	const [Category, setCategory] = useState([])
	const [counterGroup, setCounterGroup] = useState([])
	const [filterCounterGroupTitle, setFilterCounterGroupTitle] = useState("")
	const [itemGroups, setItemsGroup] = useState([])
	const [filterTitle, setFilterTitle] = useState("")
	const [filterCategory, setFilterCategory] = useState("")
	const [filterCompany, setFilterCompany] = useState("")
	const [itemGroupTitle, setItemGroupTitle] = useState("")
	const [routesData, setRoutesData] = useState([])
	const [counter, setCounter] = useState([])
	const [filterCounterTitle, setFilterCounterTitle] = useState("")
	const [filterRoute, setFilterRoute] = useState("")
	const [filterItemData, setFilterItemData] = useState([])
	const [filterItemGroupData, setFilterItemGroupData] = useState([])
	const [filterCounterata, setFilterCounterData] = useState([])
	const [filterCounterGroupData, setFilterCounterGroupData] = useState([])
	useEffect(() => {
		setFilterItemGroupData(
			itemGroups.sort((a, b) => {
				let aLength = objData.item_groups?.filter(c => c === a?.item_group_uuid)?.length
				let bLength = objData.item_groups?.filter(c => c === b?.item_group_uuid)?.length
				if (aLength && bLength) {
					return a.item_group_title?.localeCompare(b.item_group_title)
				} else if (aLength) {
					return -1
				} else if (bLength) {
					return 1
				} else {
					return a.item_group_title?.localeCompare(b.item_group_title)
				}
			})
		)
		setFilterItemData(
			items.sort((a, b) => {
				let aLength = objData.items.filter(c => c === a.item_uuid)?.length
				let bLength = objData.items.filter(c => c === b.item_uuid)?.length
				if (aLength && bLength) {
					return a.item_title?.localeCompare(b.item_title)
				} else if (aLength) {
					return -1
				} else if (bLength) {
					return 1
				} else {
					return a.item_title?.localeCompare(b.item_title)
				}
			})
		)
		setFilterCounterGroupData(
			counterGroup.sort((a, b) => {
				let aLength = objData.counter_groups.filter(c => c === a.counter_group_uuid)?.length

				let bLength = objData.counter_groups.filter(c => c === b.counter_group_uuid)?.length
				if (aLength && bLength) {
					return a.counter_group_title?.localeCompare(b.counter_group_title)
				} else if (aLength) {
					return -1
				} else if (bLength) {
					return 1
				} else {
					return a.counter_group_title?.localeCompare(b.counter_group_title)
				}
			})
		)
		setFilterCounterData(
			counter.sort((a, b) => {
				let aLength = objData.counters.filter(c => c === a.counter_uuid)?.length
				let bLength = objData.counters.filter(c => c === b.counter_uuid)?.length
				if (aLength && bLength) {
					return a.counter_title?.localeCompare(b.counter_title)
				} else if (aLength) {
					return -1
				} else if (bLength) {
					return 1
				} else {
					return a.counter_title?.localeCompare(b.counter_title)
				}
			})
		)
	}, [ui, items, counter, itemGroups, counterGroup])
	const getRoutesData = async () => {
		const response = await axios({
			method: "get",
			url: "/routes/GetRouteList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setRoutesData(response.data.result)
	}

	const getCounter = async () => {
		const response = await axios({
			method: "get",
			url: "/counters/GetCounterData",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success)
			setCounter(
				response.data.result.map(b => ({
					...b,
					route_title: routesData.find(a => a.route_uuid === b.route_uuid)?.route_title || "-",
				}))
			)
	}

	useEffect(() => {
		getCounter()
	}, [routesData])
	const getCounterGroup = async () => {
		const response = await axios({
			method: "get",
			url: "/counterGroup/GetCounterGroupList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setCounterGroup(response.data.result)
	}

	const getItemGroup = async () => {
		const response = await axios({
			method: "get",
			url: "/itemGroup/GetItemGroupList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setItemsGroup(response.data.result)
	}
	const getItemCategories = async () => {
		const response = await axios({
			method: "get",
			url: "/itemCategories/GetItemCategoryList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setCategory(response.data.result)
	}
	const getItemsData = async () => {
		const response = await axios({
			method: "get",
			url: "/items/GetActiveItemList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success)
			setItems(
				response.data.result.map(b => ({
					...b,
					company_title: company.find(a => a?.company_uuid === b?.company_uuid)?.company_title,
					category_title: Category.find(a => a?.category_uuid === b?.category_uuid)?.category_title,
				}))
			)
	}
	const getCompanies = async () => {
		const cachedData = localStorage.getItem('companiesData');
		
		if (cachedData) {
			setCompany(JSON.parse(cachedData));
		} else {
		  const response = await axios({
			method: "get",
			url: "/companies/getCompanies",
			headers: {
			  "Content-Type": "application/json",
			},
		  });
	  
		  if (response.data.success) {
			localStorage.setItem('companiesData', JSON.stringify(response.data.result));
			setCompany(response.data.result);
		  }
		}
	  };  
	useEffect(() => {
		getItemsData()
	}, [company, Category])
	useEffect(() => {
		getItemGroup()
		getCompanies()
		getCounterGroup()
		getItemCategories()
		getRoutesData()
	}, [])
	const submitHandler = async e => {
		e.preventDefault()
		if (!objData.qty_details.length) return
		let data = {
			...objData,
			qty_details: objData.qty_details.filter(a => a.add_qty && a.base_qty),
		}
		if (popupForm?.type === "edit") {
			const response = await axios({
				method: "put",
				url: "/autoBill/UpdateAutoQty",
				data,
				headers: {
					"Content-Type": "application/json",
				},
			})
			
			if (response.data.success) {
				onSave()
			}
		} else {
			const response = await axios({
				method: "post",
				url: "/autoBill/CreateAutoQty",
				data,
				headers: {
					"Content-Type": "application/json",
				},
			})
			
			if (response.data.success) {
				onSave()
			}
		}
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
					{+ui === 1 ? (
						<div style={{ overflowY: "scroll", height: "40vh" }}>
							<table
								className="user-table"
								style={{
									width: "60vw",

									overflow: "scroll",
								}}>
								<tbody>
									<tr>
										<td
											colSpan={2}
											style={{
												width: "50vw",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
											}}>
											<b>Auto Title : </b>
											<input
												className="searchInput"
												style={{
													border: "none",
													borderBottom: "2px solid black",
													borderRadius: "0px",
												}}
												placeholder="Title"
												value={objData.auto_title}
												onChange={e =>
													setObgData(prev => ({
														...prev,
														auto_title: e.target.value,
													}))
												}
											/>
										</td>
									</tr>
									{objData?.qty_details?.map((item, i) => (
										<tr key={item.item_uuid} style={{ height: "30px" }}>
											<td colSpan={4} style={{ textAlign: "center" }}>
												If quantity of base item is
												<input
													type="number"
													onWheel={e => e.target.blur()}
													className="searchInput"
													style={{
														border: "none",
														borderBottom: "2px solid black",
														borderRadius: "0px",
														width: "80px",
														padding: "0 5px",
													}}
													value={item?.base_qty}
													onChange={e =>
														setObgData(prev => ({
															...prev,
															qty_details: prev.qty_details.map(i =>
																i.uuid === item.uuid
																	? { ...i, base_qty: e.target.value }
																	: i
															),
														}))
													}
												/>
												, add / remove
												<input
													className="searchInput"
													style={{
														border: "none",
														borderBottom: "2px solid black",
														borderRadius: "0px",
														width: "80px",
														padding: "0 5px",
													}}
													type="number"
													onWheel={e => e.target.blur()}
													value={item.add_qty}
													onChange={e =>
														setObgData(prev => ({
															...prev,
															qty_details: prev.qty_details.map(i =>
																i.uuid === item.uuid
																	? { ...i, add_qty: e.target.value }
																	: i
															),
														}))
													}
												/>
											</td>

											<td>
												<select
													value={item.unit}
													className="select"
													style={{
														border: "none",
														borderBottom: "2px solid black",
														borderRadius: "0px",
														width: "80px",
													}}
													onChange={e =>
														setObgData(prev => ({
															...prev,
															qty_details: prev.qty_details.map(i =>
																i.uuid === item.uuid
																	? { ...i, unit: e.target.value }
																	: i
															),
														}))
													}>
													<option value="p">Pcs</option>
													<option value="b">Box</option>
												</select>
											</td>
											<td>
												<Delete
													onClick={e =>
														setObgData(prev => ({
															...prev,
															qty_details: prev.qty_details.filter(
																i => i.uuid !== item.uuid
															),
														}))
													}
												/>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							<button
								className="theme-btn"
								onClick={e =>
									setObgData(prev => ({
										...prev,
										qty_details: [...prev.qty_details, { ...DEFAULT, uuid: uuid() }],
									}))
								}>
								Add
							</button>
						</div>
					) : +ui === 2 ? (
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}>
							<div
								style={{
									overflowY: "scroll",
									height: "45vh",
								}}>
								<input
									type="text"
									onChange={e => setItemGroupTitle(e.target.value)}
									value={itemGroupTitle}
									placeholder="Search Item Group Title..."
									className="searchInput"
								/>

								<table className="table">
									<thead>
										<tr>
											<th className="description" style={{ width: "50%" }}>
												Item Group
											</th>
											<th style={{ width: "25%" }}>Action</th>
										</tr>
									</thead>
									<tbody>
										{filterItemGroupData
											?.filter(a => a.item_group_title)
											.filter(
												a =>
													!itemGroupTitle ||
													a.item_group_title
														.toLocaleLowerCase()
														.includes(itemGroupTitle.toLocaleLowerCase())
											)

											.map((item, index) => {
												return (
													<tr key={item.item_uuid}>
														<td>{item.item_group_title}</td>

														<td>
															<button
																type="button"
																className="noBgActionButton"
																style={{
																	backgroundColor: objData.item_groups?.filter(
																		a => a === item?.item_group_uuid
																	)?.length
																		? "red"
																		: "var(--mainColor)",
																	width: "150px",
																	fontSize: "large",
																}}
																onClick={event =>
																	setObgData(prev => ({
																		...objData,
																		item_groups: prev.item_groups.filter(
																			a => a === item.item_group_uuid
																		).length
																			? prev.item_groups.filter(
																					a => a !== item.item_group_uuid
																			  )
																			: prev.item_groups.length
																			? [
																					...prev.item_groups,
																					item.item_group_uuid,
																			  ]
																			: [item.item_group_uuid],
																	}))
																}>
																{objData.item_groups.filter(
																	a => a === item.item_group_uuid
																).length
																	? "Remove"
																	: "Add"}
															</button>
														</td>
													</tr>
												)
											})}
									</tbody>
								</table>
							</div>
							<div
								style={{
									overflowY: "scroll",
									height: "45vh",
								}}>
								<input
									type="text"
									onChange={e => setFilterTitle(e.target.value)}
									value={filterTitle}
									placeholder="Search Item Title..."
									className="searchInput"
								/>
								<input
									type="text"
									onChange={e => setFilterCompany(e.target.value)}
									value={filterCompany}
									placeholder="Search Company Title..."
									className="searchInput"
								/>
								<input
									type="text"
									onChange={e => setFilterCategory(e.target.value)}
									value={filterCategory}
									placeholder="Search Category Title..."
									className="searchInput"
								/>

								<table className="table">
									<thead>
										<tr>
											<th className="description" style={{ width: "25%" }}>
												Item
											</th>
											<th className="description" style={{ width: "25%" }}>
												Company
											</th>
											<th className="description" style={{ width: "25%" }}>
												Category
											</th>

											<th style={{ width: "25%" }}>Action</th>
										</tr>
									</thead>

									<tbody>
										{filterItemData
											?.filter(a => a.item_uuid)
											.filter(
												a =>
													!filterTitle ||
													a.item_title
														.toLocaleLowerCase()
														.includes(filterTitle.toLocaleLowerCase())
											)
											.filter(
												a =>
													!filterCompany ||
													a?.company_title
														.toLocaleLowerCase()
														.includes(filterCompany.toLocaleLowerCase())
											)
											.filter(
												a =>
													!filterCategory ||
													a?.category_title
														.toLocaleLowerCase()
														.includes(filterCategory.toLocaleLowerCase())
											)

											.map((item, index) => {
												return (
													<tr key={item.item_uuid}>
														<td>{item.item_title}</td>
														<td>{item.company_title}</td>
														<td>{item.category_title}</td>

														<td>
															<button
																type="button"
																className="noBgActionButton"
																style={{
																	backgroundColor: objData.items.filter(
																		a => a === item.item_uuid
																	)?.length
																		? "red"
																		: "var(--mainColor)",
																	width: "150px",
																	fontSize: "large",
																}}
																onClick={event =>
																	setObgData(prev => ({
																		...objData,
																		items: prev.items.filter(
																			a => a === item.item_uuid
																		).length
																			? prev.items.filter(
																					a => a !== item.item_uuid
																			  )
																			: prev.items.length
																			? [...prev.items, item.item_uuid]
																			: [item.item_uuid],
																	}))
																}>
																{objData.items.filter(a => a === item.item_uuid)?.length
																	? "Remove"
																	: "Add"}
															</button>
														</td>
													</tr>
												)
											})}
									</tbody>
								</table>
							</div>
						</div>
					) : (
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}>
							<div
								style={{
									overflowY: "scroll",
									height: "45vh",
								}}>
								<input
									type="text"
									onChange={e => setFilterCounterGroupTitle(e.target.value)}
									value={filterCounterGroupTitle}
									placeholder="Search Item Group Title..."
									className="searchInput"
								/>

								<table className="table">
									<thead>
										<tr>
											<th className="description" style={{ width: "50%" }}>
												Counter Group
											</th>
											<th style={{ width: "25%" }}>Action</th>
										</tr>
									</thead>
									<tbody>
										{filterCounterGroupData
											?.filter(a => a.counter_group_title)
											.filter(
												a =>
													!filterCounterGroupTitle ||
													a.counter_group_title
														.toLocaleLowerCase()
														.includes(filterCounterGroupTitle.toLocaleLowerCase())
											)

											.map((item, index) => {
												return (
													<tr key={item.item_uuid}>
														<td>{item.counter_group_title}</td>

														<td>
															<button
																type="button"
																className="noBgActionButton"
																style={{
																	backgroundColor: objData.counter_groups.filter(
																		a => a === item.counter_group_uuid
																	)?.length
																		? "red"
																		: "var(--mainColor)",
																	width: "150px",
																	fontSize: "large",
																}}
																onClick={event =>
																	setObgData(prev => ({
																		...objData,
																		counter_groups: prev.counter_groups.filter(
																			a => a === item.counter_group_uuid
																		).length
																			? prev.counter_groups.filter(
																					a => a !== item.counter_group_uuid
																			  )
																			: prev.counter_groups.length
																			? [
																					...prev.counter_groups,
																					item.counter_group_uuid,
																			  ]
																			: [item.counter_group_uuid],
																	}))
																}>
																{objData.counter_groups.filter(
																	a => a === item.counter_group_uuid
																)?.length
																	? "Remove"
																	: "Add"}
															</button>
														</td>
													</tr>
												)
											})}
									</tbody>
								</table>
							</div>
							<div
								style={{
									overflowY: "scroll",
									height: "45vh",
								}}>
								<input
									type="text"
									onChange={e => setFilterCounterTitle(e.target.value)}
									value={filterCounterTitle}
									placeholder="Search Counter Title..."
									className="searchInput"
								/>
								<input
									type="text"
									onChange={e => setFilterRoute(e.target.value)}
									value={filterRoute}
									placeholder="Search Route Title..."
									className="searchInput"
								/>

								<table className="table">
									<thead>
										<tr>
											<th className="description" style={{ width: "25%" }}>
												Counter
											</th>
											<th className="description" style={{ width: "25%" }}>
												Route
											</th>

											<th style={{ width: "25%" }}>Action</th>
										</tr>
									</thead>
									<tbody>
										{filterCounterata
											?.filter(a => a.counter_uuid)
											.filter(
												a =>
													!filterCounterTitle ||
													a.counter_title
														?.toLocaleLowerCase()
														.includes(filterCounterTitle.toLocaleLowerCase())
											)
											.filter(
												a =>
													!filterRoute ||
													a?.route_title
														?.toLocaleLowerCase()
														.includes(filterRoute.toLocaleLowerCase())
											)

											.map((item, index) => {
												return (
													<tr key={item.counter_uuid}>
														<td>{item.counter_title}</td>
														<td>{item.route_title}</td>

														<td>
															<button
																type="button"
																className="noBgActionButton"
																style={{
																	backgroundColor: objData.counters.filter(
																		a => a === item.counter_uuid
																	)?.length
																		? "red"
																		: "var(--mainColor)",
																	width: "150px",
																	fontSize: "large",
																}}
																onClick={event =>
																	setObgData(prev => ({
																		...objData,
																		counters: prev.counters.filter(
																			a => a === item.counter_uuid
																		).length
																			? prev.counters.filter(
																					a => a !== item.counter_uuid
																			  )
																			: prev.counters.length
																			? [...prev.counters, item.counter_uuid]
																			: [item.counter_uuid],
																	}))
																}>
																{objData.counters.filter(a => a === item.counter_uuid)
																	?.length
																	? "Remove"
																	: "Add"}
															</button>
														</td>
													</tr>
												)
											})}
									</tbody>
								</table>
							</div>
						</div>
					)}
					{+ui === 1 ? (
						<div
							style={{
								width: "100%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}>
							<button className="fieldEditButton" onClick={() => setUi(prev => prev + 1)}>
								Next
							</button>
						</div>
					) : +ui === 2 ? (
						<div
							style={{
								width: "100%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}>
							<button className="fieldEditButton" onClick={() => setUi(prev => prev - 1)}>
								Back
							</button>
							<button className="fieldEditButton" onClick={() => setUi(prev => prev + 1)}>
								Next
							</button>
						</div>
					) : (
						<div
							style={{
								width: "100%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}>
							<button className="fieldEditButton" onClick={() => setUi(prev => prev - 1)}>
								Back
							</button>
							<button className="fieldEditButton" onClick={submitHandler}>
								{popupForm?.type === "edit" ? "Update" : "Save"}
							</button>
						</div>
					)}
					<button onClick={onSave} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}
