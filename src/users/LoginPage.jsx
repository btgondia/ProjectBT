import axios from "axios"
import React, { useContext, useState } from "react"

import { openDB } from "idb"
import { useNavigate } from "react-router-dom"
import context from "../context/context"

const LoginPage = ({ setUserType }) => {
	const [isLoading, setIsLoading] = useState(false)
	const [userData, setUserData] = useState({
		login_username: "",
		login_password: ""
	})

	const onChange = e => setUserData(i => ({ ...i, [e.target.name]: e?.target?.value?.replaceAll(" ", "") }))
	const { setNotification } = useContext(context)
	const Navigate = useNavigate()
	const loginHandler = async () => {
		try {
			setIsLoading(true)
			const response = await axios({
				method: "post",
				url: "/users/login",
				data: userData,
				headers: {
					"Content-Type": "application/json"
				}
			})
			if (response.data.success) {
                                let data = response.data.result
                                localStorage.setItem(
                                        "user",
                                        JSON.stringify(data)
                                )
				if (data.selected_warehouse) localStorage.setItem("selected_warehouse", data.selected_warehouse)
				localStorage.setItem("user_uuid", data.user_uuid)
				localStorage.setItem("user_title", data.user_title)
				localStorage.setItem("user_role", JSON.stringify(data.user_role || []))
				localStorage.setItem("user_mobile", data.user_mobile)
				localStorage.setItem("warehouse", data.warehouse?.length ? JSON.stringify(data.warehouse[0]) : "")

				sessionStorage.setItem("userType", response.data.result.user_type)
                                const hasTripView = data?.permissions?.includes("trip_view")
                                if (+data.user_type === 0) {
                                        setUserType(response.data.result.user_type || false)
                                        if (hasTripView) {
                                                Navigate("/trip")
                                        } else {
                                                Navigate("/accounting_dashboard")
                                        }
                                        return
                                }
				const result = await axios({
					method: "get",
					url: "/users/getDetails",
					data: userData,
					headers: {
						"Content-Type": "application/json"
					}
				})
				data = result.data.result
				let Version = +localStorage.getItem("IDBVersion") + 1
				const db = await openDB("BT", Version || 1, {
					upgrade(db) {
						for (const property in data) {
							db.createObjectStore(property, {
								keyPath: "IDENTIFIER"
							})
						}
					}
				})
				const exitFunction = () => {
					let time = new Date()
					localStorage.setItem("IDBVersion", Version)
					localStorage.setItem("indexed_time", time.getTime())
					setUserType(response.data.result.user_type || false)
					setIsLoading(false)
					db.close()
					Navigate("/users")
				}
				let store
				let index = 0
				for (const property in data) {
					store = await db.transaction(property, "readwrite").objectStore(property)
					for (let item of data[property]) {
						let IDENTIFIER =
							item[
								property === "autobill"
									? "auto_uuid"
									: property === "companies"
									? "company_uuid"
									: property === "counter"
									? "counter_uuid"
									: property === "counter_groups"
									? "counter_group_uuid"
									: property === "item_category"
									? "category_uuid"
									: property === "items"
									? "item_uuid"
									: property === "routes"
									? "route_uuid"
									: property === "payment_modes"
									? "mode_uuid"
									: property === "warehouse"
									? "warehouse_uuid"
									: ""
							]
						
						await store.put({ ...item, IDENTIFIER })
					}
					index = index + 1
					if (index === Object.keys(data).length) {
						exitFunction()
					}
				}
			} else {
				setNotification(response.data)
				setTimeout(() => {
					setNotification(null)
					setIsLoading(false)
				}, 5000)
			}
		} catch (error) {
			console.error(error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div id="login-container" onKeyDown={e => (e.key === "Enter" ? loginHandler() : "")}>
			{/* <div className="foodDoAdmin"><img src={foodDoAdmin} alt="" /></div> */}

			<div className="form">
				<div>
					<h3>Welcome back</h3>
					<h1>Log into your account</h1>
				</div>
				<div className="input-container">
					<label htmlFor="username" className="form-label">
						Username
					</label>
					<input
						type="username"
						className="form-input"
						name="login_username"
						id="username"
						value={userData.login_username}
						onChange={onChange}
						autoComplete="off"
						required
					/>
				</div>

				<div className="input-container">
					<label htmlFor="password" className="form-label">
						Password
					</label>
					<input
						type="password"
						className="form-input"
						name="login_password"
						id="password"
						value={userData.login_password}
						onChange={onChange}
						minLength="5"
						autoComplete="off"
						required
					/>
				</div>

				{!isLoading ? (
					<button className="submit-btn" onClick={loginHandler}>
						Login now
					</button>
				) : (
					<button className="submit-btn" id="loading-screen">
						<svg viewBox="0 0 100 100">
							<path d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50" fill="#000" stroke="none">
								<animateTransform
									attributeName="transform"
									type="rotate"
									dur="1s"
									repeatCount="indefinite"
									keyTimes="0;1"
									values="0 50 51;360 50 51"
								></animateTransform>
							</path>
						</svg>
					</button>
				)}
			</div>
		</div>
	)
}

export default LoginPage
