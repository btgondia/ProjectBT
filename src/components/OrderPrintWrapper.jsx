import React, { useCallback, useMemo } from "react"
import OrderPrint from "./prints/OrderPrint"
import PendingPaymentsSummary from "./prints/PendingPaymentsSummary"

const OrderPrintWrapper = ({
	componentRef,
	orders,
	counters,
	reminderDate,
	users,
	items,

	pendingPayments,
	counterOrders,
	print,
	category,
	route = [],
	...props
}) => {
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
	function getNextChar(char) {
		if (char < "a" || char > "z") {
		  throw new Error("Input must be a lowercase letter from a to z");
		}
	
		let charCode = char.charCodeAt(0);
	
		charCode++;
	
		if (charCode > "z".charCodeAt(0)) {
		  charCode = "a".charCodeAt(0);
		}
	
		return String.fromCharCode(charCode);
	  }
	
	  const hsn_code = useCallback((item_details=[]) => {
		let hsn = [];
		let char = "a";
		for (let item of item_details) {
		  console.log({ item });
		  if (item.hsn && !hsn.find((a) => a.hsn === item.hsn)) {
			hsn.push({ hsn: item.hsn, char });
			char = getNextChar(char);
		  }
		}
		return hsn;
	  }, []);
	
	return (
		<div className="order-print-layout">
			<div ref={componentRef}>
				{orders
					?.map(a => ({
						...a,
						sort_order: +counters?.find(b => b.counter_uuid === a.counter_uuid)?.sort_order
					}))
					?.sort((a, b) => a.sort_order - b.sort_order)
					?.map(a => ({
						...a,
						item_details: a.item_details
							.filter(b => b.status !== 3)
							.map(a => {
								let itemData = items.find(b => b.item_uuid === a.item_uuid)
								return {
									...a,
									category_title:
										category.find(b => b.category_uuid === itemData?.category_uuid)?.category_title || "",
									item_title: itemData?.item_title
								}
							})
							.sort((a, b) =>
								a.category_title && b.category_title
									? a.category_title?.localeCompare(b.category_title) || a.item_title.localeCompare(b.item_title)
									: a.item_title && b.item_title
									? a.item_title.localeCompare(b.item_title)
									: 0
							)
							.map((a, i) => ({ ...a, sr: i + 1 }))
					}))
					?.map(__order => {
						let order_hsn = hsn_code(__order?.item_details)
						return getPrintData(__order)?.map((order, i, array) => (
							<OrderPrint
								counter={counters.find(a => a.counter_uuid === order?.counter_uuid)}
								reminderDate={reminderDate}
								order={order}
								defaultOrder={__order}
								date={new Date(order?.status[0]?.time)}
								user={users.find(a => a.user_uuid === order?.status[0]?.user_uuid)?.user_title || ""}
								itemData={items}
								item_details={order?.item_details}
								allOrderItems={__order?.item_details}
							
								footer={i + 1 === array.length}
								category={category}
								route={route}
								hsn_code={order_hsn}
								{...props}
							/>
						))
					})}
				{pendingPayments && <PendingPaymentsSummary counterOrders={counterOrders} print={print} />}
			</div>
		</div>
	)
}

export default OrderPrintWrapper
