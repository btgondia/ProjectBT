import { v4 as uuid } from "uuid"

export let getInitialOrderValue = () => ({
	counter_uuid: "",
	item_details: [{ uuid: uuid(), b: 0, p: 0, sr: 1 }],
	item: [],
	priority: 0,
	order_type: "I",
	time_1: 24 * 60 * 60 * 1000,
	time_2: (24 + 48) * 60 * 60 * 1000,
	warehouse_uuid: localStorage.getItem("warehouse")
		? JSON.parse(localStorage.getItem("warehouse")) || ""
		: "",
})

export const companyLoadRates = [
	{ value: "per_unit", label: "Per Unit" },
	{ value: "per_box", label: "Per Box" },
	{ value: "per_pack", label: "Per Pack" },
]

export const whatsAppMessageTemplates = {
	paymentReminderManual: `💰
Priya Grahak *{counter_title}*,
Neeche Diye gaye bill ka bhugtaan *UPI* dwara kiya jana tha. Jo ab tak hamare khate me credit nehi hua hai.
Kripya Payment neeche diye account me me kare.


*------ORDER DETAILS------*{details}


*------BANK DETAILS------*
*GPay, PhonePe, UPI Number* : 9422551074
*UPI ID* : btgondia@upi

*Account Details:*
Ac No. : 0182008700014607
IFSC : PUNB0018200
Bharat Traders

_Bharat Traders, Accounts Department_
`
}