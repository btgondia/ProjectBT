import React, { useEffect, useMemo } from "react";

const PendingPaymentsSummary = ({
  print,
  counterOrders,
  paymentsSummaryRef,
  counters = [],
}) => {
  const itemsQuantity = (items) =>
    Object.values(
      items?.reduce(
        (quantities, i) => ({
          b: (quantities?.b || 0) + +i?.b,
          p: (quantities?.p || 0) + +i?.p,
        }),
        {}
      )
    )?.join(":");

  useEffect(() => {
    print?.();
  }, [print]);

  const getDate = (i) => {
    const date = new Date(i);
    return [date.getDate(), date.getMonth() + 1, date.getFullYear()]
      .map((i) => i.toString().padStart(2, "0"))
      .join("/");
  };
  const counterList = useMemo(
    () =>
      Object.keys(counterOrders || {})
        .map((a) => {
          let {
            route_title = "",
            counter_title = "",
            credit_rating = "",
            address = "",
            sort_order = 0,
          } = counters.find((c) => c.counter_uuid === a);
          console.log({
            route_title,
            counter_title,
            credit_rating,
            address,
            sort_order,
          });

          return {
            route_title,
            counter_title,
            credit_rating,
            address,
            sort_order,
            orders: counterOrders[a]?.orders || [],
            numbers: counterOrders[a]?.numbers || [],
          };
        })
        .filter(Boolean) // Remove any null values
        .sort((a, b) => a?.sort_order - b?.sort_order),
    [counterOrders, counters]
  );

  console.log("counters", counterOrders);
  return (
    <table id="pending-payments-summary" ref={paymentsSummaryRef ?? null}>
      <tr style={{ height: "50px" }}>
        <th style={{ textAlign: "left" }} colSpan={5}>
          {new Date().toGMTString().slice(0, -4)}
        </th>
      </tr>
      {counterList?.length
        ? counterList.map(
            ({
              route_title,
              counter_title,
              credit_rating,
              address,
              orders,
              numbers,
            }) => {
              return (
                <>
                  <tr>
                    <th colSpan={3} style={{ textAlign: "left" }}>
                      {counter_title},{route_title}{" "}
                      {credit_rating ? "[" + credit_rating + "]" : ""}
                    </th>
                    <th colSpan={2} style={{ textAlign: "right" }}>
                      {numbers?.[0]}
                    </th>
                  </tr>
                  <tr>
                    <td colSpan={5} style={{ textAlign: "left" }}>
                      {address}
                    </td>
                  </tr>

                  {orders?.map((order) => (
                    <tr>
                      <td>{getDate(+order?.time_1)}</td>
                      <td>
                        {(order?.order_type === "I" ? "" : "E") +
                          order?.invoice_number}
                      </td>
                      <td>Rs.{order?.order_grandtotal}</td>
                      <td>{itemsQuantity(order?.item_details)}</td>
                      <td>[ {order?.notes?.join(", ")} ]</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={5} style={{ textAlign: "right" }}>
                      TOTAL: Rs.
                      {orders?.reduce(
                        (sum, i) => sum + +i?.order_grandtotal,
                        0
                      )}
                    </td>
                  </tr>
                </>
              );
            }
          )
        : ""}
    </table>
  );
};

export default PendingPaymentsSummary;
