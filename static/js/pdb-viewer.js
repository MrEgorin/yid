let scene, camera, renderer, controls;
let atoms = [];
let aminoAcids = [];
let selectedAtoms = [];
let currentView = 'atoms';
let labelsVisible = false;
let ribbonVisible = false;
let secondaryStructure = [];

function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth * 0.8 / (window.innerHeight * 0.6), 0.1, 1000);
    camera.position.set(0, 0, 50);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.6);
    document.getElementById('threeJsContainer').appendChild(renderer.domElement);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 500;

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    renderer.domElement.addEventListener('click', onAtomClick);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();

    document.getElementById('pdbForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        fetch('/api/parse-pdb/', {
            method: 'POST',
            body: formData
        }).then(response => response.json()).then(data => {
            atoms = data.atoms;
            aminoAcids = data.amino_acids;
            secondaryStructure = data.secondary_structure || [];
            renderAtoms();
            document.getElementById('toggle-atoms-btn').disabled = false;
            document.getElementById('toggle-amino-btn').disabled = false;
            document.getElementById('toggle-cluster-btn').disabled = false;
            document.getElementById('toggle-ribbon-btn').disabled = false;
            document.getElementById('toggle-labels-btn').disabled = false;
            document.getElementById('reset-angle-btn').disabled = false;
        }).catch(error => console.error('Error:', error));
    });

    document.getElementById('toggle-atoms-btn').addEventListener('click', () => {
        currentView = 'atoms';
        renderAtoms();
    });

    document.getElementById('toggle-amino-btn').addEventListener('click', () => {
        currentView = 'amino';
        renderAminoAcids();
    });

    document.getElementById('toggle-cluster-btn').addEventListener('click', () => {
        currentView = 'clusters';
        renderClusters();
    });

    document.getElementById('toggle-ribbon-btn').addEventListener('click', () => {
        ribbonVisible = !ribbonVisible;
        if (currentView === 'amino') renderRibbon();
    });

    document.getElementById('toggle-labels-btn').addEventListener('click', () => {
        labelsVisible = !labelsVisible;
        if (currentView === 'atoms') renderAtoms();
    });

    document.getElementById('reset-angle-btn').addEventListener('click', resetAngle);
});

function createLabel(text, position) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = 'Bold 20px Arial';
    const width = context.measureText(text).width;
    canvas.width = width;
    canvas.height = 25;
    context.font = 'Bold 20px Arial';
    context.fillStyle = 'white';
    context.fillText(text, 0, 20);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(width * 0.1, 2.5, 1);
    sprite.position.set(position.x, position.y + 1, position.z);
    return sprite;
}

function addOutline(mesh) {
    if (mesh.userData.outline) return;
    const radius = getRadiusByElement(mesh.userData.element) * 1.2;
    const geometry = new THREE.CircleGeometry(radius, 32);
    const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
    const outline = new THREE.LineLoop(geometry, material);
    outline.position.copy(mesh.position);
    outline.rotation.x = Math.PI / 2;
    mesh.userData.outline = outline;
    scene.add(outline);
}

function removeOutline(mesh) {
    if (mesh.userData.outline) {
        scene.remove(mesh.userData.outline);
        mesh.userData.outline = null;
    }
}

function renderAtoms() {
    while (scene.children.length > 2) scene.remove(scene.children[2]); // Залишаємо світло
    atoms.forEach(atom => {
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(getRadiusByElement(atom.element), 16, 16),
            new THREE.MeshPhongMaterial({ color: getColorByElement(atom.element) })
        );
        sphere.position.set(atom.x, atom.y, atom.z);
        sphere.userData = { 
            label: `${atom.atomName} (${atom.residue}${atom.resSeq})`, 
            outline: null 
        };
        scene.add(sphere);

        if (labelsVisible && atoms.length < 500) { // Оптимізація: показуємо підписи тільки для малих молекул
            const label = createLabel(sphere.userData.label, sphere.position);
            sphere.userData.labelSprite = label;
            scene.add(label);
        }
    });
    adjustCamera();
}

function renderAminoAcids() {
    while (scene.children.length > 2) scene.remove(scene.children[2]);
    aminoAcids.forEach(aa => {
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 16, 16),
            new THREE.MeshPhongMaterial({ color: 0x00ff00 })
        );
        sphere.position.set(aa.x, aa.y, aa.z);
        sphere.userData = { label: `${aa.residue}${aa.resSeq}` };
        scene.add(sphere);
    });
    if (ribbonVisible) renderRibbon();
    adjustCamera();
}

function renderRibbon() {
    while (scene.children.length > 2) scene.remove(scene.children[2]); // Очищаємо сцену перед рендерингом стрічки
    aminoAcids.forEach((aa, index) => {
        if (index < aminoAcids.length - 1) {
            const start = new THREE.Vector3(aa.x, aa.y, aa.z);
            const end = new THREE.Vector3(aminoAcids[index + 1].x, aminoAcids[index + 1].y, aminoAcids[index + 1].z);
            const ss = secondaryStructure.find(ss => ss.resSeq === aa.resSeq)?.structure || 'C';
            let color = 0x00ff00; // За замовчуванням петля (зелений)
            if (ss === 'H') color = 0xff0000; // Альфа-спіраль (червоний)
            else if (ss === 'E') color = 0xffff00; // Бета-лист (жовтий)

            const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
            const material = new THREE.LineBasicMaterial({ color: color });
            const line = new THREE.Line(geometry, material);
            scene.add(line);
        }
    });
    adjustCamera();
}

function renderClusters() {
    while (scene.children.length > 2) scene.remove(scene.children[2]);
    const clusterSize = 10;
    const clusters = {};
    atoms.forEach(atom => {
        const key = `${Math.floor(atom.x / clusterSize)},${Math.floor(atom.y / clusterSize)},${Math.floor(atom.z / clusterSize)}`;
        if (!clusters[key]) clusters[key] = [];
        clusters[key].push(atom);
    });
    Object.values(clusters).forEach(cluster => {
        const center = new THREE.Vector3();
        cluster.forEach(atom => center.add(new THREE.Vector3(atom.x, atom.y, atom.z)));
        center.divideScalar(cluster.length);
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(5, 5, 5),
            new THREE.MeshPhongMaterial({ color: 0x0000ff, transparent: true, opacity: 0.5 })
        );
        cube.position.copy(center);
        scene.add(cube);
    });
    adjustCamera();
}

function adjustCamera() {
    const data = currentView === 'amino' ? aminoAcids : atoms;
    const center = new THREE.Vector3();
    data.forEach(item => center.add(new THREE.Vector3(item.x, item.y, item.z)));
    center.divideScalar(data.length);
    camera.position.set(center.x, center.y, center.z + 50);
    controls.target = center;
    controls.update();
}

function getColorByElement(element) {
    const colors = { 'H': 0xffffff, 'C': 0x808080, 'N': 0x0000ff, 'O': 0xff0000, 'S': 0xffff00 };
    return colors[element] || 0x00ff00;
}

function getRadiusByElement(element) {
    const radii = { 'H': 0.3, 'C': 0.7, 'N': 0.65, 'O': 0.6, 'S': 0.9 };
    return radii[element] || 0.5;
}

function onAtomClick(event) {
    if (currentView !== 'atoms') return;

    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - renderer.domElement.offsetLeft) / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - renderer.domElement.offsetTop) / renderer.domElement.clientHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children.filter(obj => obj instanceof THREE.Mesh));
    if (intersects.length > 0) {
        const atom = intersects[0].object;
        if (selectedAtoms.length < 3 && !selectedAtoms.includes(atom)) {
            addOutline(atom);
            selectedAtoms.push(atom);
            document.getElementById('angleInfo').innerText = `Selected ${selectedAtoms.length} atom${selectedAtoms.length > 1 ? 's' : ''}: ${atom.userData.label}`;
            document.getElementById('angleResult').innerText = `Selected: ${selectedAtoms.map((a, i) => `${i + 1}. ${a.userData.label}`).join(', ')}`;

            if (selectedAtoms.length === 3) {
                fetch('/api/calculate-angle/', {
                    method: 'POST',
                    body: JSON.stringify({ coords: selectedAtoms.map(a => [a.position.x, a.position.y, a.position.z]) }),
                    headers: { 'Content-Type': 'application/json' }
                }).then(response => response.json()).then(data => {
                    document.getElementById('angleResult').innerText += `\nAngle: ${data.angle.toFixed(2)}°`;
                }).catch(error => console.error('Error calculating angle:', error));
            }
        } else if (selectedAtoms.includes(atom)) {
            removeOutline(atom);
            selectedAtoms = selectedAtoms.filter(a => a !== atom);
            document.getElementById('angleResult').innerText = selectedAtoms.length > 0 ? `Selected: ${selectedAtoms.map((a, i) => `${i + 1}. ${a.userData.label}`).join(', ')}` : '';
            document.getElementById('angleInfo').innerText = selectedAtoms.length > 0 ? `Selected ${selectedAtoms.length} atom${selectedAtoms.length > 1 ? 's' : ''}` : 'Hover over atoms for details; click to select up to 3 atoms';
        }
    }
}

function onMouseMove(event) {
    if (currentView !== 'atoms') return;

    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - renderer.domElement.offsetLeft) / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - renderer.domElement.offsetTop) / renderer.domElement.clientHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children.filter(obj => obj instanceof THREE.Mesh));
    if (intersects.length > 0) {
        const atom = intersects[0].object;
        document.getElementById('angleInfo').innerText = `Hovered: ${atom.userData.label}`;
    } else if (selectedAtoms.length > 0) {
        document.getElementById('angleInfo').innerText = `Selected ${selectedAtoms.length} atom${selectedAtoms.length > 1 ? 's' : ''}`;
    } else {
        document.getElementById('angleInfo').innerText = 'Hover over atoms for details; click to select up to 3 atoms';
    }
}

function resetAngle() {
    selectedAtoms.forEach(atom => removeOutline(atom));
    selectedAtoms = [];
    document.getElementById('angleInfo').innerText = 'Hover over atoms for details; click to select up to 3 atoms';
    document.getElementById('angleResult').innerText = '';
}