import React from "react"
import OrderPrint from "./prints/OrderPrint"

const OrderPrintWrapper = ({ componentRef, orders, counters, reminderDate, users, items, paymentModes }) => {
	const getPrintData = order => {
		const max_count = order?.order_type !== "E" ? 15 : 19
		const min_count = max_count - 7
		const sourceArray = order?.item_details
		const arrayOfArrays = []

		if (sourceArray.length > max_count) {
			const initial_array_count = sourceArray.length / max_count
			for (let i = 0; i < initial_array_count; i++) {
				arrayOfArrays.push(sourceArray.slice(max_count * i, max_count * (i + 1)))
				if (i - 1 === initial_array_count) {
					const remaining_items = sourceArray.length % max_count
					if (remaining_items)
						arrayOfArrays.push(sourceArray.slice(max_count * (i + 1), max_count * (i + 1)) + remaining_items)
				}
			}
		} else {
			arrayOfArrays.push(sourceArray)
		}

		if (arrayOfArrays.at(-1).length > min_count) {
			arrayOfArrays.push([arrayOfArrays.at(-1).at(-1)])
			arrayOfArrays[arrayOfArrays.length - 2] = arrayOfArrays.at(-2).slice(0, arrayOfArrays.at(-2).length - 1)
		}

		const result = arrayOfArrays?.map(_i => ({ ...order, item_details: _i }))
		return result
	}

	return (
		<div className="order-print-layout">
			<div ref={componentRef}>
				{orders
					?.map(a => ({ ...a, sort_order: +counters?.find(b => b.counter_uuid === a.counter_uuid)?.sort_order }))
					?.sort((a, b) => a.sort_order - b.sort_order)
					?.map(a => ({
						...a,
						item_details: a.item_details.filter(b => b.status !== 3).map((b, i) => ({ ...b, sr: i + 1 }))
					}))
					?.map(__order => {
						return getPrintData(__order)?.map((order, i, array) => (
							<OrderPrint
								counter={counters.find(a => a.counter_uuid === order?.counter_uuid)}
								reminderDate={reminderDate}
								order={order}
								date={new Date(order?.status[0]?.time)}
								user={users.find(a => a.user_uuid === order?.status[0]?.user_uuid)?.user_title || ""}
								itemData={items}
								item_details={order?.item_details}
								paymentModes={paymentModes}
								counters={counters}
								footer={i + 1 === array.length}
							/>
						))
					})}
			</div>
		</div>
	)
}

export default OrderPrintWrapper
