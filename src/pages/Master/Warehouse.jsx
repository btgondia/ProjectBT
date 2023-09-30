import React, { useState, useEffect } from "react"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid"
import axios from "axios"
const Warehouse = () => {
	const [itemsData, setItemsData] = useState([])
	const [filterItemsData, setFilterItemsData] = useState([])

	const [popupForm, setPopupForm] = useState(false)
	const [filterTitle, setFilterTitle] = useState("")

	const getItemsData = async () => {
		const response = await axios({
			method: "get",
			url: "/warehouse/GetWarehouseAllList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setItemsData(response.data.result)
	}
	useEffect(() => {
		getItemsData()
	}, [popupForm])
	useEffect(
		() =>
			setFilterItemsData(
				itemsData
					.filter(a => a.warehouse_title)
					.filter(
						a =>
							!filterTitle ||
							a.warehouse_title.toLocaleLowerCase().includes(filterTitle.toLocaleLowerCase())
					)
			),
		[itemsData, filterTitle]
	)

	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading">
					<h2>Items</h2>
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
							placeholder="Search Warehouse Title..."
							className="searchInput"
						/>

						<div>Total Items: {filterItemsData.length}</div>
						<button className="theme-btn" onClick={() => setPopupForm(true)}>
							Add
						</button>
					</div>
				</div>
				<div className="table-container-user item-sales-container">
					<Table itemsDetails={filterItemsData} setPopupForm={setPopupForm} />
				</div>
			</div>
			{popupForm ? (
				<NewUserForm
					onSave={() => setPopupForm(false)}
					setItemsData={setItemsData}
					popupInfo={popupForm}
					items={itemsData}
				/>
			) : (
				""
			)}
		</>
	)
}
function Table({ itemsDetails, setPopupForm }) {
	const [items, setItems] = useState("sort_order")
	const [order, setOrder] = useState("")
	return (
		<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead>
				<tr>
					<th>S.N</th>

					<th colSpan={3}>
						<div className="t-head-element">
							<span>Warehouse Title</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("warehouse_title")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("warehouse_title")
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

							<td colSpan={3}>{item.warehouse_title}</td>
						</tr>
					))}
			</tbody>
		</table>
	)
}
function NewUserForm({ onSave, popupInfo, setItemsData }) {
	const [data, setdata] = useState({})

	const [errMassage, setErrorMassage] = useState("")

	useEffect(() => {
		if (popupInfo?.type === "edit")
			setdata({
				...popupInfo.data,
			})
	}, [popupInfo.data, popupInfo?.type])

	const submitHandler = async e => {
		e.preventDefault()

		if (!data.warehouse_title) {
			setErrorMassage("Please insert Route Title")
			return
		}

		if (popupInfo?.type === "edit") {
			const response = await axios({
				method: "put",
				url: "/warehouse/putWarehouse",
				data: [data],
				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.result[0].success) {
				setItemsData(prev => prev.map(i => (i.user_uuid === data.user_uuid ? data : i)))
				onSave()
			}
		} else {
			const response = await axios({
				method: "post",
				url: "/warehouse/postWarehouse",
				data,
				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.success) {
				setItemsData(prev => [...prev, data])
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
								<h1>{popupInfo.type === "edit" ? "Edit" : "Add"} Warehouse</h1>
							</div>

							<div className="formGroup">
								<div className="row">
									<label className="selectLabel">
										Warehouse Title
										<input
											type="text"
											name="route_title"
											className="numberInput"
											value={data?.warehouse_title}
											onChange={e =>
												setdata({
													...data,
													warehouse_title: e.target.value,
													pronounce: e.target.value,
												})
											}
											maxLength={60}
										/>
									</label>

									<label className="selectLabel">
										Status
										<input
											type="checkbox"
											name="status"
											className="numberInput"
											checked={data?.status}
											onChange={e =>
												setdata({
													...data,
													status: e.target.checked,
												})
											}
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

export default Warehouse
