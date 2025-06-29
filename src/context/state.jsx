import React, { useEffect, useState } from "react";
import Context from "./context";
import axios from "axios";
import { Billing } from "../Apis/functions";

const State = (props) => {
  const [calculationPopup, setcalculationPopup] = useState(null);
  const [counterNotesPopup, setCounterNotesPopup] = useState(null);
  const [cashRegisterPopup, setCashRegisterPopup] = useState(null);
  const [isTripsModalOpen, setIsTripsModalOpen] = useState(false);
  const [openingBalanceDatePopup, setOpeningBalanceDatePopup] = useState(false);
  const [bankStatementImport, setBankStatementImport] = useState(false);
  const [view, setView] = useState(parseInt(sessionStorage.getItem("view")) || 0);
  const [skipStages, setSkipStages] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(null);
  const [pageLoading, setPageLoading] = useState(null);
  const [gstReportPopup, setGstReportPopup] = useState(false);
  const [checkAccountingBalance, setCheckAccountingBalance] = useState(null);
  const [printTypePopup, setPrintTypePopup] = useState(false);
  const submitBulkOrders = async ({
    stage,
    orders,
    data,
    diliveredUser,
    counters,
    items,
    params = {},
  }) => {
    if (loading) return;
    let controller = new AbortController();
    setLoading(true);
    let timeout = setTimeout(() => {
      setNotification({
        message: "Error Processing Request",
        success: false,
      });
      controller.abort();
      setLoading(false);
    }, 45000);
    try {
      let { selectedData = orders, reasons = {} } = params;
      let user_uuid = localStorage.getItem("user_uuid");
      let time = new Date();
      let status =
        +data.stage === 0
          ? []
          : stage === 1
          ? +data.stage === 2
            ? [{ stage: 2, time: time.getTime(), user_uuid }]
            : +data.stage === 3
            ? [
                { stage: 2, time: time.getTime(), user_uuid },
                { stage: 3, time: time.getTime(), user_uuid },
              ]
            : +data.stage === 3.5
            ? [
                { stage: 2, time: time.getTime(), user_uuid },
                { stage: 3, time: time.getTime(), user_uuid },
                { stage: 3.5, time: time.getTime(), user_uuid: diliveredUser },
              ]
            : +data.stage === 4
            ? [
                { stage: 2, time: time.getTime(), user_uuid },
                { stage: 3, time: time.getTime(), user_uuid },
                { stage: 3.5, time: time.getTime(), user_uuid: diliveredUser },
                { stage: 4, time: time.getTime(), user_uuid },
              ]
            : [
                { stage: 2, time: time.getTime(), user_uuid },
                { stage: 3, time: time.getTime(), user_uuid },
                { stage: 3.5, time: time.getTime(), user_uuid: diliveredUser },
                { stage: 4, time: time.getTime(), user_uuid },
                { stage: 5, time: time.getTime(), user_uuid },
              ]
          : stage === 2
          ? +data.stage === 3
            ? [{ stage: 3, time: time.getTime(), user_uuid }]
            : +data.stage === 3.5
            ? [
                { stage: 3, time: time.getTime(), user_uuid },
                { stage: 3.5, time: time.getTime(), user_uuid: diliveredUser },
              ]
            : +data.stage === 4
            ? [
                { stage: 3, time: time.getTime(), user_uuid },
                { stage: 3.5, time: time.getTime(), user_uuid: diliveredUser },
                { stage: 4, time: time.getTime(), user_uuid },
              ]
            : [
                { stage: 3, time: time.getTime(), user_uuid },
                { stage: 4, time: time.getTime(), user_uuid },
                { stage: 3.5, time: time.getTime(), user_uuid: diliveredUser },
                { stage: 5, time: time.getTime(), user_uuid },
              ]
          : stage === 3
          ? +data.stage === 3.5
            ? [{ stage: 3.5, time: time.getTime(), user_uuid: diliveredUser }]
            : +data.stage === 4
            ? [
                // { stage: 3.5, time: time.getTime(), user_uuid: diliveredUser },
                { stage: 4, time: time.getTime(), user_uuid },
              ]
            : [
                // { stage: 3.5, time: time.getTime(), user_uuid: diliveredUser },
                { stage: 4, time: time.getTime(), user_uuid },
                { stage: 5, time: time.getTime(), user_uuid },
              ]
          : stage === 3.5
          ? +data.stage === 4
            ? [
                // { stage: 3.5, time: time.getTime(), user_uuid: diliveredUser },
                { stage: 4, time: time.getTime(), user_uuid },
              ]
            : [
                // { stage: 3.5, time: time.getTime(), user_uuid: diliveredUser },
                { stage: 4, time: time.getTime(), user_uuid },
                { stage: 5, time: time.getTime(), user_uuid },
              ]
          : [{ stage: 5, time: time.getTime(), user_uuid }];

      selectedData = selectedData?.map((a) => ({
        ...a,
        status: +data.stage === 0 ? a.status : [...a.status, ...status],
        hold: +data.stage === 0 ? "Y" : a.hold || "N",
      }));

      if (+data.stage === 5) {
        let orderData = [];
        for (let obj of selectedData) {
          obj = {
            ...obj,
            processing_canceled:
              +stage === 2
                ? obj.processing_canceled?.length
                  ? [...obj.processing_canceled, ...obj.item_details]
                  : obj.item_details
                : obj.processing_canceled || [],
            delivery_return:
              +stage === 4
                ? obj.delivery_return?.length
                  ? [...obj.delivery_return, ...obj.item_details]
                  : obj.item_details
                : obj.delivery_return || [],
            item_details: obj.item_details.map((a) => ({
              ...a,
              b: 0,
              p: 0,
            })),
          };

          let billingData = await Billing({
            order_uuid: obj?.order_uuid,
            invoice_number: `${obj?.order_type}${obj?.invoice_number}`,
            replacement: obj.replacement,
            adjustment: obj.adjustment,
            shortage: obj.shortage,
            counter: counters.find((a) => a.counter_uuid === obj.counter_uuid),
            ////add_discounts: true,
            items: obj.item_details.map((a) => {
              let itemData = items.find((b) => a.item_uuid === b.item_uuid);
              return {
                ...itemData,
                ...a,
              };
            }),
          });

          const status = obj?.status?.map((_i) =>
            +_i?.stage === 5
              ? { ..._i, cancellation_reason: reasons[obj?.order_uuid] }
              : _i
          );

          orderData.push({
            ...obj,
            ...billingData,
            item_details: billingData.items,
            status,
          });
        }

        const response = await axios({
          method: "put",
          signal: controller.signal,
          url: "/orders/putOrders",
          data: orderData,
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.data.success) {
          clearTimeout(timeout);
        }

        setLoading(false);
        return;
      }
      const response = await axios({
        method: "put",
        url: "/orders/putOrders",
        data: selectedData,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        clearTimeout(timeout);
      }
    } catch (error) {
     
    }
    setLoading(false);
  };
  const updateOrder = async (param = {}) => {
    let controller = new AbortController();
    if (loading) {
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setNotification({
        message: "Error Processing Request",
        success: false,
      });
      controller.abort();
      setLoading(false);
    }, 45000);
    try {
      const {
        data,
        sendPaymentReminder,
        completeOrder,
        modes,
        outstanding,
        modeTotal,
        location,
      } = param;
      if (modes) {
        if (
          location.includes("completeOrderReport") ||
          location.includes("signedBills") ||
          location.includes("pendingEntry") ||
          location.includes("upiTransactionReport")
        ) {
          await axios({
            method: "put",
            url: "/receipts/putReceipt",
            data: {
              modes,
              order_uuid: data?.order_uuid,
              counter_uuid: data?.counter_uuid,
            },
            headers: {
              "Content-Type": "application/json",
            },
          });

          await axios({
            method: "put",
            url: "/Outstanding/putOutstanding",
            data: {
              ...outstanding,
              order_uuid: data?.order_uuid,
              counter_uuid: data?.counter_uuid,
            },
            headers: {
              "Content-Type": "application/json",
            },
          });
        } else {
          // let obj = modes.find((a) => a.mode_title === "Cash");
          // if (obj?.amt && obj?.coin === "") {
          //   setCoinPopup(true);
          //   return;
          // }
          let time = new Date();
          let obj = {
            user_uuid: localStorage.getItem("user_uuid"),
            time: time.getTime(),
            order_uuid: data?.order_uuid,
            counter_uuid: data?.counter_uuid,
            trip_uuid: data?.trip_uuid,
            invoice_number: data?.invoice_number,
            order_grandtotal: data?.order_grandtotal,
            modes: modes?.map((a) =>
              a.mode_title === "Cash" ? { ...a, coin: 0 } : a
            ),
          };

          if (modeTotal) {
            await axios({
              method: "post",
              url: "/receipts/postReceipt",
              data: obj,
              headers: {
                "Content-Type": "application/json",
              },
            });
          }
          if (outstanding?.amount)
            await axios({
              method: "post",
              url: "/Outstanding/postOutstanding",
              data: outstanding,
              headers: {
                "Content-Type": "application/json",
              },
            });
        }
      }
      const orderUpdateData = data;
      const maxState = Math.max(
        ...orderUpdateData?.status?.map((s) => +s.stage)
      );

      if (
        +orderUpdateData?.payment_pending &&
        maxState < 3.5 &&
        completeOrder
      ) {
        orderUpdateData.status.push({
          stage: 3.5,
          time: Date.now(),
          user_uuid: localStorage.getItem("user_uuid"),
        });
      }

      const response = await axios({
        method: "put",
        url: "/orders/putOrders",
        signal: controller.signal,
        data: [
          {
            ...data,
            item_details: data.item_details?.map((i) => ({
              ...i,
              price: +(+i.price).toFixed(3),
            })),
          },
        ],
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        if (sendPaymentReminder) sendPaymentReminders([data?.counter_uuid]);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };
  const CalculateLines = async (days, type) => {
    setLoading(true);
    const response = await axios({
      method: "put",
      url: "/counters/CalculateLines",
      data: { days, type },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      setLoading(false);
    }
  };
  const updateServerPdf = async (data) => {
   
  };

  const [promptState, setPromptState] = useState();

  const getSpecialPrice = (counters, item, counter_uuid) => {
    const data = counters
      ?.find((i) => i.counter_uuid === counter_uuid)
      ?.item_special_price?.find((i) => i.item_uuid === item.item_uuid);
    return data;
  };
  useEffect(() => {
    if (notification) {
      setTimeout(() => setNotification(null), 3000);
    }
  }, [notification]);
  useEffect(() => {
    if (loading) {
      setTimeout(() => setLoading(null), 10000);
    }
  }, [loading]);
  useEffect(() => {
    sessionStorage.setItem("view", view);
  }, [view]);

  const saveSpecialPrice = async (item, counter_uuid, setCounters, price) => {
    try {
     
      const response = await axios({
        method: "patch",
        url: "/counters/item_special_price/" + counter_uuid,
        data: [{ item_uuid: item.item_uuid, price: price || item.p_price }],
        headers: { "Content-Type": "application/json" },
      });
      if (!response.data.success) return;
      setCounters((list) =>
        list.map((i) =>
          i.counter_uuid === counter_uuid ? response.data.counter : i
        )
      );
    } catch (error) {
     
    }
  };

  const deleteSpecialPrice = async (item, counter_uuid, setCounters) => {
    try {
     
      setPromptState(null);
      const response = await axios({
        method: "patch",
        url: "/counters/delete_special_price",
        data: { item_uuid: item.item_uuid, counter_uuid: counter_uuid },
        headers: { "Content-Type": "application/json" },
      });
      if (!response.data.success) return;
      setCounters((list) =>
        list.map((i) =>
          i.counter_uuid === counter_uuid ? response.data.counter : i
        )
      );
    } catch (error) {
     
    }
  };

  const spcPricePrompt = (...params) => {
    setPromptState({
      active: true,
      message: "Item special price will be deleted. Do you wish to continue?",
      actions: [
        {
          label: "Cancel",
          classname: "cancel",
          action: () => setPromptState(null),
        },
        {
          label: "Confirm",
          classname: "confirm",
          action: () => deleteSpecialPrice(...params),
        },
      ],
    });
  };

  const PAYMENT_REMINDER_NOTIFICATION = "7e65e044-9953-433b-a9d7-cced4730b189";
  const sendPaymentReminders = async (counter_ids) => {
    if (!counter_ids?.length) return;
    const response = await axios.post(
      "/whatsapp_notifications/send_payment_reminders",
      {
        notification_uuid: PAYMENT_REMINDER_NOTIFICATION,
        counter_ids,
      }
    );

    if (response?.data?.success)
      setNotification({
        success: true,
        message: "Messages sent successfully",
      });
    else
      setNotification({
        success: false,
        message: "Failed to send messages",
      });
    setTimeout(() => setNotification(null), 3000);
  };
  const getAccountingBalanceDetails = async () => {
    setLoading(true);
    const response = await axios.get("/ledger/getAccountingBalanceDetails");
    if (response.data.success) {
      setCheckAccountingBalance({
        data: response.data.result,
        type: "accounting",
      });
      setNotification({
        success: true,
        message: "Accounting Balance Details Fetched Successfully",
      });
    } else {
      setNotification({
        success: true,
        message: "No Accounting Balance Details Difference Found",
      });
    }
    setLoading(false);
  };
  const getDebitCreditBalanceDetails = async () => {
    setLoading(true);
    const response = await axios.get(
      "/ledger/getDebitCreditAccountingBalanceDetails"
    );
    if (response.data.success) {
      setCheckAccountingBalance({
        data: response.data.result,
        type: "Debit/Credit",
      });
      setNotification({
        success: true,
        message: "Debit/Credit Balance Details Fetched Successfully",
      });
    } else {
      setNotification({
        success: true,
        message: "No Credit/Debit Balance Details Difference Found",
      });
    }
    setLoading(false);
  };
  const getGSTErrorDetails = async () => {
    setLoading(true);
    const response = await axios.get("/ledger/getGSTErrorDetails");
    if (response.data.success) {
      setCheckAccountingBalance({
        data: response.data.result,
        type: "GST Error",
      });
      setNotification({
        success: true,
        message: "GST Error Details Fetched Successfully",
      });
    } else {
      setNotification({
        success: true,
        message: "No GST Error Details Found",
      });
    }
    setLoading(false);
  };
  const fixAllGST = async (checked) => {
    setLoading(true);
    const response = await axios({
      method: "post",
      url: "/ledger/removeGSTError",
      data: checked,
      headers: {
        "Content-Type": "application/json",
      },
    });
   
    if (response.data.success) {
      setLoading(false);
      setNotification({ success: true, message: "Data Updated" });
      getGSTErrorDetails();
    }
  };

  return (
    <Context.Provider
      value={{
        calculationPopup,
        setcalculationPopup,
        CalculateLines,
        loading,
        setLoading,
        notification,
        setNotification,
        updateServerPdf,
        cashRegisterPopup,
        setCashRegisterPopup,
        isTripsModalOpen,
        setIsTripsModalOpen,
        promptState,
        setPromptState,
        getSpecialPrice,
        saveSpecialPrice,
        deleteSpecialPrice,
        spcPricePrompt,
        pageLoading,
        setPageLoading,
        PAYMENT_REMINDER_NOTIFICATION,
        sendPaymentReminders,
        skipStages,
        setSkipStages,
        view,
        setView,
        bankStatementImport,
        setBankStatementImport,
        updateOrder,
        submitBulkOrders,
        setOpeningBalanceDatePopup,
        openingBalanceDatePopup,
        getAccountingBalanceDetails,
        checkAccountingBalance,
        setCheckAccountingBalance,
        counterNotesPopup,
        setCounterNotesPopup,
        gstReportPopup,
        setGstReportPopup,
        getDebitCreditBalanceDetails,
        getGSTErrorDetails,
        fixAllGST,
        printTypePopup,
    setPrintTypePopup,
      }}
    >
      {props.children}
    </Context.Provider>
  );
};

export default State;
