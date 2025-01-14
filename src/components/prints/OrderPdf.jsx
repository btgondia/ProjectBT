import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import OrderPrint from "./OrderPrint";
import OrderPrint2 from "./OrderPrint2";

const OrderPdf = () => {
  const params = useParams();
  const [counter, setCounter] = useState([]);
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState({});
  const [reminderDate, setReminderDate] = useState();
  const [itemData, setItemsData] = useState([]);
  const [route, setRoute] = useState([]);

  const getCounters = async (counter_uuid) => {
    const response = await axios({
      method: "post",
      url: "/counters/GetCounterList",
      data: { counters: [counter_uuid] },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setCounter(response.data.result[0]);
  };
  const getRoute = async () => {
    const response = await axios({
      method: "get",
      url: "/routes/GetRouteList",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setRoute(response.data.result);
  };

  const getItemsData = async () => {
    const cachedData = localStorage.getItem("itemsData");
    if (cachedData) {
      setItemsData(JSON.parse(cachedData));
    } else {
      const response = await axios({
        method: "get",
        url: "/items/GetItemList",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        localStorage.setItem("itemsData", JSON.stringify(response.data.result));
        setItemsData(response.data.result);

        if (order.dms_invoice_number) {
          setOrder((prev) => {
            let item_details = prev.item_details.sort((a, b) => {
              let item_a_title =
                itemData.find((c) => c.item_uuid === a.item_uuid)
                  ?.dms_item_name || "";
              let item_b_title =
                itemData.find((c) => c.item_uuid === b.item_uuid)
                  ?.dms_item_name || "";
              return item_a_title.localeCompare(item_b_title);
            }).map(
              (a,i)=>({...a, sr:i+1})
            );
            return { ...prev, item_details };
          });
        }
      }
    }
  };

  const getUser = async (user_uuid) => {
    const response = await axios({
      method: "get",
      url: "/users/GetUser/" + user_uuid,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setUser(response.data.result);
  };

  const getItemsDataReminder = async () => {
    const response = await axios({
      method: "get",
      url: "/items/getNewItemReminder",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setReminderDate(response.data.result);
  };

  useEffect(() => {
    if (!params.order_uuid) return;
    (async () => {
      const api_response = await axios.get(
        "/orders/GetOrder/" + params.order_uuid
      );
      if (!api_response.data.success)
        return
      setOrder(api_response.data.result);
      getItemsData(
        api_response.data.result.item_details.map((a) => a.item_uuid)
      );
      getCounters(api_response.data.result?.counter_uuid);
      getUser(api_response.data.result.status[0]?.user_uuid);
      getItemsDataReminder();
      getRoute();
    })();
  }, [params.order_uuid]);
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

  const hsn_code = useMemo(() => {
    let hsn = [];
    let char = "a";
    for (let item of order.item_details) {
     
      if (item.hsn && !hsn.find((a) => a.hsn === item.hsn)) {
        hsn.push({ hsn: item.hsn, char });
        char = getNextChar(char);
      }
    }
    return hsn;
  }, [order.item_details]);

  return (
    <div id="item-container" style={{ backgroundColor: "#fff" }}>
      {order &&
        Array.from(
          Array(Math.ceil(order?.item_details?.length / 12)).keys()
        )?.map((a, i) =>
          order.dms_invoice_number ? (
            <OrderPrint2
              counter={counter}
              reminderDate={reminderDate}
              order={JSON.parse(JSON.stringify(order))}
              date={new Date(order?.status?.[0]?.time)}
              user={user}
              itemData={itemData}
              item_details={order?.item_details?.slice(a * 12, 12 * (a + 1))}
              footer={!(order?.item_details?.length > 12 * (a + 1))}
              route={route}
              hsn_code={hsn_code}
            />
          ) : (
            <OrderPrint
              counter={counter}
              reminderDate={reminderDate}
              order={JSON.parse(JSON.stringify(order))}
              date={new Date(order?.status?.[0]?.time)}
              user={user?.user_title || ""}
              itemData={itemData}
              item_details={order?.item_details?.slice(a * 12, 12 * (a + 1))}
              footer={!(order?.item_details?.length > 12 * (a + 1))}
              route={route}
              hsn_code={hsn_code}
            />
          )
        )}
    </div>
  );
};

export default OrderPdf;
