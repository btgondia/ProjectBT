import { useState, useEffect, useRef, useCallback, useMemo, useContext } from "react"
import axios from "axios"
import Select from "react-select"
import { v4 as uuid } from "uuid"
import { Billing, CONTROL_AUTO_REFRESH, jumpToNextIndex } from "../Apis/functions"
import { Add, CheckCircle, ContentCopy, NoteAdd, WhatsApp } from "@mui/icons-material"
import { useReactToPrint } from "react-to-print"
import { AddCircle as AddIcon, RemoveCircle } from "@mui/icons-material"

import FreeItems from "./FreeItems"
import DiliveryReplaceMent from "./DiliveryReplaceMent"
import TaskPopupMenu from "./TaskPopupMenu"
import MessagePopup from "./MessagePopup"
import context from "../context/context"
import { IoCheckmarkDoneOutline } from "react-icons/io5"
import { FaSave } from "react-icons/fa"
import Prompt from "./Prompt"
import OrderPrintWrapper from "./OrderPrintWrapper"

const default_status = [
	{ value: 0, label: "Preparing" },
	{ value: 1, label: "Ready" },
	{ value: 2, label: "Hold" },
	{ value: 3, label: "Canceled" }
]
const priorityOptions = [
	{ value: 0, label: "Normal" },
	{ value: 1, label: "High" }
]
export function OrderDetails({
	orderJson,
	order_uuid,
	onSave,
	orderStatus,
	items = [],
	counter = [],
	paymentModeData = [],
	itemCategories = [],
	trips = [],
	userData = [],
	warehouseData = [],
	reminder = null
}) {
	const {
		setNotification,
		promptState,
		setPromptState,
		getSpecialPrice,
		saveSpecialPrice,
		spcPricePrompt,
		sendPaymentReminders
	} = useContext(context)
	const [counters, setCounters] = useState([])
	const [waiting, setWaiting] = useState(false)
	const [caption, setCaption] = useState("")
	const [captionPopup, setCaptionPopup] = useState("")
	const [reminderDate, setReminderDate] = useState()
	const [category, setCategory] = useState([])
	const [itemsData, setItemsData] = useState([])
	const [editOrder, setEditOrder] = useState(false)
	const [deliveryPopup, setDeliveryPopup] = useState(false)
	const [orderData, setOrderData] = useState()
	const [selectedTrip, setSelectedTrip] = useState("")
	const [printData, setPrintData] = useState({ item_details: [], status: [] })
	const [holdPopup, setHoldPopup] = useState(false)
	const [messagePopup, setMessagePopup] = useState(false)
	const [splitHoldPopup, setSplitHold] = useState(false)
	const [paymentModes, setPaymentModes] = useState([])
	const [complete, setComplete] = useState(false)
	const [completeOrder, setCompleteOrder] = useState(false)
	const [order, setOrder] = useState({})

	const [taskPopup, setTaskPopup] = useState(false)
	const [warehousePopup, setWarhousePopup] = useState(false)
	const [users, setUsers] = useState([])
	const [tripData, setTripData] = useState([])
	const [uuids, setUuid] = useState()
	const [popupDetails, setPopupDetails] = useState()
	const [popupDiscount, setPopupDiscount] = useState()
	const [copymsg, setCopymsg] = useState()
	const [notesPopup, setNotesPoup] = useState()
	const [counterNotesPopup, setCounterNotesPoup] = useState()
	const [popupForm, setPopupForm] = useState()
	const [focusedInputId, setFocusedInputId] = useState(0)
	const reactInputsRef = useRef({})
	const componentRef = useRef(null)
	const [deletePopup, setDeletePopup] = useState(false)
	const [warehouse, setWarehouse] = useState([])
	const [appliedCounterCharges, setAppliedCounterCharges] = useState(null)
	const [deductionsPopup, setDeductionsPopup] = useState()
	const [deductionsData, setDeductionsData] = useState()

	useEffect(CONTROL_AUTO_REFRESH, [])
	const getOrder = async order_uuid => {
		const response = await axios({
			method: "get",
			url: "/orders/GetOrder/" + order_uuid,

			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			console.log({ response: response.data.result })
			setOrder(response.data.result)
			const reason = response?.data?.result?.status?.find(s => +s.stage === 5)?.cancellation_reason
			if (reason)
				setPromptState({
					active: true,
					heading: "Cancellation Reason",
					message: reason,
					actions: [{ label: "Close", classname: "confirm", action: () => setPromptState(null) }]
				})
		}
	}
	useEffect(() => {
		if (order?.receipt_number) {
			setDeliveryPopup("edit")
		}
	}, [order?.receipt_number])
	useEffect(() => {
		if (orderJson) {
			setOrder(orderJson)
		} else {
			getOrder(order_uuid)
		}
	}, [orderJson, order_uuid])
	const GetPaymentModes = async () => {
		if (paymentModeData.length) {
			setPaymentModes(paymentModeData)
			return
		}
		const response = await axios({
			method: "get",
			url: "/paymentModes/GetPaymentModesList",

			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setPaymentModes(response.data.result)
	}
	const getItemCategories = async () => {
		if (itemCategories.length) {
			setCategory(itemCategories)
			return
		}
		const response = await axios({
			method: "get",
			url: "/itemCategories/GetItemCategoryList",
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setCategory(response.data.result)
	}
	const getWarehouseData = async () => {
		if (warehouseData.length) {
			setWarehouse(warehouseData)
			return
		}
		const response = await axios({
			method: "get",
			url: "/warehouse/GetWarehouseList",

			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setWarehouse(response.data.result)
	}
	const getTripData = async () => {
		if (trips.length) {
			setTripData(trips)
			return
		}
		const response = await axios({
			method: "get",
			url: "/trips/GetTripList/" + localStorage.getItem("user_uuid"),

			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setTripData(response.data.result)
	}
	useEffect(() => {
		getTripData()
	}, [popupForm])
	useEffect(() => {
		if (order?.order_status === "A") setEditOrder(true)
	}, [order?.order_status])

	const appendNewRow = () => {
		let item_uuid = uuid()
		setFocusedInputId(`REACT_SELECT_COMPONENT_ITEM_TITLE@${item_uuid}`)
		setTimeout(
			() =>
				setOrderData(prev => ({
					...prev,
					item_details: [
						...prev.item_details,
						{
							uuid: item_uuid,
							b: 0,
							p: 0,
							sr: prev.item_details?.length + 1
						}
					]
				})),
			250
		)
	}

	const shiftFocus = id => jumpToNextIndex(id, reactInputsRef, setFocusedInputId, appendNewRow)
	const callBilling = async (data = orderData, updateInDB) => {
		if (!data && !editOrder) return
		let counter = counters.find(a => data.counter_uuid === a.counter_uuid)
		let time = new Date()
		let autoBilling = await Billing({
			order_uuid: data?.order_uuid,
			invoice_number: `${data?.order_type}${data?.invoice_number}`,
			shortage: data.shortage,
			adjustment: data.adjustment,
			replacement: data.replacement,
			counter_uuid: data.counter_uuid,
			counter,
			items: orderData?.item_details,
			others: {
				stage: 1,
				user_uuid: "240522",
				time: time.getTime(),

				type: "NEW"
			}
		})

		setOrderData(prev => {
			const updated_data = {
				...prev,
				...(data || {}),
				...autoBilling,
				item_details: autoBilling.items?.map(a => ({
					...(prev.item_details.find(b => b.item_uuid === a.item_uuid) || {}),
					...a
				}))
			}
			if (updateInDB) updateOrder({ data: updated_data })
			return updated_data
		})
	}

	const reactToPrintContent = useCallback(() => {
		return componentRef.current
	}, [])

	const handlePrint = useReactToPrint({
		content: reactToPrintContent,
		documentTitle: "Statement",
		removeAfterPrint: true
	})

	const getUsers = async () => {
		if (userData.length) {
			setUsers(userData)
			return
		}
		const response = await axios({
			method: "get",
			url: "/users/GetUserList",

			headers: {
				"Content-Type": "application/json"
			}
		})
		// console.log("users", response);
		if (response.data.success) setUsers(response.data.result)
	}

	// const getAutoBill = async () => {
	//   let data = [];
	//   const response = await axios({
	//     method: "get",
	//     url: "/autoBill/autoBillItem",

	//     headers: {
	//       "Content-Type": "application/json",
	//     },
	//   });
	//   if (response.data.success) data = response;
	//   const response1 = await axios({
	//     method: "get",
	//     url: "/autoBill/autoBillQty",

	//     headers: {
	//       "Content-Type": "application/json",
	//     },
	//   });
	//   if (response1.data.success)
	//     data = data ? response1.data.result : [...data, ...response1.data.result];
	//   // console.log(data);
	// };

	useEffect(() => {
		setOrderData({
			...order,
			priority: order?.priority || 0,
			item_details: order?.item_details?.map((a, i) => ({
				...itemsData.find(b => b.item_uuid === a.item_uuid),
				...a,
				uuid: uuid(),
				default: true,
				sr: i + 1
			})),
			fulfillment: []
		})

		if (order?.notes?.filter(a => a)?.length) {
			setNotesPoup(true)
		}
	}, [itemsData, order])

	useEffect(() => {
		if (counters?.find(a => a.counter_uuid === order?.counter_uuid)?.notes?.filter(a => a)?.length) {
			setCounterNotesPoup(counters?.find(a => a.counter_uuid === order?.counter_uuid))
		}
	}, [counters, order?.counter_uuid])

	useEffect(() => {
		setPrintData(prev => ({
			...prev,
			...orderData,
			item_details:
				orderData?.item_details
					?.map(a => ({
						...a,
						category_title: category.find(b => b.category_uuid === a.category_uuid)?.category_title
					}))
					.sort((a, b) => a?.category_title?.localeCompare(b.category_title) || a?.item_title?.localeCompare(b.item_title))
					?.filter(a => +a.status !== 3)
					?.map((a, i) => ({
						...a,
						sr: i + 1
					})) || []
		}))
	}, [category, orderData])

	const getItemsData = async item => {
		if (items.length) {
			console.log(items)
			setItemsData(items)
			return
		}
		const response = await axios({
			method: "post",
			url: "/items/GetItemList",
			data: { items: item },
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setItemsData(response.data.result)
	}

	const getItemsDataReminder = async () => {
		if (reminder) {
			setReminderDate(reminder)
			return
		}
		const response = await axios({
			method: "get",
			url: "/items/getNewItemReminder",

			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setReminderDate(response.data.result)
	}

	const getCounters = async counters => {
		if (counter.length) {
			setCounters(counter)
		} else {
			const response = await axios({
				method: "post",
				url: "/counters/GetCounterList",
				data: { counters },
				headers: {
					"Content-Type": "application/json"
				}
			})
			if (response.data.success) setCounters(response.data.result)
		}
	}

	const getAppliedCounterCharges = async charges_uuid => {
		try {
			const response = await axios.post(`/counterCharges/list`, { charges_uuid })
			if (response.data.success) setAppliedCounterCharges(response.data.result)
		} catch (error) {
			console.error(error)
		}
	}

	const sendMsg = async () => {
		if (waiting) {
			return
		}
		setWaiting(true)
		const response = await axios({
			method: "post",
			url: "/orders/sendPdf",
			data: {
				caption,
				counter_uuid: orderData.counter_uuid,
				order_uuid: orderData.order_uuid,
				invoice_number: orderData.invoice_number,
				additional_users: userSelection,
				additional_numbers: Object.values(additionalNumbers?.values)
			},
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data) {
			setNotification(response.data)
			setTimeout(() => setNotification(null), 5000)
			setCaptionPopup(null)
			setCaption("")
			setWaiting(false)
		}
	}

	useEffect(() => {
		// getAutoBill();
		getUsers()
		getWarehouseData()
		getItemCategories()
		getItemsDataReminder()
		GetPaymentModes()
	}, [])

	useEffect(() => {
		if (order) {
			setDeductionsData({
				actual: +order?.replacement || 0,
				shortage: +order?.shortage || 0,
				adjustment: +order?.adjustment || 0,
				adjustment_remarks: order?.adjustment_remarks || ""
			})
			getCounters([order?.counter_uuid])
			getItemsData(order?.item_details?.map(a => a.item_uuid))
			if (order?.counter_charges) getAppliedCounterCharges(order?.counter_charges)
		}
	}, [order])

	const onSubmit = async (type = { stage: 0, diliveredUser: "" }, completedOrderEdited) => {
		if (orderData?.payment_pending && !orderData.notes?.length) return setNotesPoup(true)
		let counter = counters.find(a => orderData?.counter_uuid === a.counter_uuid)
		let fulfillment = orderData.fulfillment

		for (let item of orderData.item_details) {
			let itemData = order?.item_details.find(a => a.item_uuid === item.item_uuid)
			let aQty = +(item?.b || 0) * (+item?.conversion || 0) + (+item?.p || 0)
			let bQty = +(itemData?.b || 0) * (+item?.conversion || 0) + (+itemData?.p || 0)
			let difference = bQty - aQty
			if (bQty > aQty) {
				let exicting = fulfillment?.find(a => a.item_uuid === item.item_uuid)
				if (exicting) {
					difference = difference + (+(exicting.b || 0) * (+item.conversion || 0) + (+exicting.p || 0))
				}

				fulfillment.push({
					item_uuid: item.item_uuid,
					b: Math.floor(difference / (+item.conversion || 1)),
					p: Math.floor(difference % (+item.conversion || 1))
				})
			}
		}
		// console.log(fulfillment);
		let data = {
			...orderData,
			item_details: orderData?.item_details?.filter(a => a.item_uuid) || []
		}

		let autoBilling = await Billing({
			order_uuid: data?.order_uuid,
			invoice_number: `${data?.order_type}${data?.invoice_number}`,
			counter,
			items: data.item_details,
			replacement: data.replacement,
			adjustment: data.adjustment,
			shortage: data.shortage,
			others: {}
		})
		data = {
			...data,
			...autoBilling,
			item_details: autoBilling.items
		}
		let time = new Date()
		let user_uuid = localStorage.getItem("user_uuid")
		data = {
			...data,
			item_details: data.item_details?.map(a => ({
				...a,
				gst_percentage: a.item_gst,
				status: a.status || 0,
				price: a?.price || a.item_price || 0
			})),
			order_status: data?.item_details?.filter(a => a.price_approval === "N")?.length ? "A" : "R",
			orderStatus
		}

		data =
			type.stage === 5
				? {
						...data,
						status: [
							{
								stage: 1,
								time: data?.status?.find(a => +a.stage === 1)?.time || time.getTime(),
								user_uuid: data?.status?.find(a => +a.stage === 1)?.user_uuid || user_uuid
							},
							{
								stage: 2,
								time: data?.status?.find(a => +a.stage === 1)?.time || time.getTime(),
								user_uuid: data?.status?.find(a => +a.stage === 1)?.user_uuid || user_uuid
							},
							{
								stage: 3,
								time: data?.status?.find(a => +a.stage === 1)?.time || time.getTime(),
								user_uuid: data?.status?.find(a => +a.stage === 1)?.user_uuid || user_uuid
							},
							{
								stage: 4,
								time: time.getTime(),
								user_uuid
							},
							{
								stage: 3.5,
								time: time.getTime(),
								user_uuid: type.diliveredUser
							}
						]
				  }
				: {
						...data,
						fulfillment: [
							...(fulfillment || []),
							...(order?.fulfillment?.filter(a => !fulfillment.find(b => b.item_uuid === a.item_uuid)) || [])
						]
				  }
		if (completedOrderEdited) {
			setOrderData(data)
			setDeliveryPopup("edit")
			return
		}

		if (completeOrder) {
			updateOrder({ data })
		} else {
			setMessagePopup(data)
		}
	}

	const updateOrder = async (param = {}) => {
		const { data = messagePopup, sendPaymentReminder } = param
		setWaiting(true)
		console.log({ messagePopup })
		const response = await axios({
			method: "put",
			url: "/orders/putOrders",
			data: [
				{
					...data,
					item_details: data.item_details?.map(i => ({ ...i, price: +(+i.price).toFixed(3) }))
				}
			],
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			getOrder(order_uuid, true)
			setEditOrder(false)
			if (sendPaymentReminder) sendPaymentReminders([orderData?.counter_uuid])
		}
		setWaiting(false)
		if (!completeOrder) {
			setMessagePopup(false)
		}
	}

	const splitOrder = async (type = { stage: 0 }) => {
		setWaiting(true)
		let counter = counters.find(a => orderData?.counter_uuid === a.counter_uuid)
		let fulfillment = orderData.fulfillment
		for (let item of orderData.item_details) {
			let itemData = order?.item_details.find(a => a.item_uuid === item.item_uuid)
			let aQty = +(item?.b || 0) * (+item?.conversion || 0) + (+item?.p || 0)
			let bQty = +(itemData?.b || 0) * (+item?.conversion || 0) + (+itemData?.p || 0)
			let difference = bQty - aQty
			if (bQty > aQty) {
				let exicting = fulfillment?.find(a => a.item_uuid === item.item_uuid)
				if (exicting) {
					difference = difference + (+(exicting.b || 0) * (+item.conversion || 0) + (+exicting.p || 0))
				}

				fulfillment.push({
					item_uuid: item.item_uuid,
					b: Math.floor(difference / (+item.conversion || 1)),
					p: Math.floor(difference % (+item.conversion || 1))
				})
			}
		}
		// console.log(fulfillment);
		let data = {
			...orderData,

			item_details: orderData?.item_details?.filter(a => a.item_uuid && +a.status !== 2) || []
		}
		let data2 = {
			...orderData,

			item_details: orderData?.item_details?.filter(a => a.item_uuid && +a.status === 2) || []
		}

		let autoBilling = await Billing({
			order_uuid: data?.order_uuid,
			invoice_number: `${data?.order_type}${data?.invoice_number}`,
			counter,
			items: data.item_details,
			replacement: data.replacement,
			adjustment: data.adjustment,
			shortage: data.shortage,
			others: {}
		})
		data = {
			...data,
			...autoBilling,
			item_details: autoBilling.items
		}
		let autoBilling2 = await Billing({
			order_uuid: data2?.order_uuid,
			invoice_number: `${data2?.order_type}${data2?.invoice_number}`,
			counter,
			items: data2.item_details,
			replacement: data2.replacement,
			adjustment: data2.adjustment,
			shortage: data2.shortage,
			others: {}
		})
		data2 = {
			...data2,
			...autoBilling2,
			item_details: autoBilling2.items
		}
		let time = new Date()
		let user_uuid = localStorage.getItem("user_uuid")
		data = {
			...data,

			item_details: data.item_details?.map(a => ({
				...a,
				gst_percentage: a.item_gst,
				status: a.status || 0,
				price: a?.price || a.item_price || 0
			})),
			order_status: data?.item_details?.filter(a => a.price_approval === "N")?.length ? "A" : "R",
			orderStatus
		}

		data =
			type.stage === 5
				? {
						...data,
						status: [
							{
								stage: 1,
								time: data?.status?.find(a => +a.stage === 1)?.time || time.getTime(),
								user_uuid: data?.status?.find(a => +a.stage === 1)?.user_uuid || user_uuid
							},
							{
								stage: 2,
								time: data?.status?.find(a => +a.stage === 1)?.time || time.getTime(),
								user_uuid: data?.status?.find(a => +a.stage === 1)?.user_uuid || user_uuid
							},
							{
								stage: 3,
								time: data?.status?.find(a => +a.stage === 1)?.time || time.getTime(),
								user_uuid: data?.status?.find(a => +a.stage === 1)?.user_uuid || user_uuid
							},
							{
								stage: 4,
								time: time.getTime(),
								user_uuid
							}
						]
				  }
				: {
						...data,
						fulfillment: [
							...(fulfillment || []),
							...(order?.fulfillment?.filter(a => !fulfillment.find(b => b.item_uuid === a.item_uuid)) || [])
						]
				  }
		// console.log("data", data);

		const response = await axios({
			method: "put",
			url: "/orders/putOrders",
			data: [data],
			headers: {
				"Content-Type": "application/json"
			}
		})
		delete data2.order_uuid
		delete data2.invoice_number
		delete data2._id
		const response2 = await axios({
			method: "post",
			url: "/orders/postOrder",
			data: data2,
			headers: {
				"Content-Type": "application/json"
			}
		})

		if (response2.data.success) {
			// window.location.reload();
			console.log(response2)
		}
		if (response.data.success) {
			onSave()
		}
		setWaiting(false)
	}

	const handleWarehouseChacking = async (complete, methodType) => {
		let warehouse_uuid =
			users.find(a => a.user_uuid === localStorage.getItem("user_uuid"))?.warehouse[0] ||
			JSON.parse(localStorage.getItem("warehouse") || "")
		if (methodType === "complete") {
			setComplete(true)
		}
		if (
			warehouse_uuid &&
			// +warehouse_uuid !== 0 &&
			warehouse_uuid !== orderData.warehouse_uuid
		) {
			// console.log("data", orderData.warehouse_uuid);

			if (!orderData.warehouse_uuid) {
				updateWarehouse(warehouse_uuid, methodType)
			} else {
				//   setWarhousePopup(warehouse_uuid);
				if (methodType === "complete" || complete) {
					setDeliveryPopup(true)
				} else {
					handleTaskChecking()
				}
			}
		} else {
			if (methodType === "complete" || complete) {
				setDeliveryPopup(true)
			} else {
				handleTaskChecking()
			}
		}
	}

	const updateWarehouse = async (warehouse_uuid, method) => {
		const response = await axios({
			method: "put",
			url: "/orders/putOrders",
			data: [{ ...orderData, warehouse_uuid }],
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			setOrderData(prev => ({
				...prev,
				warehouse_uuid
			}))
			if (method === "complete" || complete) {
				setDeliveryPopup(true)
			} else handleTaskChecking()
		}
	}

	useEffect(() => {
		if (!editOrder) return
		reactInputsRef.current?.[orderData?.item_details?.[0]?.uuid]?.focus()
	}, [editOrder])
	const HoldOrder = async (hold = "Y") => {
		let data = {
			...orderData,
			hold
		}
		data = Object.keys(data)
			?.filter(key => key !== "notes")
			.reduce((obj, key) => {
				obj[key] = data[key]
				return obj
			}, {})
		const response = await axios({
			method: "put",
			url: "/orders/putOrders",
			data: [data],
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			onSave()
		}
	}
	let listItemIndexCount = 0
	const handleTaskChecking = async () => {
		const response = await axios({
			method: "get",
			url: "/tasks/getCounterTask/" + orderData.counter_uuid,
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			setTaskPopup(response.data.result)
		} else handlePrint()
	}
	const postOrderData = async () => {
		const response = await axios({
			method: "put",
			url: "/orders/putOrders",
			data: [
				{
					order_uuid: orderData.order_uuid,
					invoice_number: orderData.invoice_number,
					trip_uuid: +selectedTrip.trip_uuid === 0 ? "" : selectedTrip?.trip_uuid,
					warehouse_uuid: +selectedTrip?.trip_uuid === 0 ? "" : selectedTrip?.warehouse_uuid
					// warehouse_uuid: selectedTrip?.warehouse_uuid,
				}
			],
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			setOrderData(prev => ({
				...prev,
				trip_uuid: +selectedTrip.trip_uuid === 0 ? "" : selectedTrip.trip_uuid,
				warehouse_uuid: +selectedTrip.trip_uuid === 0 ? "" : selectedTrip.warehouse_uuid
			}))
			setSelectedTrip({ trip_uuid: 0, warehouse_uuid: "" })
		}
	}

	const [dateTimeUpdating, setDateTimeUpdating] = useState(0)
	const handleDateTimeUpdate = async e => {
		try {
			setDateTimeUpdating(1)
			const time = {
				time_1: new Date(e.target.value).getTime(),
				time_2: (orderData?.time_2 - orderData?.time_1 || 48 * 60 * 60 * 1000) + new Date(e.target.value).getTime()
			}

			setOrderData(data => ({ ...data, ...time }))
			const response = await axios.put("/orders/order_datetime", {
				order_uuid: orderData?.order_uuid,
				...time
			})

			if (response?.success) setDateTimeUpdating(2)
		} catch (error) {
			setDateTimeUpdating(0)
		}
	}

	const print_items_length = orderData?.order_type !== "E" ? 16 : 19
	const getPrintData = () => {
		const sourceArray = printData?.item_details
		const arrayOfArrays = []
		const l = print_items_length

		for (let i = 0; i < sourceArray.length; i += l) {
			if (l - 4 < sourceArray.length - i && sourceArray.length - i < l) {
				arrayOfArrays.push(sourceArray.slice(i, i + (l - 4)))
				arrayOfArrays.push(sourceArray.slice(i + (l - 4), i + l))
			} else {
				arrayOfArrays.push(sourceArray.slice(i, i + l))
			}
			console.log(i, sourceArray.length, arrayOfArrays)
		}

		const result = arrayOfArrays?.map(_i => ({ ...printData, item_details: _i }))
		console.log({ arrayOfArrays, result })
		return result
	}

	const [additionalNumbers, setAdditionalNumbers] = useState({ count: 0, values: [] })
	const [userSelection, setUserSelection] = useState([])

	return deliveryPopup ? (
		<DiliveryPopup
			onSave={() => {
				if (order?.receipt_number) {
					onSave()
				}
				if (deliveryPopup === "edit") onSubmit()
				setDeliveryPopup(false)
			}}
			deliveryPopup={deliveryPopup}
			postOrderData={diliveredUser => onSubmit({ stage: 5, diliveredUser })}
			setSelectedOrder={setOrderData}
			order={orderData}
			counters={counters}
			items={itemsData}
			updateBilling={callBilling}
			users={users}
		/>
	) : (
		<>
			<div className="overlay">
				<div
					className="modal"
					style={{
						maxHeight: "100vh",
						height: "max-content",
						width: "90vw",
						padding: "0",
						zIndex: "999999999",
						border: "2px solid #000",
						fontSize: "12px"
					}}
				>
					<div className="inventory" style={{ height: "max-content", maxHeight: "100vh" }}>
						<div
							className="accountGroup"
							id="voucherForm"
							action=""
							style={{
								// height: "400px",
								height: "max-content",
								maxHeight: "75vh",
								overflow: "scroll"
							}}
						>
							<div className="inventory_header" style={{ backgroundColor: "#fff", color: "#000" }}>
								{editOrder ? (
									<>
										<div className="inputGroup order-edit-select">
											<label htmlFor="Warehouse">Counter</label>
											<div className="inputGroup">
												<Select
													options={counters?.map(a => ({
														value: a.counter_uuid,
														label: a.counter_title
													}))}
													onChange={doc => {
														setOrderData(prev => ({
															...prev,
															counter_uuid: doc.value
														}))
													}}
													value={
														orderData?.counter_uuid
															? {
																	value: orderData?.counter_uuid,
																	label: counters?.find(j => j.counter_uuid === orderData.counter_uuid)?.counter_title
															  }
															: { value: 0, label: "None" }
													}
													// autoFocus={!order?.warehouse_uuid}
													openMenuOnFocus={true}
													menuPosition="fixed"
													menuPlacement="auto"
													placeholder="Select"
												/>
											</div>
										</div>
										<div className="inputGroup order-edit-select">
											<label htmlFor="Warehouse">Priority</label>
											<div className="inputGroup">
												<Select
													options={priorityOptions}
													onChange={doc => setOrderData(x => ({ ...x, priority: doc?.value }))}
													value={priorityOptions?.find(j => j.value === orderData.priority)}
													openMenuOnFocus={true}
													menuPosition="fixed"
													menuPlacement="auto"
													placeholder="Select Priority"
												/>
											</div>
										</div>

										<div className="inputGroup order-edit-select">
											<label htmlFor="Warehouse">Time</label>
											<div className="inputGroup" style={{ width: "fit-content" }}>
												{/* <label
													htmlFor="order-datetime"
													style={{ margin: "auto", width: "fit-content" }}>
													{new Date(+orderData?.time_1).toDateString()}
												</label> */}
												<input
													type="datetime-local"
													id="order-datetime"
													onChange={handleDateTimeUpdate}
													disabled={dateTimeUpdating === 1}
													value={orderData?.time_1 ? new Date(+orderData?.time_1).toJSON().split(".")[0] : ""}
												/>
											</div>

											{dateTimeUpdating === 2 ? (
												<span style={{ fontSize: "1.1rem" }}>✓</span>
											) : (
												<svg viewBox="0 0 100 100" style={{ width: "20px", opacity: dateTimeUpdating }}>
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
											)}
										</div>
									</>
								) : (
									<h2 className="flex">
										<span
											className="flex"
											style={{
												cursor: "pointer",
												// backgroundColor: "#000",
												width: "fit-content"
											}}
											onClick={() => setCounterNotesPoup(counters.find(a => a.counter_uuid === orderData.counter_uuid))}
										>
											<NoteAdd />
											{counters.find(a => a.counter_uuid === orderData?.counter_uuid)?.counter_title || ""} :{" "}
											{orderData?.invoice_number || ""}
										</span>
									</h2>
								)}
							</div>
							<div className="inventory_header">
								<h2>Order Details</h2>
							</div>

							<div className="topInputs">
								<div
									className="inputGroup flex"
									style={{
										width: "100%",
										flexDirection: "row",
										justifyContent: "space-between"
									}}
								>
									<button
										style={{ width: "fit-Content", backgroundColor: "red" }}
										className="theme-btn"
										onClick={() => setDeletePopup("Delete")}
									>
										Cancel Order
									</button>

									{order?.hold !== "Y" ? (
										<button
											style={{ width: "fit-Content", backgroundColor: "blue" }}
											className="theme-btn"
											onClick={() => {
												if (orderData.notes?.length) {
													setDeletePopup("hold")
												} else setNotesPoup("hold")
											}}
										>
											Hold Order
										</button>
									) : (
										<button
											style={{ width: "fit-Content", backgroundColor: "blue" }}
											className="theme-btn"
											onClick={() => {
												HoldOrder("N")
											}}
										>
											Cancel Hold
										</button>
									)}
									<button
										style={{ width: "fit-Content", backgroundColor: "blue" }}
										className="theme-btn"
										onClick={() => setDeductionsPopup(true)}
									>
										Deductions
									</button>
									<button
										style={{ width: "fit-Content", backgroundColor: "#44cd4a" }}
										className="theme-btn"
										onClick={() => {
											handleWarehouseChacking(true, "complete")
											setCompleteOrder(true)
										}}
									>
										Complete Order
									</button>
									<button
										style={{ width: "fit-Content", backgroundColor: "black" }}
										className="theme-btn"
										onClick={() => {
											if (
												!window.location.pathname.includes("completeOrderReport") &&
												(window.location.pathname.includes("admin") || window.location.pathname.includes("trip"))
											)
												handleWarehouseChacking()
											else handlePrint()
										}}
									>
										Print
									</button>
									{editOrder ? (
										<button
											className="theme-btn"
											style={{
												width: "max-content"
											}}
											onClick={() => setHoldPopup("Summary")}
										>
											Free
										</button>
									) : (
										<button
											className="theme-btn"
											style={{
												width: "max-content"
											}}
											onClick={() => setSplitHold(true)}
										>
											Split Hold Order
										</button>
									)}
									<button
										style={{ width: "fit-Content" }}
										className="theme-btn"
										onClick={e => {
											reactInputsRef.current = {}
											e.target.blur()
											if (!editOrder) {
												getItemsData([])
												getCounters([])
											}
											setEditOrder(prev => !prev)
										}}
									>
										Edit
									</button>
									<button
										style={{ width: "fit-Content" }}
										className="theme-btn"
										onClick={e => {
											reactInputsRef.current = {}
											e.target.blur()
											setPopupForm(true)
											setSelectedTrip(orderData?.trip_uuid || 0)
										}}
									>
										Assign Trip
									</button>
									<button
										style={{ width: "fit-Content" }}
										className="theme-btn"
										onClick={e => {
											e.target.blur()
											setNotesPoup(prev => !prev)
										}}
									>
										Notes
									</button>
								</div>
							</div>

							<div className="items_table" style={{ flex: "1", paddingLeft: "10px" }}>
								<table>
									<thead className="bb b--green" style={{ position: "sticky", top: 0, zIndex: "100" }}>
										<>
											<tr>
												<th>Warehouse</th>
												<th>
													{editOrder ? (
														<Select
															options={[
																{ value: "", label: "None" },
																...warehouse?.map((a, j) => ({
																	value: a.warehouse_uuid,
																	label: a.warehouse_title
																}))
															]}
															onChange={e => {
																setOrderData(prev => ({
																	...prev,
																	warehouse_uuid: e.value
																}))
															}}
															value={{
																value: orderData.warehouse_uuid || "",
																label:
																	warehouse.find(a => orderData?.warehouse_uuid === a.warehouse_uuid)?.warehouse_title || "None"
															}}
															openMenuOnFocus={true}
															menuPosition="fixed"
															menuPlacement="auto"
															placeholder="Item"
														/>
													) : (
														warehouse.find(a => orderData?.warehouse_uuid === a.warehouse_uuid)?.warehouse_title || "None"
													)}
												</th>
												<th>Grand Total</th>
												<th>{orderData?.order_grandtotal || 0}</th>
												<th
													className={
														window.location.pathname.includes("completeOrderReport") ||
														window.location.pathname.includes("signedBills") ||
														window.location.pathname.includes("pendingEntry") ||
														window.location.pathname.includes("upiTransactionReport")
															? "hover_class"
															: ""
													}
													onClick={() =>
														window.location.pathname.includes("completeOrderReport") ||
														window.location.pathname.includes("signedBills") ||
														window.location.pathname.includes("pendingEntry") ||
														window.location.pathname.includes("upiTransactionReport")
															? setDeliveryPopup("put")
															: {}
													}
												>
													Payment Total
												</th>
												<th>{orderData?.payment_total || 0}</th>
												<th style={{ width: "12%" }}>UUID</th>
												<th
													onClick={() => {
														setCopymsg(true)
														navigator.clipboard.writeText(orderData?.order_uuid)
														setTimeout(() => setCopymsg(false), 1000)
													}}
													style={{
														cursor: "pointer",
														position: "relative",
														width: "12%"
													}}
													onMouseOver={() => setUuid(true)}
													onMouseLeave={() => setUuid(false)}
												>
													{orderData?.order_uuid?.substring(0, 7) + "..."}
													{copymsg && (
														<div
															style={{
																position: "absolute",
																top: "100%"
															}}
														>
															<div id="talkbubble">COPIED!</div>
														</div>
													)}
													{"   "}
													<ContentCopy
														style={
															uuids
																? {
																		fontSize: "12px",
																		transform: "scale(1.5)"
																  }
																: { fontSize: "12px" }
														}
														onClick={() => {
															setCopymsg(true)
															navigator.clipboard.writeText(orderData?.order_uuid)
															setTimeout(() => setCopymsg(false), 1000)
														}}
													/>
													{uuids && (
														<div
															style={{
																position: "absolute",
																top: "100%"
															}}
														>
															<div id="talkbubble">{orderData?.order_uuid}</div>
														</div>
													)}
												</th>
											</tr>
											<tr>
												<th colSpan={2} style={{ textAlign: "center" }}>
													<button
														style={{ width: "fit-Content" }}
														className="theme-btn"
														onClick={() =>
															setPopupDetails({
																type: "Status",
																data: orderData?.status
															})
														}
													>
														Status
													</button>
												</th>
												<th colSpan={2} style={{ textAlign: "center" }}>
													<button
														style={{ width: "fit-Content" }}
														className="theme-btn"
														onClick={() =>
															setPopupDetails({
																type: "Delivery Return",
																data: orderData?.delivery_return
															})
														}
													>
														Delivery Return
													</button>
												</th>
												<th colSpan={2} style={{ textAlign: "center" }}>
													<button
														style={{ width: "fit-Content" }}
														className="theme-btn"
														onClick={() =>
															setPopupDetails({
																type: "Fulfillment",
																data: orderData?.fulfillment
															})
														}
													>
														Fulfillment
													</button>
												</th>
												<th colSpan={2} style={{ textAlign: "center" }}>
													<button
														style={{ width: "fit-Content" }}
														className="theme-btn"
														onClick={() =>
															setPopupDetails({
																type: "Auto Added",
																data: orderData?.auto_Added
															})
														}
													>
														Auto Added
													</button>
												</th>
											</tr>
										</>
									</thead>
								</table>

								<table className="f6 w-100 center" cellSpacing="0">
									<thead className="lh-copy" style={{ position: "static" }}>
										<tr className="white">
											{editOrder ? (
												<>
													<th style={{ width: "8px" }}></th>
												</>
											) : (
												""
											)}
											<th className="pa2 tl bb b--black-20 w-30">Sr.</th>
											<th className="pa2 tl bb b--black-20 w-30">Item Name</th>
											<th className="pa2 tl bb b--black-20 w-30">MRP</th>
											{editOrder ? <th className="pa2 tl bb b--black-20 w-30">Status</th> : ""}
											<th className="pa2 tc bb b--black-20">Quantity(b)</th>
											<th className="pa2 tc bb b--black-20">Quantity(p)</th>
											<th className="pa2 tc bb b--black-20 ">Price(p)</th>
											<th className="pa2 tc bb b--black-20 ">Price(b)</th>
											{editOrder ? (
												<>
													<th className="pa2 tc bb b--black-20 ">Old Price</th>
													<th className="pa2 tc bb b--black-20 "></th>
													<th className="pa2 tc bb b--black-20 "></th>
												</>
											) : (
												""
											)}
										</tr>
									</thead>
									<tbody className="lh-copy">
										{orderData?.item_details?.map((item, i) => {
											const item_title_component_id = `REACT_SELECT_COMPONENT_ITEM_TITLE@${item.uuid}`
											const item_status_component_id = `REACT_SELECT_COMPONENT_ITEM_STATUS@${item.uuid}`

											return (
												<tr
													key={i}
													style={{
														height: "20px",
														backgroundColor:
															item.price_approval === "N"
																? "#00edff"
																: +item.status === 1
																? "green"
																: +item.status === 2
																? "yellow"
																: +item.status === 3
																? "red"
																: "#fff",
														color:
															item.price_approval === "N" ? "#000" : +item.status === 1 || +item.status === 3 ? "#fff" : "#000",
														borderBottom: "2px solid #fff"
													}}
												>
													{editOrder ? (
														<>
															<td style={{ width: "8px" }}>
																{item.price_approval === "N" ? (
																	<span
																		onClick={() =>
																			setOrderData(prev => ({
																				...prev,
																				item_details: prev.item_details?.map(a =>
																					a.uuid === item.uuid
																						? {
																								...a,
																								price_approval: "Y"
																						  }
																						: a
																				)
																			}))
																		}
																	>
																		<CheckCircle
																			sx={{ fontSize: 15 }}
																			style={{
																				cursor: "pointer",
																				color: "blue"
																			}}
																		/>
																	</span>
																) : (
																	""
																)}
																<span
																	onClick={() =>
																		setOrderData(prev => {
																			let exicting = order?.fulfillment?.find(a => a.item_uuid === item.item_uuid)
																			let difference = 0
																			if (exicting) {
																				difference =
																					+(item.b || 0) * (+item.conversion || 0) +
																					(+item.p || 0) +
																					(+(exicting.b || 0) * (+item.conversion || 0) + (+exicting.p || 0))
																			}
																			let fulfillment = exicting
																				? [
																						...(prev.fulfillment || []),

																						{
																							item_uuid: item.item_uuid,
																							b: Math.floor(difference / (+item.conversion || 1)),
																							p: Math.floor(difference % (+item.conversion || 1))
																						}
																				  ]
																				: [
																						...(prev.fulfillment || []),
																						{
																							item_uuid: item.item_uuid,
																							b: item.b,
																							p: item.p
																						}
																				  ]

																			return {
																				...prev,
																				item_details: prev.item_details?.filter(a => !(a.uuid === item.uuid)),
																				fulfillment
																			}
																		})
																	}
																>
																	<RemoveCircle
																		sx={{
																			fontSize: item.price_approval === "N" ? 15 : 20
																		}}
																		style={{
																			cursor: "pointer",
																			color: "red"
																		}}
																	/>
																</span>
															</td>
														</>
													) : (
														""
													)}
													<td className="ph2 pv1 tl bb b--black-20 bg-white" style={{ textAlign: "center", width: "3ch" }}>
														{item.sr || i + 1}
													</td>
													<td className="ph2 pv1 tl bb b--black-20 bg-white">
														<div
															className="inputGroup"
															index={!item.default ? listItemIndexCount++ : ""}
															id={!item.default ? item_title_component_id : ""}
															// style={{ height: "20px" }}
														>
															{editOrder && !item.default ? (
																<Select
																	ref={ref => (reactInputsRef.current[item_title_component_id] = ref)}
																	styles={{
																		control: styles => ({
																			...styles,
																			// minHeight: 20,
																			// maxHeight: 20,
																			borderRadius: 2,
																			padding: 0
																		})
																	}}
																	id={"1_item_uuid" + item.uuid}
																	options={itemsData
																		?.filter(
																			a =>
																				!order?.item_details?.filter(b => a.item_uuid === b.item_uuid)?.length && a.status !== 0
																		)
																		.sort((a, b) => a?.item_title?.localeCompare(b.item_title))
																		?.map((a, j) => ({
																			value: a.item_uuid,
																			label: a.item_title + "______" + a.mrp,
																			key: a.item_uuid
																		}))}
																	onChange={e => {
																		setOrderData(prev => ({
																			...prev,
																			item_details: prev.item_details?.map(a =>
																				a.uuid === item.uuid
																					? {
																							...a,
																							...itemsData.find(b => b.item_uuid === e.value),
																							status: 0,
																							price: itemsData.find(b => b.item_uuid === e.value)?.item_price
																					  }
																					: a
																			)
																		}))
																		shiftFocus(item_status_component_id)
																	}}
																	value={{
																		value: item.item_uuid || "",
																		label: item.item_title ? item.item_title + "______" + item.mrp : "",
																		key: item.item_uuid || item.uuid
																	}}
																	openMenuOnFocus={true}
																	autoFocus={focusedInputId === item_title_component_id || (i === 0 && focusedInputId === 0)}
																	menuPosition="fixed"
																	menuPlacement="auto"
																	placeholder="Item"
																/>
															) : (
																itemsData.find(a => a.item_uuid === item.item_uuid)?.item_title || ""
															)}
														</div>
													</td>
													<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}>
														{item.mrp || ""}
													</td>
													{editOrder ? (
														<td
															className="ph2 pv1 tc bb b--black-20 bg-white"
															style={{
																textAlign: "center",
																color: "#000",
																height: "20px"
															}}
															index={listItemIndexCount++}
															id={item_status_component_id}
														>
															<Select
																ref={ref => (reactInputsRef.current[item_status_component_id] = ref)}
																styles={{
																	control: styles => {
																		// console.log(styles);
																		return {
																			...styles,
																			minHeight: 25,
																			maxHeight: 25,
																			borderRadius: 2,
																			padding: 0,
																			justifyContent: "flex-start",
																			alignItems: "start"
																		}
																	}
																}}
																id={"2_item_uuid" + item.uuid}
																options={default_status}
																onChange={e => {
																	setOrderData(prev => ({
																		...prev,
																		item_details: prev.item_details?.map(a =>
																			a.uuid === item.uuid ? { ...a, status: e.value } : a
																		)
																	}))
																	shiftFocus(item_status_component_id)
																}}
																value={+item.status >= 0 ? default_status.find(a => +a.value === +item.status) : 0}
																// autoFocus={
																// 	focusedInputId === item_status_component_id || (i === 0 && item.default && focusedInputId === 0)
																// }
																openMenuOnFocus={true}
																menuPosition="fixed"
																menuPlacement="auto"
																placeholder="Status"
															/>
														</td>
													) : (
														""
													)}
													<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center", height: "20px" }}>
														{editOrder ? (
															<input
																id={"q" + item.uuid}
																type="number"
																className="numberInput"
																index={listItemIndexCount++}
																style={{
																	width: "10ch",
																	fontSize: "12px",
																	padding: 0,
																	height: "20px"
																}}
																value={item.b || 0}
																onChange={e => {
																	setOrderData(prev => {
																		return {
																			...prev,
																			item_details: prev.item_details?.map(a =>
																				a.uuid === item.uuid
																					? {
																							...a,
																							b: e.target.value
																					  }
																					: a
																			)
																		}
																	})
																}}
																onFocus={e => {
																	e.target.onwheel = () => false
																	e.target.select()
																}}
																onKeyDown={e => (e.key === "Enter" ? shiftFocus(e.target.id) : "")}
																disabled={!item.item_uuid}
																onWheel={e => e.preventDefault()}
															/>
														) : (
															item.b || 0
														)}
													</td>
													<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}>
														{editOrder ? (
															<input
																id={"p" + item.uuid}
																style={{
																	width: "10ch",
																	fontSize: "12px",
																	padding: 0,
																	height: "20px"
																}}
																type="number"
																className="numberInput"
																onWheel={e => e.preventDefault()}
																index={listItemIndexCount++}
																value={item.p || 0}
																onChange={e => {
																	setOrderData(prev => {
																		return {
																			...prev,
																			item_details: prev.item_details?.map(a =>
																				a.uuid === item.uuid
																					? {
																							...a,
																							p: e.target.value
																					  }
																					: a
																			)
																		}
																	})
																}}
																onFocus={e => {
																	e.target.onwheel = () => false
																	e.target.select()
																}}
																onKeyDown={e => (e.key === "Enter" ? shiftFocus(e.target.id) : "")}
																disabled={!item.item_uuid}
															/>
														) : (
															item.p || 0
														)}
													</td>
													<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}>
														{editOrder ? (
															<input
																type="number"
																style={{
																	width: "15ch",
																	fontSize: "12px",
																	padding: 0,
																	height: "20px"
																}}
																className="numberInput"
																onWheel={e => e.preventDefault()}
																index={listItemIndexCount++}
																value={+(+item.price || 0).toFixed(3)}
																onChange={e => {
																	setOrderData(prev => {
																		return {
																			...prev,
																			item_details: prev.item_details?.map(a =>
																				a.uuid === item.uuid
																					? {
																							...a,
																							price: e.target.value
																					  }
																					: a
																			)
																		}
																	})
																}}
																onFocus={e => {
																	e.target.onwheel = () => false
																	e.target.select()
																}}
																onKeyDown={e => (e.key === "Enter" ? shiftFocus(e.target.id) : "")}
																disabled={!item.item_uuid}
															/>
														) : (
															"Rs:" + (item?.price || 0)
														)}
													</td>
													<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}>
														{editOrder ? (
															<input
																type="number"
																style={{
																	width: "15ch",
																	fontSize: "12px",
																	padding: 0,
																	height: "20px"
																}}
																className="numberInput"
																onWheel={e => e.preventDefault()}
																index={listItemIndexCount++}
																value={Math.floor(item.price * item.conversion || 0)}
																onChange={e => {
																	setOrderData(prev => {
																		return {
																			...prev,
																			item_details: prev.item_details?.map(a =>
																				a.uuid === item.uuid
																					? {
																							...a,
																							price: +(e.target.value / item.conversion)
																					  }
																					: a
																			)
																		}
																	})
																}}
																onFocus={e => {
																	e.target.onwheel = () => false
																	e.target.select()
																}}
																onKeyDown={e => (e.key === "Enter" ? shiftFocus(e.target.id) : "")}
																disabled={!item.item_uuid}
															/>
														) : (
															"Rs:" + (+item.price * +item.conversion || 0).toFixed(2)
														)}
													</td>
													{editOrder ? (
														<>
															{console.log(
																"---------------------------------------------",
																getSpecialPrice(counters, item, orderData?.counter_uuid),
																item?.item_price,
																item?.price
															)}
															<td>
																Rs.{item.old_price || item.item_price}{" "}
																{item?.old_price?.toString() &&
																	`(${(((+item.old_price - +item.price) * 100) / +item.old_price)?.toFixed(2)}%)`}
															</td>
															<td>
																{+item?.item_price !== +item?.price &&
																	(+getSpecialPrice(counters, item, orderData?.counter_uuid)?.price === +item?.price ? (
																		<IoCheckmarkDoneOutline
																			className="table-icon checkmark"
																			onClick={() => spcPricePrompt(item, orderData?.counter_uuid, setCounters)}
																		/>
																	) : (
																		<FaSave
																			className="table-icon"
																			title="Save current price as special item price"
																			onClick={() => saveSpecialPrice(item, orderData?.counter_uuid, setCounters, +item?.price)}
																		/>
																	))}
															</td>
															<td>
																<button
																	style={{
																		width: "fit-Content",
																		fontSize: "12px",
																		padding: "5px 10px"
																	}}
																	className="theme-btn"
																	onClick={() => setPopupDiscount(item)}
																>
																	Discounts
																</button>
															</td>
														</>
													) : (
														""
													)}
												</tr>
											)
										})}
										{editOrder ? (
											<tr>
												<td
													onClick={() =>
														setOrderData(prev => ({
															...prev,
															item_details: [...prev.item_details, { uuid: uuid(), b: 0, p: 0, edit: true }]
														}))
													}
												>
													<AddIcon sx={{ fontSize: 40 }} style={{ color: "#4AC959", cursor: "pointer" }} />
												</td>
											</tr>
										) : (
											""
										)}
										<tr
											style={{
												height: "50px",

												borderBottom: "2px solid #fff"
											}}
										>
											<td></td>
											<td></td>
											<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}>
												<div className="inputGroup">Total</div>
											</td>
											{editOrder ? <td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}></td> : ""}
											<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}>
												{(orderData?.item_details?.length > 1
													? orderData?.item_details?.map(a => +a?.b || 0).reduce((a, b) => a + b)
													: orderData?.item_details?.length
													? orderData?.item_details[0]?.b
													: 0) || 0}
											</td>
											<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}>
												{(orderData?.item_details?.length > 1
													? orderData?.item_details?.map(a => +a?.p || 0).reduce((a, b) => a + b)
													: orderData?.item_details?.length
													? orderData?.item_details[0]?.p
													: 0) || 0}
											</td>
											<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}></td>
											{editOrder ? <td></td> : ""}
										</tr>
									</tbody>
								</table>
							</div>
						</div>
						<button onClick={onSave} className="closeButton">
							x
						</button>
					</div>

					<div
						className="bottomContent"
						style={{
							background: "white",
							justifyContent: "space-between",
							paddingTop: "20px"
						}}
					>
						<div id="payment-pending-wrapper">
							{editOrder ? (
								<>
									<input
										type="checkbox"
										name="payment-pending-status"
										id="payment-pending-status"
										checked={Boolean(orderData?.payment_pending)}
										onChange={e => setOrderData(x => ({ ...x, payment_pending: +e.target.checked }))}
									/>
									<label htmlFor="payment-pending-status">Payment pending</label>
								</>
							) : (
								<span>Payment pending: {orderData?.payment_pending ? "Yes" : "No"}</span>
							)}
						</div>

						{editOrder ? (
							<button
								type="button"
								onClick={
									window.location.pathname.includes("completeOrderReport") || window.location.pathname.includes("pendingEntry")
										? () => onSubmit({ stage: 0, diliveredUser: "" }, 1)
										: () => onSubmit()
								}
							>
								Save
							</button>
						) : (
							""
						)}

						<button
							type="button"
							onClick={() => {
								setCaptionPopup(true)
							}}
							style={{
								width: "max-content",
								padding: "10px 20px",
								position: "absolute",
								right: "300px",
								backgroundColor: "#fff",
								color: "var(--main)"
							}}
						>
							<WhatsApp />
						</button>
						<button type="button" onClick={() => {}} style={{ width: "max-content", padding: "10px 20px" }}>
							Order Total : {orderData?.order_grandtotal || 0}
						</button>
					</div>
				</div>
			</div>

			{promptState?.active && <Prompt {...promptState} />}

			{waiting ? (
				<div className="overlay" style={{ zIndex: "99999999999999999" }}>
					<div className="flex" style={{ width: "40px", height: "40px" }}>
						<svg viewBox="0 0 100 100">
							<path d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50" fill="#ffffff" stroke="none">
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
					</div>
				</div>
			) : (
				""
			)}
			{holdPopup ? (
				<FreeItems
					onSave={() => setHoldPopup(false)}
					orders={orderData}
					holdPopup={holdPopup}
					itemsData={itemsData}
					setOrder={setOrderData}
				/>
			) : (
				""
			)}
			{messagePopup ? (
				<MessagePopup
					onClose={updateOrder}
					message="Update Amount"
					message2={"Rs. " + messagePopup?.order_grandtotal}
					button1="Save"
					button2="Cancel"
					button={{
						label: "Save & Send WhatsApp Notification",
						action: () => updateOrder({ sendPaymentReminder: true }),
						visible: true
					}}
					onSave={() => setMessagePopup(false)}
				/>
			) : (
				""
			)}
			{splitHoldPopup ? (
				<MessagePopup
					onClose={splitOrder}
					message="Create Separate Order for Hold ?"
					message2=""
					button1="Save"
					button2="Cancel"
					onSave={() => setSplitHold(false)}
				/>
			) : (
				""
			)}
			{warehousePopup ? (
				<NewUserForm onClose={() => setWarhousePopup(false)} updateChanges={updateWarehouse} popupInfo={warehousePopup} />
			) : (
				""
			)}
			{popupDetails ? (
				<CheckingValues onSave={() => setPopupDetails(false)} popupDetails={popupDetails} users={users} items={itemsData} />
			) : (
				""
			)}
			{popupDiscount ? (
				<DiscountPopup
					onSave={() => setPopupDiscount(false)}
					popupDetails={popupDiscount}
					items={itemsData}
					onUpdate={data => {
						setOrderData({
							...orderData,
							item_details: orderData?.item_details?.map(a =>
								a.item_uuid === data.item_uuid ? { ...a, charges_discount: data.charges_discount } : a
							)
						})
						setPopupDiscount(false)
					}}
				/>
			) : (
				""
			)}
			{taskPopup ? (
				<TaskPopupMenu
					onSave={() => {
						handlePrint()
						setTaskPopup(false)
					}}
					taskData={taskPopup}
					users={users}
					counter={counters.find(a => a.counter_uuid === orderData.counter_uuid)}
				/>
			) : (
				""
			)}
			{deletePopup ? (
				<DeleteOrderPopup
					onSave={() => {
						setDeletePopup(false)
					}}
					onDeleted={() => {
						setDeletePopup(false)
						onSave()
					}}
					deletePopup={deletePopup}
					order={order}
					counters={counters}
					items={itemsData}
					item_details={order?.item_details}
					HoldOrder={HoldOrder}
				/>
			) : (
				""
			)}

			{notesPopup ? (
				<NotesPopup
					onSave={() => setNotesPoup(false)}
					setSelectedOrder={setOrderData}
					notesPopup={notesPopup}
					HoldOrder={HoldOrder}
					order={orderData}
				/>
			) : (
				""
			)}
			{captionPopup ? (
				<>
					<div className="overlay" style={{ zIndex: 999999999 }}>
						<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
							<div
								className="content"
								style={{
									height: "fit-content",
									padding: "10px",
									width: "fit-content"
								}}
							>
								<div style={{ overflowY: "scroll" }}>
									<form className="form">
										<div className="formGroup" style={{ gap: "20px" }}>
											<div
												className="row"
												style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
											>
												<div style={{ width: "50px" }}>Caption</div>
												<label className="selectLabel flex" style={{ width: "200px" }}>
													<input
														type="text"
														name="route_title"
														className="numberInput"
														style={{ width: "200px" }}
														value={caption}
														placeholder="Enter your caption here"
														onChange={e => {
															setCaption(e.target.value)
														}}
													/>
												</label>
											</div>

											<div id="additional_numbers">
												<div>
													<span>Additional Numbers</span>
													<button
														type="button"
														className="theme-btn"
														onClick={() => setAdditionalNumbers(_i => ({ ..._i, count: _i.count + 1 }))}
														// disabled={Object.values(additionalNumbers?.values)?.length < additionalNumbers?.count}
													>
														Add
													</button>
												</div>
												<div>
													{Array(additionalNumbers?.count)
														?.fill("")
														?.map((_, idx) => (
															<input
																key={"additional_mobile_number-" + idx}
																type="text"
																maxLength={10}
																placeholder="Mobile Number"
																value={additionalNumbers?.values?.[idx]}
																onChange={e =>
																	!e.target.value || +e.target.value
																		? setAdditionalNumbers(_i => ({
																				..._i,
																				values: { ..._i.values, [idx]: e.target.value }
																		  }))
																		: (e.target.value = additionalNumbers?.values?.[idx] || "")
																}
															/>
														))}
												</div>
											</div>

											<div>
												<span>Users</span>
												<UserSelection users={users} selection={userSelection} setSelection={setUserSelection} />
											</div>
										</div>

										<div className="flex" style={{ justifyContent: "space-between" }}>
											<button onClick={() => setCaptionPopup(null)} className="closeButton">
												x
											</button>

											{!waiting ? (
												<button type="button" className="submit" onClick={sendMsg}>
													Send
												</button>
											) : (
												<button type="button" className="submit" style={{ width: "80px" }}>
													<svg viewBox="0 0 100 100" style={{ width: "20px" }}>
														<path d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50" fill="#ffffff" stroke="none">
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
									</form>
								</div>
							</div>
						</div>
					</div>
				</>
			) : (
				""
			)}
			{counterNotesPopup ? (
				<CounterNotesPopup
					onSave={() => setCounterNotesPoup(false)}
					notesPopup={counterNotesPopup}
					HoldOrder={HoldOrder}
					// postOrderData={() => onSubmit({ stage: 5 })}
					setSelectedOrder={setOrderData}
					order={orderData}
				/>
			) : (
				""
			)}
			{popupForm ? (
				<TripPopup
					onSave={() => {
						setPopupForm(false)
						postOrderData()
					}}
					selectedTrip={selectedTrip}
					setSelectedTrip={setSelectedTrip}
					popupInfo={popupForm}
					orders={orderData}
					trips={tripData}
					onClose={() => {
						setPopupForm(null)

						setSelectedTrip(null)
					}}
				/>
			) : (
				""
			)}

			<OrderPrintWrapper
				componentRef={componentRef}
				orders={[printData]}
				reminderDate={reminderDate}
				users={users}
				items={itemsData}
				paymentModes={paymentModes}
				counters={counter}
				charges={appliedCounterCharges}
			/>

			{deductionsPopup ? (
				<DiliveryReplaceMent
					onSave={() => setDeductionsPopup(false)}
					data={deductionsData}
					setData={setDeductionsData}
					updateBilling={result =>
						callBilling(
							{
								...order,
								replacement: result?.actual || 0,
								shortage: result?.shortage || 0,
								adjustment: result?.adjustment || 0,
								adjustment_remarks: result?.adjustment_remarks || ""
							},
							true
						)
					}
				/>
			) : (
				""
			)}
		</>
	)
}
const DeleteOrderPopup = ({ onSave, order, counters, items, onDeleted, deletePopup, HoldOrder }) => {
	const [disable, setDisabled] = useState(true)
	const [reason, setReason] = useState("")

	useEffect(() => {
		setTimeout(() => setDisabled(false), deletePopup === "hold" ? 100 : 0)
	}, [])

	const PutOrder = async () => {
		if (deletePopup === "hold") {
			HoldOrder()
			return
		}
		let time = new Date()
		let data = {
			...order,
			status: [
				...order?.status,
				{
					stage: 5,
					user_uuid: localStorage.getItem("user_uuid"),
					time: time.getTime(),
					cancellation_reason: reason
				}
			],
			fulfillment: order?.fulfillment?.length ? [...order?.fulfillment, ...order?.item_details] : order?.item_details,
			item_details: order?.item_details?.map(a => ({ ...a, b: 0, p: 0 }))
		}

		let billingData = await Billing({
			order_uuid: data?.order_uuid,
			invoice_number: `${data?.order_type}${data?.invoice_number}`,
			replacement: data.replacement,
			adjustment: data.adjustment,
			shortage: data.shortage,
			counter: counters.find(a => a.counter_uuid === data.counter_uuid),
			items: data.item_details?.map(a => {
				let itemData = items.find(b => a.item_uuid === b.item_uuid)
				return {
					...itemData,
					...a,
					price: itemData?.price || 0
				}
			})
		})
		data = {
			...data,
			...billingData,
			item_details: billingData.items,
			edit: true
		}
		const response = await axios({
			method: "put",
			url: "/orders/putOrders",
			data: [data],
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			onDeleted()
		}
	}

	return (
		<div className="overlay" style={{ zIndex: 9999999999 }}>
			<form
				className="modal"
				style={{
					height: "fit-content",
					width: "max-content",
					paddingTop: "50px"
				}}
				onSubmit={e => {
					e.preventDefault()
					PutOrder()
				}}
			>
				<h3>Order will be {deletePopup?.toLowerCase() === "delete" ? "deleted" : deletePopup?.toLowerCase()}</h3>

				<textarea
					type="text"
					name="cancellation-reason"
					className="cancellation-reason"
					value={reason}
					onChange={e => setReason(e.target.value)}
					placeholder="Cancellation reason"
					required
				/>

				<div className="flex">
					<button type="submit" className="submit" disabled={disable} style={{ opacity: disable ? "0.5" : "1" }}>
						Confirm
					</button>
				</div>

				<button onClick={onSave} className="closeButton">
					x
				</button>
			</form>
		</div>
	)
}
function CheckingValues({ onSave, popupDetails, users, items }) {
	function formatAMPM(date) {
		var hours = date.getHours()
		var minutes = date.getMinutes()
		var ampm = hours >= 12 ? "pm" : "am"
		hours = hours % 12
		hours = hours ? hours : 12 // the hour '0' should be '12'
		minutes = minutes < 10 ? "0" + minutes : minutes
		var strTime = hours + ":" + minutes + " " + ampm
		return strTime
	}
	return (
		<div className="overlay" style={{ zIndex: 999999999 }}>
			<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
				<h1>{popupDetails.type}</h1>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content"
					}}
				>
					<div style={{ overflowY: "scroll", width: "100%" }}>
						{popupDetails.type === "Status" ? (
							<div className="flex" style={{ flexDirection: "column", width: "100%" }}>
								<table
									className="user-table"
									style={{
										width: "max-content",
										height: "fit-content"
									}}
								>
									<thead>
										<tr>
											<th colSpan={2}>
												<div className="t-head-element">Type</div>
											</th>
											<th colSpan={2}>
												<div className="t-head-element">Time</div>
											</th>
											<th>
												<div className="t-head-element">User</div>
											</th>
										</tr>
									</thead>
									<tbody className="tbody">
										{popupDetails?.data?.length &&
											popupDetails?.data?.map((item, i) => (
												<tr
													key={item?.item_uuid || Math.random()}
													style={{
														height: "30px"
													}}
												>
													<td colSpan={2}>
														{+item.stage === 1
															? "Order Placed By"
															: +item.stage === 2
															? "Order Processed By"
															: +item.stage === 3
															? "Order Checked By"
															: +item.stage === 3.5
															? "Order Delivered By"
															: +item.stage === 4
															? "Order Completed By"
															: ""}
													</td>
													<td colSpan={2}>{new Date(+item.time).toDateString() + " " + formatAMPM(new Date(item.time)) || ""}</td>
													<td>
														{item.user_uuid === "240522"
															? "Admin"
															: users.find(a => a.user_uuid === item?.user_uuid)?.user_title || ""}
													</td>
												</tr>
											))}
									</tbody>
								</table>
							</div>
						) : popupDetails.type === "Delivery Return" ? (
							<div className="flex" style={{ flexDirection: "column", width: "100%" }}>
								<table
									className="user-table"
									style={{
										width: "max-content",
										height: "fit-content"
									}}
								>
									<thead>
										<tr>
											<th colSpan={2}>
												<div className="t-head-element">Item</div>
											</th>
											<th>
												<div className="t-head-element">Quantity</div>
											</th>
										</tr>
									</thead>
									<tbody className="tbody">
										{popupDetails.data?.map((item, i) => (
											<tr
												key={item?.item_uuid || Math.random()}
												style={{
													height: "30px"
												}}
											>
												<td colSpan={2}>{items.find(a => a.item_uuid === item.item_uuid)?.item_title || ""}</td>
												<td>
													{item?.b || 0}:{item.p || 0}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : popupDetails.type === "Auto Added" ? (
							<div className="flex" style={{ flexDirection: "column", width: "100%" }}>
								<table
									className="user-table"
									style={{
										width: "max-content",
										height: "fit-content"
									}}
								>
									<thead>
										<tr>
											<th colSpan={2}>
												<div className="t-head-element">Item</div>
											</th>
											<th>
												<div className="t-head-element">Quantity</div>
											</th>
										</tr>
									</thead>
									<tbody className="tbody">
										{popupDetails.data?.map((item, i) => (
											<tr
												key={item?.item_uuid || Math.random()}
												style={{
													height: "30px"
												}}
											>
												<td colSpan={2}>{items.find(a => a.item_uuid === item.item_uuid)?.item_title || ""}</td>
												<td>
													{item?.b || 0}:{item.p || 0}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : popupDetails.type === "Fulfillment" ? (
							<div className="flex" style={{ flexDirection: "column", width: "100%" }}>
								<table
									className="user-table"
									style={{
										width: "max-content",
										height: "fit-content"
									}}
								>
									<thead>
										<tr>
											<th colSpan={2}>
												<div className="t-head-element">Item</div>
											</th>
											<th>
												<div className="t-head-element">Quantity</div>
											</th>
										</tr>
									</thead>
									<tbody className="tbody">
										{popupDetails.data?.map((item, i) => (
											<tr
												key={item?.item_uuid || Math.random()}
												style={{
													height: "30px"
												}}
											>
												<td colSpan={2}>{items.find(a => a.item_uuid === item.item_uuid)?.item_title || ""}</td>
												<td>
													{item?.b || 0}:{item.p || 0}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							""
						)}

						<div className="flex" style={{ justifyContent: "space-between" }}>
							<button type="button" className="submit" onClick={onSave}>
								Cancel
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
function DiscountPopup({ onSave, popupDetails, onUpdate }) {
	const [data, setData] = useState([])
	const [edit, setEdit] = useState("")
	useEffect(() => {
		setData(
			popupDetails.charges_discount?.map(a => ({
				...a,
				uuid: a._id || a._id || uuid()
			}))
		)
	}, [popupDetails.charges_discount])

	return (
		<div className="overlay" style={{ zIndex: 999999999 }}>
			<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
				<h1>Discount</h1>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content"
					}}
				>
					<div style={{ overflowY: "scroll", width: "100%" }}>
						<div className="flex" style={{ flexDirection: "column", width: "100%" }}>
							<table
								className="user-table"
								style={{
									width: "max-content",
									height: "fit-content"
								}}
							>
								<thead>
									<tr>
										<th colSpan={2}>
											<div className="t-head-element">Name</div>
										</th>
										<th colSpan={2}>
											<div className="t-head-element">Value</div>
										</th>
									</tr>
								</thead>
								<tbody className="tbody">
									{data.length
										? data?.map((item, i) => (
												<tr
													key={item?.uuid || Math.random()}
													style={{
														height: "30px"
													}}
												>
													<td colSpan={2}>
														{item._id ? (
															item.title
														) : (
															<input
																type="text"
																className="numberInput"
																style={{
																	width: "10ch",
																	fontSize: "12px",
																	padding: 0,
																	height: "20px"
																}}
																value={item.title || 0}
																onChange={e => {
																	setData(prev =>
																		prev?.map(a =>
																			a.uuid === item.uuid
																				? {
																						...a,
																						title: e.target.value
																				  }
																				: a
																		)
																	)
																	setEdit(true)
																}}
																onFocus={e => {
																	e.target.onwheel = () => false
																	e.target.select()
																}}
																onWheel={e => e.preventDefault()}
															/>
														)}
													</td>
													<td colSpan={2}>
														<input
															type="number"
															className="numberInput"
															style={{
																width: "10ch",
																fontSize: "12px",
																padding: 0,
																height: "20px"
															}}
															value={item.value || 0}
															onChange={e => {
																setData(prev => prev?.map(a => (a.uuid === item.uuid ? { ...a, value: e.target.value } : a)))
																setEdit(true)
															}}
															onFocus={e => {
																e.target.onwheel = () => false
																e.target.select()
															}}
															onWheel={e => e.preventDefault()}
														/>
													</td>
												</tr>
										  ))
										: ""}
								</tbody>
							</table>
							<button type="button" className="submit" onClick={() => setData(prev => [...prev, { uuid: uuid() }])}>
								<Add />
							</button>
						</div>

						<div className="flex" style={{ justifyContent: "space-between" }}>
							{edit ? (
								<button type="button" className="submit" onClick={() => onUpdate({ ...popupDetails, charges_discount: data })}>
									Save
								</button>
							) : (
								""
							)}
							<button type="button" className="submit" onClick={onSave}>
								Cancel
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
function DiliveryPopup({ onSave, postOrderData, credit_allowed, counters, order, updateBilling, deliveryPopup, users }) {
	const [PaymentModes, setPaymentModes] = useState([])
	const [modes, setModes] = useState([])
	const [error, setError] = useState("")
	const [popup, setPopup] = useState(false)
	const [waiting, setWaiting] = useState(false)
	const [diliveredUser, setDiliveredUser] = useState("")

	// const [coinPopup, setCoinPopup] = useState(false);
	const [data, setData] = useState({})
	const [outstanding, setOutstanding] = useState({})
	const time2 = new Date()
	time2.setHours(12)
	let reminder = useMemo(() => {
		return new Date(
			time2.setDate(time2.getDate() + (counters.find(a => a.counter_uuid === order?.counter_uuid)?.payment_reminder_days || 0))
		).getTime()
	}, [counters, order?.counter_uuid])
	let type = useMemo(() => {
		return counters.find(a => a.counter_uuid === order?.counter_uuid)?.outstanding_type || 0
	}, [counters, order?.counter_uuid])
	console.log(outstanding)
	const GetPaymentModes = async () => {
		const response = await axios({
			method: "get",
			url: "/paymentModes/GetPaymentModesList",

			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			setPaymentModes(response.data.result)
			GetReciptsModes()
		}
	}
	const getTripData = async trip_uuid => {
		const response = await axios({
			method: "post",
			url: "/trips/GetTripData",
			data: { params: ["users"], trips: [trip_uuid].filter(a => a) },
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			console.log("dilivereduser", response.data.result[0]?.users[0])
			if (response.data.result[0]?.users[0]) setDiliveredUser(response.data.result[0]?.users[0])
		}
	}
	const GetReciptsModes = async () => {
		const response = await axios({
			method: "post",
			url: "/receipts/getRecipt",
			data: {
				order_uuid: order?.order_uuid,
				counter_uuid: order?.counter_uuid
			},
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setModes(response.data.result.modes)
	}
	const GetOutstanding = async () => {
		const response = await axios({
			method: "post",
			url: "/Outstanding/getOutstanding",
			data: {
				order_uuid: order?.order_uuid,
				counter_uuid: order?.counter_uuid
			},
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setOutstanding(response.data.result)
		else {
			let time = new Date()

			setOutstanding({
				order_uuid: order?.order_uuid,
				amount: "",
				user_uuid: localStorage.getItem("user_uuid"),
				time: time.getTime(),
				invoice_number: order?.invoice_number,
				trip_uuid: order?.trip_uuid,
				counter_uuid: order?.counter_uuid,
				reminder,
				type
			})
		}
	}
	useEffect(() => {
		if (deliveryPopup === "put" || deliveryPopup === "edit") {
			GetOutstanding()
		} else {
			let time = new Date()
			setOutstanding({
				order_uuid: order?.order_uuid,
				amount: "",
				user_uuid: localStorage.getItem("user_uuid"),
				time: time.getTime(),
				invoice_number: order?.invoice_number,
				trip_uuid: order?.trip_uuid,
				counter_uuid: order?.counter_uuid,
				reminder,
				type
			})
		}
		GetPaymentModes()
		if (order.trip_uuid) getTripData(order.trip_uuid)
	}, [
		deliveryPopup,
		order?.counter_uuid,
		order?.invoice_number,
		order?.order_uuid,
		order?.trip_uuid,
		reminder,
		type,
		order.trip_uuid
	])

	useEffect(() => {
		if (PaymentModes?.length)
			setModes(
				PaymentModes?.map(a => ({
					...a,
					amt: "",
					coin: "",
					status:
						a.mode_uuid === "c67b5794-d2b6-11ec-9d64-0242ac120002" || a.mode_uuid === "c67b5988-d2b6-11ec-9d64-0242ac120002"
							? "0"
							: 1
				}))
			)
	}, [PaymentModes])
	console.log(modes)
	const submitHandler = async () => {
		if (waiting) {
			return
		}
		setWaiting(true)
		// if (outstanding.amount && !outstanding.remarks) {
		// 	setError("Remarks is mandatory")
		// 	setWaiting(false)
		// 	return
		// }
		if (modes.find(a => a.mode_uuid === "c67b5794-d2b6-11ec-9d64-0242ac120002" && a.amt && !a.remarks)) {
			setError("Cheque number is mandatory")
			setWaiting(false)
			return
		}
		updateBilling({
			...order,
			replacement: data?.actual || 0,
			shortage: data?.shortage || 0,
			adjustment: data?.adjustment || 0,
			adjustment_remarks: data?.adjustment_remarks || ""
		})
		setError("")
		let modeTotal = modes?.map(a => +a.amt || 0)?.reduce((a, b) => a + b)
		//console.log(
		// Tempdata?.order_grandtotal,
		//   +(+modeTotal + (+outstanding?.amount || 0))
		// );
		if (+order?.order_grandtotal !== +(+modeTotal + (+outstanding?.amount || 0))) {
			setError("Invoice Amount and Payment mismatch")
			setWaiting(false)
			return
		}
		if (
			window.location.pathname.includes("completeOrderReport") ||
			window.location.pathname.includes("signedBills") ||
			window.location.pathname.includes("pendingEntry") ||
			window.location.pathname.includes("upiTransactionReport")
		) {
			let response
			if (modeTotal) {
				response = await axios({
					method: "put",
					url: "/receipts/putReceipt",
					data: {
						modes,
						order_uuid: order?.order_uuid,
						counter_uuid: order?.counter_uuid
					},
					headers: {
						"Content-Type": "application/json"
					}
				})
			}
			if (outstanding?.amount) {
				response = await axios({
					method: "put",
					url: "/Outstanding/putOutstanding",
					data: {
						...outstanding,
						order_uuid: order?.order_uuid,
						counter_uuid: order?.counter_uuid
					},
					headers: {
						"Content-Type": "application/json"
					}
				})
			}

			if (response.data.success) {
				onSave()
			}
		} else {
			// let obj = modes.find((a) => a.mode_title === "Cash");
			// if (obj?.amt && obj?.coin === "") {
			//   setCoinPopup(true);
			//   return;
			// }
			let time = new Date()
			let obj = {
				user_uuid: localStorage.getItem("user_uuid"),
				time: time.getTime(),
				order_uuid: order?.order_uuid,
				counter_uuid: order?.counter_uuid,
				trip_uuid: order?.trip_uuid,
				invoice_number: order?.invoice_number,
				modes: modes?.map(a => (a.mode_title === "Cash" ? { ...a, coin: 0 } : a))
			}
			let response
			if (modeTotal) {
				response = await axios({
					method: "post",
					url: "/receipts/postReceipt",
					data: obj,
					headers: {
						"Content-Type": "application/json"
					}
				})
			}
			if (outstanding?.amount)
				response = await axios({
					method: "post",
					url: "/Outstanding/postOutstanding",
					data: outstanding,
					headers: {
						"Content-Type": "application/json"
					}
				})
			if (response.data.success) {
				postOrderData(diliveredUser)
				onSave()
			}
		}
		setWaiting(false)
	}

	return (
		<>
			<div className="overlay" style={{ zIndex: 9999999999 }}>
				<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
					<div className="flex" style={{ justifyContent: "space-between" }}>
						<h3>Payments</h3>
						<h3>Rs. {order?.order_grandtotal}</h3>
					</div>
					<div
						className="content"
						style={{
							height: "fit-content",
							padding: "10px",
							width: "fit-content"
						}}
					>
						<div style={{ overflowY: "scroll" }}>
							<form className="form">
								<div className="formGroup">
									{PaymentModes?.map(item => (
										<div className="row" style={{ flexDirection: "row", alignItems: "center" }} key={item.mode_uuid}>
											<div style={{ width: "50px" }}>{item.mode_title}</div>
											<label className="selectLabel flex" style={{ width: "80px" }}>
												<input
													type="number"
													name="route_title"
													className="numberInput"
													value={modes.find(a => a.mode_uuid === item.mode_uuid)?.amt}
													style={{ width: "80px" }}
													disabled={order?.order_type === "E" && item?.mode_title !== "Cash"}
													onContextMenu={e => {
														e.preventDefault()
														e.stopPropagation()
														setModes(prev =>
															prev?.map(a =>
																a.mode_uuid === item.mode_uuid
																	? {
																			...a,
																			amt: order.order_grandtotal || 0
																	  }
																	: a
															)
														)
													}}
													onChange={e =>
														setModes(prev =>
															prev?.map(a =>
																a.mode_uuid === item.mode_uuid
																	? {
																			...a,
																			amt: e.target.value
																	  }
																	: a
															)
														)
													}
													maxLength={42}
													onWheel={e => e.preventDefault()}
													autocomplete="off"
												/>
											</label>
											{item.mode_uuid === "c67b5794-d2b6-11ec-9d64-0242ac120002" &&
											modes.find(a => a.mode_uuid === item.mode_uuid)?.amt ? (
												<label className="selectLabel flex" style={{ width: "200px" }}>
													<input
														type="text"
														name="route_title"
														className="numberInput"
														value={item?.remarks}
														placeholder={"Cheque Number"}
														style={{
															width: "100%",
															backgroundColor: "light",
															fontSize: "12px"
														}}
														onChange={e =>
															setModes(prev =>
																prev?.map(a => (a.mode_uuid === item.mode_uuid ? { ...a, remarks: e.target.value } : a))
															)
														}
														maxLength={42}
														onWheel={e => e.preventDefault()}
														autocomplete="off"
													/>
												</label>
											) : (
												""
											)}
										</div>
									))}
									<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
										<div style={{ width: "50px" }}>UnPaid</div>
										<label className="selectLabel flex" style={{ width: "80px" }}>
											<input
												type="number"
												name="route_title"
												className="numberInput"
												value={outstanding?.amount}
												placeholder={""}
												disabled={order?.order_type === "E"}
												style={
													!credit_allowed === "Y"
														? {
																width: "90px",
																backgroundColor: "light",
																fontSize: "12px",
																color: "#fff"
														  }
														: { width: "80px" }
												}
												onContextMenu={e => {
													e.preventDefault()
													e.stopPropagation()
													setOutstanding(prev => ({
														...prev,
														amount: order.order_grandtotal || 0
													}))
												}}
												onChange={e =>
													setOutstanding(prev => ({
														...prev,
														amount: e.target.value
													}))
												}
												maxLength={42}
												onWheel={e => e.preventDefault()}
												autocomplete="off"
											/>
											{/* {popupInfo.conversion || 0} */}
										</label>
										{outstanding?.amount ? (
											<label className="selectLabel flex" style={{ width: "100%" }}>
												<input
													type="text"
													name="route_title"
													className="numberInput"
													value={outstanding?.remarks}
													placeholder={"Remarks"}
													style={{
														width: "100%",
														backgroundColor: "light",
														fontSize: "12px"
													}}
													onChange={e =>
														setOutstanding(prev => ({
															...prev,
															remarks: e.target.value
														}))
													}
													maxLength={42}
													onWheel={e => e.preventDefault()}
													autocomplete="off"
												/>
												{/* {popupInfo.conversion || 0} */}
											</label>
										) : (
											""
										)}
									</div>
									<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
										{deliveryPopup === "put" ? (
											""
										) : (
											<button
												type="button"
												className="submit"
												style={{ color: "#fff", backgroundColor: "#7990dd" }}
												onClick={() => setPopup(true)}
											>
												Deductions
											</button>
										)}
									</div>
									<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
										<div style={{ width: "100px" }}>Delivered By</div>
										<label className="selectLabel flex" style={{ width: "120px" }}>
											<select
												className="numberInput"
												style={{
													width: "100%",
													backgroundColor: "light",
													fontSize: "12px"
												}}
												value={diliveredUser}
												onChange={e => setDiliveredUser(e.target.value)}
											>
												<option value="">None</option>
												{users
													.filter(a => a.status)
													.map(a => (
														<option value={a.user_uuid}>{a.user_title}</option>
													))}
											</select>
											{/* {popupInfo.conversion || 0} */}
										</label>
									</div>
									<i style={{ color: "red" }}>{error}</i>
								</div>

								<div className="flex" style={{ justifyContent: "space-between" }}>
									<button type="button" style={{ backgroundColor: "red" }} className="submit" onClick={onSave}>
										Cancel
									</button>
									<button type="button" className="submit" onClick={submitHandler}>
										Save
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
			{waiting ? (
				<div className="overlay" style={{ zIndex: "999999999999999999" }}>
					<div className="flex" style={{ width: "40px", height: "40px" }}>
						<svg viewBox="0 0 100 100">
							<path d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50" fill="#ffffff" stroke="none">
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
					</div>
				</div>
			) : (
				""
			)}
			{popup ? (
				<DiliveryReplaceMent
					onSave={() => {
						setPopup(false)
					}}
					setData={setData}
					updateBilling={e =>
						updateBilling({
							...order,
							replacement: e?.actual || 0,
							shortage: e?.shortage || 0,
							adjustment: e?.adjustment || 0,
							adjustment_remarks: e?.adjustment_remarks || ""
						})
					}
					data={data}
				/>
			) : (
				""
			)}
		</>
	)
}
function NotesPopup({ onSave, order, setSelectedOrder, notesPopup, HoldOrder }) {
	const [notes, setNotes] = useState([])
	const [edit, setEdit] = useState(false)
	useEffect(() => {
		// console.log(order?.notes);
		setNotes(order?.notes || [])
	}, [order])
	const submitHandler = async () => {
		const response = await axios({
			method: "put",
			url: "/orders/putOrderNotes",
			data: { notes, invoice_number: order?.invoice_number },
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			setSelectedOrder(prev => ({
				...prev,
				notes
			}))
			if (notesPopup === "hold") setTimeout(HoldOrder, 2000)
			onSave()
		}
	}
	return (
		<>
			<div className="overlay" style={{ zIndex: 9999999999 }}>
				<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
					<div className="flex" style={{ justifyContent: "space-between" }}>
						<h3>Order Notes</h3>
						{notesPopup === "hold" ? <h3>Please Enter Notes</h3> : ""}
					</div>
					<div
						className="content"
						style={{
							height: "fit-content",
							padding: "10px",
							width: "fit-content"
						}}
					>
						<div style={{ overflowY: "scroll" }}>
							<form className="form">
								<div className="formGroup">
									<div className="row" style={{ flexDirection: "row", alignItems: "start" }}>
										<div style={{ width: "50px" }}>Notes</div>
										<label className="selectLabel flex" style={{ width: "200px" }}>
											<textarea
												name="route_title"
												className="numberInput"
												style={{ width: "200px", height: "200px" }}
												value={notes?.toString()?.replace(/,/g, "\n")}
												onChange={e => {
													setNotes(e.target.value.split("\n"))
													setEdit(true)
												}}
											/>
										</label>
									</div>
								</div>

								<div className="flex" style={{ justifyContent: "space-between" }}>
									<button onClick={onSave} className="closeButton">
										x
									</button>
									{edit ? (
										<button type="button" className="submit" onClick={submitHandler}>
											Save
										</button>
									) : (
										""
									)}
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
function CounterNotesPopup({
	onSave,

	order,
	setSelectedOrder,
	notesPopup,
	HoldOrder
}) {
	const [notes, setNotes] = useState([])
	const [edit, setEdit] = useState(false)
	useEffect(() => {
		// console.log(order?.notes);
		setNotes(notesPopup?.notes || [])
	}, [notesPopup?.notes])
	console.log(notesPopup)
	const submitHandler = async () => {
		const response = await axios({
			method: "put",
			url: "/counters/putCounter",
			data: [
				{
					counter_uuid: notesPopup.counter_uuid,
					notes
				}
			],
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			onSave()
		}
	}
	return (
		<>
			<div className="overlay" style={{ zIndex: 9999999999 }}>
				<div
					className="modal"
					style={{
						height: "fit-content",
						width: "max-content",
						backgroundColor: "cyan"
					}}
				>
					<div className="flex" style={{ justifyContent: "space-between" }}>
						<h3>Counter Notes</h3>
						{/* <h3>Please Enter Notes</h3> */}
					</div>
					<div
						className="content"
						style={{
							height: "fit-content",
							padding: "10px",
							width: "fit-content"
						}}
					>
						<div style={{ overflowY: "scroll" }}>
							<form className="form">
								<div className="formGroup" style={{ backgroundColor: "#fff" }}>
									<div className="row" style={{ flexDirection: "row", alignItems: "start" }}>
										<div style={{ width: "50px" }}>Notes</div>
										<label className="selectLabel flex" style={{ width: "200px" }}>
											<textarea
												name="route_title"
												className="numberInput"
												style={{ width: "200px", height: "200px" }}
												value={notes?.toString()?.replace(/,/g, "\n")}
												onChange={e => {
													setNotes(e.target.value.split("\n"))
													setEdit(true)
												}}
											/>
										</label>
									</div>
								</div>

								<div className="flex" style={{ justifyContent: "space-between" }}>
									<button onClick={onSave} className="closeButton">
										x
									</button>
									{edit ? (
										<button type="button" className="submit" onClick={submitHandler}>
											Save
										</button>
									) : (
										""
									)}
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
function NewUserForm({ popupInfo, updateChanges, onClose }) {
	const [data, setdata] = useState("")

	const [warehouse, setWarehouse] = useState([])
	const getItemsData = async () => {
		const response = await axios({
			method: "get",
			url: "/warehouse/GetWarehouseList",

			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setWarehouse(response.data.result)
	}
	useEffect(() => {
		setdata(popupInfo)
		getItemsData()
	}, [popupInfo])
	const submitHandler = async e => {
		e.preventDefault()
		updateChanges(data)
		onClose()
	}

	return (
		<div className="overlay" style={{ zIndex: 99999999999 }}>
			<div className="modal" style={{ height: "fit-content", width: "fit-content", padding: 50 }}>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20p0",
						marginBottom: "10px",
						width: "fit-content"
					}}
				>
					<div style={{ overflowY: "scroll" }}>
						<form className="form" onSubmit={submitHandler}>
							<div className="row">
								<h1>Update Warehouse</h1>
							</div>

							<div className="formGroup">
								<div className="row">
									<label className="selectLabel">
										Warehouse
										<div className="inputGroup">
											<Select
												options={[
													{ value: 0, label: "None" },
													...warehouse?.map(a => ({
														value: a.warehouse_uuid,
														label: a.warehouse_title
													}))
												]}
												onChange={doc => setdata(doc.value)}
												value={
													data
														? {
																value: data,
																label: warehouse?.find(j => j.warehouse_uuid === data)?.warehouse_title
														  }
														: { value: 0, label: "None" }
												}
												autoFocus={!data}
												openMenuOnFocus={true}
												menuPosition="fixed"
												menuPlacement="auto"
												placeholder="Select"
											/>
										</div>
									</label>
								</div>
							</div>

							<button type="submit" className="submit">
								Save Changes
							</button>
						</form>
					</div>
					<button type="button" onClick={() => onClose()} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}
function TripPopup({ onSave, setSelectedTrip, selectedTrip, trips, onClose }) {
	const submitHandler = async e => {
		e.preventDefault()
		onSave()
	}
	return (
		<div className="overlay" style={{ zIndex: "99999999999" }}>
			<div className="modal" style={{ height: "fit-content", width: "fit-content" }}>
				<div
					className="content"
					// style={{ flexDirection: "row", flexWrap: "wrap", gap: "5" }}
					style={{
						height: "fit-content",
						padding: "20p0",
						marginBottom: "10px",
						width: "fit-content"
					}}
				>
					<div style={{ overflowY: "scroll" }}>
						<form className="form" onSubmit={submitHandler}>
							<div className="row">
								<h1>Assign Trip</h1>
							</div>

							<div className="formGroup">
								Trip
								<div className="row">
									<label className="selectLabel">
										<select
											name="route_title"
											className="numberInput"
											value={selectedTrip.trip_uuid}
											onChange={e =>
												setSelectedTrip({
													trip_uuid: e.target.value,
													warehouse_uuid: trips?.find(a => a.trip_uuid === e.target.value)?.warehouse_uuid || ""
												})
											}
											maxLength={42}
											style={{ width: "200px" }}
										>
											<option value="0">None</option>
											{trips
												?.filter(
													a =>
														a.trip_uuid &&
														a.status &&
														(+JSON.parse(localStorage.getItem("warehouse") || "") === 1 ||
															JSON.parse(localStorage.getItem("warehouse") || "") === a.warehouse_uuid)
												)
												?.map(a => (
													<option value={a.trip_uuid}>{a.trip_title}</option>
												))}
										</select>
									</label>
								</div>
							</div>

							<button type="submit" className="submit">
								Save changes
							</button>
						</form>
					</div>
					<button type="button" onClick={() => onClose()} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}
const UserSelection = ({ users, selection, setSelection }) => {
	const [search, setSearch] = useState("")
	return (
		<div id="counters-list" className="users-list">
			<div style={{ margin: "0" }}>
				<input type="text" value={search} placeholder="Search" onChange={e => setSearch(e.target.value)} />
				<div className="list" style={{ maxHeight: "150px" }}>
					<div>
						<input
							id="all-counters"
							type="checkbox"
							checked={selection?.length === users?.length}
							onChange={() => setSelection(selection?.length === users?.length ? [] : users.map(_i => _i?.user_uuid))}
						/>
						<label htmlFor="all-counters">User Title</label>
					</div>
					<hr />
					{users
						?.sort((a, b) => a.user_title.localeCompare(b.user_title))
						?.filter(i => !search || i?.user_title?.toLowerCase()?.includes(search?.toLowerCase()))
						?.map(i => (
							<div key={i?.user_uuid}>
								<input
									type="checkbox"
									id={i?.user_uuid}
									checked={selection?.includes(i?.user_uuid)}
									onChange={e =>
										setSelection(state =>
											state.filter(_i => _i !== i?.user_uuid).concat(state?.includes(i?.user_uuid) ? [] : [i?.user_uuid])
										)
									}
								/>
								<label htmlFor={i?.user_uuid}>{i?.user_title}</label>
							</div>
						))}
				</div>
			</div>
		</div>
	)
}
