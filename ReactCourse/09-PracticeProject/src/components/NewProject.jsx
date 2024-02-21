import { useRef, useState } from "react";
import Input from "./Input";
import Modal from "./Modal";
export default function NewProject({ onAdd, onCancel }) {
  const [project, setProject] = useState({
    title: "",
    description: "",
    dueDate: "",
  });
  const [isValid, setIsvalid] = useState(true);
  const title = useRef();
  const description = useRef();
  const dueDate = useRef();
  const dialog = useRef();
  function handleSave() {
    const enteredTitle = title.current.value;
    const enteredDescription = description.current.value;
    const enteredDueDate = dueDate.current.value;
    if (
      enteredTitle.trim() === "" ||
      enteredDescription.trim() === "" ||
      enteredDueDate.trim() === ""
    ) {
      dialog.current.open();
      return;
    }
    onAdd({
      title: enteredTitle,
      description: enteredDescription,
      dueDate: enteredDueDate,
    });
  }
  function handleCancel() {
    title.current.value = "";
    description.current.value = "";
    dueDate.current.value = "";
  }
  return (
    <>
      <Modal ref={dialog} buttonCaption="넹">
        {" "}
        <h2 className="my-4 text-xl font-bold text-stone-800">
          Please enter vaild data
        </h2>
        <p className="mb-4 text-stone-600">maybe you forgot input any value?</p>
      </Modal>
      <div className="w-[35rem] mt-16">
        <menu className="flex items-center justify-end gap-4 my-4">
          <li>
            <button
              className="text-stone-800 hover:text-stone-950"
              onClick={(handleCancel, onCancel)}
            >
              Cancel
            </button>
          </li>
          <li>
            <button
              className="px-6 py-2 rounded-md bg-stone-800 text-stone-500"
              onClick={handleSave}
            >
              Save
            </button>
          </li>
        </menu>
        <div>
          <Input label="title" name="title" ref={title} />
          <Input
            label="description"
            textarea="textarea"
            name="description"
            ref={description}
          />
          <Input label="due date" name="dueDate" type="date" ref={dueDate} />
          {!isValid && <p>Please enter valid data.</p>}
        </div>
      </div>
    </>
  );
}
