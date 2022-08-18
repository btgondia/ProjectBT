import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MainAdmin from "./pages/MainAdmin/MainAdmin";
import RoutesPage from "./pages/Master/Routes";
import ItemCategories from "./pages/Master/ItemCategories";
import CounterGroup from "./pages/Master/CounterGroup";
import ItemGroup from "./pages/Master/ItemGroup";
import Counter from "./pages/Master/Counter";
import Users from "./pages/Master/Users";
import Orders from "./users/Orders";
import SelectedCounterOrder from "./users/SelectedCounterOrder";
import ItemsPage from "./pages/Master/Items";
import axios from "axios";
import AutoIncreaseQuantity from "./pages/others/AutoIncreaseQuantity";
import AutoIncreaseItem from "./pages/others/AutoIncreaseItem";
import Main from "./users/Main";
import LoginPage from "./users/LoginPage";
import Processing from "./users/Processing";
import ProcessingOrders from "./users/ProcessingOrders";
import AddOrder from "./pages/AddOrder/AddOrder";
import UserActivity from "./pages/Reports/UserActivity";
import UPITransection from "./pages/Reports/UPITransection";
import CompleteOrder from "./pages/Reports/CompleteOrder";
import ItemDetails from "./pages/Reports/ItemDetails";
import CompletedTrips from "./pages/Reports/CompletedTrips";
import { useEffect, useState } from "react";
import { updateIndexedDb } from "./Apis/functions";
import CounterLeger from "./pages/Reports/CounterLeger";
import Outstanding from "./pages/Reports/Outstanding";
import PendingsEntry from "./pages/Reports/PendingsEntry";
import SignedBills from "./pages/QuikAccess/SignedBills";
import OrderRangeIncentive from "./pages/others/OrderRangeIncentve";
import DeliveryIncentive from "./pages/others/DeliveryIncentive";
import ItemIncentive from "./pages/others/ItemIncentive";
import TasksPage from "./pages/QuikAccess/Tasks";
import Warehouse from "./pages/Master/Warehouse";
import CurrentStock from "./pages/Reports/CurrentStock";
import AddStock from "./pages/AddOrder/AddStock";


function App() {
  const [userType, setUserType] = useState(false);
  axios.defaults.baseURL = "https://api.btgondia.com";
  // axios.defaults.baseURL = "http://15.207.39.69:9000";
  // axios.defaults.baseURL = "http://localhost:9000";

  const getUserType = async () => {
    let user_uuid = localStorage.getItem("user_uuid");
    if (user_uuid) {
      const response = await axios({
        method: "get",
        url: "users/GetUser/" + user_uuid,

        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response.data.result.user_type);
      if (response.data.success)
        setUserType(response.data.result.user_type || false);
    }
  };
  useEffect(() => {
    getUserType();
  }, []);
  useEffect(() => {
    if (userType) {
      let time = +localStorage.getItem("indexed_time") || "";
      let currTime = new Date();
      currTime = currTime.getTime();
      if (64800000 < currTime - time) {
        updateIndexedDb();
      }
    }
  }, [userType]);

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Navigate replace to={"/users"} />} />
          <Route
            path="/login"
            element={<LoginPage setUserType={setUserType} />}
          />
          {+userType === 0 || userType ? (
            <>
              {+userType === 0 ? (
                <>
                  {/* admin Routes */}
                  <Route path="/admin" element={<MainAdmin />} />
                  <Route path="/trip" element={<MainAdmin />} />
                  <Route path="/admin/routes" element={<RoutesPage />} />
                  <Route
                    path="/admin/itemCategories"
                    element={<ItemCategories />}
                  />
                  <Route
                    path="/admin/counterGroup"
                    element={<CounterGroup />}
                  />
                  <Route path="/admin/itemGroup" element={<ItemGroup />} />
                  <Route path="/admin/counter" element={<Counter />} />
                  <Route path="/admin/adminUsers" element={<Users />} />
                  <Route path="/admin/items" element={<ItemsPage />} />
                  <Route path="/admin/warehouse" element={<Warehouse />} />
                  <Route
                    path="/admin/autoIncreaseQty"
                    element={<AutoIncreaseQuantity />}
                  />
                  <Route
                    path="/admin/autoIncreaseItem"
                    element={<AutoIncreaseItem />}
                  />
                  <Route
                    path="/admin/OrderRangeIncentive"
                    element={<OrderRangeIncentive />}
                  />
                  <Route
                    path="/admin/DeliveryIncentive"
                    element={<DeliveryIncentive />}
                  />
                  <Route
                    path="/admin/ItemIncentive"
                    element={<ItemIncentive />}
                  />
                  <Route path="/admin/addOrder" element={<AddOrder />} />
                  <Route path="/admin/addStock" element={<AddStock />} />
                  <Route
                    path="/admin/userActivity"
                    element={<UserActivity />}
                  />
                  <Route
                    path="/admin/upiTransactionReport"
                    element={<UPITransection />}
                  />
                  <Route
                    path="/admin/completeOrderReport"
                    element={<CompleteOrder />}
                  />
                  <Route
                    path="/admin/OrderItemReport"
                    element={<ItemDetails />}
                  />
                  <Route
                    path="/admin/CompletedTripsReport"
                    element={<CompletedTrips />}
                  />
                  <Route
                    path="/admin/CounterLeger"
                    element={<CounterLeger />}
                  />
                  <Route path="/admin/Outstandings" element={<Outstanding />} />
                  <Route
                    path="/admin/pendingEntry"
                    element={<PendingsEntry />}
                  />
                  <Route
                    path="/admin/currentStock"
                    element={<CurrentStock />}
                  />
                  <Route path="/admin/signedBills" element={<SignedBills />} />
                  <Route path="/admin/tasks" element={<TasksPage />} />
                  <Route
                    path="*"
                    element={<Navigate replace to={"/admin"} />}
                  />
                </>
              ) : (
                <>
                  {/* users routes */}
                  <Route path="/users" element={<Main />} />
                  <Route path="/users/orders" element={<Orders />} />
                  <Route path="/users/route/:route_uuid" element={<Orders />} />
                  <Route path="/users/processing" element={<Processing />} />
                  <Route path="/users/checking" element={<Processing />} />
                  <Route path="/users/delivery" element={<Processing />} />
                  <Route
                    path="/users/processing/:trip_uuid"
                    element={<ProcessingOrders />}
                  />
                  <Route
                    path="/users/orders/:counter_uuid"
                    element={<SelectedCounterOrder />}
                  />
                  <Route
                    path="/users/checking/:trip_uuid"
                    element={<ProcessingOrders />}
                  />
                  <Route
                    path="/users/delivery/:trip_uuid"
                    element={<ProcessingOrders />}
                  />
                  <Route
                    path="/users/processing/:trip_uuid/:order_uuid"
                    element={<ProcessingOrders />}
                  />
                  <Route
                    path="/users/checking/:trip_uuid/:order_uuid"
                    element={<ProcessingOrders />}
                  />
                  <Route
                    path="/users/delivery/:trip_uuid/:order_uuid"
                    element={<ProcessingOrders />}
                  />

                  <Route
                    path="*"
                    element={<Navigate replace to={"/users"} />}
                  />
                </>
              )}
            </>
          ) : !window.location.pathname.includes("/login") ? (
            <Route path="*" element={<Navigate replace to={"/login"} />} />
          ) : (
            ""
          )}
        </Routes>
      </Router>

      {/* {window.location.pathname.split('/').at(-2) === 'processing' && <div id="console">
        <h3>CONSOLE <button onClick={e => window.location.reload()}>Reload</button></h3>
      </div>} */}
    </div>
  );
}

export default App;
