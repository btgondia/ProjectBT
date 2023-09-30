import React, { useState, useEffect, useMemo, useContext } from "react"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid"
import { DeleteOutline } from "@mui/icons-material"
import axios from "axios"
import noimg from "../../assets/noimg.jpg"
import { server } from "../../App"
import context from "../../context/context"
import { v4 as uuid } from "uuid"
import Compressor from "compressorjs"

const ItemsPage = () => {
	const [itemsData, setItemsData] = useState([])
	const [disabledItem, setDisabledItem] = useState(false)
	const [itemCategories, setItemCategories] = useState([])
	const [companies, setCompanies] = useState([])
	const [popupForm, setPopupForm] = useState(false)
	const [deletePopup, setDeletePopup] = useState(false)
	const [filterTitle, setFilterTitle] = useState("")
	const [filterCategory, setFilterCategory] = useState("")
	const [filterCompany, setFilterCompany] = useState("")
	const { setNotification } = useContext(context)
	const getItemCategories = async (controller = new AbortController()) => {
		const response = await axios({
			method: "get",
			url: "/itemCategories/GetItemCategoryList",
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setItemCategories(response.data.result)
	}
	const getItemsData = async (controller = new AbortController()) => {
		const response = await axios({
			method: "get",
			url: "/items/GetItemData",
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setItemsData(response.data.result)
	}
	useEffect(() => {
		const controller = new AbortController()
		getItemsData(controller)
		return () => {
			controller.abort()
		}
	}, [popupForm])
	const filterItemsData = useMemo(
		() =>
			itemsData
				.map(b => ({
					...b,
					company_title: companies.find(a => a.company_uuid === b.company_uuid)?.company_title || "-",
					category_title:
						itemCategories.find(a => a.category_uuid === b.category_uuid)?.category_title || "-",
				}))
				.filter(
					a =>
						a.item_title &&
						(disabledItem || a.status) &&
						(!filterTitle || a.item_title.toLocaleLowerCase().includes(filterTitle.toLocaleLowerCase())) &&
						(!filterCompany ||
							a.company_title.toLocaleLowerCase().includes(filterCompany.toLocaleLowerCase())) &&
						(!filterCategory ||
							a.category_title.toLocaleLowerCase().includes(filterCategory.toLocaleLowerCase()))
				),
		[companies, disabledItem, filterCategory, filterCompany, filterTitle, itemCategories, itemsData]
	)

	const getCompanies = async (controller = new AbortController()) => {
		const response = await axios({
			method: "get",
			url: "/companies/getCompanies",
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setCompanies(response.data.result)
	}
	useEffect(() => {
		const controller = new AbortController()
		getCompanies(controller)
		getItemCategories()
		return () => {
			controller.abort(controller)
		}
	}, [])
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
							placeholder="Search Item Title..."
							className="searchInput"
						/>
						<input
							type="text"
							onChange={e => setFilterCompany(e.target.value)}
							value={filterCompany}
							placeholder="Search Company..."
							className="searchInput"
						/>
						<input
							type="text"
							onChange={e => setFilterCategory(e.target.value)}
							value={filterCategory}
							placeholder="Search Category..."
							className="searchInput"
						/>
						<div>Total Items: {filterItemsData.length}</div>
						<div
							style={{
								display: "flex",
								width: "120px",
								alignItems: "center",
								justifyContent: "space-between",
							}}>
							<input
								type="checkbox"
								onChange={e => setDisabledItem(e.target.checked)}
								value={disabledItem}
								className="searchInput"
								style={{ scale: "1.2" }}
							/>
							<div style={{ width: "100px" }}>Disabled Items</div>
						</div>

						<button className="theme-btn" onClick={() => setPopupForm(true)}>
							Add
						</button>
					</div>
				</div>
				<div className="table-container-user item-sales-container">
					<Table
						itemsDetails={filterItemsData}
						categories={itemCategories}
						companies={companies}
						setPopupForm={setPopupForm}
						setDeletePopup={setDeletePopup}
					/>
				</div>
			</div>
			{popupForm ? (
				<NewUserForm
					onSave={() => {
						setPopupForm(false)
						getItemsData()
					}}
					setItemsData={setItemsData}
					companies={companies}
					itemCategories={itemCategories}
					popupInfo={popupForm}
					items={itemsData}
					setNotification={setNotification}
				/>
			) : (
				""
			)}
			{deletePopup ? (
				<DeleteItemPopup
					onSave={() => {
						setDeletePopup(false)
						getItemsData()
					}}
					setItemsData={setItemsData}
					popupInfo={deletePopup}
				/>
			) : (
				""
			)}
		</>
	)
}

export default ItemsPage
function Table({ itemsDetails, setPopupForm, setDeletePopup }) {
	const [items, setItems] = useState("sort_order")
	const [order, setOrder] = useState("")

	console.log(items)
	return (
		<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead>
				<tr>
					<th>S.N</th>
					<th colSpan={3}>
						<div className="t-head-element">
							<span>Company Title</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("company_title")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("company_title")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={3}>
						<div className="t-head-element">
							<span>Category Title</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("category_title")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("category_title")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={3}>
						<div className="t-head-element">
							<span>Item Title</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("item_title")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("item_title")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>MRP</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("mrp")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("mrp")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>Code</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("item_code")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("item_code")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>Discount</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("item_discount")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("item_discount")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>Selling Price</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("item_price")

										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("item_price")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>Conversion</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("conversion")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("conversion")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>GST(%)</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("item_gst")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("item_gst")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>One Pack</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("one_pack")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("one_pack")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={1}></th>
				</tr>
			</thead>
			<tbody className="tbody">
				{itemsDetails
					.map(a => ({ ...a, item_discount: +a.item_discount || 0 }))
					.sort((a, b) =>
						order === "asc"
							? typeof a[items] === "string"
								? a[items]?.localeCompare(b[items])
								: a[items] - b[items]
							: typeof a[items] === "string"
							? b[items]?.localeCompare(a[items])
							: b[items] - a[items]
					)
					?.map((item, i) => (
						<tr
							key={Math.random()}
							style={{ height: "30px" }}
							onClick={() => setPopupForm({ type: "edit", data: item })}>
							<td>{i + 1}</td>
							<td colSpan={3}>{item.company_title}</td>
							<td colSpan={3}>{item.category_title}</td>
							<td colSpan={3}>{item.item_title}</td>
							<td colSpan={2}>{item.mrp}</td>
							<td colSpan={2}>{item.item_code}</td>
							<td colSpan={2}>{item.item_discount || 0}</td>
							<td colSpan={2}>{item.item_price}</td>
							<td colSpan={2}>{item.conversion}</td>
							<td colSpan={2}>{item.item_gst}</td>
							<td colSpan={2}>{item.one_pack}</td>
							<td
								colSpan={1}
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
function NewUserForm({ onSave, popupInfo, setItemsData, companies, itemCategories, items, setNotification }) {
	const [data, setdata] = useState({})

	const [itemGroup, setItemGroup] = useState([])

	const [errMassage, setErrorMassage] = useState("")
	let findDuplicates = arr => arr?.filter((item, index) => arr?.indexOf(item) != index)
	const getCounterGroup = async () => {
		const response = await axios({
			method: "get",
			url: "/itemGroup/GetItemGroupList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success)
			setItemGroup(response.data.result.filter(a => a.item_group_uuid && a.item_group_title))
	}

	useEffect(() => {
		getCounterGroup()
	}, [])
	useEffect(() => {
		if (popupInfo?.type === "edit")
			setdata({
				one_pack: "1",
				conversion: "1",
				status: 1,
				...popupInfo.data,
			})
		else
			setdata({
				one_pack: "1",
				conversion: "1",
				company_uuid: companies[0].company_uuid,
				category_uuid: itemCategories.filter(a => a.company_uuid === companies[0].company_uuid)[0]
					?.category_uuid,
				free_issue: "N",
				status: 1,
				exclude_discount: 0,
			})
	}, [companies, itemCategories, popupInfo.data, popupInfo?.type])

	const submitHandler = async e => {
		let obj = { ...data, item_uuid: data.item_uuid || uuid() }
		e.preventDefault()
		let barcodeChecking = items
			?.filter(a => a.item_uuid !== obj.item_uuid)
			?.filter(a => a?.barcode?.length)
			?.map(a => a?.barcode)
			?.filter(a => a?.filter(b => obj?.barcode?.filter(c => b === c)?.length)?.length)
		barcodeChecking = [].concat.apply([], barcodeChecking)
		if (!obj.item_title) {
			setErrorMassage("Please insert Item Title")
			return
		}
		if (findDuplicates(obj.barcode)?.length || barcodeChecking?.length) {
			setErrorMassage("Please insert Unique Barcode")
			return
		}

		if (obj.img) {
			const previousFile = obj.img
			new Compressor(obj.img, {
				quality: 0.8, // 0.6 can also be used, but its not recommended to go below.
				success: compressedResult => {
					// compressedResult has the compressed file.
					// Use the compressed file to upload the images to your server.
					const FileData = new File([compressedResult], obj.item_uuid + "thumbnail.png")
					const form = new FormData()
					form.append("file", FileData)
					axios({
						method: "post",
						url: "/uploadImage",
						data: form,
						headers: {
							"Content-Type": "multipart/form-data",
						},
					})
				},
			})
			const newFile = new File([previousFile], data.item_uuid + ".png")
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
			obj = { ...obj, img_status: 1 }
		}
		if (popupInfo?.type === "edit") {
			const response = await axios({
				method: "put",
				url: "/items/putItem",
				data: [obj],
				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.result[0].success) {
				onSave()
			}
		} else {
			if (obj?.item_code && items.find(a => a.item_code === obj.item_code)) {
				setErrorMassage("Please insert Different Item Code")
				return
			}
			const response = await axios({
				method: "post",
				url: "/items/postItem",
				data: obj,
				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.success) {
				onSave()
			}
		}
	}
	const onChangeGroupHandler = e => {
		let temp = data.item_group_uuid || []
		let options = Array.from(e.target.selectedOptions, option => option.value)
		for (let i of options) {
			if (data.item_group_uuid.filter(a => a === i).length) temp = temp.filter(a => a !== i)
			else temp = [...temp, i]
		}
		// temp = data.filter(a => options.filter(b => b === a.user_uuid).length)
		console.log(options, temp)

		setdata(prev => ({ ...prev, item_group_uuid: temp }))
	}
	return (
		<div className="overlay" style={{ zIndex: 9999999 }}>
			<div className="modal" style={{ height: "90vh", width: "fit-content" }}>
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
								<h1>{popupInfo.type === "edit" ? "Edit" : "Add"} Items</h1>
							</div>

							<div className="formGroup">
								<div className="row">
									<label className="selectLabel">
										Item Title
										<input
											type="text"
											name="route_title"
											className="numberInput"
											value={data?.item_title}
											onChange={e =>
												setdata({
													...data,
													item_title: e.target.value,
													pronounce: e.target.value,
												})
											}
											maxLength={60}
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
									<label htmlFor={data.item_uuid} className="flex">
										Upload Image
										<input
											className="searchInput"
											type="file"
											id={data.item_uuid}
											style={{ display: "none" }}
											onChange={e => {
												if (e.target.files[0].size > 500000) {
													setNotification({ message: "File is too big!" })
													setTimeout(() => setNotification(null), 500)
												} else {
													setdata(prev => ({
														...prev,
														img: e.target.files[0],
													}))
												}
											}}
										/>
										<img
											style={{
												width: "100px",
												height: "100px",
												objectFit: "contain",
											}}
											src={data.img_status ? server + "/" + data.item_uuid + ".png" : noimg}
											onError={({ currentTarget }) => {
												currentTarget.onerror = null // prevents looping
												currentTarget.src = noimg
											}}
											alt=""
										/>
									</label>
									{data.img_status ? (
										<span
											className="flex"
											style={{ width: "10%", height: "100px" }}
											onClick={() => setdata(prev => ({ ...prev, img_status: false }))}>
											<DeleteOutline />
										</span>
									) : (
										""
									)}
								</div>
								<div className="row">
									<label className="selectLabel">
										Company
										<select
											name="user_type"
											className="select"
											value={data?.company_uuid}
											onChange={e =>
												setdata({
													...data,
													company_uuid: e.target.value,
													category_uuid: itemCategories.filter(
														a => a.company_uuid === e.target.value
													)[0]?.category_uuid,
												})
											}>
											{companies
												.sort((a, b) => a.sort_order - b.sort_order)
												.map(a => (
													<option value={a.company_uuid}>{a.company_title}</option>
												))}
										</select>
									</label>
									<label className="selectLabel">
										Item Category
										<select
											name="user_type"
											className="select"
											value={data?.category_uuid}
											onChange={e =>
												setdata({
													...data,
													category_uuid: e.target.value,
												})
											}>
											{itemCategories
												.filter(a => a.company_uuid === data.company_uuid)
												.sort((a, b) => a.sort_order - b.sort_order)
												.map(a => (
													<option value={a.category_uuid}>{a.category_title}</option>
												))}
										</select>
									</label>
								</div>

								<div className="row">
									<label className="selectLabel">
										Pronounce
										<input
											type="text"
											name="route_title"
											className="numberInput"
											value={data?.pronounce}
											onChange={e =>
												setdata({
													...data,
													pronounce: e.target.value,
												})
											}
											maxLength={42}
										/>
									</label>
									<label className="selectLabel">
										MRP
										<input
											type="number"
											onWheel={e => e.target.blur()}
											name="sort_order"
											className="numberInput"
											value={data?.mrp}
											onChange={e =>
												setdata({
													...data,
													mrp: e.target.value,
												})
											}
											maxLength={5}
										/>
									</label>
								</div>

								<div className="row">
									<label className="selectLabel">
										Item Price
										<input
											type="number"
											onWheel={e => e.target.blur()}
											name="route_title"
											className="numberInput"
											step="0.001"
											value={data?.item_price}
											onChange={e =>
												setdata({
													...data,
													item_price: e.target.value,
													margin: (data.mrp / e.target.value - 1) * 100,
												})
											}
											maxLength={5}
										/>
									</label>
									<label className="selectLabel">
										Item Margin
										<input
											type="number"
											onWheel={e => e.target.blur()}
											name="route_title"
											className="numberInput"
											step="0.001"
											value={data?.margin}
											onChange={e => {
												let item_price = data?.mrp / (e.target.value / 100 + 1)
												item_price =
													item_price - Math.floor(item_price) !== 0
														? item_price
																.toString()
																.match(
																	new RegExp("^-?\\d+(?:.\\d{0," + (2 || -1) + "})?")
																)[0]
														: item_price

												setdata({
													...data,
													margin: e.target.value,
													item_price,
												})
											}}
											maxLength={5}
										/>
									</label>{" "}
								</div>

								<div className="row">
									<label className="selectLabel">
										Item Code
										<input
											type="text"
											name="one_pack"
											className="numberInput"
											value={data?.item_code}
											onChange={e =>
												setdata({
													...data,
													item_code: e.target.value.replace(/\s+/g, ""),
												})
											}
										/>
									</label>
									<label className="selectLabel">
										GST
										<input
											type="number"
											onWheel={e => e.target.blur()}
											name="sort_order"
											className="numberInput"
											value={data?.item_gst}
											onChange={e =>
												setdata({
													...data,
													item_gst: e.target.value,
												})
											}
											maxLength={3}
										/>
									</label>
								</div>
								<div className="row">
									<label className="selectLabel">
										Conversion
										<input
											type="text"
											name="route_title"
											className="numberInput"
											value={data?.conversion}
											onChange={e =>
												setdata({
													...data,
													conversion: e.target.value,
												})
											}
											maxLength={5}
											disabled={popupInfo.type === "edit"}
										/>
									</label>
									<label className="selectLabel">
										One Pack
										<input
											type="text"
											name="one_pack"
											className="numberInput"
											value={data?.one_pack}
											onChange={e =>
												setdata({
													...data,
													one_pack: e.target.value,
												})
											}
											maxLength={5}
										/>
									</label>
								</div>

								<div className="row">
									<label className="selectLabel">
										Item Discount
										<input
											type="text"
											name="one_pack"
											className="numberInput"
											value={data?.item_discount}
											onChange={e =>
												setdata({
													...data,
													item_discount: e.target.value,
												})
											}
											maxLength={5}
										/>
									</label>
									<label className="selectLabel" style={{ width: "100px" }}>
										Free Issue
										<div className="flex" style={{ justifyContent: "space-between" }}>
											<div className="flex">
												<input
													type="radio"
													name="statusOnn"
													className="numberInput"
													checked={data.free_issue === "Y"}
													style={{ height: "25px" }}
													onClick={() => setdata(prev => ({ ...prev, free_issue: "Y" }))}
												/>
												Yes
											</div>
											<div className="flex">
												<input
													type="radio"
													name="statusOff"
													className="numberInput"
													checked={data.free_issue === "N"}
													style={{ height: "25px" }}
													onClick={() => setdata(prev => ({ ...prev, free_issue: "N" }))}
												/>
												No
											</div>
										</div>
									</label>
								</div>
								<div className="row">
									<label className="selectLabel">
										Barcode
										<textarea
											type="number"
											onWheel={e => e.target.blur()}
											name="sort_order"
											className="numberInput"
											value={data?.barcode?.toString()?.replace(/,/g, "\n")}
											style={{ height: "50px" }}
											onChange={e =>
												setdata({
													...data,
													barcode: e.target.value.split("\n"),
												})
											}
										/>
									</label>
									<label className="selectLabel" style={{ width: "100px" }}>
										Status
										<div className="flex" style={{ justifyContent: "space-between" }}>
											<div className="flex">
												<input
													type="radio"
													name="sort_order"
													className="numberInput"
													checked={data.status}
													style={{ height: "25px" }}
													onClick={e =>
														setdata(prev => ({
															...prev,
															status: 1,
														}))
													}
												/>
												On
											</div>
											<div className="flex">
												<input
													type="radio"
													name="sort_order"
													className="numberInput"
													checked={!data?.status}
													style={{ height: "25px" }}
													onClick={e =>
														setdata(prev => ({
															...prev,
															status: 0,
														}))
													}
												/>
												Off
											</div>
										</div>
									</label>
								</div>
								<div className="row">
									<label className="selectLabel" style={{ width: "50%" }}>
										Item Group
										<select
											className="numberInput"
											style={{ width: "200px", height: "100px" }}
											value={data?.item_group_uuid}
											onChange={onChangeGroupHandler}
											multiple>
											{/* <option selected={occasionsTemp.length===occasionsData.length} value="all">All</option> */}
											{itemGroup?.map(occ => (
												<option
													value={occ.item_group_uuid}
													style={{ marginBottom: "5px", textAlign: "center" }}>
													{occ.item_group_title}
												</option>
											))}
										</select>
									</label>
									<div style={{ flexDirection: "column", gap: "10px" }}>
										<div>
											Exclude Discount
											<div className="flex" style={{ justifyContent: "flex-start", gap: "20px" }}>
												<div className="flex">
													<input
														type="checkbox"
														name="sort_order"
														className="numberInput"
														checked={data.exclude_discount}
														style={{ height: "25px", marginRight: "5px" }}
														onClick={() =>
															setdata(prev => ({
																...prev,
																exclude_discount: 1,
															}))
														}
													/>
													Yes
												</div>
												<div className="flex">
													<input
														type="checkbox"
														name="sort_order"
														className="numberInput"
														checked={!data.exclude_discount}
														style={{ height: "25px", marginRight: "5px" }}
														onClick={() =>
															setdata(prev => ({
																...prev,
																exclude_discount: 0,
															}))
														}
													/>
													No
												</div>
											</div>
										</div>
										<div>
											Billing Type
											<div className="flex" style={{ justifyContent: "flex-start", gap: "20px" }}>
												{["Invoice", "Estimate"]?.map((_i, idx) => (
													<div
														key={_i}
														className="flex"
														onClick={() => setdata(x => ({ ...x, billing_type: _i?.[0] }))}>
														<input
															type="radio"
															checked={
																data.billing_type === _i?.[0] ||
																(idx === 0 && !data.billing_type)
															}
															style={{ height: "25px", marginRight: "5px" }}
														/>
														{_i}
													</div>
												))}
											</div>
										</div>
									</div>
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
function DeleteItemPopup({ onSave, popupInfo, setItemsData }) {
	const [errMassage, setErrorMassage] = useState("")
	const [loading, setLoading] = useState(false)

	const submitHandler = async e => {
		e.preventDefault()
		setLoading(true)
		try {
			const response = await axios({
				method: "delete",
				url: "/items/deleteItem",
				data: { item_uuid: popupInfo.item_uuid },
				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.success) {
				onSave()
			}
		} catch (err) {
			console.log(err)
			setErrorMassage("Order already exist")
		}
		setLoading(false)
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
								<h1>Delete Items</h1>
							</div>
							<div className="row">
								<h1>{popupInfo.item_title}</h1>
							</div>

							<i style={{ color: "red" }}>{errMassage === "" ? "" : "Error: " + errMassage}</i>
							<div className="flex" style={{ justifyContent: "space-between" }}>
								{loading ? (
									<button
										className="submit"
										id="loading-screen"
										style={{ background: "red", width: "120px" }}>
										<svg viewBox="0 0 100 100">
											<path
												d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50"
												fill="#ffffff"
												stroke="none">
												<animateTransform
													attributeName="transform"
													type="rotate"
													dur="1s"
													repeatCount="indefinite"
													keyTimes="0;1"
													values="0 50 51;360 50 51"></animateTransform>
											</path>
										</svg>
									</button>
								) : (
									<button type="submit" className="submit" style={{ background: "red" }}>
										Confirm
									</button>
								)}
								<button type="button" className="submit" onClick={onSave}>
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}
