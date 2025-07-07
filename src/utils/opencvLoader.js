export function waitForOpenCV(callback) {
    if (window.cv && cv.imread) {
      callback();
    } else {
      setTimeout(() => waitForOpenCV(callback), 100);
    }
  }
  