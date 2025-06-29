import React from "react"
import ReactDOM from "react-dom"
import "./index.css"
import App from "./App"
import State from "./context/state"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import OrderPdf from "./components/prints/OrderPdf"

ReactDOM.render(
	<State>
		<Router>
			<Routes>
				<Route path="/pdf/:order_uuid" element={<OrderPdf />} />
			</Routes>
			<App />
		</Router>
	</State>,
	document.getElementById("root")
)
