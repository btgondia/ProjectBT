import React, { useState, useEffect, useContext } from "react"
import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import { RiSearchLine } from "react-icons/ri"
import { HiOutlinePlus } from "react-icons/hi"
import { IoCloseOutline } from "react-icons/io5"
import { MdOutlineEdit } from "react-icons/md"
import { IoIosCloseCircle } from "react-icons/io"
import { ImCheckboxChecked, ImCheckboxUnchecked } from "react-icons/im"

import Context from "../../context/context"
import Prompt from "../../components/Prompt"
import axios from "axios"
import { v4 } from "uuid"
import { Autocomplete, ListItem, TextField, styled } from "@mui/material"

const CounterCharges = () => {
	const status = ["Pending", "Completed", "Floating"]
	const [promptState, setPromptState] = useState()
	const [charges, setCharges] = useState([])
	const [searchState, setSearchState] = useState()
	const [formState, setFormState] = useState()
	const [completedFilter, setCompletedFilter] = useState(false)
	const [counters, setCounters] = useState([])
	const context = useContext(Context)
	const { setPageLoading } = context

	const fetchCompanies = async () => {
		try {
			setPageLoading(true)
			const response = await axios.get(`/counterCharges/${completedFilter ? "completed" : "running"}`)
			if (response?.data?.success) setCharges(response?.data?.result)
			setPageLoading(false)
		} catch (error) {
			setPageLoading(false)
			console.log(error)
		}
	}

	const postCharge = async charge => {
		try {
			setPageLoading(true)
			charge.charge_uuid = v4()
			charge.user_uuid = localStorage.getItem("user_uuid")
			const response = await axios.post("/counterCharges", charge)
			console.log(response.data)
			if (response?.data?.success) setCharges(state => state.concat([response.data.result]))
			setPageLoading(false)
		} catch (error) {
			setPageLoading(false)
			console.log(error)
		}
	}

	const updateCharge = async charge => {
		try {
			setPageLoading(true)
			const response = await axios.put("/counterCharges", charge)
			if (response?.data?.success)
				setCharges(state => state?.map(i => (i.charge_uuid !== charge?.charge_uuid ? i : { ...i, ...response.data.result })))
			setPageLoading(false)
		} catch (error) {
			setPageLoading(false)
			console.log(error)
		}
	}

	const deleteCharge = async charge => {
		setPromptState(null)
		setPageLoading(true)
		try {
			await axios.delete(`/counterCharges/${charge?.charge_uuid}`)
			setCharges(state => state?.filter(i => i.charge_uuid !== charge?.charge_uuid))
			setPageLoading(false)
		} catch (error) {
			setPageLoading(false)
			console.log(error)
		}
	}

	useEffect(() => {
		;(async () => {
			const response = await axios("/counters/minimum_details")
			if (response.data.success) setCounters(response.data.result)
		})()
	}, [])

	useEffect(() => {
		fetchCompanies()
	}, [])

	useEffect(() => {
		fetchCompanies()
	}, [completedFilter])

	const showAlert = charge => {
		setPromptState({
			message: `Selected counter charge for '${charge?.counter}' will be removed permanently. Continue?`,
			actions: [
				{ label: "Cancel", classname: "cancel", action: () => setPromptState(null) },
				{ label: "Continue", classname: "confirm", action: () => deleteCharge(charge) }
			]
		})
	}

	const filterCharges = data => {
		let _data
		if (!searchState) _data = data
		else
			_data = data?.filter(i =>
				[i?.counter, i?.user, i?.narration].join(" ")?.toLowerCase()?.includes(searchState?.toLowerCase())
			)
		return _data
	}

	return (
		<>
			<Sidebar />
			<Header />
			<div className="layout-content" id="companies-wrapper">
				{/* <div className="page-heading">
					<h2>Companies</h2>
				</div> */}
				<div id="companies-header">
					<div tabIndex={0} className="theme-searchbar">
						<span>
							<RiSearchLine />
						</span>
						<input type="text" value={searchState} onChange={e => setSearchState(e.target.value)} placeholder="Search..." />
						<button onClick={() => setSearchState("")}>
							<IoCloseOutline />
						</button>
					</div>
					<div id="actions-wrapper">
						<div id="completed-filter" onClick={() => setCompletedFilter(i => !i)}>
							{completedFilter ? <ImCheckboxChecked fill="#000000" /> : <ImCheckboxUnchecked fill="#000000" />}
							<span>Completed Only</span>
						</div>
						<button className="theme-btn round" onClick={() => setFormState({ active: true, onSubmit: postCharge, counters })}>
							<HiOutlinePlus style={{ fontSize: "1rem" }} />
							Create
						</button>
					</div>
				</div>
				<div id="companies-list">
					<table>
						<thead>
							<tr>
								<th>SN</th>
								<th>Counter</th>
								<th>Created At</th>
								<th>Created By</th>
								<th>Status</th>
								<th>Amount</th>
								<th>Narration</th>
								<th>Remarks</th>
								<th>Invoice Number</th>
								<th>Completed At</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{filterCharges(charges)?.map((charge, index) => (
								<tr key={charge?.charge_uuid}>
									<td>{index + 1}</td>
									<td>{charge?.counter}</td>
									<td>{new Date(charge?.created_at)?.toDateString()}</td>
									<td>{charge?.user}</td>
									<td>{status[charge?.status]}</td>
									<td>₹{charge?.amt}</td>
									<td>{charge?.narration}</td>
									<td>{charge?.remarks}</td>
									<td>{charge?.invoice_number || "N/A"}</td>
									<td>{charge?.completed_at ? new Date(charge?.completed_at)?.toDateString() : "N/A"}</td>
									<td>
										<div className="table-row-actions">
											<button
												className="theme-icon-btn"
												onClick={() =>
													setFormState({
														active: true,
														onSubmit: updateCharge,
														data: charge
													})
												}
											>
												<MdOutlineEdit />
											</button>
											<button className="theme-icon-btn">
												<IoCloseOutline style={{ color: "red" }} onClick={() => showAlert(charge)} />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{promptState && <Prompt {...promptState} />}
			{formState?.active && <CompanyForm {...formState} close={() => setFormState(i => ({ ...i, active: false }))} />}
		</>
	)
}

const CompanyForm = ({ close, onSubmit, data = {}, counters }) => {
	const [charge, setCharge] = useState(data)
	const onChange = e => setCharge(i => ({ ...i, [e.target.name]: e.target.value }))
	const submit = e => {
		e.preventDefault()
		onSubmit(charge)
		close()
	}

	const CssTextField = styled(TextField)({
		"&.MuiTextField-root": {
			padding: "5px 10px!important"
		},
		"& .MuiInput-root.MuiInput-underline": {
			fontSize: ".85rem",
			border: "none"
		},
		"& .MuiInput-underline:before": {
			border: "none"
		},
		"& .MuiInput-underline:after": {
			border: "none"
		},
		"& .MuiInput-underline:hover:before": {
			border: "none"
		}
	})

	const FormFields = [
		{ label: "Amount", key: "amt", type: "number", attributes: { placeholder: "₹0.00" } },
		{ label: "Narration (Displayed)", key: "narration", attributes: { maxlength: 15, placeholder: "Displayed in invoice" } },
		{ label: "Remarks (Not displayed)", key: "remarks", attributes: { placeholder: "Counter charge remarks" } }
	]
	console.log({ charge })
	return (
		<div className="overlay-wrapper">
			<div id="company-form">
				<button id="close" onClick={close}>
					<IoIosCloseCircle />
				</button>
				<h2>Counter Charge Details</h2>
				<form onSubmit={submit}>
					{FormFields?.map(field => (
						<div key={field.key}>
							<label htmlFor={field.key}>{field.label}</label>
							<input
								type={field.type || "text"}
								className="form-input"
								id={field.key}
								name={field.key}
								value={charge[field.key]}
								onChange={onChange}
								required
								{...field.attributes}
							/>
						</div>
					))}

					<div>
						<label htmlFor={"counter-selection"}>Counter</label>
						<Autocomplete
							disablePortal
							value={charge?.counter_uuid || ""}
							onChange={(e, { value }) => setCharge(prev => ({ ...prev, counter_uuid: value }))}
							options={counters?.map(i => ({ value: i.counter_uuid, label: i.counter_title }))}
							renderInput={params => <CssTextField placeholder="None" {...params} variant="standard" className="form-input" />}
							renderOption={(props, option) => (
								<ListItem sx={{ fontSize: ".8rem" }} {...props}>
									{option.label}
								</ListItem>
							)}
						/>
						{/* <select
							id="counter-selection"
							className="form-input"
							value={charge?.counter_uuid}
							name="counter_uuid"
							onChange={onChange}
							disabled={!counters?.[0]}
							required
						>
							<option value="" disabled selected>
								Select counter
							</option>
							{counters?.map(({ counter_uuid, counter_title }) => (
								<option key={counter_uuid} value={counter_uuid}>
									{counter_title}
								</option>
							))}
						</select> */}
					</div>

					<button type="submit" className="theme-btn round">
						Submit
					</button>
				</form>
			</div>
		</div>
	)
}

export default CounterCharges
