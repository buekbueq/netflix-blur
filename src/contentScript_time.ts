"use strict";

import elementReady from "element-ready";
import tinykeys from "tinykeys";
import { BLUR_ON_ICON, BLUR_OFF_ICON } from "./icons";
import "./contentScript.css";

type CallbackFunction = () => void;
type BlurTimeInterval = { start: number; end: number };

let unsubscribeShortcut: CallbackFunction | undefined;
let domObserver: MutationObserver;
let blurTimes: BlurTimeInterval[] = [];

function cleanUp(): void {
  document.body.classList.remove("netflix-blur-active");

  if (typeof unsubscribeShortcut === "function") {
    unsubscribeShortcut();
    unsubscribeShortcut = undefined;
  }

  if (domObserver) {
    domObserver.disconnect();
  }
}

// 팝업에서 받은 시간 간격 데이터를 이용해 블러 적용
async function applyBlurAtSpecificTime() {
  const videoElement = await elementReady("video", {
    stopOnDomReady: false,
    timeout: 10000,
  });

  if (!videoElement) {
    console.error("비디오 요소를 찾을 수 없습니다.");
    return;
  }

  videoElement.addEventListener("timeupdate", () => {
    const currentTime = videoElement.currentTime;

    // 블러 효과를 적용할 시간 범위에 있는지 확인
    const isBlurTime = blurTimes.some(
      (time) => currentTime >= time.start && currentTime <= time.end
    );

    if (isBlurTime) {
      document.body.classList.add("netflix-blur-active");
    } else {
      document.body.classList.remove("netflix-blur-active");
    }
  });
}

// 시간 간격 데이터를 백그라운드에서 받아와 저장하는 리스너 추가
chrome.runtime.onMessage.addListener((message: any) => {
  if (message.type === "SAVE_BLUR_TIMES") {
    blurTimes = message.intervals;
    console.log("저장된 블러 시간:", blurTimes);
    applyBlurAtSpecificTime();  // 시간 기반 블러링 적용
  } else if (message.type === "ADD_BLUR_BUTTON") {
    initShortcut();
    initializeObserver();
    initializeBlurControl();
  } else if (message.type === "CLEAN_UP") {
    cleanUp();
  }
});

async function initializeObserver() {
  const targetNode = await elementReady("[data-uia='player']", {
    stopOnDomReady: false,
    timeout: 10000,
  });

  if (typeof targetNode === "undefined") {
    return;
  }

  const config = { attributes: false, childList: true, subtree: true };

  const callback = (mutationList: MutationRecord[]) => {
    for (const mutation of mutationList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        const controlsElement = Array.from(mutation.addedNodes).find(
          (node: any) => {
            return (
              node.querySelector("[data-uia='control-audio-subtitle']") !== null
            );
          }
        );

        if (controlsElement) {
          initializeBlurControl();
          applyBlurAtSpecificTime(); // 시간 기반 블러링 적용
        }
      }
    }
  };

  domObserver = new MutationObserver(callback);
  domObserver.observe(targetNode!, config);
}

async function initializeBlurControl(): Promise<void> {
  const audioSubtitleControlElement = await elementReady(
    "[data-uia='control-audio-subtitle']",
    {
      stopOnDomReady: false,
      timeout: 10000,
    }
  );

  if (typeof audioSubtitleControlElement === "undefined") {
    return;
  }

  const blurButton = document.querySelector(
    ".netflix-blur-player-blur-control"
  );

  if (blurButton) {
    blurButton.remove();
  }

  const playerControlElement = document.createElement("div");
  playerControlElement.classList.add("netflix-blur-player-blur-control");
  playerControlElement.title = "Blur";

  playerControlElement.addEventListener("click", () => {
    const bodyElement = document.body;

    if (bodyElement.classList.contains("netflix-blur-active")) {
      bodyElement.classList.remove("netflix-blur-active");
      playerControlElement.title = "Blur";
    } else {
      bodyElement.classList.add("netflix-blur-active");
      playerControlElement.title = "Unblur";
    }
  });

  const html = `<button class="netflix-blur-player-button" tabIndex="0" role="button" aria-label="Blur Video Player">
  ${BLUR_ON_ICON}
  ${BLUR_OFF_ICON}
</button>`;

  playerControlElement.innerHTML = html;
  audioSubtitleControlElement!.parentNode!.parentNode!.insertBefore(
    playerControlElement,
    audioSubtitleControlElement!.parentNode!.parentNode!.firstChild
  );

  if (typeof unsubscribeShortcut === "undefined") {
    initShortcut();
  }
}

function initShortcut() {
  unsubscribeShortcut = tinykeys(window, {
    b: () => {
      if (document.body.classList.contains("netflix-blur-active")) {
        document.body.classList.remove("netflix-blur-active");
      } else {
        document.body.classList.add("netflix-blur-active");
      }
    },
  });
}
