import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector";
import { Easing, Tween, Group } from "@tweenjs/tween.js";
import { GUI } from "dat.gui";
import images from "./images.json";
import titles from "./image_meta.json";

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, function (txt: string) {
    return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  });
}

images.forEach((image: string) => {
  const imageNameWithoutExtension = image.replace(/\.[^/.]+$/, "");
  if (!titles.hasOwnProperty(image)) {
    // @ts-ignore
    titles[image] = toTitleCase(imageNameWithoutExtension.replace(/_/g, " "));
  }
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
// layer 1 is for the arrows so they dont show in the reflection
camera.layers.enable(1);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);
const textureLoader = new THREE.TextureLoader();
const leftArrowTexture = textureLoader.load("left.png");
const rightArrowTexture = textureLoader.load("right.png");

const rootNode = new THREE.Object3D();
scene.add(rootNode);

const itemWidth = 3;
const itemPadding = 1;
const radius = (images.length * (itemWidth + itemPadding)) / (2 * Math.PI);

rootNode.position.set(0, 0, radius - itemWidth);

const angleInc = (Math.PI * 2) / images.length;
const mirrorObjects: THREE.Mesh[] = [];

for (let i = 0; i < images.length; i++) {
  const baseNode = new THREE.Object3D();
  baseNode.rotation.y = angleInc * i + angleInc / 2;
  rootNode.add(baseNode);

  const texture = textureLoader.load("./art/" + images[i]);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;

  const border = new THREE.Mesh(
    new THREE.BoxGeometry(itemWidth + 0.2, 2.2, 0.09),
    new THREE.MeshStandardMaterial({ color: 0x202020 }),
  );
  border.name = `Border_${i}`;
  border.position.z = radius;
  baseNode.add(border);
  const artwork = new THREE.Mesh(
    new THREE.BoxGeometry(itemWidth, 2, 0.1),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0 }),
  );
  artwork.name = `Art_${i}`;
  border.add(artwork);
  mirrorObjects.push(artwork);
  const arrowOffset = itemWidth / 2 + 0.3;
  const leftArrow = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.01),
    new THREE.MeshStandardMaterial({
      map: leftArrowTexture,
      transparent: true,
    }),
  );
  leftArrow.name = `LeftArrow`;
  leftArrow.userData = { nextIndex: (i + 1) % images.length };
  leftArrow.position.set(arrowOffset, 0, 0);
  leftArrow.layers.set(1);
  artwork.add(leftArrow);
  const rightArrow = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.01),
    new THREE.MeshStandardMaterial({
      map: rightArrowTexture,
      transparent: true,
    }),
  );
  rightArrow.name = `RightArrow`;
  rightArrow.userData = { nextIndex: (i + images.length - 1) % images.length };
  rightArrow.position.set(-arrowOffset, 0, 0);
  rightArrow.layers.set(1);
  artwork.add(rightArrow);
}

const spotLight = new THREE.SpotLight(0xffffff, 110.0, radius - 1, 0.4, 0.35);
spotLight.castShadow = false;
spotLight.position.set(0, 4, 0);
spotLight.target.position.set(0, 2.4, -1.5);
scene.add(spotLight);
scene.add(spotLight.target);

const mirror = new Reflector(new THREE.CircleGeometry(radius + 2), {
  color: new THREE.Color(0x303030),
  textureWidth: window.innerWidth,
  textureHeight: window.innerHeight,
  // resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
});
mirror.rotateX(-Math.PI / 2);
mirror.position.set(0, -1.1, 0);
mirror.camera.layers.disable(1);
rootNode.add(mirror);

// Add dat.GUI controls
const gui = new GUI();
gui.close();
const rootFolder = gui.addFolder("Root");
rootFolder.add(rootNode.position, "x", -20, 20);
rootFolder.add(rootNode.position, "y", -20, 20);
rootFolder.add(rootNode.position, "z", -20, 20);
rootFolder.open();

const lightFolder = gui.addFolder("SpotLight");
lightFolder.add(spotLight, "intensity", 0, 500);
lightFolder.add(spotLight, "distance", 0, 50);
lightFolder.add(spotLight, "angle", 0, 1);
lightFolder.add(spotLight, "penumbra", 0, 1);
lightFolder.add(spotLight.position, "x", -10, 10);
lightFolder.add(spotLight.position, "y", -10, 10);
lightFolder.add(spotLight.position, "z", -10, 10);
lightFolder.add(spotLight.target.position, "x", -10, 10).name("target x");
lightFolder.add(spotLight.target.position, "y", -10, 10).name("target y");
lightFolder.add(spotLight.target.position, "z", -10, 10).name("target z");
lightFolder.open();

function animate(): void {
  tweenGroup.update();
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  mirror.getRenderTarget().setSize(window.innerWidth, window.innerHeight);
});
let tweenGroup = new Group();

function rotateGallery(direction: number, newIndex: number): void {
  const deltaY = ((Math.PI * 2) / images.length) * direction;
  tweenGroup.add(
    new Tween(rootNode.rotation)
      .to({ y: rootNode.rotation.y + deltaY }, 1000)
      .easing(Easing.Quadratic.InOut)
      .start()
      .onStart(() => {
        document.getElementById("title")!.style.opacity = "0";
        document.getElementById("artist")!.style.opacity = "0";
      })
      .onComplete(() => {
        // @ts-ignore
        document.getElementById("title")!.innerText = titles[images[newIndex]];
        document.getElementById("artist")!.innerText = "Paul Robello";
        document.getElementById("title")!.style.opacity = "1";
        document.getElementById("artist")!.style.opacity = "1";
      }),
  );
}

window.addEventListener("click", (e: MouseEvent) => {
  const raycaster = new THREE.Raycaster();
  raycaster.layers.set(1);

  raycaster.setFromCamera(
    new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      (-e.clientY / window.innerHeight) * 2 + 1,
    ),
    camera,
  );
  const intersects = raycaster.intersectObject(rootNode, true);
  if (intersects.length > 0) {
    const obj = intersects[0].object;
    const newIndex = obj.userData["nextIndex"];
    if (obj.name === "LeftArrow") {
      rotateGallery(-1, newIndex);
    }
    if (obj.name === "RightArrow") {
      rotateGallery(1, newIndex);
    }
  }
});

document.getElementById("title")!.innerText =
  // @ts-ignore
  titles[images[Math.floor(images.length / 2)]];
document.getElementById("artist")!.innerText = "Paul Robello";
