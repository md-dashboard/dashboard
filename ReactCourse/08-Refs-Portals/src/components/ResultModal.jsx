import { forwardRef, useImperativeHandle, useRef } from "react";
import { createPortal } from "react-dom";
const ResultModal = forwardRef(function ResultModal(
  { targetTime, remainingTime, onReset },
  ref
) {
  const dialog = useRef();
  const userLost = remainingTime <= 0;
  const formattedRemainingTime = (remainingTime / 1000).toFixed(2);
  const score = Math.round((1 - remainingTime / (targetTime * 1000)) * 100);
  useImperativeHandle(ref, () => {
    return {
      open() {
        dialog.current.showModal();
      },
    };
  });
  return createPortal(
    <dialog ref={dialog} className="result-modal" onClose={onReset}>
      {userLost && <h2>You lost</h2>}
      {!userLost && <h2>당신의 점수는 {score} 점!</h2>}
      <p>
        목표시간은 <strong>{targetTime} 초 였습니다.</strong>
      </p>
      <p>
        당신은 <strong>{formattedRemainingTime} 초를 남긴채로</strong>타이머를
        눌렀습니다.
      </p>
      <form method="dialog" onSubmit={onReset}>
        <button>닫기</button>
      </form>
    </dialog>,
    document.getElementById("modal")
  );
});

export default ResultModal;
