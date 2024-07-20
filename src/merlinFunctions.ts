export const merlinButton = (
  callback: () => void,
  midiCode: string,
  keyCode: string
) => {
  var button = createButton(midiCode);
  button.mousePressed(callback);
  window.addEventListener("keydown", event => {
    if (event.key === keyCode) {
      callback();
    }
  });
};
