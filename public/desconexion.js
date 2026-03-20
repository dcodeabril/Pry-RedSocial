const furLight = "#FFF", furDark = "#67b1e0";
const skinLight = "#ddf1fa", skinDark = "#88c9f2";

function goDark() {
  gsap.set('#light', { visibility: "hidden" });
  gsap.set('.hlFur', { fill: furDark });
  gsap.set('.hlSkin', { fill: skinDark });
}

function goLight() {
  gsap.set('#light', { visibility: "visible" });
  gsap.set('.hlFur', { fill: furLight });
  gsap.set('.hlSkin', { fill: skinLight });
}

let yetiTL = gsap.timeline({ repeat: -1 });

yetiTL
  .to(['#armL', '#flashlightFront'], { duration: 0.1, x: 7, repeat: 5, yoyo: true }, 2)
  .add(goLight, 3)
  .add(goDark, 3.2)
  .add(goLight, 3.3)
  .to(['#eyeL', '#eyeR'], { duration: 0.3, scale: 1.5, transformOrigin: "center center" }, 4)
  .add(goDark, 7)
  .to(['#eyeL', '#eyeR'], { duration: 0.3, scale: 1, transformOrigin: "center center" }, 8);

goDark();