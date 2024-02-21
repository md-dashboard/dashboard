import { useRef, useState } from "react";
import Modal from "./Modal";
export default function NewTask({ onAdd }) {
  const dialog = useRef();
  const [enteredTask, setEnteredTask] = useState("");
  function handleChange(event) {
    setEnteredTask(event.target.value);
  }
  function handleClick() {
    if (enteredTask.trim() === "") {
      dialog.current.open();
      return;
    }
    onAdd(enteredTask);
    setEnteredTask("");
  }
  return (
    <>
      <Modal ref={dialog} buttonCaption="넹">
        <h2 className="my-4 text-xl font-bold text-stone-800">
          Please enter vaild data
        </h2>
        <p className="mb-4 text-stone-600">maybe you forgot input any value?</p>
      </Modal>
      <div className="flex items-center gap-4">
        <input
          type="text"
          className="w-64 px-2 py-1 rounded-sm bg-stone-200"
          onChange={handleChange}
          value={enteredTask}
        />
        <button
          className="text-stone-700 hover:text-stone-950"
          onClick={handleClick}
        >
          Add task
        </button>
      </div>
    </>
  );
}
