import React, { useState, useEffect } from "react"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"
import "./styles.css"
import axios from "axios"
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid"
import Select from "react-select"

const RoutesPage = () => {
	const [routesData, setRoutesData] = useState([])
	const [filterRoutesData, setFilterRoutesData] = useState([])
	const [filterRoutesTitle, setFilterRouteTitle] = useState("")
	const [popupForm, setPopupForm] = useState(false)
	const [warehouseData, setWarehouseData] = useState([])

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
	useEffect(() => {
		getRoutesData()
	}, [popupForm])
	useEffect(
		() =>
			setFilterRoutesData(
				routesData
					.filter(a => a.route_title)
					.filter(
						a =>
							!filterRoutesTitle ||
							a.route_title?.toLocaleLowerCase()?.includes(filterRoutesTitle.toLocaleLowerCase())
					)
			),
		[routesData, filterRoutesTitle]
	)
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
		getWarehouseData()
	}, [])
	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading">
					<h2>Routes</h2>
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
							onChange={e => setFilterRouteTitle(e.target.value)}
							value={filterRoutesTitle}
							placeholder="Search Route Title..."
							className="searchInput"
						/>

						<div>Total Items: {filterRoutesData.length}</div>
						<button className="theme-btn" onClick={() => setPopupForm(true)}>
							Add
						</button>
					</div>
				</div>
				<div className="table-container-user item-sales-container">
					<Table itemsDetails={filterRoutesData} setPopupForm={setPopupForm} warehouseData={warehouseData} />
				</div>
			</div>
			{popupForm ? (
				<NewUserForm
					onSave={() => setPopupForm(false)}
					setRoutesData={setRoutesData}
					popupInfo={popupForm}
					warehouseData={warehouseData}
				/>
			) : (
				""
			)}
		</>
	)
}

export default RoutesPage
function Table({ itemsDetails, setPopupForm }) {
	const [items, setItems] = useState("sort_order")
	const [order, setOrder] = useState("asc")
	return (
		<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead>
				<tr>
					<th>S.N</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>Routes Title</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("route_title")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("route_title")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
				</tr>
			</thead>
			<tbody className="tbody">
				{itemsDetails
					.filter(a => a.route_title)
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
							onClick={() => setPopupForm({ type: "edit", data: item })}>
							<td>{i + 1}</td>
							<td colSpan={2}>{item.route_title}</td>
						</tr>
					))}
			</tbody>
		</table>
	)
}
function NewUserForm({ onSave, popupInfo, setRoutesData, warehouseData }) {
	const [data, setdata] = useState({})

	const [errMassage, setErrorMassage] = useState("")
	useEffect(() => {
		if (popupInfo?.type === "edit") setdata(popupInfo.data)
	}, [popupInfo.data, popupInfo?.type])

	const submitHandler = async e => {
		e.preventDefault()
		if (!data.route_title) {
			setErrorMassage("Please insert Route Title")
			return
		}
		if (popupInfo?.type === "edit") {
			const response = await axios({
				method: "put",
				url: "/routes/putRoute",
				data,
				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.success) {
				setRoutesData(prev => prev.map(i => (i.user_uuid === data.user_uuid ? data : i)))
				onSave()
			}
		} else {
			const response = await axios({
				method: "post",
				url: "/routes/postRoute",
				data,
				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.success) {
				setRoutesData(prev => [...prev, data])
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
								<h1>{popupInfo.type === "edit" ? "Edit" : "Add"} Route</h1>
							</div>

							<div className="formGroup">
								<div className="row">
									<label className="selectLabel">
										Route Title
										<input
											type="text"
											name="route_title"
											className="numberInput"
											value={data?.route_title}
											onChange={e =>
												setdata({
													...data,
													route_title: e.target.value,
												})
											}
											maxLength={42}
										/>
									</label>
									<label className="selectLabel">
										Sort Order
										<input
											type="number"
											onWheel={e => e.target.blur()}
											name="sort_order"
											className="numberInput"
											value={data?.sort_order}
											onChange={e =>
												setdata({
													...data,
													sort_order: e.target.value,
												})
											}
										/>
									</label>
								</div>
								<div className="row">
									<label className="selectLabel" style={{ width: "400px" }}>
										Warehouse
										<Select
											options={warehouseData.map(a => ({
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
															value: data?.warehouse_uuid,
															label: warehouseData?.find(
																j => j.warehouse_uuid === data.warehouse_uuid
															)?.warehouse_title,
													  }
													: ""
											}
											openMenuOnFocus={true}
											menuPosition="fixed"
											menuPlacement="auto"
											placeholder="Select"
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
