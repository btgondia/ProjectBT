/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, forwardRef } from "react";
import Select from "react-select";
import axios from "axios";
import { CSS } from '@dnd-kit/utilities';
import { ViewGridIcon } from "@heroicons/react/solid";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  useSortable,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

const CounterSequence = ({ onSave, counters, routesData }) => {

  const [route, setRoute] = useState("");
  const [counterData, setCounterData] = useState([]);

  useEffect(() => {
    setCounterData(counters.filter((a) => a.route_uuid === route));
  }, [route]);

  return (
    <div className="overlay">
      <div
        className="modal"
        style={{
          height: "fit-content",
          width: "fit-content",
          paddingTop: "40px",
        }}
      >
        <div
          className="content"
          style={{
            height: "fit-content",
            padding: "20px",
            width: "fit-content",
          }}
        >
          <div style={{ overflowY: "scroll" }}>
            {route ? (
              <div style={{ width: "500px" }}>
                <Table counterData={counterData} setCounterData={setCounterData} onSave={onSave} />
              </div>
            ) : (
              <div style={{ width: "200px" }}>
                <h1>Select Route</h1>
                <Select
                  options={routesData.map((a) => ({
                    value: a.route_uuid,
                    label: a.route_title,
                  }))}
                  onChange={(doc) => setRoute((prev) => doc.value)}
                  value={
                    route
                      ? {
                        value: route,
                        label: routesData?.find(
                          (j) => j.counter_uuid === route
                        )?.route_title,
                      }
                      : ""
                  }
                  openMenuOnFocus={true}
                  menuPosition="fixed"
                  menuPlacement="auto"
                  placeholder="Select"
                />
              </div>
            )}
          </div>
          <button onClick={onSave} className="closeButton">
            x
          </button>
        </div>
      </div>
    </div>
  );
};

export default CounterSequence;
function Table({ counterData, setCounterData, onSave }) {

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState(null);
  const [itemsIdList, setItemsIdList] = useState();
  useEffect(() => setItemsIdList(counterData?.sort((a, b) => +a.sort_order - b.sort_order)?.map(i => i.counter_uuid)), [counterData])

  console.log(itemsIdList)
  const handleSave = async () => {
    const response = await axios({
      method: "put",
      url: "/counters/putCounter/sortOrder",
      data: counterData?.map(({ counter_uuid, sort_order, ...i }) => ({ counter_uuid, sort_order })),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok)
      onSave()
  }

  return (
    <>
      <table
        className="user-table"
        style={{ Width: "500px", height: "fit-content", overflowX: "scroll" }}
      >
        <thead>
          <tr>
            <th>Sort Order</th>
            <th colSpan={2}>Counter Title</th>
            <th colSpan={2}>Address</th>
          </tr>
        </thead>
        <tbody className="tbody">
          {itemsIdList?.[0] ? <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={itemsIdList}
              strategy={rectSortingStrategy}
            >
              {itemsIdList?.map((id, i) => <SortableItem key={i} id={id} activeId={activeId} setActiveId={setActiveId} counterItem={counterData?.find(i => i.counter_uuid === id)} />)}
            </SortableContext>
            <DragOverlay>
              {activeId ? <Item id={activeId} counterItem={counterData?.find(i => i.counter_uuid === activeId)} /> : null}
            </DragOverlay>
          </DndContext>
            : (<tr><td colSpan={5}>No Counter</td></tr>)
          }
        </tbody>
      </table>
      <button className='counter-save-btn' onClick={handleSave}>Save</button>
    </>
  );
  function handleDragStart(event) {
    const { active } = event;
    setActiveId(active?.id);
  }

  function handleDragEnd(event) {

    const { active, over } = event;
    if (active?.id !== over?.id) {

      const oldIndex = itemsIdList?.indexOf(active.id);
      const newIndex = itemsIdList?.indexOf(over.id);

      let updatedIds = arrayMove(itemsIdList, oldIndex, newIndex);
      setCounterData(updatedIds?.map((id, i) => {
        let doc = counterData?.find(counter => counter.counter_uuid === id)
        return { ...doc, sort_order: i + 1 }
      }))
    }
    setActiveId(null);
  }
}

const SortableItem = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition, } = useSortable({ id: props?.id });
  const style = { transform: CSS?.Transform?.toString(transform), transition };
  return (<Item {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />);
};

const Item = forwardRef(({
  activeId,
  style,
  counterItem,
  ...props
}, ref) => {

  return (
    <tr
      key={counterItem?.counter_uuid}
      ref={ref}
      style={style}
      className={activeId === counterItem?.counter_uuid ? 'dragTarget' : ''}
    >
      <td>
        <ViewGridIcon {...props} style={{ width: '16px', height: '16px', opacity: '0.7', marginRight: '5px' }} />
        {counterItem?.sort_order}
      </td>
      <td colSpan={2}>{counterItem?.counter_title}</td>
      <td colSpan={2}>{counterItem?.address}</td>
    </tr>
  )
});