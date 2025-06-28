import React, { useEffect } from "react"
import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import { RiSearchLine } from "react-icons/ri"
import { HiOutlinePlus } from "react-icons/hi"
import { IoCloseOutline } from "react-icons/io5"
import { MdOutlineEdit } from "react-icons/md"
import { IoIosCloseCircle } from "react-icons/io"
import { BsToggle2Off, BsToggle2On } from "react-icons/bs"
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"
import { useState } from "react"
import Prompt from "../../components/Prompt"
import axios from "axios"
import { v4 } from "uuid"
import { FaChevronDown } from "react-icons/fa6"
import { companyLoadRates } from "../../utils/constants"

const Companies = () => {
	const [promptState, setPromptState] = useState()
	const [companies, setCompanies] = useState()
	const [searchState, setSearchState] = useState()
	const [formState, setFormState] = useState()

	const fetchCompanies = async () => {
		const cachedData = localStorage.getItem("companiesData")
		try {
			if (cachedData) {
				setCompanies(JSON.parse(cachedData))
			} else {
				const response = await axios.get("/companies/getCompanies")
				if (response?.data?.result?.[0]) {
					localStorage.setItem("companiesData", JSON.stringify(response.data.result))
					setCompanies(response.data.result)
				}
			}
		} catch (error) {}
	}
	const createCompany = async (company) => {
		try {
			company.company_uuid = v4()
			const response = await axios({
				method: "post",
				url: "/companies",
				data: company,
				headers: { "Content-Type": "application/json" },
			})

			setCompanies((state) => state.concat([company]))
		} catch (error) {}
	}

	const updateCompany = async (company) => {
		try {
			const response = await axios({
				method: "put",
				url: "/companies",
				data: company,
				headers: { "Content-Type": "application/json" },
			})

			setCompanies((state) =>
				state?.map((i) => (i.company_uuid !== company?.company_uuid ? i : { ...i, ...company }))
			)
		} catch (error) {}
	}

	const deleteCompany = async (company) => {
		setPromptState(null)
		try {
			const response = await axios({
				method: "delete",
				url: "/companies",
				data: { company_uuid: company?.company_uuid },
				headers: { "Content-Type": "application/json" },
			})

			setCompanies((state) => state?.filter((i) => i.company_uuid !== company?.company_uuid))
		} catch (error) {}
	}

	useEffect(() => {
		fetchCompanies()
	}, [])

	const showAlert = (company) => {
		setPromptState({
			message: `Company '${company?.company_title}' will be removed permanently. Continue?`,
			actions: [
				{ label: "Cancel", classname: "cancel", action: () => setPromptState(null) },
				{ label: "Continue", classname: "confirm", action: () => deleteCompany(company) },
			],
		})
	}

	const updateStatus = ({ company_uuid, status }) => {
		updateCompany({ company_uuid, status: +!+status })
	}

	const filterCompanies = (data) => {
		let _data
		if (!searchState) _data = data
		else
			_data = data?.filter((i) =>
				i?.company_title?.toLowerCase()?.includes(searchState?.toLowerCase())
			)
		return _data?.sort((a, b) => +a?.sort_order - +b?.sort_order)
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
						<input
							type="text"
							value={searchState}
							onChange={(e) => setSearchState(e.target.value)}
							placeholder="Search companies"
						/>
						<button onClick={() => setSearchState("")}>
							<IoCloseOutline />
						</button>
					</div>
					<button
						className="theme-btn round"
						onClick={() => setFormState({ active: true, onSubmit: createCompany })}
					>
						<HiOutlinePlus style={{ fontSize: "1rem" }} />
						Create
					</button>
				</div>
				<div id="companies-list">
					<table>
						<thead>
							<tr>
								<th>SO</th>
								<th>Company Name</th>
								<th>Status</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{filterCompanies(companies)?.map((company) => (
								<tr key={company?.company_uuid}>
									<td>{company?.sort_order}</td>
									<td>{company?.company_title}</td>
									<td className="table-row-icon">
										<div onClick={() => updateStatus(company)}>
											{company?.status ? (
												<BsToggle2On style={{ color: "#44cd4a" }} />
											) : (
												<BsToggle2Off />
											)}
										</div>
									</td>
									<td>
										<div className="table-row-actions">
											<button
												className="theme-icon-btn"
												onClick={() =>
													setFormState({
														active: true,
														onSubmit: updateCompany,
														data: company,
													})
												}
											>
												<MdOutlineEdit />
											</button>
											<button className="theme-icon-btn">
												<IoCloseOutline
													style={{ color: "red" }}
													onClick={() => showAlert(company)}
												/>
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
			{formState?.active && (
				<CompanyForm {...formState} close={() => setFormState((i) => ({ ...i, active: false }))} />
			)}
		</>
	)
}

const CompanyForm = ({
	close,
	onSubmit,
	data = { sort_order: 1, company_title: "", status: 0 },
}) => {
	const [company, setCompany] = useState(data)
	const onChange = (e) => setCompany((i) => ({ ...i, [e.target.id]: e.target.value }))
	const switchStatus = () => setCompany((i) => ({ ...i, status: +!+i?.status }))
	const submit = (e) => {
		e.preventDefault()
		onSubmit(company)
		close()
	}

	return (
		<div className="overlay-wrapper">
			<div id="company-form">
				<button id="close" onClick={close}>
					<IoIosCloseCircle />
				</button>
				<h2>Company Details</h2>
				<form onSubmit={submit}>
					<div>
						<label htmlFor="sort_order">Sort Order</label>
						<div className="numbers-input">
							<button
								type="button"
								className="theme-icon-btn"
								onClick={() =>
									company?.sort_order > 1 &&
									setCompany((i) => ({ ...i, sort_order: +i.sort_order - 1 }))
								}
							>
								<FiChevronLeft />
							</button>
							<input
								type="number"
								id="sort_order"
								value={company?.sort_order}
								onChange={onChange}
							/>
							<button
								type="button"
								className="theme-icon-btn"
								onClick={() => setCompany((i) => ({ ...i, sort_order: +i.sort_order + 1 }))}
							>
								<FiChevronRight />
							</button>
						</div>
					</div>
					<div>
						<label htmlFor="company_title">Company Title</label>
						<input
							type="text"
							className="form-input"
							id="company_title"
							value={company?.company_title}
							onChange={(e) => setCompany((i) => ({ ...i, company_title: e.target.value }))}
						/>
					</div>

					<div>
						<label htmlFor="status">Status</label>
						<div style={{ fontSize: "1.65rem" }}>
							<span onClick={switchStatus}>
								{company?.status ? <BsToggle2On style={{ color: "#44cd4a" }} /> : <BsToggle2Off />}
							</span>
						</div>
					</div>

					<div>
						<label htmlFor="status">Load Rate (Billing)</label>
						<div style={{ position: "relative" }}>
							<select
								name="load_rate"
								className="form-input"
								value={company?.load_rate}
								onChange={(e) => setCompany((i) => ({ ...i, load_rate: e.target.value }))}
								style={{ width: "100%", appearance: "none" }}
							>
								{companyLoadRates.map(({ value, label }) => (
									<option value={value}>{label}</option>
								))}
							</select>
							<FaChevronDown
								style={{ position: "absolute", right: "20px", top: "50%", translate: "0 -50%" }}
							/>
						</div>
					</div>
					<button type="submit" className="theme-btn round">
						Submit
					</button>
				</form>
			</div>
		</div>
	)
}

export default Companies
