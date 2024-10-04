document.addEventListener('DOMContentLoaded', () => {
  const timeIntervalsDiv = document.getElementById('time-intervals');
  const addIntervalButton = document.getElementById('add-interval');
  const saveButton = document.getElementById('save-button');
  let intervals = [];

  // 시간을 mm:ss 형식에서 초로 변환하는 함수
  function convertToSeconds(timeStr) {
    const [minutes, seconds] = timeStr.split(':').map(Number);
    return minutes * 60 + seconds;
  }

  // 시간 간격 입력 폼 추가
  addIntervalButton.addEventListener('click', () => {
    const intervalDiv = document.createElement('div');
    intervalDiv.classList.add('time-interval');

    // 시작 시간 입력 (mm:ss 형식)
    const startInput = document.createElement('input');
    startInput.type = 'text';
    startInput.placeholder = 'Start time (mm:ss)';
    startInput.pattern = '[0-9]{1,2}:[0-5][0-9]';  // mm:ss 형식
    startInput.title = 'Start time in mm:ss format';

    // 종료 시간 입력 (mm:ss 형식)
    const endInput = document.createElement('input');
    endInput.type = 'text';
    endInput.placeholder = 'End time (mm:ss)';
    endInput.pattern = '[0-9]{1,2}:[0-5][0-9]';  // mm:ss 형식
    endInput.title = 'End time in mm:ss format';

    intervalDiv.appendChild(startInput);
    intervalDiv.appendChild(endInput);
    timeIntervalsDiv.appendChild(intervalDiv);
  });

  // 저장 버튼 클릭 시 시간 간격을 가져와서 저장
  saveButton.addEventListener('click', () => {
    const intervalElements = document.querySelectorAll('.time-interval');
    intervals = Array.from(intervalElements).map(interval => {
      const inputs = interval.querySelectorAll('input');
      const startTime = inputs[0].value;
      const endTime = inputs[1].value;

      // 입력 값이 유효한지 확인
      if (!startTime.match(/[0-9]{1,2}:[0-5][0-9]/) || !endTime.match(/[0-9]{1,2}:[0-5][0-9]/)) {
        alert('Please enter times in mm:ss format');
        return null;
      }

      return {
        start: convertToSeconds(startTime),
        end: convertToSeconds(endTime),
      };
    }).filter(interval => interval !== null);  // 유효한 시간 간격만 저장

    if (intervals.length > 0) {
      // 시간 간격 데이터를 Chrome Storage에 저장
      chrome.storage.sync.set({ blurIntervals: intervals }, () => {
        alert('Blur intervals saved!');
      });
    }
  });
});
