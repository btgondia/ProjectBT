import React, { useState, useEffect } from "react"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid"
import axios from "axios"
import Select from "react-select"
const ItemsPage = () => {
	const [itemsData, setItemsData] = useState([])
	const [filterItemsData, setFilterItemsData] = useState([])
	const [filterUsers, setFilterUsers] = useState([])
	const [counters, setCounter] = useState([])
	const [popupForm, setPopupForm] = useState(false)
	const [filterTitle, setFilterTitle] = useState("")
	const [users, setUsers] = useState([])
	const [FilterCounter, setFilterCounter] = useState("")
	const [completed, setCompleted] = useState(0)
	const getUsers = async () => {
		const response = await axios({
			method: "get",
			url: "/users/GetUserList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		
		if (response.data.success) setUsers(response.data.result)
	}
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
	const getItemsData = async () => {
		const response = await axios({
			method: "get",
			url: "/tasks/GetTasksList/" + completed,

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success)
			setItemsData(
				response.data.result.map(b => ({
					...b,
					counter_title:
						+b.counter_uuid === 0
							? "None"
							: counters.find(a => a.counter_uuid === b.counter_uuid)?.counter_title || "-",
					created_by_user:
						+b.created_by === 240522
							? "Admin"
							: users.find(a => a.created_by === b.user_uuid)?.user_title || "-",
					completed_by_user:
						+b.completed_by === 240522
							? "Admin"
							: users.find(a => a.completed_by === b.user_uuid)?.user_title || "-",
					users_name: b?.assigned_to?.map(a => users.find(c => a === c.user_uuid)?.user_title) || [],
				}))
			)
		else setItemsData([])
	}
	useEffect(() => {
		getItemsData()
	}, [popupForm, counters, users, completed])
	useEffect(() => {
		setFilterItemsData(
			itemsData
				.filter(a => a.task)
				.filter(a => !filterTitle || a.task.toLocaleLowerCase().includes(filterTitle.toLocaleLowerCase()))
				.filter(
					a =>
						!FilterCounter ||
						a.counter_title.toLocaleLowerCase().includes(FilterCounter.toLocaleLowerCase())
				)
			// .filter(
			//   (a) =>
			//     !filterUsers ||
			//     a.created_by_user
			//       .toLocaleLowerCase()
			//       .includes(FilterCounter.toLocaleLowerCase())
			// )
		)
	}, [FilterCounter, filterTitle, filterUsers, itemsData])

	useEffect(() => {
		getCounter()
		getUsers()
	}, [])
	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading">
					<h2>Tasks</h2>
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
							onChange={e => setFilterTitle(e.target.value)}
							value={filterTitle}
							placeholder="Search Task..."
							className="searchInput"
						/>
						<input
							type="text"
							onChange={e => setFilterCounter(e.target.value)}
							value={FilterCounter}
							placeholder="Search Counter..."
							className="searchInput"
						/>
						{/* <input
              type="text"
              onChange={(e) => setFilterUsers(e.target.value)}
              value={filterUsers}
              placeholder="Search User..."
              className="searchInput"
            /> */}
						<select
							type="text"
							onChange={e => {
								setCompleted(e.target.value)
								
							}}
							value={completed}
							placeholder="Search User..."
							className="searchInput">
							<option value={0}>Incomplete Tast</option>
							<option value={1}>Completed Task</option>
						</select>

						<div>Total Tasks: {filterItemsData.length}</div>
						<button className="theme-btn" onClick={() => setPopupForm(true)}>
							Add
						</button>
					</div>
				</div>
				<div className="table-container-user item-sales-container">
					<Table
						itemsDetails={filterItemsData}
						counters={counters}
						setPopupForm={setPopupForm}
						completed={completed}
					/>
				</div>
			</div>
			{popupForm ? (
				<NewUserForm
					onSave={() => setPopupForm(false)}
					setItemsData={setItemsData}
					counter={counters}
					popupInfo={popupForm}
					users={users}
				/>
			) : (
				""
			)}
		</>
	)
}

export default ItemsPage
function Table({ itemsDetails, setPopupForm, completed }) {
	const [items, setItems] = useState("sort_order")
	const [order, setOrder] = useState("")

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
	return (
		<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead>
				<tr>
					<th>S.N</th>
					<th colSpan={3}>
						<div className="t-head-element">
							<span>Counter Title</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("counter_title")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("counter_title")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={3}>
						<div className="t-head-element">
							<span>Created by</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("created_by_user")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("created_by_user")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={3}>
						<div className="t-head-element">
							<span>Created At</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("created_at")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("created_at")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					{completed ? (
						<>
							<th colSpan={3}>
								<div className="t-head-element">
									<span>Completed by</span>
									<div className="sort-buttons-container">
										<button
											onClick={() => {
												setItems("completed_by_user")
												setOrder("asc")
											}}>
											<ChevronUpIcon className="sort-up sort-button" />
										</button>
										<button
											onClick={() => {
												setItems("completed_by_user")
												setOrder("desc")
											}}>
											<ChevronDownIcon className="sort-down sort-button" />
										</button>
									</div>
								</div>
							</th>
							<th colSpan={3}>
								<div className="t-head-element">
									<span>Completed At</span>
									<div className="sort-buttons-container">
										<button
											onClick={() => {
												setItems("completed_at")
												setOrder("asc")
											}}>
											<ChevronUpIcon className="sort-up sort-button" />
										</button>
										<button
											onClick={() => {
												setItems("completed_at")
												setOrder("desc")
											}}>
											<ChevronDownIcon className="sort-down sort-button" />
										</button>
									</div>
								</div>
							</th>
						</>
					) : (
						""
					)}
					<th colSpan={3}>
						<div className="t-head-element">
							<span>Task</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("task")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("task")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={2}>Users</th>
					{completed ? "" : <th colSpan={6}></th>}
				</tr>
			</thead>
			<tbody className="tbody">
				{itemsDetails
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
						<tr key={Math.random()} style={{ height: "30px" }}>
							<td>{i + 1}</td>
							<td colSpan={3}>{item.counter_title}</td>
							<td colSpan={3}>{item.created_by_user}</td>
							<td colSpan={3}>
								{new Date(+item.created_at).toDateString()} - {formatAMPM(new Date(+item.created_at))}
							</td>
							{completed ? (
								<>
									<td colSpan={3}>{item.completed_by_user}</td>
									<td colSpan={3}>
										{new Date(+item.completed_at).toDateString()} -{" "}
										{formatAMPM(new Date(+item.completed_at))}
									</td>
								</>
							) : (
								""
							)}
							<td colSpan={3}>{item.task}</td>
							<td colSpan={2}>
								{item?.users_name?.length
									? item.users_name.map((a, i) => (i === 0 ? a : ", " + a))
									: ""}
							</td>
							{completed ? (
								""
							) : (
								<>
									<td colSpan={2}>
										<button
											className="theme-btn"
											onClick={e => {
												e.stopPropagation()
												if (+item.status === 0) setPopupForm({ type: "user", data: item })
											}}>
											Assign
										</button>
									</td>
									<td colSpan={2}>
										<button
											className="theme-btn"
											onClick={e => {
												e.stopPropagation()
												if (+item.status === 0) setPopupForm({ type: "edit", data: item })
											}}>
											Edit
										</button>
									</td>
									<td colSpan={2}>
										<button
											className="theme-btn"
											onClick={e => {
												e.stopPropagation()
												setPopupForm({ type: "done", data: item })
											}}>
											Done
										</button>
									</td>
								</>
							)}
						</tr>
					))}
			</tbody>
		</table>
	)
}
function NewUserForm({ onSave, popupInfo, counter, users }) {
	const [data, setdata] = useState({})

	const [errMassage, setErrorMassage] = useState("")

	useEffect(() => {
		if (popupInfo?.type === "edit") setdata(popupInfo.data)
		else if (popupInfo?.type === "user")
			setdata({
				task_uuid: popupInfo.data.task_uuid,
				assigned_to: popupInfo.data.assigned_to || [],
			})
		else if (popupInfo?.type === "done")
			setdata({
				...popupInfo.data,
				completed_by: localStorage.getItem("user_uuid"),
				status: 1,
				completed: true,
			})
		else
			setdata({
				counter_uuid: 0,
				task: "",
				created_by: localStorage.getItem("user_uuid"),
			})
	}, [popupInfo.data, popupInfo?.type])

	const submitHandler = async e => {
		e.preventDefault()

		if (!data.task && popupInfo.type !== "user") {
			setErrorMassage("Please insert Route Title")
			return
		}

		if (popupInfo?.type === "edit" || popupInfo?.type === "done" || popupInfo?.type === "user") {
			const response = await axios({
				method: "put",
				url: "/tasks/putTask",
				data: [data],
				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.result[0].success) {
				onSave()
			}
		} else {
			const response = await axios({
				method: "post",
				url: "/tasks/postTask",
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
			<div className="modal" style={{ width: "fit-content" }}>
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
								<h1>
									{popupInfo.type === "edit"
										? "Edit"
										: popupInfo.type === "user"
										? "Assign User"
										: popupInfo.type === "done"
										? "Confirm Complete "
										: "Add"}{" "}
									Task
								</h1>
							</div>

							{popupInfo?.type === "done" ? (
								""
							) : popupInfo?.type === "user" ? (
								<div className="formGroup">
									<div className="row">
										<label className="selectLabel">
											Users
											<div className="formGroup" style={{ height: "200px", overflow: "scroll" }}>
												{users.map(occ => (
													<div
														style={{
															marginBottom: "5px",
															textAlign: "center",
															backgroundColor: data?.assigned_to?.filter(
																a => a === occ.user_uuid
															).length
																? "#caf0f8"
																: "#fff",
														}}
														onClick={e => {
															e.stopPropagation()
															setdata(prev => ({
																...prev,
																assigned_to: prev?.assigned_to?.find(
																	a => a === occ.user_uuid
																)
																	? prev?.assigned_to.filter(a => a !== occ.user_uuid)
																	: prev?.assigned_to.length
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
								</div>
							) : (
								<div className="formGroup">
									<div className="row">
										<label className="selectLabel">
											Task
											<textarea
												type="text"
												name="route_title"
												className="numberInput"
												style={{ height: "150px" }}
												value={data?.task}
												onChange={e =>
													setdata({
														...data,
														task: e.target.value,
													})
												}
											/>
										</label>
									</div>
									<div className="row">
										<label className="selectLabel" style={{ width: "400px" }}>
											Counter
											<Select
												value={
													data?.counter_uuid
														? {
																value: data?.counter_uuid,
																label: counter?.find(
																	j => j.counter_uuid === data.counter_uuid
																)?.counter_title,
														  }
														: { value: 0, label: "None" }
												}
												onChange={e =>
													setdata({
														...data,
														counter_uuid: e.value,
													})
												}
												options={[
													{ value: 0, label: "None" },
													...counter.map(a => ({
														value: a.counter_uuid,
														label:
															a.counter_title + " , " + a.route_title + ", " + a.address,
													})),
												]}
												openMenuOnFocus={true}
												menuPosition="fixed"
												menuPlacement="auto"
												placeholder="Select"
											/>
										</label>
									</div>
								</div>
							)}

							<i style={{ color: "red" }}>{errMassage === "" ? "" : "Error: " + errMassage}</i>

							<button type="submit" className="submit">
								{popupInfo?.type === "edit" ? "Confirm" : "Save changes"}
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
