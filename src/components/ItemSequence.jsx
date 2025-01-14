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

const ItemSequence = ({ onSave, itemsData, itemCategories }) => {

  const [category, setItemCategories] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(itemsData.filter((a) => a.category_uuid === category));
  }, [category]);

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
            {category ? (
              <div style={{ width: "500px" }}>
                <Table items={items} setItems={setItems} onSave={onSave} />
              </div>
            ) : (
              <div style={{ width: "200px" }}>
                <h1>Select Category</h1>
                <Select
                  options={itemCategories.map((a) => ({
                    value: a.category_uuid,
                    label: a.category_title,
                  }))}
                  onChange={(doc) => setItemCategories((prev) => doc.value)}
                  value={
                    category
                      ? {
                        value: category,
                        label: itemCategories?.find(
                          (j) => j.item_uuid === category
                        )?.category_title,
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

export default ItemSequence;
function Table({ items, setItems, onSave }) {

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState(null);
  const [itemsIdList, setItemsIdList] = useState();
  useEffect(() => setItemsIdList(items?.sort((a, b) => +a.sort_order - b.sort_order)?.map(i => i.item_uuid)), [items])

 
  const handleSave = async () => {
    const response = await axios({
      method: "put",
      url: "/items/putItems/sortOrder",
      data: items?.map(({ item_uuid, sort_order, ...i }) => ({ item_uuid, sort_order })),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.request.status === 200)
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
              {itemsIdList?.map((id, i) => <SortableItem key={i} id={id} activeId={activeId} setActiveId={setActiveId} counterItem={items?.find(i => i.item_uuid === id)} />)}
            </SortableContext>
            <DragOverlay>
              {activeId ? <Item id={activeId} counterItem={items?.find(i => i.item_uuid === activeId)} /> : null}
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
      setItems(updatedIds?.map((id, i) => {
        let doc = items?.find(counter => counter.item_uuid === id)
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
      key={counterItem?.item_uuid}
      ref={ref}
      style={style}
      className={activeId === counterItem?.item_uuid ? 'dragTarget' : ''}
    >
      <td>
        <ViewGridIcon {...props} style={{ width: '16px', height: '16px', opacity: '0.7', marginRight: '5px' }} />
        {counterItem?.sort_order}
      </td>
      <td colSpan={2}>{counterItem?.item_title}</td>
  
    </tr>
  )
});