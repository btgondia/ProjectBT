import React, { useState, useEffect, useMemo } from "react"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"

import SetupModal from "../../components/setupModel/SetupModel"
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid"
import axios from "axios"
import { DeleteOutline } from "@mui/icons-material"
const CounterGroup = () => {
	const [counterGroup, setCounterGroup] = useState([])
	const [deletePopup, setDeletePopup] = useState(false)
	const [filterCounterGroupTitle, setFilterCounterGroupTitle] = useState("")
	const [popupForm, setPopupForm] = useState(false)
	const [addItems, setAddItems] = useState(false)
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

	useEffect(() => {
		getCounterGroup()
	}, [popupForm])

	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading">
					<h2>Counter Group</h2>
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
							onChange={e => setFilterCounterGroupTitle(e.target.value)}
							value={filterCounterGroupTitle}
							placeholder="Search Counter Title..."
							className="searchInput"
						/>

						<div>
							Total Items:{" "}
							{
								counterGroup
									.filter(a => a.counter_group_title)
									.filter(
										a =>
											!filterCounterGroupTitle ||
											a.counter_group_title
												.toLocaleLowerCase()
												.includes(filterCounterGroupTitle.toLocaleLowerCase())
									).length
							}
						</div>
						<button className="theme-btn" onClick={() => setPopupForm(true)}>
							Add
						</button>
					</div>
				</div>
				<div className="table-container-user item-sales-container">
					<Table
						itemsDetails={counterGroup
							.filter(a => a.counter_group_title)
							.filter(
								a =>
									!filterCounterGroupTitle ||
									a.counter_group_title
										.toLocaleLowerCase()
										.includes(filterCounterGroupTitle.toLocaleLowerCase())
							)}
						setPopupForm={setPopupForm}
						setAddItems={setAddItems}
						setDeletePopup={setDeletePopup}
					/>
				</div>
			</div>
			{popupForm ? (
				<NewUserForm onSave={() => setPopupForm(false)} popupInfo={popupForm} setRoutesData={setCounterGroup} />
			) : (
				""
			)}
			{addItems ? (
				<SetupModal onClose={() => setAddItems(false)}>
					<ItemsForm
						ItemGroup={addItems}
						// itemGroupings={itemGroupings}
						// setItemGroupings={setItemGroupings}
						// itemGroupingIndex={itemsModalIndex}
						setItemsModalIndex={setAddItems}
					/>
				</SetupModal>
			) : (
				""
			)}
			{deletePopup ? (
				<DeleteCounterPopup
					onSave={() => setDeletePopup(false)}
					getCounterGroup={getCounterGroup}
					popupInfo={deletePopup}
				/>
			) : (
				""
			)}
		</>
	)
}

export default CounterGroup
function Table({ itemsDetails, setPopupForm, setAddItems, setDeletePopup }) {
	const [items, setItems] = useState("counter_group_title")
	const [order, setOrder] = useState("asc")
	return (
		<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead>
				<tr>
					<th>S.N</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>Counter Group Title</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("counter_group_title")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("counter_group_title")
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
					.filter(a => a.counter_group_title)
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
							<td colSpan={2}>{item.counter_group_title}</td>
							<td>
								<button
									type="button"
									onClick={e => {
										e.stopPropagation()
										setAddItems(item)
									}}
									className="fieldEditButton">
									Action
								</button>
							</td>
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
function NewUserForm({ onSave, popupInfo, setRoutesData }) {
	const [data, setdata] = useState({})
	const [errMassage, setErrorMassage] = useState("")
	useEffect(() => {
		if (popupInfo?.type === "edit") setdata(popupInfo.data)
	}, [popupInfo.data, popupInfo?.type])

	const submitHandler = async e => {
		e.preventDefault()
		if (!data.counter_group_title) {
			setErrorMassage("Please insert Group Title")
			return
		}
		if (popupInfo?.type === "edit") {
			const response = await axios({
				method: "put",
				url: "/counterGroup/putCounterGroup",
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
				url: "/counterGroup/postCounterGroup",
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
								<h1>{popupInfo.type === "edit" ? "Edit" : "Add"} Counter Group</h1>
							</div>

							<div className="formGroup">
								<div className="row">
									<label className="selectLabel">
										Counter Group Title
										<input
											type="text"
											name="route_title"
											className="numberInput"
											value={data?.counter_group_title}
											onChange={e =>
												setdata({
													...data,
													counter_group_title: e.target.value,
												})
											}
											maxLength={42}
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

function ItemsForm({ ItemGroup, itemGroupingIndex, setItemsModalIndex }) {
	const [filterCounterTitle, setFilterCounterTitle] = useState("")
	const [filterRouteTitle, setFilterRouteTitle] = useState("")
	const [counters, setCounter] = useState([])
	const [routesData, setRoutesData] = useState([])

	const getCounter = async () => {
		const response = await axios({
			method: "post",
			url: "/counters/GetCounterData",
			data: ["counter_uuid", "counter_title", "route_uuid", "counter_group_uuid"],
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setCounter(response.data.result)
	}
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
		getCounter()
		getRoutesData()
	}, [])

	const submitHandler = async () => {
		const response = await axios({
			method: "put",
			url: "/counters/putCounter",
			data: counters.filter(a => a.edit),
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			setItemsModalIndex(null)
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
		return counters.counter_group_uuid
	}, [counters.counter_group_uuid])
	return (
		<div
			className="noSpaceForm"
			style={{
				padding: "0px 12px",
				height: "fit-content",
			}}>
			<h1>Counters</h1>

			<div className="flex" style={{ justifyContent: "space-between" }}>
				<input
					type="text"
					onChange={e => setFilterCounterTitle(e.target.value)}
					value={filterCounterTitle}
					placeholder="Search Counter..."
					className="searchInput"
				/>
				<input
					type="text"
					onChange={e => setFilterRouteTitle(e.target.value)}
					value={filterRouteTitle}
					placeholder="Search Routes..."
					className="searchInput"
				/>
			</div>
			<div
				style={{
					overflowY: "scroll",
					height: "45vh",
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
									<td colSpan={3}>
										{a.route_title}
										<span
											onClick={e => {
												e.stopPropagation()

												setCounter(prev => {
													let counter_form_uuid =
														filteredCounter?.filter(
															b =>
																a.route_uuid === b.route_uuid &&
																b.counter_group_uuid.find(
																	d => d === ItemGroup.counter_group_uuid
																)
														)?.length ===
														filteredCounter?.filter(b => a.route_uuid === b.route_uuid)
															?.length
															? true
															: false
													return prev.map(count =>
														count.route_uuid === a.route_uuid
															? {
																	...count,
																	counter_group_uuid: counter_form_uuid
																		? count?.counter_group_uuid?.filter(
																				d => d !== ItemGroup.counter_group_uuid
																		  )
																		: [
																				...(count.counter_group_uuid || []),
																				ItemGroup.counter_group_uuid,
																		  ],
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
													filteredCounter?.filter(
														b =>
															a.route_uuid === b.route_uuid &&
															b.counter_group_uuid.find(
																d => d === ItemGroup.counter_group_uuid
															)
													)?.length ===
													filteredCounter?.filter(b => a.route_uuid === b.route_uuid)?.length
												}
												style={{ transform: "scale(1.3)" }}
											/>
										</span>
									</td>
								</tr>
								{filteredCounter
									?.filter(b => a.route_uuid === b.route_uuid)
									?.sort((a, b) => a.counter_title?.localeCompare(b.counter_title))
									?.map((item, i, array) => {
										return (
											<tr key={Math.random()} style={{ height: "30px" }}>
												<td
													onClick={e => {
														e.stopPropagation()
														setCounter(prev =>
															prev.map(a =>
																a.counter_uuid === item.counter_uuid
																	? {
																			...a,
																			counter_group_uuid:
																				a.counter_group_uuid.find(
																					d =>
																						d ===
																						ItemGroup.counter_group_uuid
																				)
																					? a.counter_group_uuid.filter(
																							d =>
																								d !==
																								ItemGroup.counter_group_uuid
																					  )
																					: [
																							...(a.counter_group_uuid ||
																								[]),
																							ItemGroup.counter_group_uuid,
																					  ],
																			edit: true,
																	  }
																	: a
															)
														)
													}}
													className="flex"
													style={{ justifyContent: "space-between" }}>
													<input
														type="checkbox"
														checked={item.counter_group_uuid.find(
															d => d === ItemGroup.counter_group_uuid
														)}
														style={{ transform: "scale(1.3)" }}
													/>
													{i + 1}
												</td>

												<td colSpan={2}>{item.counter_title || ""}</td>
											</tr>
										)
									})}
							</>
						))}
					</tbody>
				</table>

				{/* <table className="table">
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
          {filterItemData
            ?.filter((a) => a.counter_uuid)

            .map((item, index) => {
              return (
                <tr key={item.counter_uuid}>
                  <td>{item.counter_title}</td>
                  <td>{item?.route_title}</td>
                  <td>
                    <button
                      type="button"
                      className="noBgActionButton"
                      style={{
                        backgroundColor: includesItem?.filter(
                          (a) =>
                            a?.counter_uuid === item?.counter_uuid &&
                            a.counter_group_uuid.filter(
                              (a) => a === itemGroup.counter_group_uuid
                            ).length
                        )?.length
                          ? "red"
                          : "var(--mainColor)",
                        width: "150px",
                        fontSize: "large",
                      }}
                      onClick={(event) =>
                        onItemIncludeToggle(
                          item.counter_uuid,
                          includesItem?.filter(
                            (a) =>
                              a?.counter_uuid === item?.counter_uuid &&
                              a.counter_group_uuid.filter(
                                (a) => a === itemGroup.counter_group_uuid
                              ).length
                          )?.length
                            ? "remove"
                            : "add"
                        )
                      }
                    >
                      {includesItem?.filter(
                        (a) =>
                          a?.counter_uuid === item?.counter_uuid &&
                          a.counter_group_uuid.filter(
                            (a) => a === itemGroup.counter_group_uuid
                          ).length
                      )?.length
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
			<div>
				<button type="button" className="fieldEditButton" onClick={submitHandler}>
					Done
				</button>
			</div>
		</div>
	)
}

function DeleteCounterPopup({ onSave, popupInfo, getCounterGroup }) {
	const [errMassage, setErrorMassage] = useState("")
	const [loading, setLoading] = useState(false)

	const submitHandler = async e => {
		e.preventDefault()
		setLoading(true)
		try {
			const response = await axios({
				method: "delete",
				url: "/counterGroup/deleteCounterGroup",
				data: { counter_group_uuid: popupInfo.counter_group_uuid },
				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.success) {
				getCounterGroup()
				onSave()
			}
		} catch (err) {
			
			// setErrorMassage("Order already exist");
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
								<h1>Delete Counter Group</h1>
							</div>
							<div className="row">
								<h1>{popupInfo.counter_group_title}</h1>
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
