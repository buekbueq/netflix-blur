document.addEventListener('DOMContentLoaded', () => {
  const timeIntervalsDiv = document.getElementById('time-intervals');
  const addIntervalButton = document.getElementById('add-interval');
  const saveButton = document.getElementById('save-button');
  let intervals = [];

  // 시간 간격 입력 폼 추가
  addIntervalButton.addEventListener('click', () => {
    const intervalDiv = document.createElement('div');
    intervalDiv.classList.add('time-interval');

    const startInput = document.createElement('input');
    startInput.type = 'number';
    startInput.placeholder = 'Start time (seconds)';
    
    const endInput = document.createElement('input');
    endInput.type = 'number';
    endInput.placeholder = 'End time (seconds)';

    intervalDiv.appendChild(startInput);
    intervalDiv.appendChild(endInput);
    timeIntervalsDiv.appendChild(intervalDiv);
  });

  // 저장 버튼 클릭 시 시간 간격을 가져와서 전송
  saveButton.addEventListener('click', () => {
    const intervalElements = document.querySelectorAll('.time-interval');
    intervals = Array.from(intervalElements).map(interval => {
      const inputs = interval.querySelectorAll('input');
      return {
        start: parseFloat(inputs[0].value),
        end: parseFloat(inputs[1].value),
      };
    });

    // 시간 간격 데이터를 백그라운드로 전송
    chrome.runtime.sendMessage({ type: 'SAVE_BLUR_TIMES', intervals });
  });
});
