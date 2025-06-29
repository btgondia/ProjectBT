import React, { useState, useEffect } from "react"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"
import axios from "axios"
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid"
const Users = () => {
	const [users, setUsers] = useState([])
	const [routes, setRoutes] = useState([])
	const [warehouseData, setWarehouseData] = useState([])
	const [filterUsers, setFilterUsers] = useState([])
	const [usersTitle, setUsersTitle] = useState("")
	const [popupForm, setPopupForm] = useState(false)
	const [payoutPopup, setPayoutPopup] = useState(false)
	const [disabledItem, setDisabledItem] = useState(false)

	const getUsers = async () => {
		const response = await axios({
			method: "get",
			url: "/users/GetNormalUserList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		
		if (response.data.success) setUsers(response.data.result)
	}

	useEffect(() => {
		getUsers()
	}, [popupForm])
	useEffect(
		() =>
			setFilterUsers(
				users
					.filter(a => a.user_title)
					//   .filter((a) => disabledItem || a.status)
					.filter(
						a => !usersTitle || a.user_title?.toLocaleLowerCase()?.includes(usersTitle.toLocaleLowerCase())
					)
			),
		[disabledItem, users, usersTitle]
	)
	const getRoutesData = async () => {
		const response = await axios({
			method: "get",
			url: "/routes/GetRouteList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setRoutes(response.data.result)
	}
	const getWarehouseData = async () => {
		const response = await axios({
			method: "get",
			url: "/warehouse/GetWarehouseList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setWarehouseData(response.data.result)
	}
	useEffect(() => {
		getRoutesData()
		getWarehouseData()
	}, [])
	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading">
					<h2>Salesman Item Suggestion </h2>
				</div>
				<div id="item-sales-top">
					<div
						id="date-input-container"
						style={{
							overflow: "visible",
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							width: "100%",
						}}>
						<input
							type="text"
							onChange={e => setUsersTitle(e.target.value)}
							value={usersTitle}
							placeholder="Search User Title..."
							className="searchInput"
						/>

						<div>Total Items: {filterUsers.length}</div>
						{/* <div
              style={{
                display: "flex",
                width: "120px",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
               <input
                type="checkbox"
                onChange={(e) => setDisabledItem(e.target.checked)}
                value={disabledItem}
                className="searchInput"
                style={{ scale: "1.2" }}
              /> 
              <div style={{ width: "100px" }}>Disabled Users</div> 
            </div>
*/}
						<button className="theme-btn" onClick={() => setPopupForm(true)}>
							Add
						</button>
					</div>
				</div>
				<div className="table-container-user item-sales-container">
					<Table itemsDetails={filterUsers} setPopupForm={setPopupForm} setPayoutPopup={setPayoutPopup} />
				</div>
			</div>
			{popupForm ? (
				<NewUserForm
					onSave={() => setPopupForm(false)}
					popupInfo={popupForm}
					setUsers={setUsers}
					routes={routes}
					warehouseData={warehouseData}
				/>
			) : (
				""
			)}
			{payoutPopup ? (
				<UserPayouts onSave={() => setPayoutPopup(false)} popupInfo={payoutPopup} getUsers={getUsers} />
			) : (
				""
			)}
		</>
	)
}

export default Users
function Table({ itemsDetails, setPopupForm, setPayoutPopup }) {
	const [items, setItems] = useState("user_title")
	const [order, setOrder] = useState("asc")
	return (
		<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead style={{ position: "sticky", top: 0 }}>
				<tr>
					<th>S.N</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>User Title</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("user_title")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("user_title")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>

					<th colSpan={2}>Action</th>
				</tr>
			</thead>
			<tbody className="tbody">
				{itemsDetails
					.filter(a => a.user_title)
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
							key={Math.random()}
							style={{ height: "30px" }}
							onClick={e => {
								e.stopPropagation()
								// setPopupForm({ type: "edit", data: item });
							}}>
							<td>{i + 1}</td>
							<td colSpan={2}>{item.user_title}</td>

							<td colSpan={2}>
								<button
									type="button"
									className="theme-btn"
									onClick={e => {
										e.stopPropagation()
										setPayoutPopup(item)
									}}>
									Item Suggestions
								</button>
							</td>
						</tr>
					))}
			</tbody>
		</table>
	)
}
function NewUserForm({ onSave, popupInfo, setUsers, routes, warehouseData }) {
	const [data, setdata] = useState({
		user_mobile: "",
		user_type: "1",
		status: "1",
	})
	const [errMassage, setErrorMassage] = useState("")
	useEffect(() => {
		if (popupInfo?.type === "edit") setdata(popupInfo.data)
	}, [popupInfo.data, popupInfo?.type])

	const submitHandler = async e => {
		e.preventDefault()
		if (!data.user_title || !data.login_password || !data.login_username) {
			setErrorMassage("Please insert user_title login_username login_password")
			return
		} else if (!(data.user_mobile === "" || data.user_mobile?.length === 10)) {
			setErrorMassage("Please enter 10 Numbers in Mobile")
			return
		}
		if (popupInfo?.type === "edit") {
			const response = await axios({
				method: "put",
				url: "/users/putUser",
				data,
				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.success) {
				setUsers(prev => prev.map(i => (i.user_uuid === data.user_uuid ? data : i)))
				onSave()
			}
		} else {
			const response = await axios({
				method: "post",
				url: "/users/postUser",
				data,
				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.success) {
				setUsers(prev => [...prev, data])
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
					<div style={{ overflowY: "scroll" }}>
						<form className="form" onSubmit={submitHandler}>
							<div className="row">
								<h1>{popupInfo.type === "edit" ? "Edit" : "Add"} User </h1>
							</div>

							<div className="form">
								<div className="row">
									<label className="selectLabel">
										User Title
										<input
											type="text"
											name="route_title"
											className="numberInput"
											value={data?.user_title}
											onChange={e =>
												setdata({
													...data,
													user_title: e.target.value,
												})
											}
											maxLength={42}
										/>
									</label>

									<label className="selectLabel">
										Login Username
										<input
											type="text"
											name="sort_order"
											className="numberInput"
											value={data?.login_username}
											onChange={e =>
												setdata({
													...data,
													login_username: e.target.value,
												})
											}
										/>
									</label>
								</div>
								<div className="row">
									<label className="selectLabel" style={{ width: "50%" }}>
										Login Password
										<input
											type="text"
											name="sort_order"
											className="numberInput"
											value={data?.login_password}
											onChange={e =>
												setdata({
													...data,
													login_password: e.target.value,
												})
											}
										/>
									</label>
									<label className="selectLabel" style={{ width: "50%" }}>
										Mobile
										<input
											type="number"
											onWheel={e => e.target.blur()}
											name="sort_order"
											className="numberInput"
											value={data?.user_mobile}
											onChange={e =>
												setdata({
													...data,
													user_mobile: e.target.value,
												})
											}
										/>
									</label>
								</div>
								<div className="row">
									<label
										className="selectLabel"
										style={{
											width: "50%",
										}}>
										User Type
										<select
											type="text"
											name="sort_order"
											className="numberInput"
											value={data?.user_type}
											onChange={e =>
												setdata({
													...data,
													user_type: e.target.value,
												})
											}
											// style={{ height: "150px" }}
										>
											<option value={0}>Admin</option>
											<option value={1}>Others</option>
										</select>
									</label>
									<label
										className="selectLabel"
										style={{
											flexDirection: "row",
											alignItems: "center",
										}}>
										Status
										<input
											type="radio"
											name="sort_order"
											className="numberInput"
											checked={+data?.status === 1}
											onClick={e =>
												setdata(prev => ({
													...data,
													status: +prev.status === 1 ? 0 : 1,
												}))
											}
										/>
									</label>
								</div>
								<div className="row">
									{+data.user_type ? (
										<label className="selectLabel" style={{ height: "100px" }}>
											Roles
											<select
												name="user_type"
												className="select"
												value={data?.user_role}
												style={{ height: "100px" }}
												onChange={e => {
													let catData = data?.user_role || []
													let options = Array.from(
														e.target.selectedOptions,
														option => option.value
													)
													for (let i of options) {
														if (catData.filter(a => a === i).length)
															catData = catData.filter(a => a !== i)
														else catData = [...catData, i]
													}
													// data = occasionsData.filter(a => options.filter(b => b === a.occ_uuid).length)
													

													setdata({ ...data, user_role: catData })
												}}
												multiple>
												<option value="1">Order</option>
												<option value="2">Processing</option>
												<option value="3">Checking</option>
												<option value="4">Delivery</option>
											</select>
										</label>
									) : (
										<>
											<label className="selectLabel" style={{ width: "50%" }}>
												Routes
												<div
													className="formGroup"
													style={{ height: "200px", overflow: "scroll" }}>
													<div
														style={{
															marginBottom: "5px",
															textAlign: "center",
															backgroundColor: data.routes?.filter(a => +a === 1).length
																? "#caf0f8"
																: "#fff",
														}}
														onClick={e => {
															e.stopPropagation()
															setdata(prev => ({
																...prev,
																routes: [1],
															}))
														}}>
														All
													</div>
													<div
														style={{
															marginBottom: "5px",
															textAlign: "center",
															backgroundColor: data.routes?.filter(a => a === "none")
																.length
																? "#caf0f8"
																: "#fff",
														}}
														onClick={e => {
															e.stopPropagation()
															setdata(prev => {
																let routes = prev?.routes?.find(a => a === "none")
																	? prev?.routes?.filter(a => a !== "none")
																	: prev?.routes?.length &&
																	  !prev.routes.filter(a => +a === 1).length
																	? [...prev?.routes, "none"]
																	: ["none"]
																return {
																	...prev,
																	routes,
																}
															})
														}}>
														UnKnown
													</div>
													{routes.map(occ => (
														<div
															style={{
																marginBottom: "5px",
																textAlign: "center",
																backgroundColor: data.routes?.filter(
																	a => a === occ.route_uuid
																).length
																	? "#caf0f8"
																	: "#fff",
															}}
															onClick={e => {
																e.stopPropagation()
																setdata(prev => ({
																	...prev,
																	routes: prev?.routes?.find(
																		a => a === occ.route_uuid
																	)
																		? prev?.routes?.filter(
																				a => a !== occ.route_uuid
																		  )
																		: prev?.routes?.length &&
																		  !prev.routes.filter(a => +a === 1).length
																		? [...prev?.routes, occ?.route_uuid]
																		: [occ?.route_uuid],
																}))
															}}>
															{occ.route_title}
														</div>
													))}
												</div>
											</label>
											<label className="selectLabel" style={{ width: "50%" }}>
												Warehouse
												<div
													className="formGroup"
													style={{ height: "200px", overflow: "scroll" }}>
													<div
														style={{
															marginBottom: "5px",
															textAlign: "center",
															backgroundColor: data.warehouse?.filter(a => a === "none")
																.length
																? "#caf0f8"
																: "#fff",
														}}
														onClick={e => {
															e.stopPropagation()
															setdata(prev => ({
																...prev,
																warehouse: prev?.warehouse?.find(a => a === "none")
																	? prev?.warehouse?.filter(a => a !== "none")
																	: prev?.warehouse?.length &&
																	  !prev.warehouse.filter(a => +a === 1).length
																	? [...prev?.warehouse, "none"]
																	: ["none"],
															}))
														}}>
														None
													</div>
													<div
														style={{
															marginBottom: "5px",
															textAlign: "center",
															backgroundColor: data.warehouse?.filter(a => +a === 1)
																.length
																? "#caf0f8"
																: "#fff",
														}}
														onClick={e => {
															e.stopPropagation()
															setdata(prev => ({
																...prev,
																warehouse: [1],
															}))
														}}>
														All
													</div>
													{warehouseData.map(occ => (
														<div
															style={{
																marginBottom: "5px",
																textAlign: "center",
																backgroundColor: data.warehouse?.filter(
																	a => a === occ.warehouse_uuid
																).length
																	? "#caf0f8"
																	: "#fff",
															}}
															onClick={e => {
																e.stopPropagation()
																setdata(prev => ({
																	...prev,
																	warehouse: prev?.warehouse?.find(
																		a => a === occ.warehouse_uuid
																	)
																		? prev?.warehouse?.filter(
																				a => a !== occ.warehouse_uuid
																		  )
																		: prev?.warehouse?.length &&
																		  !prev.warehouse.filter(a => +a === 1).length
																		? [...prev?.warehouse, occ?.warehouse_uuid]
																		: [occ?.warehouse_uuid],
																}))
															}}>
															{occ.warehouse_title}
														</div>
													))}
												</div>
											</label>
										</>
									)}
								</div>
							</div>
							<i style={{ color: "red" }}>{errMassage === "" ? "" : "Error: " + errMassage}</i>

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
function UserPayouts({ onSave, popupInfo, getUsers }) {
	const [salesmanSuggestion, setSalesmanSuggestion] = useState([])
	const [items, setItems] = useState([])
	const [filterItemData, setFilterItemData] = useState([])
	const [filterTitle, setFilterTitle] = useState("")
	const [filterCategory, setFilterCategory] = useState("")
	const [filterCompany, setFilterCompany] = useState("")
	const [company, setCompany] = useState([])
	const [Category, setCategory] = useState([])
	const [errMassage, setErrorMassage] = useState("")

	useEffect(() => {
		setSalesmanSuggestion(popupInfo?.salesman_suggestion || [])
	}, [popupInfo])
	useEffect(() => {
		setFilterItemData(
			items.sort((a, b) => {
				let aLength = salesmanSuggestion.filter(c => c === a.item_uuid)?.length
				let bLength = salesmanSuggestion.filter(c => c === b.item_uuid)?.length
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
	}, [items])
	const submitHandler = async e => {
		e.preventDefault()

		
		let obj = {
			user_uuid: popupInfo.user_uuid,
			salesman_suggestion: salesmanSuggestion,
		}
		const response = await axios({
			method: "put",
			url: "/users/putUser",
			data: obj,
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			getUsers()
			onSave()
		}
	}
	const getItemsData = async (companyData, ItemCategoryData) => {
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
					company_title: companyData.find(a => a?.company_uuid === b?.company_uuid)?.company_title,
					category_title: ItemCategoryData.find(a => a?.category_uuid === b?.category_uuid)?.category_title,
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
	useEffect(() => {
		getItemsData(company, Category)
	}, [company, Category])
	useEffect(() => {
		getCompanies()

		getItemCategories()
	}, [])
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
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							flexDirection: "column",
						}}>
						<div>
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

							<table
								className="table"
								style={{
									width: "100%",
									maxHeight: "60vh",
									minHeight: "60vh",
									overflow: "auto",
									display: "block",
								}}>
								<thead style={{ width: "100%", position: "sticky", top: 0 }}>
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
																backgroundColor: salesmanSuggestion?.filter(
																	a => a === item.item_uuid
																)?.length
																	? "red"
																	: "var(--mainColor)",
																width: "150px",
																fontSize: "large",
															}}
															onClick={event => {
																if (
																	!salesmanSuggestion.find(
																		a => a === item.item_uuid
																	) &&
																	salesmanSuggestion.length >= 6
																) {
																	setErrorMassage(
																		"Max 6 items (Maximum 6 selections allowed)"
																	)
																	return
																}
																setSalesmanSuggestion(prev =>
																	prev.filter(a => a === item.item_uuid).length
																		? prev.filter(a => a !== item.item_uuid)
																		: prev.length
																		? [...prev, item.item_uuid]
																		: [item.item_uuid]
																)
															}}>
															{salesmanSuggestion.filter(a => a === item.item_uuid)
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
						<i style={{ color: "red" }}>{errMassage === "" ? "" : "Error: " + errMassage}</i>
						<button type="button" onClick={submitHandler} className="submit">
							Save changes
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
