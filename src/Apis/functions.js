import axios from "axios";
import { deleteDB, openDB } from "idb";

export const AutoAdd = async ({ counter, items, dbItems, autobills = [] }) => {
  let eligibleItems = items;
  let auto_added = [];

  let data = autobills?.filter(
    (a) =>
      a.type === "auto-increase-qty" &&
      (a?.counters?.filter((b) => b === counter.counter_uuid)?.length ||
        counter?.counter_group_uuid?.filter(
          (b) => a?.counter_groups.filter((c) => c === b)?.length
        ).length)
  );

  for (let autobill of data) {
    eligibleItems = eligibleItems.map((a) => {
      if (
        // autobill.items.length === 0 ||
        autobill.items.filter((b) => b === a.item_uuid).length ||
        autobill.item_groups.filter(
          (b) => a.item_group_uuid.filter((c) => c === b).length
        ).length
      ) {
        let base_qty_arr = autobill.qty_details.filter(
          (b) => b.unit === "b" && +b.base_qty <= +a.b
        );
        base_qty_arr = base_qty_arr.find(
          (item) =>
            +item.base_qty ===
            +(base_qty_arr.length > 1
              ? base_qty_arr
                  .map((a) => a.base_qty)
                  .reduce((a, b) => +Math.max(a, b))
              : base_qty_arr.length === 1
              ? base_qty_arr[0].base_qty
              : null)
        );
        let pice_qty_arr = autobill.qty_details.filter(
          (b) => b.unit === "p" && +b.base_qty <= +a.p
        );
        pice_qty_arr = pice_qty_arr.find(
          (item) =>
            +item.base_qty ===
            +(pice_qty_arr.length > 1
              ? pice_qty_arr
                  .map((a) => a.base_qty)
                  .reduce((a, b) => +Math.max(a, b))
              : pice_qty_arr.length === 1
              ? pice_qty_arr[0].base_qty
              : null)
        );
        pice_qty_arr = base_qty_arr ? {} : pice_qty_arr;
        if (base_qty_arr || pice_qty_arr) {
          auto_added.push({
            item_uuid: a.item_uuid,
            b: base_qty_arr?.add_qty ? +base_qty_arr?.add_qty : 0,
            p: pice_qty_arr?.add_qty ? +pice_qty_arr?.add_qty : 0,
          });
        }

        return {
          ...a,
          b: +a.b + (base_qty_arr?.add_qty ? +base_qty_arr?.add_qty : 0),
          p: +a.p + (pice_qty_arr?.add_qty ? +pice_qty_arr?.add_qty : 0),
        };
      } else return a;
    });
  }
  //console.log("eligibleitems", eligibleItems);
  data = autobills?.filter(
    (a) =>
      a.type === "auto-item-add" &&
      (a.counters.filter((b) => b === counter.counter_uuid).length ||
        counter.counter_group_uuid.filter(
          (b) => a.counter_groups.filter((c) => c === b).length
        ).length)
  );

  for (let autobill of data) {
    let eligibleAddItems = eligibleItems?.filter(
      (a) =>
        // autobill.items.length === 0 ||
        autobill.items.filter((b) => b === a.item_uuid).length ||
        autobill.item_groups.filter(
          (b) => a.item_group_uuid.filter((c) => c === b).length
        ).length
    );
    console.log("eligible", eligibleAddItems);
    let eligiblesBox =
      eligibleAddItems.length > 1
        ? eligibleAddItems.map((a) => +a.b || 0).reduce((a, b) => a + b)
        : eligibleAddItems.length === 1
        ? +eligibleAddItems[0].b
        : 0;
    console.log("eligibleBox", eligiblesBox);
    let eligiblesPcs =
      eligibleAddItems.length > 1
        ? eligibleAddItems.map((a) => a.p).reduce((a, b) => a + b)
        : eligibleAddItems.length === 1
        ? +eligibleAddItems[0].p
        : 0;
    console.log("eligiblePcs", eligiblesPcs);

    let base_qty_arr = autobill.qty_details.filter(
      (b) => b.unit === "b" && +b.base_qty <= eligiblesBox
    );
    console.log("baseqtyarr", base_qty_arr);
    base_qty_arr =
      eligibleAddItems.length >= autobill.min_range
        ? base_qty_arr.find(
            (item) =>
              +item.base_qty ===
              (base_qty_arr.length > 1
                ? base_qty_arr
                    .map((a) => a.base_qty)
                    .reduce((a, b) => +Math.max(a, b))
                : base_qty_arr.length === 1
                ? +base_qty_arr[0]?.base_qty
                : null)
          )
        : null;
    console.log("baseqtyobj", base_qty_arr);
    let pice_qty_arr = autobill.qty_details.filter(
      (b) => b.unit === "p" && +b.base_qty <= eligiblesPcs
    );
    // console.log("piceqtyarr", pice_qty_arr);
    pice_qty_arr =
      eligibleAddItems.length >= autobill.min_range
        ? pice_qty_arr.find(
            (item) =>
              +item.base_qty ===
              (pice_qty_arr.length > 1
                ? pice_qty_arr
                    .map((a) => a.base_qty)
                    .reduce((a, b) => +Math.max(a, b))
                : pice_qty_arr.length === 1
                ? +pice_qty_arr[0]?.base_qty
                : null)
          )
        : null;
    // console.log("piceqtyobj", pice_qty_arr);

    if (base_qty_arr?.add_items) {
      let dataItems = dbItems.filter(
        (a) =>
          base_qty_arr?.add_items.filter((b) => b.item_uuid === a.item_uuid)
            .length
      );
      dataItems = dataItems.map((a) => {
        if (base_qty_arr?.add_items.find((b) => b.item_uuid === a.item_uuid)) {
          let data = base_qty_arr?.add_items.find(
            (b) => b.item_uuid === a.item_uuid
          );
          auto_added.push({ ...data, p: data.add_qty || 0 });
        }
        return {
          ...a,
          p: base_qty_arr?.add_items.find((b) => b.item_uuid === a.item_uuid)
            .add_qty,
        };
      });
      console.log("datapiceItems", dataItems);

      let nonFiltered = eligibleItems.filter(
        (a) => !dataItems.filter((b) => a.item_uuid === b.item_uuid).length
      );

      // eslint-disable-next-line no-loop-func
      dataItems = dataItems.map((a) => {
        let data = eligibleItems.find((b) => a.item_uuid === b.item_uuid);
        return {
          ...a,
          p: (data ? data.p : a.p) || 0,
          b: (data ? data.b : a.b) || 0,
          free: (data ? data.free : a.free) || 0,
        };
      });
      console.log(nonFiltered, dataItems);
      eligibleItems = nonFiltered.length
        ? dataItems.length
          ? [...nonFiltered, ...dataItems]
          : nonFiltered
        : dataItems.length
        ? dataItems
        : [];
    }
    if (pice_qty_arr?.add_items) {
      let dataItems = dbItems.filter(
        (a) =>
          pice_qty_arr?.add_items.filter((b) => b.item_uuid === a.item_uuid)
            .length
      );
      dataItems = dataItems.map((a) => {
        if (pice_qty_arr?.add_items.find((b) => b.item_uuid === a.item_uuid)) {
          let data = pice_qty_arr?.add_items.find(
            (b) => b.item_uuid === a.item_uuid
          );
          auto_added.push({ ...data, p: data.add_qty || 0 });
        }
        return {
          ...a,
          p: pice_qty_arr?.add_items.find((b) => b.item_uuid === a.item_uuid)
            .add_qty,
        };
      });
      // console.log("datapiceItems", dataItems);

      let nonFiltered = eligibleItems.filter(
        (a) => !dataItems.filter((b) => a.item_uuid === b.item_uuid).length
      );

      // eslint-disable-next-line no-loop-func
      dataItems = dataItems.map((a) => {
        let data = eligibleItems.find((b) => a.item_uuid === b.item_uuid);
        return {
          ...a,
          p: (data ? data.p : a.p) || 0,
          b: (data ? data.b : a.b) || 0,
          free: (data ? data.free : a.free) || 0,
        };
      });
      console.log(nonFiltered, dataItems);
      eligibleItems = nonFiltered.length
        ? dataItems.length
          ? [...nonFiltered, ...dataItems]
          : nonFiltered
        : dataItems.length
        ? dataItems
        : [];
    }
  }

  return {
    counter_uuid: counter.counter_uuid,
    auto_added,
    items: eligibleItems,
  };
};

export const Billing = async ({
  counter = {},
  items = [],
  others = null,
  replacement = 0,
  shortage = 0,
  adjustment = 0,

  add_discounts,
  edit_prices = [],
}) => {
  let newPriceItems = [];
  console.log("itemsdata", items);
  // let add_discounts = true;
  for (let item of items) {
    item = { ...item, item_total: 0 };
    let edit_price = +edit_prices.find((a) => a.item_uuid === item.item_uuid)
      ?.item_price;
    let billDiscounts = item.charges_discount?.find(
      (a) => a.title === "Bill Discounting"
    );
    let charges_discount =
      add_discounts || item.edit
        ? []
        : item.charges_discount?.filter((a) => a.value) || [];
    let price = +(add_discounts || item.edit
      ? counter?.item_special_price?.find((a) => a.item_uuid === item.item_uuid)
          ?.price || 0
      : 0);
    let special_discount_percentage =
      add_discounts || item.edit
        ? counter?.item_special_discount?.find(
            (a) => a.item_uuid === item.item_uuid
          )?.discount || 0
        : 0;
    let company_discount_percentage =
      add_discounts || item.edit
        ? counter?.company_discount?.find(
            (a) => a.company_uuid === item.company_uuid
          )?.discount || 0
        : 0;

    item = {
      ...item,
      qty: +item.conversion * +item.b + +item.p,
    };
    if (price) item = { ...item, item_price: price };

    if (special_discount_percentage) {
      charges_discount?.push({
        title: "Special Discount",
        value: special_discount_percentage,
      });
      item = {
        ...item,
        special_discount_percentage,
        item_desc_total:
          (+edit_price || +item?.price || +item?.item_price || 0) *
            ((100 - special_discount_percentage) / 100) || 0,
      };
    }

    if (item.edit || (add_discounts && item.item_discount)) {
      charges_discount?.push({
        title: "Item Discount",
        value: item.item_discount,
      });
      item = {
        ...item,
        item_desc_total: item.item_desc_total
          ? item.item_desc_total * ((100 - item.item_discount) / 100) || 0
          : (+edit_price || +item?.price || +item?.item_price || 0) *
              ((100 - item.item_discount) / 100) || 0,
      };
    }

    if (company_discount_percentage) {
      charges_discount?.push({
        title: "Company Discount",
        value: company_discount_percentage,
      });
      item = {
        ...item,
        company_discount_percentage,
        item_desc_total: item.item_desc_total
          ? item.item_desc_total *
              ((100 - company_discount_percentage) / 100) || 0
          : (+edit_price || +item?.price || +item.item_price || 0) *
              ((100 - company_discount_percentage) / 100) || 0,
      };
    }

    // console.log(item);
    item = {
      ...item,
      item_desc_total:
        add_discounts || item.edit
          ? item.item_desc_total
          : (+edit_price || +item?.price || +item?.item_price) *
            (charges_discount?.length > 1
              ? charges_discount
                  ?.map((a) => +((100 - +a.value) / 100))
                  ?.reduce((a, b) => a * b)
              : item?.charges_discount?.length
              ? (100 - +charges_discount[0]?.value) / 100
              : 1),
    };

    let item_total =
      item.status !== 3
        ? (
            (+item.item_desc_total || +item?.price || +item.item_price || 0) *
            (+item.qty || 0)
          ).toFixed(2)
        : 0;
    if (billDiscounts && add_discounts) {
      charges_discount.push(billDiscounts);
      item_total = item_total * +((100 - +billDiscounts.value) / 100);
    }

    if (item_total) item_total = (+item_total || 0).toFixed(2);
    item = {
      ...item,
      charges_discount,
      item_total,
      item_desc_total: 0,
    };

    //console.log("item", item);
    newPriceItems.push(item);
  }
  //console.log("newItemPrice", newPriceItems);
  let order_grandtotal = Math.round(
    newPriceItems.length > 1
      ? newPriceItems.map((a) => +a.item_total || 0).reduce((a, b) => a + b) -
          replacement -
          shortage -
          adjustment
      : newPriceItems.length
      ? (newPriceItems.map((a) => a.item_total)[0] || 0) -
        replacement -
        shortage -
        adjustment
      : 0
  );
  // console.log("itemsdata",newPriceItems)
  console.log("itemsdata", order_grandtotal);
  return {
    counter_uuid: counter.counter_uuid,
    order_grandtotal,
    items: newPriceItems,
    others,
  };
};

export const updateIndexedDb = async (setNotification = () => {}) => {
  await deleteDB("BT", {
    blocked(currentVersion, blockedVersion, event) {
      console.log("IDB DELETE REQUEST BLOCKED.", {
        currentVersion,
        blockedVersion,
      });
      window.location.reload();
    },
  });
  let Version = +localStorage.getItem("IDBVersion") + 1;
  const response = await axios({
    method: "get",
    url: "/users/GetUser/" + localStorage.getItem("user_uuid"),
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log(response.data.success);
  if (!response.data.result.status) {
    localStorage.clear();
    sessionStorage.clear();
    setNotification(response.data);
    setTimeout(() => setNotification(null), 5000);
    return;
  }
  const result = await axios({
    method: "get",
    url: "/users/getDetails",
    headers: {
      "Content-Type": "application/json",
    },
  });
  let data = result.data.result;
  console.log(data);
  const db = await openDB("BT", Version, {
    upgrade(db) {
      for (const property in data) {
        db.createObjectStore(property, {
          keyPath: "IDENTIFIER",
        });
      }
    },
  });
  const exitFunction = () => {
    let time = new Date();
    localStorage.setItem("indexed_time", time.getTime());
    localStorage.setItem("IDBVersion", Version);

    db.close();
    window.location.reload(true);
  };
  let store;
  let index = 0;
  for (const property in data) {
    store = await db.transaction(property, "readwrite").objectStore(property);
    for (let item of data[property]) {
      let IDENTIFIER =
        item[
          property === "autobill"
            ? "auto_uuid"
            : property === "companies"
            ? "company_uuid"
            : property === "counter"
            ? "counter_uuid"
            : property === "counter_groups"
            ? "counter_group_uuid"
            : property === "item_category"
            ? "category_uuid"
            : property === "items"
            ? "item_uuid"
            : property === "routes"
            ? "route_uuid"
            : property === "payment_modes"
            ? "mode_uuid"
            : ""
        ];
      //console.log({ ...item, IDENTIFIER });
      await store.put({ ...item, IDENTIFIER });
    }
    index = index + 1;
    if (index === Object.keys(data).length) {
      exitFunction();
    }
  }
};

export const audioLoopFunction = ({
  i,
  recall,
  forcePlayCount,
  src,
  callback,
}) => {
  try {
    clearInterval(+sessionStorage.getItem("intervalId"));

    if (!src?.[0]) return;
    if (!src?.some((i) => i.getAttribute("played") !== "true")) {
      let utterance = new SpeechSynthesisUtterance("Category completed");
      var voices = window.speechSynthesis.getVoices();
      utterance.voice = voices.find((voice) => voice.lang === "hi-IN");
      window.speechSynthesis.speak(utterance);
      return;
    }
    if (src?.[i]?.getAttribute("played") === "true") {
      //console.log(`skipped number : ${i + 1}`);
      audioLoopFunction({ i: i + 1, recall, forcePlayCount, src, callback });
      return;
    }

    //console.log(`trying to play audio number : ${i + 1}`);

    navigator.mediaSession.setActionHandler("play", function () {
      src[i].play();
      navigator.mediaSession.playbackState = "playing";
    });

    navigator.mediaSession.setActionHandler("pause", function () {
      src[i].pause();
      navigator.mediaSession.playbackState = "paused";
    });

    src[i]
      .play()
      .then((res) => {
        if (!forcePlayCount) {
          src[i].pause();
          navigator.mediaSession.playbackState = "paused";
          //console.log(`Paused ${i + 1}/${src.length} audios`);
        } else {
          //console.log(`Playing ${i + 1}/${src.length} audios`);
          navigator.mediaSession.playbackState = "playing";
          //console.log("forcePlayCount:", forcePlayCount);
        }

        let intervalId = setInterval(() => {
          if (src[i]?.duration - src[i].currentTime > 8.8)
            return console.log(
              `returning : ${src[i]?.duration - src[i].currentTime}`
            );

          clearInterval(+sessionStorage.getItem("intervalId"));
          src[i].currentTime = src[i].duration;
          src[i].pause();
          src[i].setAttribute("played", "true");
          navigator.mediaSession.playbackState = "paused";
          callback(src[i]?.elem_id);

          if (!src[i + 1]) return;
          console.log(`no next audio : ${i + 1}`);

          setTimeout(() => {
            audioLoopFunction({
              i: i + 1,
              forcePlayCount: forcePlayCount ? forcePlayCount - 1 : 0,
              recall,
              src,
              callback,
            });
          }, 1000);
        }, 100);
        sessionStorage.setItem("intervalId", intervalId);
      })
      .catch((error) => {
        if (recall)
          setTimeout(() => {
            console.log(
              `could not play ${i} audio : ${error.message} recall : ${recall}`
            );
            audioLoopFunction({ i, recall, src, callback });
          }, 3000);
        else console.log(`could not play ${i} audio : ${error.message}`);
      });
  } catch (error) {
    console.log(error.message);
  }
};

export const audioAPIFunction = ({ speechString, elem_id, callback }) => {
  let audioElement = new Audio(
    `${axios.defaults.baseURL}/stream/${speechString
      .toLowerCase()
      .replaceAll(" ", "_")}`
  );
  audioElement.addEventListener(
    "durationchange",
    function (e) {
      if (audioElement.duration !== Infinity) {
        audioElement.remove();
        //console.log(audioElement.duration);
        audioElement.elem_id = elem_id;
        callback(audioElement);
      }
    },
    false
  );

  audioElement.load();
  audioElement.currentTime = 24 * 60 * 60;
  audioElement.volume = 0;
};

export const jumpToNextIndex = (
  id,
  reactInputsRef,
  setFocusedInputId,
  appendData
) => {
  //console.log(id);
  document.getElementById(id)?.blur();
  const index = +document.getElementById(id).getAttribute("index") + 1;
  //console.log("this is next index", index);

  const nextElem = document.querySelector(`[index="${index}"]`);
  if (nextElem) {
    if (nextElem.id.includes(`REACT_SELECT_COMPONENT`)) {
      //console.log("next select container id: ", nextElem.id);
      reactInputsRef.current[nextElem.id].focus();
    } else {
      //console.log("next input id: ", nextElem.id);
      setFocusedInputId("");
      setTimeout(
        () => document.querySelector(`[index="${index}"]`).focus(),
        250
      );
      return;
    }
  } else appendData();
};

export const refreshDb = async () => {
  let Version = +(localStorage.getItem("IDBVersion") || 0) + 1;
  await deleteDB("BT", {
    blocked(currentVersion, blockedVersion, event) {
      console.log("IDB DELETE REQUEST BLOCKED.", {
        currentVersion,
        blockedVersion,
      });
      window.location.reload();
    },
  });
  console.log(Version);
  const result = await axios({
    method: "get",
    url: "/users/getDetails",
    headers: {
      "Content-Type": "application/json",
    },
  });
  let data = result.data.result;
  console.log(data);
  const db = await openDB("BT", Version, {
    upgrade(db) {
      for (const property in data) {
        db.createObjectStore(property, {
          keyPath: "IDENTIFIER",
        });
      }
    },
  });
  localStorage.setItem("IDBVersion", Version);
  let store;
  for (const property in data) {
    store = await db.transaction(property, "readwrite").objectStore(property);
    for (let item of data[property]) {
      let IDENTIFIER =
        item[
          property === "autobill"
            ? "auto_uuid"
            : property === "companies"
            ? "company_uuid"
            : property === "counter"
            ? "counter_uuid"
            : property === "counter_groups"
            ? "counter_group_uuid"
            : property === "item_category"
            ? "category_uuid"
            : property === "items"
            ? "item_uuid"
            : property === "routes"
            ? "route_uuid"
            : property === "payment_modes"
            ? "mode_uuid"
            : property === "warehouse"
            ? "warehouse_uuid"
            : ""
        ];
      console.log({ ...item, IDENTIFIER });
      await store.put({ ...item, IDENTIFIER });
    }
  }

  db.close();
  let time = new Date();
  localStorage.setItem("indexed_time", time.getTime());
};
