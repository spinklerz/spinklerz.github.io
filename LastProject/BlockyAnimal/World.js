/* Grader Notes: 
- Ambient Light line 43
- Directional Light line 46
- Point Light line 59 
- Texture using image 37993.png line ~200
- Loaded OBJ function loadCustomModel() line 145
- SkyBox line function createSkyboxWithInfinity() line 205 
- Implemented Camera Controls 
- Move with WSAD Space Shift 
- WOW: 
    - Implemented animations rotate, bounce and bounce + rotate
    - Added infinity sign's and animated it 
    - Random position of shapes on reload
*/


let scene, camera, renderer, clock = new THREE.Clock();
let controls = {
    moveForward: false,
    moveBackward: false, 
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false
};
let animated = [];

const cameraSettings = {
    movementSpeed: 0.1,
    mouseSensitivity: 0.002,
    minVerticalAngle: -1.5,
    maxVerticalAngle: 1.5,
    minHeight: 1.0
};

// Helper function for random values
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0x404040, 0.4)); // Ambient
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8); // Directional
    dirLight.position.set(10, 10, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);
    const pointLight = new THREE.PointLight(0xff4444, 1, 50); // Point
    pointLight.position.set(5, 5, 5);
    pointLight.castShadow = true;
    scene.add(pointLight);
    animated.push({ obj: pointLight, type: 'orbit' });

    //Skybox with rotating infinity signs
    createSkyboxWithInfinity();
    createGroundWithTexture();

    loadCustomModel();
    createShapes();
    
    setupCameraControls();
    animate();
}

function createShapes() {
    const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff];
    
    // Cubes (12 shapes) - Random positions and scales / animation rotate
    for (let i = 0; i < 12; i++) {
        const randomScale = randomRange(0.5, 2.0);
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({ color: colors[i % colors.length] })
        );
        
        cube.position.set(
            randomRange(-40, 40),
            randomRange(1, 15),
            randomRange(-40, 40)
        );
        
        cube.scale.set(randomScale, randomScale, randomScale);
        cube.castShadow = true;
        cube.receiveShadow = true;
        scene.add(cube);
        animated.push({ obj: cube, type: 'rotate' });
    }

    // Spheres (10 shapes) - Random positions and scales / animation bounce
    for (let i = 0; i < 10; i++) {
        const randomScale = randomRange(0.3, 1.5);
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 16, 16),
            new THREE.MeshPhongMaterial({ color: colors[i % colors.length] })
        );
        
        sphere.position.set(
            randomRange(-35, 35),
            randomRange(2, 20),
            randomRange(-35, 35)
        );
        
        sphere.scale.set(randomScale, randomScale, randomScale);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        scene.add(sphere);
        animated.push({ obj: sphere, type: 'bounce', baseY: sphere.position.y });
    }

    // Cylinders (8 shapes) - Random positions and scales / animation bounce and rotate
    for (let i = 0; i < 8; i++) {
        const randomScale = randomRange(0.4, 1.8);
        const cylinder = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16),
            new THREE.MeshLambertMaterial({ color: colors[i % colors.length] })
        );
        
        cylinder.position.set(
            randomRange(-30, 30),
            randomRange(1, 18),
            randomRange(-30, 30)
        );
        
        cylinder.scale.set(randomScale, randomScale, randomScale);
        cylinder.castShadow = true;
        cylinder.receiveShadow = true;
        scene.add(cylinder);
        animated.push({ obj: cylinder, type: 'bounce', baseY: cylinder.position.y });
        animated.push({ obj: cylinder, type: 'rotate' });
    }
}

function loadCustomModel() {
    console.log('Entering loadCustomModel');
    if (typeof THREE.MTLLoader === 'undefined' || typeof THREE.OBJLoader === 'undefined') {
        console.error('Loader Not Found');
        return;
    }
    
    const goldMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x332200,
        emissiveIntensity: 0.1,
        envMapIntensity: 1.0
    });
    
    const mtlLoader = new THREE.MTLLoader();
    
    mtlLoader.load('./obj_file.mtl', function(materials) {
        console.log('MTL LOADED!', materials);
        materials.preload();
        
        const objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        
        objLoader.load('./obj_file.obj', function(object) {
            console.log('OBJ Loaded', object);
            
            object.position.set(0, 10, 0);
            object.scale.set(0.1, 0.1, 0.1);
            
            object.traverse(function(child) {
                if (child.isMesh) {
                    child.material = goldMaterial.clone();
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            scene.add(object);
            animated.push({ obj: object, type: 'rotate' });
            console.log('Goldy added');
        });});
}

function createGroundWithTexture() {
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const textureLoader = new THREE.TextureLoader();
    
    const texture = textureLoader.load('37993.png');
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    
    const ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ map: texture }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
}

function createSkyboxWithInfinity() {
    // Create basic skybox
    const skyGeo = new THREE.SphereGeometry(400, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({ 
        color: 0x001122, 
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.8
    });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Create infinity curve
    class InfinityCurve extends THREE.Curve {
        constructor(scale = 1) {
            super();
            this.scale = scale;
        }
        
        getPoint(t, optionalTarget = new THREE.Vector3()) {
            const tx = Math.sin(t * Math.PI * 2) * this.scale;
            const ty = Math.sin(t * Math.PI * 4) * this.scale * 0.5;
            const tz = 0;
            return optionalTarget.set(tx, ty, tz);
        }
    }

    // Create infinity signs on 6 faces of a cube around the scene
    const positions = [
        { pos: [0, 0, -350], rot: [0, 0, 0] },
        { pos: [0, 0, 350], rot: [0, Math.PI, 0] },
        { pos: [-350, 0, 0], rot: [0, Math.PI/2, 0] },
        { pos: [350, 0, 0], rot: [0, -Math.PI/2, 0] },
        { pos: [0, 350, 0], rot: [-Math.PI/2, 0, 0] },
        { pos: [0, -350, 0], rot: [Math.PI/2, 0, 0] }
    ];

    const colors = [0xff6b9d, 0x6bcfff, 0x6bff8a, 0xffeb6b, 0xff6b6b, 0xc86bff];

    positions.forEach((face, index) => {
        const randomInfinityScale = randomRange(30, 80);
        const curve = new InfinityCurve(randomInfinityScale);
        
        const randomTubeRadius = randomRange(2, 6);
        const tubeGeo = new THREE.TubeGeometry(curve, 100, randomTubeRadius, 8, false);
        const tubeMat = new THREE.MeshStandardMaterial({ 
            color: colors[index],
            transparent: true,
            opacity: 0.7,
            emissive: colors[index],
            emissiveIntensity: 0.3
        });
        
        const infinitySign = new THREE.Mesh(tubeGeo, tubeMat);
        infinitySign.position.set(...face.pos);
        infinitySign.rotation.set(...face.rot);
        infinitySign.rotation.z += (index * Math.PI / 3);
        
        const overallScale = randomRange(0.7, 1.4);
        infinitySign.scale.set(overallScale, overallScale, overallScale);
        
        scene.add(infinitySign);
        animated.push({ 
            obj: infinitySign, 
            type: 'infinity', 
            speed: 0.5 + Math.random() * 0.5,
            axis: index % 3
        });
    });
}

function setupCameraControls() {
    let isPointerLocked = false;
    
    //Pointer lock setup
    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });
    
    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = !!document.pointerLockElement;
        console.log('Pointer lock:', isPointerLocked ? 'enabled' : 'disabled');
    });
    
    document.addEventListener('pointerlockerror', () => {
        console.error('Pointer lock error');
    });
    
    
    document.addEventListener('mousemove', (event) => {
        if (!isPointerLocked) return;
        
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        
        camera.rotation.y -= movementX * cameraSettings.mouseSensitivity;
        camera.rotation.x -= movementY * cameraSettings.mouseSensitivity;
        camera.rotation.x = Math.max(
            cameraSettings.minVerticalAngle, 
            Math.min(cameraSettings.maxVerticalAngle, camera.rotation.x)
        );
    });
    

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            event.preventDefault();
        }
    });
}

function handleKeyDown(event) {
    switch(event.code) {
        case 'KeyW':
            controls.moveForward = true;
            break;
        case 'KeyS':
            controls.moveBackward = true;
            break;
        case 'KeyA':
            controls.moveLeft = true;
            break;
        case 'KeyD':
            controls.moveRight = true;
            break;
        case 'Space':
            controls.moveUp = true;
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            controls.moveDown = true;
            break;
    }
}

function handleKeyUp(event) {
    switch(event.code) {
        case 'KeyW':
            controls.moveForward = false;
            break;
        case 'KeyS':
            controls.moveBackward = false;
            break;
        case 'KeyA':
            controls.moveLeft = false;
            break;
        case 'KeyD':
            controls.moveRight = false;
            break;
        case 'Space':
            controls.moveUp = false;
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            controls.moveDown = false;
            break;
    }
}

function updateCameraMovement() {
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);
    const up = new THREE.Vector3(0, 1, 0);
    
    forward.applyQuaternion(camera.quaternion);
    right.applyQuaternion(camera.quaternion);
    const movementDelta = new THREE.Vector3();
    
    if (controls.moveForward) {
        movementDelta.add(forward.clone().multiplyScalar(cameraSettings.movementSpeed));
    }
    if (controls.moveBackward) {
        movementDelta.add(forward.clone().multiplyScalar(-cameraSettings.movementSpeed));
    }
    if (controls.moveRight) {
        movementDelta.add(right.clone().multiplyScalar(cameraSettings.movementSpeed));
    }
    if (controls.moveLeft) {
        movementDelta.add(right.clone().multiplyScalar(-cameraSettings.movementSpeed));
    }
    if (controls.moveUp) {
        movementDelta.add(up.clone().multiplyScalar(cameraSettings.movementSpeed));
    }
    if (controls.moveDown) {
        movementDelta.add(up.clone().multiplyScalar(-cameraSettings.movementSpeed));
    }
    camera.position.add(movementDelta);
    camera.position.y = Math.max(cameraSettings.minHeight, camera.position.y);
}

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    updateCameraMovement();

    // Object animations
    animated.forEach(item => {
        if (item.type === 'rotate') {
            item.obj.rotation.x += 0.01;
            item.obj.rotation.y += 0.02;
        } else if (item.type === 'bounce') {
            item.obj.position.y = item.baseY + Math.abs(Math.sin(time * 2)) * 2;
        } else if (item.type === 'orbit') {
            item.obj.position.x = Math.sin(time) * 10;
            item.obj.position.z = Math.cos(time) * 10;
        } else if (item.type === 'infinity') {
            if (item.axis === 0) {
                item.obj.rotation.x += item.speed * 0.01;
            } else if (item.axis === 1) {
                item.obj.rotation.y += item.speed * 0.01;
            } else {
                item.obj.rotation.z += item.speed * 0.01;
            }
            
            const pulse = 1 + Math.sin(time * item.speed) * 0.1;
            item.obj.scale.set(pulse, pulse, pulse);
        }
    });

    renderer.render(scene, camera);
}

init();