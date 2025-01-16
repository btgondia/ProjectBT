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
			url: "/users/GetUserList",

			headers: {
				"Content-Type": "application/json"
			}
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
					.filter(a => disabledItem || a.status)
					.filter(a => !usersTitle || a.user_title?.toLocaleLowerCase()?.includes(usersTitle.toLocaleLowerCase()))
			),
		[disabledItem, users, usersTitle]
	)
	const getRoutesData = async () => {
		const response = await axios({
			method: "get",
			url: "/routes/GetRouteList",

			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setRoutes(response.data.result)
	}
	const getWarehouseData = async () => {
		const response = await axios({
			method: "get",
			url: "/warehouse/GetWarehouseList",

			headers: {
				"Content-Type": "application/json"
			}
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
					<h2>Users </h2>
				</div>
				<div id="item-sales-top">
					<div
						id="date-input-container"
						style={{
							overflow: "visible",
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							width: "100%"
						}}
					>
						<input
							type="text"
							onChange={e => setUsersTitle(e.target.value)}
							value={usersTitle}
							placeholder="Search User Title..."
							className="searchInput"
						/>

						<div>Total Items: {filterUsers.length}</div>
						<div
							style={{
								display: "flex",
								width: "120px",
								alignItems: "center",
								justifyContent: "space-between"
							}}
						>
							<input
								type="checkbox"
								onChange={e => setDisabledItem(e.target.checked)}
								value={disabledItem}
								className="searchInput"
								style={{ scale: "1.2" }}
							/>
							<div style={{ width: "100px" }}>Disabled Users</div>
						</div>

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
			<thead>
				<tr>
					<th>S.N</th>
					<th colSpan={2}>
						{" "}
						<div className="t-head-element">
							<span>User Title</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("user_title")
										setOrder("asc")
									}}
								>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("user_title")
										setOrder("desc")
									}}
								>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>User Type</span>
							<div className="sort-buttons-container"></div>
						</div>
					</th>
					<th colSpan={2}>
						{" "}
						<div className="t-head-element">
							<span>Login Id</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("login_username")
										setOrder("asc")
									}}
								>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("login_username")
										setOrder("desc")
									}}
								>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th style={{ width: "200px" }}>
						<div className="t-head-element">
							<span>Balance Incentive</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("incentive_balance")
										setOrder("asc")
									}}
								>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("incentive_balance")
										setOrder("desc")
									}}
								>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={2}>Permission</th>

					<th colSpan={2}>
						{" "}
						<div className="t-head-element">
							<span>Status</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("status")
										setOrder("asc")
									}}
								>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("status")
										setOrder("desc")
									}}
								>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
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
								setPopupForm({ type: "edit", data: item })
							}}
						>
							<td>{i + 1}</td>
							<td colSpan={2}>{item.user_title}</td>
							<td colSpan={2}>{+item.user_type === 0 ? "Admin" : "Other"}</td>
							<td colSpan={2}>{item.login_username}</td>
							<td colSpan={2} className="flex" style={{ justifyContent: "space-between" }}>
								{item.incentive_balance || 0}
								<button
									type="button"
									className="theme-btn"
									onClick={e => {
										e.stopPropagation()
										setPayoutPopup(item)
									}}
								>
									Payout
								</button>
							</td>
							<td colSpan={2}>{item?.user_role?.map((a, i) => (i === 0 ? a : "," + a)) || "-"}</td>

							<td colSpan={2}>{item.status}</td>
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
		status: "1"
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
					"Content-Type": "application/json"
				}
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
					"Content-Type": "application/json"
				}
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
						width: "fit-content"
					}}
				>
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
													user_title: e.target.value
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
													login_username: e.target.value
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
													login_password: e.target.value
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
													user_mobile: e.target.value
												})
											}
										/>
									</label>
								</div>
								<div className="row">
									<label
										className="selectLabel"
										style={{
											width: "50%"
										}}
									>
										User Type
										<select
											type="text"
											name="sort_order"
											className="numberInput"
											value={data?.user_type}
											onChange={e =>
												setdata({
													...data,
													user_type: e.target.value
												})
											}
											// style={{ height: "150px" }}
										>
											<option value={0}>Admin</option>
											<option value={1}>Others</option>
										</select>
									</label>
									<label className="selectLabel" style={{ width: "50%" }}>
										DMS ERP Id
										<input
											onWheel={e => e.target.blur()}
											name="dms_erp_id"
											className="numberInput"
											value={data?.dms_erp_id}
											onChange={e =>
												setdata({
													...data,
													dms_erp_id: e.target.value
												})
											}
										/>
									</label>
								</div>
								<div>
									<label
										className="selectLabel"
										style={{
											flexDirection: "row",
											alignItems: "center"
										}}
									>
										Status
										<input
											type="radio"
											name="sort_order"
											className="numberInput"
											checked={+data?.status === 1}
											onClick={e =>
												setdata(prev => ({
													...data,
													status: +prev.status === 1 ? 0 : 1
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
													let options = Array.from(e.target.selectedOptions, option => option.value)
													for (let i of options) {
														if (catData.filter(a => a === i).length) catData = catData.filter(a => a !== i)
														else catData = [...catData, i]
													}
													// data = occasionsData.filter(a => options.filter(b => b === a.occ_uuid).length)
													

													setdata({ ...data, user_role: catData })
												}}
												multiple
											>
												<option value="1">Order</option>
												<option value="7">Advance Ordering</option>
												<option value="2">Processing</option>
												<option value="3">Checking</option>
												<option value="4">Delivery</option>
												<option value="5">Stock Transfer</option>
												<option value="6">Collection</option>
												<option value="8">Stock Adjustment</option>
											</select>
										</label>
									) : (
										<>
											<label className="selectLabel" style={{ width: "50%" }}>
												Routes
												<div className="formGroup" style={{ height: "200px", overflow: "scroll" }}>
													<div
														style={{
															marginBottom: "5px",
															textAlign: "center",
															backgroundColor: data.routes?.filter(a => +a === 1).length ? "#caf0f8" : "#fff"
														}}
														onClick={e => {
															e.stopPropagation()
															setdata(prev => ({
																...prev,
																routes: [1]
															}))
														}}
													>
														All
													</div>
													<div
														style={{
															marginBottom: "5px",
															textAlign: "center",
															backgroundColor: data.routes?.filter(a => a === "none").length ? "#caf0f8" : "#fff"
														}}
														onClick={e => {
															e.stopPropagation()
															setdata(prev => {
																let routes = prev?.routes?.find(a => a === "none")
																	? prev?.routes?.filter(a => a !== "none")
																	: prev?.routes?.length && !prev.routes.filter(a => +a === 1).length
																	? [...prev?.routes, "none"]
																	: ["none"]
																return {
																	...prev,
																	routes
																}
															})
														}}
													>
														UnKnown
													</div>
													{routes.map(occ => (
														<div
															style={{
																marginBottom: "5px",
																textAlign: "center",
																backgroundColor: data.routes?.filter(a => a === occ.route_uuid).length
																	? "#caf0f8"
																	: "#fff"
															}}
															onClick={e => {
																e.stopPropagation()
																setdata(prev => ({
																	...prev,
																	routes: prev?.routes?.find(a => a === occ.route_uuid)
																		? prev?.routes?.filter(a => a !== occ.route_uuid)
																		: prev?.routes?.length && !prev.routes.filter(a => +a === 1).length
																		? [...prev?.routes, occ?.route_uuid]
																		: [occ?.route_uuid]
																}))
															}}
														>
															{occ.route_title}
														</div>
													))}
												</div>
											</label>
											<label className="selectLabel" style={{ width: "50%" }}>
												Warehouse
												<div className="formGroup" style={{ height: "200px", overflow: "scroll" }}>
													{/* <div
                            style={{
                              marginBottom: "5px",
                              textAlign: "center",
                              backgroundColor: data.warehouse?.filter(
                                (a) => a === "none"
                              ).length
                                ? "#caf0f8"
                                : "#fff",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setdata((prev) => ({
                                ...prev,
                                warehouse: prev?.warehouse?.find(
                                  (a) => a === "none"
                                )
                                  ? prev?.warehouse?.filter((a) => a !== "none")
                                  : prev?.warehouse?.length &&
                                    !prev.warehouse.filter((a) => +a === 1)
                                      .length
                                  ? [...prev?.warehouse, "none"]
                                  : ["none"],
                              }));
                            }}
                          >
                            None
                          </div>
                          <div
                            style={{
                              marginBottom: "5px",
                              textAlign: "center",
                              backgroundColor: data.warehouse?.filter(
                                (a) => +a === 1
                              ).length
                                ? "#caf0f8"
                                : "#fff",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setdata((prev) => ({
                                ...prev,
                                warehouse: [1],
                              }));
                            }}
                          >
                            All
                          </div> */}
													{warehouseData.map(occ => (
														<div
															style={{
																marginBottom: "5px",
																textAlign: "center",
																backgroundColor: data.warehouse?.filter(a => a === occ.warehouse_uuid).length
																	? "#caf0f8"
																	: "#fff"
															}}
															onClick={e => {
																e.stopPropagation()
																setdata(prev => ({
																	...prev,
																	warehouse:
																		//  prev?.warehouse?.find(
																		//   (a) => a === occ.warehouse_uuid
																		// )
																		//   ? prev?.warehouse?.filter(
																		//       (a) => a !== occ.warehouse_uuid
																		//     )
																		//   : prev?.warehouse?.length &&
																		//     !prev.warehouse.filter((a) => +a === 1)
																		//       .length
																		//   ? [...prev?.warehouse, occ?.warehouse_uuid]
																		//   :
																		[occ?.warehouse_uuid]
																}))
															}}
														>
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
	const [data, setdata] = useState({
		amount: 0,
		remarks: ""
	})
	const [errMassage, setErrorMassage] = useState("")

	const submitHandler = async e => {
		e.preventDefault()

		
		let obj = { user_uuid: popupInfo.user_uuid, ...data }
		const response = await axios({
			method: "post",
			url: "/incentiveStatment/postIncentiveStatment",
			data: obj,
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			getUsers()
			onSave()
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
						width: "fit-content"
					}}
				>
					<div style={{ overflowY: "scroll" }}>
						<form className="form" onSubmit={submitHandler}>
							<div className="row">
								<h1>{popupInfo?.user_title || "User"}- Payout</h1>
							</div>

							<div className="form">
								<div className="row">
									<label className="selectLabel">
										Payout Amount
										<input
											type="number"
											name="route_title"
											className="numberInput"
											value={data?.amount}
											onChange={e =>
												setdata({
													...data,
													amount: e.target.value
												})
											}
											maxLength={42}
										/>
									</label>
								</div>
								<div className="row">
									<label className="selectLabel">
										Remarks
										<textarea
											type="text"
											name="sort_order"
											className="numberInput"
											value={data?.login_username}
											onChange={e =>
												setdata({
													...data,
													login_username: e.target.value
												})
											}
											style={{ height: "150px" }}
										/>
									</label>
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
