import React, { useEffect, useState } from "react"

function DiliveryReplaceMent({ onSave, data = {}, setData, updateBilling = () => {} }) {
	const [error, setError] = useState(false)
	const [values, setValues] = useState(false)
	useEffect(() => {
		setValues(data)
	}, [])
	return (
		<div className="overlay" style={{ zIndex: "9999999999999" }}>
			<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content"
					}}
				>
					<div style={{ overflowY: "scroll" }}>
						<form className="form">
							<div className="formGroup">
								<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
									<div style={{ width: "100px" }}>Replacement</div>
									<label className="selectLabel flex" style={{ width: "100px" }}>
										<input
											type="number"
											name="route_title"
											className="numberInput"
											value={values.replacement}
											style={{ width: "100px" }}
											onChange={e =>
												setValues(prev => ({
													...prev,
													replacement: e.target.value
												}))
											}
											maxLength={42}
											onWheel={e => e.preventDefault()}
										/>
										{/* {popupInfo.conversion || 0} */}
									</label>
								</div>
								<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
									<div style={{ width: "100px" }}>Shortage</div>
									<label className="selectLabel flex" style={{ width: "100px" }}>
										<input
											type="number"
											name="route_title"
											className="numberInput"
											value={values.shortage}
											style={{ width: "100px" }}
											onChange={e =>
												setValues(prev => ({
													...prev,
													shortage: e.target.value
												}))
											}
											maxLength={42}
											onWheel={e => e.preventDefault()}
										/>
										{/* {popupInfo.conversion || 0} */}
									</label>
								</div>
								<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
									<div style={{ width: "100px" }}>Adjustment</div>
									<label className="selectLabel flex" style={{ width: "100px" }}>
										<input
											type="number"
											name="route_title"
											className="numberInput"
											value={values.adjustment}
											style={{ width: "100px" }}
											onChange={e =>
												setValues(prev => ({
													...prev,
													adjustment: e.target.value
												}))
											}
											maxLength={42}
											onWheel={e => e.preventDefault()}
										/>
										{/* {popupInfo.conversion || 0} */}
									</label>
								</div>
								{values.adjustment ? (
									<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
										<div style={{ width: "100px" }}>Adjustment Remarks</div>
										<label className="selectLabel flex" style={{ width: "100px" }}>
											<textarea
												type="number"
												name="route_title"
												className="numberInput"
												value={values.adjustment_remarks}
												style={{
													width: "100px",
													height: "100px",
													border: error ? "2px solid red" : "1px solid #000"
												}}
												onChange={e =>
													setValues(prev => ({
														...prev,
														adjustment_remarks: e.target.value
													}))
												}
												onWheel={e => e.preventDefault()}
											/>
											{/* {popupInfo.conversion || 0} */}
										</label>
									</div>
								) : (
									""
								)}
								{error ? <h5>Please Enter Adjustment Remarks</h5> : ""}
							</div>

							<div className="flex" style={{ justifyContent: "space-between" }}>
								<button type="button" style={{ backgroundColor: "red" }} className="submit" onClick={onSave}>
									Cancel
								</button>
								<button
									type="button"
									className="submit"
									onClick={() => {
										if (!values.adjustment || values.adjustment_remarks) {
											setData(prev => ({ ...prev, ...values }))
											updateBilling(values)
											onSave()
										} else {
											setError(true)
											setTimeout(() => setError(false), 3000)
										}
									}}
								>
									Save
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}

export default DiliveryReplaceMent
