import axios from "axios"
import React, { useState } from "react"

const MobileOrderSequence = ({ onClose }) => {
	const [value, setValue] = useState()

	const getDetails = async controller => {
		const response = await axios({
			method: "get",
			url: "/details/GetDetails",
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setValue(response.data.result[0]?.mobile_order_sequence || 0)
	}

	useState(() => {
		const controller = new AbortController()
		getDetails(controller)
		return () => {
			controller.abort()
		}
	}, [])

	const updateDetails = async controller => {
		const response = await axios({
			method: "post",
			url: "/details/mobileOrderSequence",
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json"
			},
			data: {
				mobile_order_sequence: value
			}
		})
		if (response.data.success) {
			onClose()
		}
	}

	return (
		<div className="overlay" style={{ position: "fixed", top: 0, left: 0, zIndex: 9999999 }}>
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
						<form
							className="form"
							onSubmit={e => {
								e.preventDefault()
								const controller = new AbortController()
								updateDetails(controller)
								return () => {
									controller.abort()
								}
							}}
						>
							<div className="formGroup">
								<div className="row">
									<label className="selectLabel">
										Mobile Orders Sequence
										<select
											className="numberInput"
											value={value}
											name="routes"
											onChange={e => setValue(e.target.value)}
										>
											{[
												{ value: 0, name: "Order time wise" },
												{ value: 1, name: "Sort order wise" }
											]?.map(occ => (
												<option value={occ.value} style={{ marginBottom: "5px" }}>
													{occ.name}
												</option>
											))}
										</select>
									</label>
								</div>

								<div className="row">
									<button className="simple_Logout_button" type="submit">
										Save
									</button>
								</div>
							</div>
						</form>
					</div>
				</div>
				<button onClick={onClose} className="closeButton">
					x
				</button>
			</div>
		</div>
	)
}

export default MobileOrderSequence
